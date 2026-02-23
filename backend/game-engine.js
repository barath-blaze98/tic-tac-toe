/**
 * Game Engine - All game logic lives here
 * No other file should contain game logic
 */

// All 8 winning lines
const WINNING_LINES = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6]
];

/**
 * Check if there's a winner
 * @param {Array} board - Array of 9 cells (null | "X" | "O")
 * @returns {string|null} - "X" | "O" | null
 */
function checkWinner(board) {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

/**
 * Check if the game is a draw
 * @param {Array} board - Array of 9 cells
 * @returns {boolean}
 */
function checkDraw(board) {
  return board.every(cell => cell !== null);
}

/**
 * Validate a move
 * @param {Object} room - The room object
 * @param {string} playerRole - "X" | "O"
 * @param {number} index - Cell index (0-8)
 * @returns {Object} - { valid: boolean, error?: { code: string, message: string } }
 */
function validateMove(room, playerRole, index) {
  // Check if game is in playing state
  if (room.status !== 'playing') {
    return {
      valid: false,
      error: {
        code: 'GAME_NOT_STARTED',
        message: 'The game has not started yet'
      }
    };
  }

  // Check if it's the player's turn
  if (room.turn !== playerRole) {
    return {
      valid: false,
      error: {
        code: 'NOT_YOUR_TURN',
        message: `It's ${room.turn}'s turn, not yours`
      }
    };
  }

  // Check if the cell is valid
  if (index < 0 || index > 8) {
    return {
      valid: false,
      error: {
        code: 'INVALID_CELL',
        message: 'Invalid cell index'
      }
    };
  }

  // Check if the cell is empty
  if (room.board[index] !== null) {
    return {
      valid: false,
      error: {
        code: 'CELL_TAKEN',
        message: 'This cell is already taken'
      }
    };
  }

  return { valid: true };
}

/**
 * Apply a move to the board and return the result
 * @param {Object} room - The room object (will be mutated)
 * @param {number} index - Cell index (0-8)
 * @returns {Object} - { winner: "X" | "O" | "draw" | null }
 */
function applyMove(room, index) {
  // Place the mark
  room.board[index] = room.turn;

  // Check for winner
  const winner = checkWinner(room.board);
  if (winner) {
    room.status = 'ended';
    return { winner };
  }

  // Check for draw
  if (checkDraw(room.board)) {
    room.status = 'ended';
    return { winner: 'draw' };
  }

  // Switch turn
  room.turn = room.turn === 'X' ? 'O' : 'X';
  return { winner: null };
}

/**
 * Get the opposite role
 * @param {string} role - "X" | "O"
 * @returns {string}
 */
function getOppositeRole(role) {
  return role === 'X' ? 'O' : 'X';
}

module.exports = {
  checkWinner,
  checkDraw,
  validateMove,
  applyMove,
  getOppositeRole,
  WINNING_LINES
};