const movable = document.querySelector('div#movable');

// WebSocket
const socket = new WebSocket(`ws://${window.location.hostname}:3001`);

socket.addEventListener('open', function (event) {
  console.log('WebSocket connected');
});

socket.addEventListener('message', function (event) {
  console.log('Message from server: ', event.data);
  const message = JSON.parse(event.data);
  if (message.event === 'move') {
    movable.style.left = `${message.x}px`;
    movable.style.top = `${message.y}px`;
  }
});

socket.addEventListener('error', function (event) {
  console.error('WebSocket error: ', event);
});

socket.addEventListener('close', function (event) {
  console.log('WebSocket closed');
});


// Movable
movable.addEventListener('mousedown', (event) => {
  event.preventDefault();
  console.log('mousedown:', event);
  let offsetX = event.clientX - movable.getBoundingClientRect().left;
  let offsetY = event.clientY - movable.getBoundingClientRect().top;

  function onMouseMove(event) {
    console.log('mousemove:', event);
    movable.style.left = `${event.clientX - offsetX}px`;
    movable.style.top = `${event.clientY - offsetY}px`;
    socket.send(JSON.stringify({
      event: 'move',
      x: event.clientX - offsetX,
      y: event.clientY - offsetY,
    }));
  }

  function onMouseUp(event) {
    console.log('mouseup:', event);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
});

function onClick() {
  console.log('click:');
}
