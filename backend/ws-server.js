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
  updateAndBroadcastState({
    dice: [randomInt(1, 6), randomInt(1, 6)],
  });
}

eventHandlers.changeBalance = function(ws, data) {
  updateAndBroadcastState({
    [`balance.${data.player}`]: data.value,
  });
}

eventHandlers.move = function(ws, data) {
  updateAndBroadcastState({
    [`position.${data.id}`]: {left: data.left, top: data.top},
  });
}

eventHandlers.reset = function(ws, data) {
  updateAndBroadcastState({
    dice: [0, 0],
    balance: { cat: 0, dog: 0, dino: 0, racer: 0 },
    position: [
      'chip-cat', 'chip-dog', 'chip-dino', 'chip-racer',
      'house-1', 'house-2', 'house-3', 'house-4', 'house-5', 'house-6', 'house-7', 'house-8',
      'hotel-1', 'hotel-2', 'hotel-3', 'hotel-4', 'hotel-5', 'hotel-6', 'hotel-7', 'hotel-8', 'hotel-9', 'hotel-10', 'hotel-11', 'hotel-12',
    ].reduce((acc, id) => {
      acc[id] = {left: 0, top: 0};
      return acc;
    }, {}),
  });
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

async function updateAndBroadcastState(query) {
  const newState = await mongo.updateState(query);
  sendToAll(JSON.stringify({
    event: 'state',
    data: newState,
  }));
}

// function thisUser(ws) {
//   const ip = ws._socket.remoteAddress;
//   return mongo.users.findOne({ ip });
// }

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
