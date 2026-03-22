let ws = null;
let reconnectTimer = null;
let listeners = {};

export function connectWS(token, onMessage) {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.host;
  ws = new WebSocket(`${protocol}://${host}/ws`);

  ws.onopen = () => {
    console.log('[WS] Connecté');
    ws.send(JSON.stringify({ type: 'AUTH', token }));
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (onMessage) onMessage(msg);
      // Notify specific listeners
      if (listeners[msg.type]) {
        listeners[msg.type].forEach(cb => cb(msg.data));
      }
    } catch {}
  };

  ws.onerror = (err) => console.error('[WS] Erreur:', err);

  ws.onclose = () => {
    console.log('[WS] Déconnecté — reconnexion dans 3s');
    reconnectTimer = setTimeout(() => connectWS(token, onMessage), 3000);
  };
}

export function disconnectWS() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) { ws.close(); ws = null; }
  listeners = {};
}

export function sendWS(payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

export function onWS(type, callback) {
  if (!listeners[type]) listeners[type] = [];
  listeners[type].push(callback);
  return () => {
    listeners[type] = listeners[type].filter(cb => cb !== callback);
  };
}

export function isWSConnected() {
  return ws && ws.readyState === WebSocket.OPEN;
}
