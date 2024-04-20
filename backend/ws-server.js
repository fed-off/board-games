const ws = require('ws');

const PORT = process.env.WSPORT || 3001;

const wss = new ws.WebSocketServer({ port: PORT });

wss.on('connection', function connection(ws) {
  console.log('client connected');

  ws.on('error', console.error);

  ws.on('close', function close() {
    console.log('client disconnected');
  });

  ws.on('message', function message(data) {
    console.log('received: %s', data);
    sendToAll(data.toString());
  });




  ws.send('hi from server');
});

// Функция для отправки сообщения всем клиентам
function sendToAll(message) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === ws.WebSocket.OPEN) {
      client.send(message);
    }
  });
}
