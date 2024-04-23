const ws = require('ws');
const mongo = require('./mongodb.js');


const collection = mongo.db.collection("div-position");

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
    const msg = JSON.parse(data);

    sendToAll(data.toString());
    collection.updateOne({}, { $set: {x: msg.x, y: msg.y}}).then(result => {
      console.log('result:', result);
    }).catch(console.error);
  });

  collection.findOne().then(doc => {
    console.log('doc:', doc);
    ws.send(JSON.stringify({
      event: 'move',
      x: doc.x,
      y: doc.y,
    }));
  }).catch(console.error);

});

// Функция для отправки сообщения всем клиентам
function sendToAll(message) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === ws.WebSocket.OPEN) {
      client.send(message);
    }
  });
}
