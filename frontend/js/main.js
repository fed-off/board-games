const startForm = document.querySelector('form.monopoly__start-form');

// == State ==
let myChip = null;
function setMyChip(chip) {
  if (chip === myChip) return;
  myChip = chip;
  startForm.querySelector(`input[value="${chip}"]`).checked = true;
  startForm.querySelectorAll('input[type="radio"]').forEach(input => input.disabled = true);
  startForm.querySelector('button.start-form__button-submit').disabled = true;
  startForm.querySelector('button.start-form__start-button').disabled = false;
}

let players = [];
function setPlayers(newPlayers) {
  if (newPlayers.length === players.length) return;
  players = newPlayers;
  startForm.querySelectorAll('input[type="radio"]').forEach(input => {
    input.classList.remove('start-form__radio--occupied');
    input.disabled = false;
  });
  players.forEach(player => {
    const chipInput = startForm.querySelector(`input[value="${player.chip}"]`);
    chipInput.classList.add('start-form__radio--occupied');
    chipInput.disabled = true;
  });
}


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

eventHandlers.hello = function(data) {
  console.log('hello:', data);
  setPlayers(data.players);
  if (data.chip) {
    setMyChip(data.chip);
  }
}

eventHandlers.playerJoined = function(data) {
  console.log('playerJoined:', data);
  if (data.player.chip !== myChip) {
    setPlayers([...players, data.player]);
  }
}

eventHandlers.gameStarted = function(data) {
  console.log('gameStarted: ', data);
}


// == Form ==
// selectChip
startForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const selectedInput = startForm.querySelector('input[name="chip"]:checked');
  const selectedChip = selectedInput?.value;
  console.log('Selected chip:', selectedChip);
  if (!selectedChip) {
    return;
  }
  setMyChip(selectedChip);
  ws.send(JSON.stringify({
    event: 'selectChip',
    data: {
      chip: selectedChip,
    },
  }));
});

// startGame
startForm.querySelector('button.start-form__start-button').addEventListener('click', function(event) {
  startForm.querySelector('button.start-form__start-button').disabled = true;
  ws.send(JSON.stringify({
    event: 'startGame',
    data: {},
  }));
});
