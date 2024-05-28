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


// === Event Handlers ===
const eventHandlers = {};

// === State ===
let currentMovableId = null;
eventHandlers.state = function(data) {
  diceValue.textContent = data.dice.join(' + ');
  for (const player in data.balance) {
    balanceInputs[player].value = data.balance[player];
  }
  // TODO: cache movable and property elements
  for (const id in data.position) {
    const movable = document.getElementById(id);
    if (movable && movable.id !== currentMovableId) {
      movable.style.left = `${data.position[id].left}vw`;
      movable.style.top = `${data.position[id].top}vh`;
    }
  }
  for (const id in data.property) {
    const property = document.getElementById(id);
    if (property) {
      property.value = data.property[id];
    }
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

// === Reset ===
document.querySelector('button.interface__button--reset').addEventListener('click', function(event) {
  if (confirm('Вы уверены что хотите сбросить игру?')) {
    send('reset');
  }
});


// === Movable ===
const movables = document.querySelectorAll('.movable');
movables.forEach(movable => {
  movable.addEventListener('mousedown', (event) => {
    event.preventDefault();
    // Calculate the offset from the mouse to the top-left corner of the element
    let offsetX = event.clientX - movable.getBoundingClientRect().left;
    let offsetY = event.clientY - movable.getBoundingClientRect().top;
    // calculate the offset for parent top-left corner
    const parentOffset = calculateParentOffset(movable);
    offsetX += parentOffset.left;
    offsetY += parentOffset.top;

    const id = event.target.id;
    currentMovableId = id;

    function onMouseMove(event) {
      const {x, y} = getMousePosition(event);
      let left = x - offsetX; // px
      let top = y - offsetY; // px
      left = left / window.innerWidth * 100; // vw
      top = top / window.innerHeight * 100; // vh
      movable.style.left = `${left}vw`;
      movable.style.top = `${top}vh`;
      send('move', {id, left, top});
    }

    function onMouseUp(event) {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      currentMovableId = null;
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
});

// === Property ===
const properties = document.querySelectorAll('select.property');
properties.forEach(property => {
  property.addEventListener('change', (event) => {
    const id = property.id;
    const owner = property.value;
    send('changePropertyOwner', {id, owner});
  });
});

// === Utils ===
function calculateParentOffset(element) {
  let top = 0;
  let left = 0;

  while (element.offsetParent) {
      element = element.offsetParent;
      top += element.offsetTop - element.scrollTop + element.clientTop;
      left += element.offsetLeft - element.scrollLeft + element.clientLeft;
  }

  return { top, left };
}

function getMousePosition(event) {
  const PADDING = 50; // px

  let x = event.clientX;
  if (x < PADDING)
    x = PADDING;
  else if (x > window.innerWidth - PADDING)
    x = window.innerWidth - PADDING;

  let y = event.clientY;
  if (y < PADDING)
    y = PADDING;
  else if (y > window.innerHeight - PADDING)
    y = window.innerHeight - PADDING;

  return {x, y};
}
