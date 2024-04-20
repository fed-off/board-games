const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Set the content type to JSON
  res.setHeader('Content-Type', 'application/json');
  
  // Check the URL
  if (req.url === '/hello') {
    // Send a JSON response with Hello World message
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Hello, World!' }));
  } else {
    // Send a 404 message
    res.writeHead(404);
    res.end(JSON.stringify({ message: 'Route Not Found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
