/**
 *  LG TV WebOS - Driver Hubitat
 *  Control completo via WebSocket SSAP
 *
 *  Instalación:
 *    1. Hubitat → Drivers Code → New Driver → pegar este código → Save
 *    2. Devices → Add Device → Virtual → "LG TV WebOS - Control Remoto"
 *    3. Configurar tvIP y tvMAC → Save Preferences
 *    4. Clic en "Pair" → aceptar en pantalla del TV
 *    5. Client Key se guarda automáticamente
 */

import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import groovy.transform.Field
import hubitat.device.HubAction
import hubitat.device.Protocol

@Field static final Map<String, String> APP_IDS = [
    netflix : "netflix",
    youtube : "youtube.leanback.v4",
    amazon  : "amazon",
    prime   : "amazon",
    disney  : "com.disney.disneyplus-prod",
    spotify : "spotify-beehive",
    hulu    : "hulu",
    plex    : "cdp-30",
    twitch  : "twitch"
]

metadata {
    definition(
        name:        "LG TV WebOS - Control Remoto",
        namespace:   "custom.lgtvwebos",
        author:      "Custom",
        description: "Control total LG Smart TV via WebOS WebSocket"
    ) {
        capability "Switch"
        capability "AudioVolume"
        capability "Refresh"

        command "channelUp"
        command "channelDown"
        command "sendKey", [
            [name: "key*", type: "STRING",
             description: "UP DOWN LEFT RIGHT ENTER BACK EXIT MUTE 0-9 RED GREEN YELLOW BLUE"]
        ]
        command "launchApp", [
            [name: "appId*", type: "STRING",
             description: "netflix  youtube  amazon  disney  spotify — o ID WebOS directo"]
        ]
        command "switchInput", [
            [name: "input*", type: "STRING",
             description: "HDMI_1  HDMI_2  HDMI_3  AV_1  COMPONENT_1"]
        ]
        command "setPictureMode", [
            [name: "mode*", type: "ENUM",
             constraints: ["cinema","vivid","standard","eco","sports","game","hdrEffect"]]
        ]
        command "pair"
        command "connect"

        attribute "pictureMode",  "string"
        attribute "currentInput", "string"
        attribute "channel",      "number"
        attribute "channelName",  "string"
        attribute "wsStatus",     "string"
    }

    preferences {
        input name: "tvIP",  type: "text", title: "IP Address del TV (fija, ej: 192.168.1.100)", required: true
        input name: "tvMAC", type: "text", title: "MAC Address del TV (para encender, ej: AA:BB:CC:DD:EE:FF)", required: false
        input name: "tvKey", type: "text", title: "Client Key (se llena automáticamente al parear)", required: false
        input name: "logEnable", type: "bool", title: "Debug logging", defaultValue: true
    }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────

def installed() {
    log.info "[LGTV] Instalado"
    initialize()
}

def updated() {
    log.info "[LGTV] Preferencias guardadas — IP: ${settings.tvIP}"
    initialize()
}

def initialize() {
    state.msgId      = 0
    state.registered = false
    state.connecting = false
    unschedule()
    runEvery1Minute("keepAlive")
    doConnect()
}

def keepAlive() {
    if (!state.registered) {
        logDebug "keepAlive: sin registro, intentando conectar"
        doConnect()
    }
}

// ── Conexión WebSocket ─────────────────────────────────────────────────────────

def connect() {
    state.connecting = false
    doConnect()
}

private doConnect() {
    def ip = settings?.tvIP?.trim()
    if (!ip) {
        log.warn "[LGTV] tvIP no configurada — ingresá la IP del TV en las preferencias y hacé 'Save Preferences'"
        return
    }
    if (state.connecting) {
        logDebug "Conexión ya en progreso"
        return
    }
    state.connecting = true
    sendEvent(name: "wsStatus", value: "conectando")
    logDebug "Conectando a ws://${ip}:3000"
    try {
        interfaces.webSocket.connect(
            "ws://${ip}:3000",
            pingInterval: 30,
            headers: ["User-Agent": "Hubitat/LGTVControl"]
        )
    } catch (e) {
        log.error "[LGTV] Error al conectar WebSocket: ${e}"
        state.connecting = false
        sendEvent(name: "wsStatus", value: "error")
    }
}

def webSocketStatus(String status) {
    logDebug "webSocketStatus: ${status}"
    state.connecting = false
    if (status == "open") {
        sendEvent(name: "wsStatus", value: "conectado")
        state.registered = false
        sendRegistration()
    } else {
        sendEvent(name: "wsStatus", value: "desconectado")
        state.registered = false
    }
}

def parse(String message) {
    logDebug "RECV: ${message}"
    try {
        def json = new JsonSlurper().parseText(message)
        switch (json.type) {
            case "registered":
                state.registered = true
                def key = json.payload?.get("client-key")
                if (key) {
                    device.updateSetting("tvKey", [value: key, type: "text"])
                    log.info "[LGTV] Pareado OK — Client Key guardado."
                }
                sendEvent(name: "wsStatus", value: "listo")
                log.info "[LGTV] Listo para enviar comandos."
                refresh()
                break
            case "response":
                handleResponse(json)
                break
            case "error":
                log.warn "[LGTV] Error TV [${json.id}]: ${json.error}"
                break
        }
    } catch (e) {
        log.error "[LGTV] Error parseando mensaje: ${e}"
    }
}

private handleResponse(json) {
    def payload = json.payload ?: [:]
    def id      = json.id ?: ""
    if (id.startsWith("vol_")) {
        if (payload.volume != null) sendEvent(name: "volume", value: payload.volume as Integer)
        if (payload.muted  != null) sendEvent(name: "mute",   value: payload.muted ? "muted" : "unmuted")
    } else if (id.startsWith("ch_")) {
        if (payload.channelNumber != null) sendEvent(name: "channel",     value: payload.channelNumber)
        if (payload.channelName)           sendEvent(name: "channelName", value: payload.channelName)
    }
}

// ── SSAP helper ────────────────────────────────────────────────────────────────

private sendSSAP(String uri, Map payload = [:], String prefix = "cmd") {
    if (!state.registered) {
        log.warn "[LGTV] No listo (wsStatus=${device.currentValue('wsStatus')}). Conectando... reintentá en unos segundos."
        doConnect()
        return
    }
    state.msgId = (state.msgId ?: 0) + 1
    def msg = JsonOutput.toJson([
        type   : "request",
        id     : "${prefix}_${state.msgId}",
        uri    : uri,
        payload: payload
    ])
    logDebug "SEND: ${msg}"
    interfaces.webSocket.sendMessage(msg)
}

private sendRegistration() {
    def key = settings?.tvKey?.trim()
    state.msgId = (state.msgId ?: 0) + 1
    def payload = [
        forcePairing: false,
        pairingType : "PROMPT",
        manifest    : [
            manifestVersion: 1,
            appVersion     : "1.1",
            signed: [
                created             : "20140509",
                appId               : "com.lge.test",
                vendorId            : "com.lge",
                localizedAppNames   : ["": "Hubitat Remote"],
                localizedVendorNames: ["": "Hubitat"],
                permissions: [
                    "CONTROL_INPUT_TEXT", "CONTROL_MOUSE_AND_KEYBOARD",
                    "READ_INSTALLED_APPS", "CONTROL_POWER",
                    "READ_CURRENT_CHANNEL", "READ_RUNNING_APPS",
                    "UPDATE_FROM_REMOTE_APP", "READ_LGE_TV_INPUT_EVENTS"
                ],
                serial: "2f930e2d2cfe083771f68e4fe7bb07"
            ],
            permissions: [
                "LAUNCH", "LAUNCH_REMOTE_APP", "APP_TO_APP", "CLOSE",
                "CONTROL_AUDIO", "CONTROL_DISPLAY", "CONTROL_INPUT_TV",
                "CONTROL_POWER", "READ_APP_STATUS", "READ_CURRENT_CHANNEL",
                "READ_INPUT_DEVICE_LIST", "READ_NETWORK_STATE",
                "READ_RUNNING_APPS", "READ_TV_CHANNEL_LIST",
                "WRITE_NOTIFICATION_TOAST", "READ_POWER_STATE"
            ]
        ]
    ]
    if (key) {
        payload["client-key"] = key
        logDebug "Registrando con client-key existente"
    } else {
        log.info "[LGTV] Sin client-key — aceptar el mensaje en la pantalla del TV"
    }
    interfaces.webSocket.sendMessage(
        JsonOutput.toJson([type: "register", id: "reg_${state.msgId}", payload: payload])
    )
}

// ── Switch ─────────────────────────────────────────────────────────────────────

def on() {
    def mac = settings?.tvMAC?.trim()
    if (!mac) {
        log.warn "[LGTV] tvMAC no configurada — configurá la MAC del TV para poder encenderlo"
        return
    }
    sendWOL(mac)
    sendEvent(name: "switch", value: "on")
    runIn(15, "connect")
    runIn(25, "connect")
}

def off() {
    sendSSAP("ssap://system/turnOff")
    sendEvent(name: "switch", value: "off")
}

private sendWOL(String mac) {
    try {
        def cleanMac = mac.replaceAll(/[:\-\. ]/, "").toUpperCase()
        if (cleanMac.length() != 12) { log.error "[LGTV] MAC inválida: ${mac}"; return }
        def magicPacket = "FF" * 6 + cleanMac * 16
        sendHubCommand(new HubAction(
            magicPacket,
            Protocol.LAN,
            [type               : HubAction.Type.LAN_TYPE_UDPCLIENT,
             destinationAddress : "255.255.255.255:9",
             encoding           : HubAction.Encoding.HEX_STRING]
        ))
        log.info "[LGTV] WOL enviado a ${mac}"
    } catch (e) {
        log.error "[LGTV] Error WOL: ${e}"
    }
}

// ── Audio ──────────────────────────────────────────────────────────────────────

def volumeUp()   { sendSSAP("ssap://audio/volumeUp",   [:], "vol") }
def volumeDown() { sendSSAP("ssap://audio/volumeDown", [:], "vol") }

def setVolume(level) {
    def v = Math.max(0, Math.min(100, level as Integer))
    sendSSAP("ssap://audio/setVolume", [volume: v], "vol")
    sendEvent(name: "volume", value: v)
}

def mute() {
    sendSSAP("ssap://audio/setMute", [mute: true], "vol")
    sendEvent(name: "mute", value: "muted")
}

def unmute() {
    sendSSAP("ssap://audio/setMute", [mute: false], "vol")
    sendEvent(name: "mute", value: "unmuted")
}

// ── Canales ────────────────────────────────────────────────────────────────────

def channelUp()   { sendSSAP("ssap://tv/channelUp",   [:], "ch") }
def channelDown() { sendSSAP("ssap://tv/channelDown", [:], "ch") }

// ── Teclas ─────────────────────────────────────────────────────────────────────

def sendKey(String key) {
    switch (key.toUpperCase()) {
        case "HOME":
            sendSSAP("ssap://com.webos.applicationManager/launch", [id: "com.webos.app.home"])
            break
        case "BACK":
            sendSSAP("ssap://system/goBack")
            break
        case "MENU":
            sendSSAP("ssap://com.webos.applicationManager/launch", [id: "com.webos.app.quicksettings"])
            break
        default:
            sendSSAP("ssap://input/button", [name: key.toUpperCase()])
            break
    }
}

// ── Apps ───────────────────────────────────────────────────────────────────────

def launchApp(String appId) {
    def resolved = APP_IDS[appId.toLowerCase()] ?: appId
    sendSSAP("ssap://system.launcher/launch", [id: resolved], "app")
    log.info "[LGTV] Lanzando: ${resolved}"
}

// ── Entradas ───────────────────────────────────────────────────────────────────

def switchInput(String input) {
    sendSSAP("ssap://tv/switchInput", [inputId: input], "sw")
    sendEvent(name: "currentInput", value: input)
}

// ── Imagen ─────────────────────────────────────────────────────────────────────

def setPictureMode(String mode) {
    sendSSAP("ssap://settings/setSystemSettings",
        [category: "picture", settings: [pictureMode: mode]], "pic")
    sendEvent(name: "pictureMode", value: mode)
}

// ── Refresh ────────────────────────────────────────────────────────────────────

def refresh() {
    sendSSAP("ssap://audio/getVolume",      [:], "vol")
    sendSSAP("ssap://tv/getCurrentChannel", [:], "ch")
}

// ── Pareo ──────────────────────────────────────────────────────────────────────

def pair() {
    log.info "[LGTV] Iniciando pareo — aceptar en pantalla del TV"
    state.registered = false
    state.connecting = false
    device.updateSetting("tvKey", [value: "", type: "text"])
    try { interfaces.webSocket.close() } catch (e) { }
    runIn(2, "doConnect")
}

private logDebug(msg) { if (logEnable) log.debug "[LGTV] ${msg}" }
