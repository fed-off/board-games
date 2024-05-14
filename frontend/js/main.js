const startForm = document.querySelector('form.monopoly__start-form');

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
  console.log('Message from server:', message);
  // Call function based on the event name if it exists
  if (typeof eventHandlers[message.event] === 'function') {
    eventHandlers[message.event](message.data);
  } else {
    console.error('Unknown event:', message);
  }
});


const eventHandlers = {};

eventHandlers.hello = function(data) {
  console.log('Hello:', data);
  if (data.chip) {
    const ourChipInput = startForm.querySelector(`input[value="${data.chip}"]`);
    ourChipInput.checked = true;
    startForm.querySelectorAll('input[type="radio"]').forEach(input => {
      console.log('input:', input);
      input.disabled = true;
    });
  }
  data.players.filter(player => player.chip !== data.chip).forEach(player => {
    const chipInput = startForm.querySelector(`input[value="${player.chip}"]`);
    chipInput.classList.add('start-form__radio--occupied');
    chipInput.disabled = true;
  });
}

eventHandlers.playerJoined = function(data) {
  console.log('playerJoined:', data);
}

eventHandlers.gameStarted = function(data) {
  console.log('gameStarted: ', data);
}


// selectChip
startForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const selectedInput = startForm.querySelector('input[name="chip"]:checked');
  const selectedChip = selectedInput?.value;
  console.log('Selected chip:', selectedChip);
  if (!selectedChip) {
    return;
  }
  ws.send(JSON.stringify({
    event: 'selectChip',
    data: {
      chip: selectedChip,
    },
  }));
});

// startGame
startForm.querySelector('button.start-form__start-button').addEventListener('click', function(event) {
  ws.send(JSON.stringify({
    event: 'startGame',
    data: {},
  }));
});
