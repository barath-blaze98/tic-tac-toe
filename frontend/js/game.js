/**
 * Game Constants - Client-side constants only
 * NO game logic here
 */

// Player symbols
const SYMBOLS = {
  X: 'X',
  O: 'O'
};

// Game statuses
const GAME_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  ENDED: 'ended'
};

// Error codes
const ERROR_CODES = {
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  WRONG_PASSKEY: 'WRONG_PASSKEY',
  ROOM_FULL: 'ROOM_FULL',
  NOT_YOUR_TURN: 'NOT_YOUR_TURN',
  CELL_TAKEN: 'CELL_TAKEN',
  GAME_NOT_STARTED: 'GAME_NOT_STARTED',
  INVALID_PASSKEY: 'INVALID_PASSKEY',
  INVALID_ROOM_ID: 'INVALID_ROOM_ID',
  INVALID_CELL: 'INVALID_CELL',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_IN_ROOM: 'NOT_IN_ROOM',
  GAME_NOT_ENDED: 'GAME_NOT_ENDED',
  ALREADY_VOTED: 'ALREADY_VOTED'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SYMBOLS, GAME_STATUS, ERROR_CODES };
}