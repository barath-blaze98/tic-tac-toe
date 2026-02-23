/**
 * Socket Module - All Socket.io client logic
 * This is the ONLY file that touches the socket
 * No other frontend file may import or reference the socket
 */

// Socket.io connection
let socket = null;

// Event callbacks - registered by main.js
const callbacks = {
  onRoomCreated: null,
  onGameStart: null,
  onBoardUpdate: null,
  onReplayVote: null,
  onPlayerLeft: null,
  onError: null,
  onConnect: null,
  onDisconnect: null
};

/**
 * Initialize socket connection
 * @param {string} serverUrl - The server URL (e.g., 'http://localhost:3000')
 */
function initSocket(serverUrl) {
  socket = io(serverUrl, {
    transports: ['websocket', 'polling']
  });

  // Connection events
  socket.on('connect', () => {
    console.log('Connected to server');
    if (callbacks.onConnect) {
      callbacks.onConnect();
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    if (callbacks.onDisconnect) {
      callbacks.onDisconnect();
    }
  });

  // Game events
  socket.on('room_created', (data) => {
    console.log('Room created:', data.roomId);
    if (callbacks.onRoomCreated) {
      callbacks.onRoomCreated(data);
    }
  });

  socket.on('game_start', (data) => {
    console.log('Game started. Role:', data.role);
    if (callbacks.onGameStart) {
      callbacks.onGameStart(data);
    }
  });

  socket.on('board_update', (data) => {
    console.log('Board updated:', data);
    if (callbacks.onBoardUpdate) {
      callbacks.onBoardUpdate(data);
    }
  });

  socket.on('replay_vote', (data) => {
    console.log('Replay vote:', data.votes);
    if (callbacks.onReplayVote) {
      callbacks.onReplayVote(data);
    }
  });

  socket.on('player_left', (data) => {
    console.log('Player left');
    if (callbacks.onPlayerLeft) {
      callbacks.onPlayerLeft(data);
    }
  });

  socket.on('error', (data) => {
    console.error('Server error:', data);
    if (callbacks.onError) {
      callbacks.onError(data);
    }
  });
}

/**
 * Register event callbacks
 * @param {Object} newCallbacks - Object containing callback functions
 */
function registerCallbacks(newCallbacks) {
  Object.assign(callbacks, newCallbacks);
}

/**
 * Create a new room
 * @param {string} passKey - The pass key (4-20 chars)
 * @param {string} playerName - The player's name
 */
function createRoom(passKey, playerName) {
  if (!socket) {
    console.error('Socket not initialized');
    return;
  }
  socket.emit('create_room', { passKey, playerName });
}

/**
 * Join an existing room
 * @param {string} roomId - The room ID (6 chars)
 * @param {string} passKey - The pass key
 * @param {string} playerName - The player's name
 */
function joinRoom(roomId, passKey, playerName) {
  if (!socket) {
    console.error('Socket not initialized');
    return;
  }
  socket.emit('join_room', { roomId, passKey, playerName });
}

/**
 * Make a move
 * @param {string} roomId - The room ID
 * @param {number} index - The cell index (0-8)
 */
function makeMove(roomId, index) {
  if (!socket) {
    console.error('Socket not initialized');
    return;
  }
  socket.emit('make_move', { roomId, index });
}

/**
 * Request a replay
 * @param {string} roomId - The room ID
 */
function requestReplay(roomId) {
  if (!socket) {
    console.error('Socket not initialized');
    return;
  }
  socket.emit('replay_request', { roomId });
}

/**
 * Leave a room
 * @param {string} roomId - The room ID
 */
function leaveRoom(roomId) {
  if (!socket) {
    console.error('Socket not initialized');
    return;
  }
  socket.emit('leave_room', { roomId });
}

/**
 * Check if socket is connected
 * @returns {boolean}
 */
function isConnected() {
  return socket && socket.connected;
}

/**
 * Disconnect socket
 */
function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initSocket,
    registerCallbacks,
    createRoom,
    joinRoom,
    makeMove,
    requestReplay,
    leaveRoom,
    isConnected,
    disconnect
  };
}