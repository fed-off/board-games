const ws = new WebSocket(`ws://${window.location.hostname}:3001`);

ws.addEventListener('open', function(event) {
  console.log('WebSocket connected');
});

ws.addEventListener('close', function(event) {
  console.log('WebSocket closed');
});

ws.addEventListener('error', function(event) {
  console.error('WebSocket error: ', event);
});

ws.addEventListener('message', function(event) {
  const message = JSON.parse(event.data);
  console.log('Message from server:', message);
  // Call function based on the event name if it exists
  if (typeof eventHandlers[message.event] === 'function') {
    eventHandlers[message.event](message.data);
  } else {
    console.error('Unknown event:', message);
  }
});


const eventHandlers = {};
eventHandlers.hello = function(message) {
  console.log('Hello:', message);
}

eventHandlers.playerJoined = function(message) {
  console.log('playerJoined:', message);
}
