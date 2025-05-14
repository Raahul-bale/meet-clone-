// Create this file in your root directory
// server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files when in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Store active rooms
const rooms = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // When user creates or joins a room
  socket.on('join-room', (roomId, userId, userName) => {
    console.log(`User ${userName} (${userId}) joined room ${roomId}`);
    
    // Create the room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = { participants: {} };
    }
    
    // Add user to room
    rooms[roomId].participants[userId] = {
      userName,
      socketId: socket.id
    };
    
    // Join the socket room
    socket.join(roomId);
    
    // Notify others in the room about the new participant
    socket.to(roomId).emit('user-connected', userId, userName);
    
    // Send list of all participants to the new user
    socket.emit('room-participants', rooms[roomId].participants);
    
    // Handle WebRTC signaling
    socket.on('signal', ({ to, from, signal }) => {
      io.to(rooms[roomId].participants[to].socketId).emit('signal', {
        from,
        signal
      });
    });
    
    // Handle user disconnect
    socket.on('disconnect', () => {
      console.log(`User ${userName} disconnected from room ${roomId}`);
      if (rooms[roomId] && rooms[roomId].participants[userId]) {
        delete rooms[roomId].participants[userId];
        socket.to(roomId).emit('user-disconnected', userId);
        
        // Remove room if empty
        if (Object.keys(rooms[roomId].participants).length === 0) {
          delete rooms[roomId];
        }
      }
    });
    
    // Handle chat messages
    socket.on('send-message', (message) => {
      socket.to(roomId).emit('receive-message', {
        content: message,
        sender: userName,
        senderId: userId,
        timestamp: new Date().toISOString()
      });
    });
    
    // Handle mute/unmute
    socket.on('toggle-audio', (isAudioEnabled) => {
      socket.to(roomId).emit('user-toggle-audio', userId, isAudioEnabled);
    });
    
    // Handle video on/off
    socket.on('toggle-video', (isVideoEnabled) => {
      socket.to(roomId).emit('user-toggle-video', userId, isVideoEnabled);
    });
    
    // Handle screen sharing
    socket.on('start-sharing', () => {
      socket.to(roomId).emit('user-started-sharing', userId);
    });
    
    socket.on('stop-sharing', () => {
      socket.to(roomId).emit('user-stopped-sharing', userId);
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});