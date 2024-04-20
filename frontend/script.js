const textArea = document.querySelector('textarea');

// WebSocket
const socket = new WebSocket('ws://localhost:3001');

socket.addEventListener('open', function (event) {
  console.log('WebSocket connected');
});

socket.addEventListener('message', function (event) {
  console.log('Message from server: ', event.data);
  textArea.value = event.data;
});

socket.addEventListener('error', function (event) {
  console.error('WebSocket error: ', event);
});

socket.addEventListener('close', function (event) {
  console.log('WebSocket closed');
});


textArea.addEventListener('input', () => {
  console.log('textInput:', textArea.value);
  socket.send(textArea.value);
});
