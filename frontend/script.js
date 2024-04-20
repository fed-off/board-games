const textArea = document.querySelector('textarea');

textArea.addEventListener('input', () => {
  console.log(textArea.value);
});

fetch('http://localhost:3000/hello')
  .then((response) => response.json())
  .then((data) => {
    textArea.value = data.message;
  });
