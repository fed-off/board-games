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
    console.log(message.event, message.data);
    eventHandlers[message.event](message.data);
  } else {
    console.error('Unknown event:', message);
  }
});

// Helper function to send messages to the server
function send(event, data = {}) {
  ws.send(JSON.stringify({
    event,
    data,
  }));
}

// === Elements ===
const diceBox = document.querySelector('div.zone-interface__dice-box');
const diceValue = diceBox.querySelector('span.zone-interface__dice-number');
const diceButton = diceBox.querySelector('button.zone-interface__dice');

const balanceInputs = {
  cat: document.querySelector('input.player__balance-value[data-player="cat"]'),
  dog: document.querySelector('input.player__balance-value[data-player="dog"]'),
  dino: document.querySelector('input.player__balance-value[data-player="dino"]'),
  racer: document.querySelector('input.player__balance-value[data-player="racer"]'),
};

console.log(balanceInputs);


// === Event Handlers ===
const eventHandlers = {};

// === State ===
eventHandlers.state = function(data) {
  diceValue.textContent = data.dice.join(' + ');
  for (const player in data.balance) {
    balanceInputs[player].value = data.balance[player];
  }
}


// === Dice ===
diceButton.addEventListener('click', function(event) {
  send('rollDice');
});


// === Balance ===
document.querySelectorAll('input.player__balance-value').forEach(input =>
  input.addEventListener('input', function(event) {
    send('changeBalance', {
      player: event.target.dataset.player,
      value: event.target.value,
    });
}));
