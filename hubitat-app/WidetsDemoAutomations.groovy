definition(
    name: "WidetsDomo Automations",
    namespace: "widetsdomo",
    author: "WidetsDomo",
    description: "Motor de reglas para dashboard WidetsDomo. Ejecuta automatizaciones 24/7 sin necesitar el browser.",
    category: "Convenience",
    iconUrl: "",
    iconX2Url: "",
    oauth: true
)

preferences {
    section("Autenticación") {
        input "accessToken", "text",
            title: "Token de acceso (copia el valor del campo 'autoToken' que aparece en esta página)",
            required: true
    }
    section("Dispositivos") {
        input "managedDevices", "capability.*",
            title: "Todos los dispositivos a monitorear y controlar",
            multiple: true, required: false
    }
}

mappings {
    path("/rules") {
        action: [GET: "getRules", POST: "upsertRule"]
    }
    path("/rules/:id") {
        action: [DELETE: "deleteRule"]
    }
    path("/rules/:id/enable") {
        action: [PUT: "setRuleEnabled"]
    }
    path("/ping") {
        action: [GET: "ping"]
    }
}

def installed() {
    if (!state.accessToken) createAccessToken()
    initialize()
    log.info "WidetsDomo Automations installed. App ID: ${app.id} | Token: ${state.accessToken}"
}

def updated() {
    unsubscribe()
    initialize()
}

def uninstalled() {
    unsubscribe()
}

def initialize() {
    if (!state.rules) state.rules = [:]
    if (!state.lastResults) state.lastResults = [:]
    subscribeAll()
}

// ── Auth ──────────────────────────────────────────────────────────

private boolean authorized() {
    return params.access_token && params.access_token == settings.accessToken
}

// ── HTTP Endpoints ────────────────────────────────────────────────

def ping() {
    if (!authorized()) { httpError(403, "Unauthorized"); return }
    render contentType: "application/json", data: groovy.json.JsonOutput.toJson([ok: true, appId: app.id])
}

def getRules() {
    if (!authorized()) { httpError(403, "Unauthorized"); return }
    def list = state.rules?.values()?.toList() ?: []
    render contentType: "application/json", data: groovy.json.JsonOutput.toJson(list)
}

def upsertRule() {
    if (!authorized()) { httpError(403, "Unauthorized"); return }
    def body = request.JSON
    if (!body?.id) { httpError(400, "Missing id"); return }
    if (!state.rules) state.rules = [:]
    state.rules[body.id] = body
    if (state.lastResults[body.id] == null) state.lastResults[body.id] = false
    unsubscribe()
    subscribeAll()
    render contentType: "application/json", data: groovy.json.JsonOutput.toJson([ok: true])
}

def deleteRule() {
    if (!authorized()) { httpError(403, "Unauthorized"); return }
    def id = params.id
    state.rules?.remove(id)
    state.lastResults?.remove(id)
    unsubscribe()
    subscribeAll()
    render contentType: "application/json", data: groovy.json.JsonOutput.toJson([ok: true])
}

def setRuleEnabled() {
    if (!authorized()) { httpError(403, "Unauthorized"); return }
    def id = params.id
    if (!state.rules?.containsKey(id)) { httpError(404, "Rule not found"); return }
    def body = request.JSON
    state.rules[id].enabled = (body.enabled == true || body.enabled == "true")
    if (!state.rules[id].enabled) state.lastResults[id] = false
    unsubscribe()
    subscribeAll()
    render contentType: "application/json", data: groovy.json.JsonOutput.toJson([ok: true])
}

// ── Subscriptions ─────────────────────────────────────────────────

private void subscribeAll() {
    def rules = state.rules?.values()?.findAll { it?.enabled } ?: []
    def subscribed = [] as Set
    for (rule in rules) {
        def nodes = collectDeviceNodes(rule.condition)
        for (node in nodes) {
            def key = "${node.deviceId}:${node.attribute}"
            if (subscribed.contains(key)) continue
            subscribed.add(key)
            def dev = findDevice(node.deviceId)
            if (dev) subscribe(dev, node.attribute, "onDeviceEvent")
        }
    }
}

private List collectDeviceNodes(node) {
    if (node == null) return []
    if (node.type == "group") return (node.children ?: []).collectMany { collectDeviceNodes(it) }
    if (node.type == "device") return [node]
    return []
}

private def findDevice(String deviceId) {
    return managedDevices?.find { String.valueOf(it.id) == deviceId }
}

// ── Event Handler ─────────────────────────────────────────────────

def onDeviceEvent(evt) {
    def rules = state.rules?.values()?.findAll { it?.enabled } ?: []
    for (rule in rules) {
        def refs = collectDeviceNodes(rule.condition).any { it.deviceId == String.valueOf(evt.deviceId) }
        if (!refs) continue
        def result = evalNode(rule.condition)
        def prev = state.lastResults?[rule.id] ?: false
        if (result && !prev) executeActions(rule.actions ?: [])
        if (!state.lastResults) state.lastResults = [:]
        state.lastResults[rule.id] = result
    }
}

// ── Evaluation ────────────────────────────────────────────────────

private boolean evalNode(node) {
    if (node == null) return false
    if (node.type == "group") {
        def children = node.children ?: []
        if (children.isEmpty()) return false
        def result = evalNode(children[0])
        for (int i = 1; i < children.size(); i++) {
            def child = children[i]
            def op = child.joinOp ?: node.operator ?: "AND"
            def val = evalNode(child)
            result = (op == "OR") ? (result || val) : (result && val)
        }
        return result
    }
    if (node.type == "device") return evalDeviceCondition(node)
    return false // time conditions not evaluated natively (v1)
}

private boolean evalDeviceCondition(cond) {
    def dev = findDevice(cond.deviceId)
    if (!dev) return false
    def actual = dev.currentValue(cond.attribute)
    if (actual == null) return false
    def op = cond.operator
    def expected = cond.value
    if (op == "eq") return String.valueOf(actual) == String.valueOf(expected)
    try {
        def a = actual as Double
        def e = expected as Double
        if (op == "gte") return a >= e
        if (op == "lte") return a <= e
    } catch (ex) { return false }
    return false
}

// ── Actions ───────────────────────────────────────────────────────

private void executeActions(actions) {
    for (action in actions) {
        def dev = findDevice(action.deviceId)
        if (!dev) { log.warn "WidetsDomo: device ${action.deviceId} not found"; continue }
        try {
            if (action.arg != null) dev."${action.command}"(action.arg)
            else dev."${action.command}"()
        } catch (ex) {
            log.warn "WidetsDomo: failed ${action.command} on ${action.deviceId}: ${ex.message}"
        }
    }
}
