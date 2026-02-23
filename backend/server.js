/**
 * HTTP Server Bootstrap
 * Raw Node.js HTTP server with Socket.io
 * No Express
 */

const http = require('http');
const { Server } = require('socket.io');

// Create HTTP server
const server = http.createServer();

// Configure CORS for GitHub Pages
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5500';

// Create Socket.io server
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST']
  }
});

// Initialize socket handlers
require('./socket-handler')(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Tic Tac Toe server running on port ${PORT}`);
  console.log(`CORS origin: ${corsOrigin}`);
});