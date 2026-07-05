const clients = new Set();

export function addClient(ws) {
  clients.add(ws);
}

export function removeClient(ws) {
  clients.delete(ws);
}

export function broadcast(payload, senderWs) {
  const msg = JSON.stringify(payload);
  for (const client of clients) {
    if (client === senderWs) continue;
    if (client.readyState !== 1) continue; // 1 = WebSocket.OPEN
    client.send(msg);
  }
}
