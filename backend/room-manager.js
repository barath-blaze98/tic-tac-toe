/**
 * Room Manager - Room CRUD and in-memory store
 * No other file may read or write the store directly
 */

const bcrypt = require('bcryptjs');
const { validateMove, applyMove } = require('./game-engine');

// In-memory room store
const rooms = new Map();

/**
 * Generate a random 6-character alphanumeric room ID
 * @returns {string}
 */
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let roomId = '';
  for (let i = 0; i < 6; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return roomId;
}

/**
 * Create a new room
 * @param {string} passKey - The pass key (4-20 chars)
 * @param {string} socketId - The socket ID of the creator
 * @returns {Promise<string>} - The generated roomId
 */
async function createRoom(passKey, socketId) {
  const roomId = generateRoomId();
  
  // Ensure uniqueness
  while (rooms.has(roomId)) {
    roomId = generateRoomId();
  }

  const passKeyHash = await bcrypt.hash(passKey, 10);

  const room = {
    roomId,
    passKeyHash,
    players: [{ socketId, role: 'X' }], // Creator is always X
    board: Array(9).fill(null),
    turn: 'X',
    status: 'waiting',
    replayVotes: new Set(),
    startingTurn: 'X' // Track who started for replay swap
  };

  rooms.set(roomId, room);
  return roomId;
}

/**
 * Join an existing room
 * @param {string} roomId - The room ID
 * @param {string} passKey - The pass key
 * @param {string} socketId - The socket ID of the joining player
 * @returns {Promise<Object>} - { success: boolean, role?: string, error?: { code: string, message: string } }
 */
async function joinRoom(roomId, passKey, socketId) {
  const room = rooms.get(roomId);

  if (!room) {
    return {
      success: false,
      error: {
        code: 'ROOM_NOT_FOUND',
        message: 'Room not found'
      }
    };
  }

  // Verify pass key
  const isValid = await bcrypt.compare(passKey, room.passKeyHash);
  if (!isValid) {
    return {
      success: false,
      error: {
        code: 'WRONG_PASSKEY',
        message: 'Incorrect pass key'
      }
    };
  }

  // Check if room is full
  if (room.players.length >= 2) {
    return {
      success: false,
      error: {
        code: 'ROOM_FULL',
        message: 'Room is full'
      }
    };
  }

  // Check if player is already in the room (reconnection scenario)
  const existingPlayer = room.players.find(p => p.socketId === socketId);
  if (existingPlayer) {
    return {
      success: true,
      role: existingPlayer.role,
      alreadyJoined: true
    };
  }

  // Assign role
  const role = room.players.length === 0 ? 'X' : 'O';
  room.players.push({ socketId, role });

  // If room is now full, start the game
  if (room.players.length === 2) {
    room.status = 'playing';
  }

  return {
    success: true,
    role,
    alreadyJoined: false
  };
}

/**
 * Get a room by ID
 * @param {string} roomId - The room ID
 * @returns {Object|null} - The room object or null
 */
function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

/**
 * Get a player's role in a room
 * @param {string} roomId - The room ID
 * @param {string} socketId - The socket ID
 * @returns {string|null} - "X" | "O" | null
 */
function getPlayerRole(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;

  const player = room.players.find(p => p.socketId === socketId);
  return player ? player.role : null;
}

/**
 * Apply a move to the room's board
 * @param {string} roomId - The room ID
 * @param {string} socketId - The socket ID of the player making the move
 * @param {number} index - The cell index (0-8)
 * @returns {Object} - { success: boolean, room?: Object, winner?: string, error?: Object }
 */
function applyMoveToRoom(roomId, socketId, index) {
  const room = rooms.get(roomId);
  if (!room) {
    return {
      success: false,
      error: {
        code: 'ROOM_NOT_FOUND',
        message: 'Room not found'
      }
    };
  }

  const playerRole = getPlayerRole(roomId, socketId);
  if (!playerRole) {
    return {
      success: false,
      error: {
        code: 'NOT_IN_ROOM',
        message: 'You are not in this room'
      }
    };
  }

  // Validate the move
  const validation = validateMove(room, playerRole, index);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }

  // Apply the move
  const result = applyMove(room, index);

  return {
    success: true,
    room,
    winner: result.winner
  };
}

/**
 * Register a replay vote
 * @param {string} roomId - The room ID
 * @param {string} socketId - The socket ID of the voting player
 * @returns {Object} - { success: boolean, votes?: number, error?: Object }
 */
function registerReplayVote(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) {
    return {
      success: false,
      error: {
        code: 'ROOM_NOT_FOUND',
        message: 'Room not found'
      }
    };
  }

  if (room.status !== 'ended') {
    return {
      success: false,
      error: {
        code: 'GAME_NOT_ENDED',
        message: 'Game has not ended yet'
      }
    };
  }

  // Check if player has already voted
  if (room.replayVotes.has(socketId)) {
    return {
      success: false,
      error: {
        code: 'ALREADY_VOTED',
        message: 'You have already voted for replay'
      }
    };
  }

  room.replayVotes.add(socketId);
  return {
    success: true,
    votes: room.replayVotes.size
  };
}

/**
 * Reset a room for a new game
 * @param {string} roomId - The room ID
 * @returns {Object|null} - The reset room object or null
 */
function resetRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;

  // Clear board
  room.board = Array(9).fill(null);
  
  // Swap starting turn
  room.startingTurn = room.startingTurn === 'X' ? 'O' : 'X';
  room.turn = room.startingTurn;
  
  // Clear votes
  room.replayVotes.clear();
  
  // Set status to playing
  room.status = 'playing';

  return room;
}

/**
 * Remove a player from a room
 * @param {string} roomId - The room ID
 * @param {string} socketId - The socket ID of the leaving player
 * @returns {Object} - { roomExists: boolean, hadPlayers: boolean, remainingPlayers: number }
 */
function removePlayer(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) {
    return { roomExists: false, hadPlayers: false, remainingPlayers: 0 };
  }

  const playerIndex = room.players.findIndex(p => p.socketId === socketId);
  if (playerIndex === -1) {
    return { roomExists: true, hadPlayers: false, remainingPlayers: room.players.length };
  }

  room.players.splice(playerIndex, 1);

  // If no players left, delete the room
  if (room.players.length === 0) {
    rooms.delete(roomId);
    return { roomExists: false, hadPlayers: true, remainingPlayers: 0 };
  }

  // Set status to waiting
  room.status = 'waiting';
  room.board = Array(9).fill(null);
  room.turn = 'X';
  room.replayVotes.clear();

  return { roomExists: true, hadPlayers: true, remainingPlayers: room.players.length };
}

/**
 * Find all rooms a player is in
 * @param {string} socketId - The socket ID
 * @returns {Array<string>} - Array of room IDs
 */
function findPlayerRooms(socketId) {
  const playerRooms = [];
  for (const [roomId, room] of rooms) {
    if (room.players.some(p => p.socketId === socketId)) {
      playerRooms.push(roomId);
    }
  }
  return playerRooms;
}

/**
 * Get the opponent's socket ID
 * @param {string} roomId - The room ID
 * @param {string} socketId - The current player's socket ID
 * @returns {string|null} - The opponent's socket ID or null
 */
function getOpponentSocketId(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;

  const opponent = room.players.find(p => p.socketId !== socketId);
  return opponent ? opponent.socketId : null;
}

module.exports = {
  createRoom,
  joinRoom,
  getRoom,
  getPlayerRole,
  applyMoveToRoom,
  registerReplayVote,
  resetRoom,
  removePlayer,
  findPlayerRooms,
  getOpponentSocketId
};