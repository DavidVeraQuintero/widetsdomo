const clients = new Map(); // ws → homeId

export function addClient(ws, homeId) {
  clients.set(ws, homeId);
}

export function removeClient(ws) {
  clients.delete(ws);
}

export function broadcast(payload, homeId, senderWs) {
  const msg = JSON.stringify(payload);
  for (const [client, clientHomeId] of clients) {
    if (client === senderWs) continue;
    if (client.readyState !== 1) continue;
    if (homeId && clientHomeId !== homeId) continue;
    client.send(msg);
  }
}
