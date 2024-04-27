const ws = require('ws');
const mongo = require('./mongodb.js');
const { DEFAULT_BALANCE } = require('./constants.js');


const PORT = process.env.WSPORT || 3001;

const wss = new ws.WebSocketServer({ port: PORT });

wss.on('connection', function(ws) {
  ws.on('error', console.error);

  ws.on('close', function() {
    onDisconnect(ws);
  });

  ws.on('message', function(data) {
    onMessage(ws, data);
  });

  onConnect(ws);
});


function sendToAll(message) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === ws.WebSocket.OPEN) {
      client.send(message);
    }
  });
};

function onConnect(ws) {
  const ip = ws._socket.remoteAddress;
  console.log('Client connected from IP', ip);

  // Update user
  mongo.users.updateOne(
    { ip },
    {
      $set: {
        active: true,
        lastVisit: new Date(),
      },
      $setOnInsert: {
        ip: ip,
        firstVisit: new Date(),
      },
    },
    { upsert: true }
  ).then(console.debug).catch(console.error);

  // Send hello event with players list
  mongo.players.find().toArray().then(players => {
    ws.send(JSON.stringify({
      event: 'hello',
      data: { players },
    }));
  }).catch(console.error);
}


function onDisconnect(ws) {
  const ip = ws._socket.remoteAddress;
  console.log('Client disconnected from IP', ip);

  // Update user
  mongo.users.updateOne(
    { ip },
    {
      $set: {
        active: false,
      },
    }
  ).then(console.debug).catch(console.error);
}


function onMessage(ws, data) {
  console.log('Received message: %s', data);
  const message = JSON.parse(data);
  // Call function based on the event name if it exists
  if (typeof eventHandlers[message.event] === 'function') {
    eventHandlers[message.event](ws, message.data);
  } else {
    console.error('Unknown event:', message);
  }
}


/**
 * eventHandlers - object with functions to handle events
 * Keys should match the event names
 * Each function should accept the WebSocket connection and the data object
 **/
const eventHandlers = {};

eventHandlers.selectChip = function(ws, data) {
  console.log('selectChip:', data);
  const ip = ws._socket.remoteAddress;

  // Find user
  mongo.users.findOne({ ip }).then(user => {
    // Create new player
    const player = {
      userId: user._id,
      chip: data.chip,
      balance: DEFAULT_BALANCE,
      position: 0,
    };
    mongo.players.insertOne(player).then(_ => {
      // Send playerJoined event to all clients
      sendToAll(JSON.stringify({
        event: 'playerJoined',
        data: { player },
      }));
    }).catch(console.error);
  }).catch(console.error);
}
