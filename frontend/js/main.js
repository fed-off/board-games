// == WebSocket ==
const ws = new WebSocket(`ws://${window.location.hostname}:3001`);
// Replace for development to connect to the remote server
// const ws = new WebSocket(`ws://3.125.34.21:3001`);

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
  // Call function based on the event name if it exists
  if (typeof eventHandlers[message.event] === 'function') {
    eventHandlers[message.event](message.data);
  } else {
    console.error('Unknown event:', message);
  }
});


// == Event Handlers ==
const eventHandlers = {};

// === Dice ===
const diceBox = document.querySelector('div.zone-interface__dice-box');
const diceValue = diceBox.querySelector('span.zone-interface__dice-number');
const diceButton = diceBox.querySelector('button.zone-interface__dice');

diceButton.addEventListener('click', function(event) {
  ws.send(JSON.stringify({
    event: 'rollDice',
    data: {},
  }));
});

eventHandlers.state = function(data) {
  console.log('state: ', data);
  diceValue.textContent = data.dice.join(' + ');
}
