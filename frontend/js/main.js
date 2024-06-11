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
const chanceButton = document.querySelector('button.interface__card-text--chance');
const trainButton = document.querySelector('button.interface__card-text--train');

const balanceInputs = {
  cat: document.querySelector('input.player__balance-value[data-player="cat"]'),
  dog: document.querySelector('input.player__balance-value[data-player="dog"]'),
  dino: document.querySelector('input.player__balance-value[data-player="dino"]'),
  racer: document.querySelector('input.player__balance-value[data-player="racer"]'),
};

const balanceDeltaSpans = {
  cat: document.querySelector('span.player__balance-delta[data-player="cat"]'),
  dog: document.querySelector('span.player__balance-delta[data-player="dog"]'),
  dino: document.querySelector('span.player__balance-delta[data-player="dino"]'),
  racer: document.querySelector('span.player__balance-delta[data-player="racer"]'),
};


// === Event Handlers ===
const eventHandlers = {};

// === State ===
let currentMovableId = null;
eventHandlers.state = function(data) {
  diceValue.textContent = data.dice.join(' + ');
  chanceButton.textContent = data.chance;
  trainButton.textContent = data.train;
  for (const player in data.balance) {
    balanceInputs[player].value = data.balance[player];
    oldBalance[player] = data.balance[player];
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

eventHandlers.dice = function(data) {
  animateText(diceValue, data.dice.join(' + '));
  resetBalanceDeltas();
}


// === Balance ===
const oldBalance = {};
function showBalanceDelta(player, newValue) {
  const oldValue = oldBalance[player];
  const delta = newValue - oldValue;
  const span = balanceDeltaSpans[player];
  if (delta === 0) {
    span.textContent = '';
    span.classList.remove('player__balance-delta--positive');
    span.classList.remove('player__balance-delta--negative');
    return;
  }
  if (delta > 0) {
    span.classList.add('player__balance-delta--positive');
    span.classList.remove('player__balance-delta--negative');
  } else {
    span.classList.add('player__balance-delta--negative');
    span.classList.remove('player__balance-delta--positive');
  }
  span.textContent = Math.abs(delta);
}

function resetBalanceDeltas() {
  for (const player in balanceDeltaSpans) {
    balanceDeltaSpans[player].textContent = '';
    balanceDeltaSpans[player].classList.remove('player__balance-delta--positive');
    balanceDeltaSpans[player].classList.remove('player__balance-delta--negative');
  }
  for (const player in balanceInputs) {
    oldBalance[player] = balanceInputs[player].value;
  }
}

document.querySelectorAll('input.player__balance-value').forEach(input =>
  input.addEventListener('input', function(event) {
    send('changeBalance', {
      player: event.target.dataset.player,
      value: event.target.value,
    });
}));

eventHandlers.balance = function(data) {
  balanceInputs[data.player].value = data.value;
  showBalanceDelta(data.player, data.value);
}

// === Reset ===
document.querySelector('button.interface__button--reset').addEventListener('click', function(event) {
  if (confirm('Вы уверены что хотите сбросить игру?')) {
    send('reset');
    resetBalanceDeltas();
  }
});

// === Chance ===
chanceButton.addEventListener('click', function(event) {
  send('chance');
});

eventHandlers.chance = function(data) {
  animateText(chanceButton, data.chance);
}

// === Train ===
trainButton.addEventListener('click', function(event) {
  send('train');
});

eventHandlers.train = function(data) {
  animateText(trainButton, data.train);
}

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

// === Property cards auto-close ===
const propertyCheckboxes = document.querySelectorAll('input.cell__color');
propertyCheckboxes.forEach(checkbox => {
  checkbox.addEventListener('change', function(event) {
    const openedCard = event.target;
    if (!openedCard.checked) return;

    function autoClose(event) {
      if (event.target.closest('.cell__info')) return;
      openedCard.checked = false;
      document.removeEventListener('click', autoClose);
    }

    document.addEventListener('click', autoClose);
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

function animateText(element, text, duration = 1500) {
  const delay = duration / text.length;
  let index = 0;
  element.textContent = '';

  function typeCharacter() {
    if (index < text.length) {
      element.textContent += text[index];
      index++;
      setTimeout(typeCharacter, delay);
    }
  }

  typeCharacter();
}
