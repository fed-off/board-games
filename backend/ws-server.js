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
  const now = new Date();
  mongo.users.updateOne(
    { ip },
    {
      $set: {
        active: true,
        lastVisit: now,
      },
      $setOnInsert: {
        ip: ip,
        firstVisit: now,
      },
    },
    { upsert: true }
  ).then(console.debug).catch(console.error);

  // Send hello event with players list
  mongo.players.find().toArray().then(players => {
    thisPlayer(ws).then(player => {
      ws.send(JSON.stringify({
        event: 'hello',
        data: {
          chip: player?.chip || null,
          players
        },
      }));
    });

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


/**
 * Utils
 **/

function thisUser(ws) {
  const ip = ws._socket.remoteAddress;
  return mongo.users.findOne({ ip });
}

function thisPlayer(ws) {
  return thisUser(ws).then(user => {
    return mongo.players.findOne({ userId: user._id });
  }).catch(console.error);
}
