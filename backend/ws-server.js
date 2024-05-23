const ws = require('ws');
const mongo = require('./mongodb.js');
// const { DEFAULT_BALANCE } = require('./constants.js');


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


function onConnect(ws) {
  const ip = ws._socket.remoteAddress;
  console.log('Client connected from IP', ip);

  mongo.state.findOne().then(doc => {
    if (doc) {
      ws.send(JSON.stringify({
        event: 'state',
        data: doc,
      }));
    } else {
      const defaultState = { dice: [0, 0] };
      mongo.state.insertOne(defaultState)
        .then(_ => {
          ws.send(JSON.stringify({
            event: 'state',
            data: defaultState,
          }));
        }).catch(console.error);
    }
  }).catch(console.error);
}


function onDisconnect(ws) {
  const ip = ws._socket.remoteAddress;
  console.log('Client disconnected from IP', ip);
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

eventHandlers.rollDice = function(ws, data) {
  console.log('rollDice:', data);
  const result = [randomInt(1, 6), randomInt(1, 6)];

  mongo.state.findOneAndUpdate(
    {},
    {
      $set: {
        dice: result,
      },
    },
    { returnDocument: 'after' }
  ).then(doc => {
    sendToAll(JSON.stringify({
      event: 'state',
      data: doc,
    }));
  }).catch(console.error);
}



// /**
//  * Utils
//  **/

function sendToAll(message) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === ws.WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// function thisUser(ws) {
//   const ip = ws._socket.remoteAddress;
//   return mongo.users.findOne({ ip });
// }

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
