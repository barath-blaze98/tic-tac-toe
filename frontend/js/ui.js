/**
 * UI Module - DOM rendering functions
 * Only reads state and renders - never writes state
 * No game logic here
 */

// DOM element references
const elements = {
  // Screens
  menuScreen: null,
  lobbyScreen: null,
  gameScreen: null,
  
  // Menu elements
  createRoomBtn: null,
  joinRoomBtn: null,
  
  // Create room form
  createRoomForm: null,
  createNameInput: null,
  createPassKeyInput: null,
  createSubmitBtn: null,
  createBackBtn: null,
  
  // Join room form
  joinRoomForm: null,
  joinNameInput: null,
  joinRoomIdInput: null,
  joinPassKeyInput: null,
  joinSubmitBtn: null,
  joinBackBtn: null,
  
  // Lobby elements
  roomIdDisplay: null,
  copyRoomIdBtn: null,
  passKeyDisplay: null,
  copyPassKeyBtn: null,
  waitingMessage: null,
  
  // Game elements
  board: null,
  cells: null,
  turnIndicator: null,
  roleIndicator: null,
  resultMessage: null,
  replayBtn: null,
  leaveBtn: null,
  replayVotes: null,
  
  // Error modal
  errorModal: null,
  errorMessage: null,
  errorCloseBtn: null
};

/**
 * Initialize DOM element references
 */
function initElements() {
  // Screens
  elements.menuScreen = document.getElementById('menu-screen');
  elements.lobbyScreen = document.getElementById('lobby-screen');
  elements.gameScreen = document.getElementById('game-screen');
  
  // Menu elements
  elements.createRoomBtn = document.getElementById('create-room-btn');
  elements.joinRoomBtn = document.getElementById('join-room-btn');
  
  // Create room form
  elements.createRoomForm = document.getElementById('create-room-form');
  elements.createNameInput = document.getElementById('create-name');
  elements.createPassKeyInput = document.getElementById('create-passkey');
  elements.createSubmitBtn = document.getElementById('create-submit');
  elements.createBackBtn = document.getElementById('create-back');
  
  // Join room form
  elements.joinRoomForm = document.getElementById('join-room-form');
  elements.joinNameInput = document.getElementById('join-name');
  elements.joinRoomIdInput = document.getElementById('join-room-id');
  elements.joinPassKeyInput = document.getElementById('join-passkey');
  elements.joinSubmitBtn = document.getElementById('join-submit');
  elements.joinBackBtn = document.getElementById('join-back');
  
  // Lobby elements
  elements.roomIdDisplay = document.getElementById('room-id-display');
  elements.copyRoomIdBtn = document.getElementById('copy-room-id');
  elements.passKeyDisplay = document.getElementById('passkey-display');
  elements.copyPassKeyBtn = document.getElementById('copy-passkey');
  elements.waitingMessage = document.getElementById('waiting-message');
  
  // Game elements
  elements.board = document.getElementById('board');
  elements.cells = document.querySelectorAll('.cell');
  elements.turnIndicator = document.getElementById('turn-indicator');
  elements.roleIndicator = document.getElementById('role-indicator');
  elements.resultMessage = document.getElementById('result-message');
  elements.replayBtn = document.getElementById('replay-btn');
  elements.leaveBtn = document.getElementById('leave-btn');
  elements.replayVotes = document.getElementById('replay-votes');
  
  // Error modal
  elements.errorModal = document.getElementById('error-modal');
  elements.errorMessage = document.getElementById('error-message');
  elements.errorCloseBtn = document.getElementById('error-close');
}

/**
 * Show a specific screen
 * @param {string} screenId - The screen ID to show
 */
function showScreen(screenId) {
  // Hide all screens
  elements.menuScreen.classList.add('hidden');
  elements.lobbyScreen.classList.add('hidden');
  elements.gameScreen.classList.add('hidden');
  
  // Show the requested screen
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.remove('hidden');
  }
}

/**
 * Show the create room form
 */
function showCreateRoomForm() {
  elements.createRoomForm.classList.remove('hidden');
  elements.joinRoomForm.classList.add('hidden');
}

/**
 * Show the join room form
 */
function showJoinRoomForm() {
  elements.createRoomForm.classList.add('hidden');
  elements.joinRoomForm.classList.remove('hidden');
}

/**
 * Hide both forms (back to menu)
 */
function hideForms() {
  elements.createRoomForm.classList.add('hidden');
  elements.joinRoomForm.classList.add('hidden');
  elements.createNameInput.value = '';
  elements.createPassKeyInput.value = '';
  elements.joinNameInput.value = '';
  elements.joinRoomIdInput.value = '';
  elements.joinPassKeyInput.value = '';
}

/**
 * Display room info in lobby
 * @param {string} roomId - The room ID
 * @param {string} passKey - The pass key
 */
function displayRoomInfo(roomId, passKey) {
  elements.roomIdDisplay.textContent = roomId;
  elements.passKeyDisplay.textContent = passKey;
}

/**
 * Update waiting message
 * @param {string} message - The message to display
 */
function updateWaitingMessage(message) {
  elements.waitingMessage.textContent = message;
}

/**
 * Render the game board
 * @param {Array} board - Array of 9 cells (null | "X" | "O")
 */
function renderBoard(board) {
  elements.cells.forEach((cell, index) => {
    const value = board[index];
    cell.textContent = value || '';
    cell.classList.remove('x', 'o', 'win', 'taken');
    if (value) {
      cell.classList.add(value.toLowerCase());
      cell.classList.add('taken');
    }
  });
}

/**
 * Highlight winning cells
 * @param {Array} winningIndices - Array of winning cell indices
 */
function highlightWinningCells(winningIndices) {
  winningIndices.forEach(index => {
    elements.cells[index].classList.add('win');
  });
}

/**
 * Update turn indicator
 * @param {string} turn - Current turn ("X" | "O")
 * @param {string} playerRole - The player's role ("X" | "O")
 * @param {string} opponentName - The opponent's name (optional)
 */
function updateTurnIndicator(turn, playerRole, opponentName) {
  const isYourTurn = turn === playerRole;
  const displayName = opponentName ? `${opponentName}'s` : "Opponent's";
  elements.turnIndicator.textContent = isYourTurn 
    ? "Your turn!" 
    : `${displayName} turn (${turn})`;
  elements.turnIndicator.className = isYourTurn ? 'your-turn' : 'opponent-turn';
}

/**
 * Update role indicator
 * @param {string} role - The player's role ("X" | "O")
 */
function updateRoleIndicator(role) {
  elements.roleIndicator.textContent = `You are: ${role}`;
  elements.roleIndicator.className = `role-${role.toLowerCase()}`;
}

/**
 * Show result message
 * @param {string} winner - The winner ("X" | "O" | "draw" | null)
 * @param {string} playerRole - The player's role
 */
function showResult(winner, playerRole) {
  elements.resultMessage.classList.remove('hidden');
  elements.replayBtn.classList.remove('hidden');
  elements.replayVotes.classList.remove('hidden');
  
  if (winner === 'draw') {
    elements.resultMessage.textContent = "It's a draw!";
    elements.resultMessage.className = 'result-message draw';
  } else if (winner === playerRole) {
    elements.resultMessage.textContent = 'You win! 🎉';
    elements.resultMessage.className = 'result-message win';
  } else {
    elements.resultMessage.textContent = 'Good game!';
    elements.resultMessage.className = 'result-message lose';
  }
}

/**
 * Hide result message and replay button
 */
function hideResult() {
  elements.resultMessage.classList.add('hidden');
  elements.replayBtn.classList.add('hidden');
  elements.replayVotes.classList.add('hidden');
  elements.replayVotes.textContent = '';
}

/**
 * Update replay votes display
 * @param {number} votes - Number of votes
 */
function updateReplayVotes(votes) {
  elements.replayVotes.textContent = `Replay votes: ${votes}/2`;
}

/**
 * Show error modal
 * @param {string} message - The error message
 */
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorModal.classList.remove('hidden');
}

/**
 * Hide error modal
 */
function hideError() {
  elements.errorModal.classList.add('hidden');
}

/**
 * Clear the board
 */
function clearBoard() {
  elements.cells.forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('x', 'o', 'win', 'taken');
  });
}

/**
 * Get elements object (for event binding in main.js)
 * @returns {Object}
 */
function getElements() {
  return elements;
}

/**
 * Show a snackbar notification
 * @param {string} message - The message to display
 */
function showSnackbar(message) {
  const snackbar = document.getElementById('snackbar');
  if (snackbar) {
    snackbar.textContent = message;
    snackbar.classList.add('show');
    setTimeout(() => {
      snackbar.classList.remove('show');
    }, 1500);
  }
}

/**
 * Trigger confetti animation
 */
function triggerConfetti() {
  const container = document.getElementById('confetti');
  if (!container) return;
  
  const colors = ['#818cf8', '#c084fc', '#f472b6', '#22c55e', '#fbbf24', '#ef4444'];
  const shapes = ['circle', 'square', 'triangle'];
  const confettiCount = 80;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = `confetti ${shapes[Math.floor(Math.random() * shapes.length)]}`;
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
    
    if (confetti.classList.contains('triangle')) {
      confetti.style.borderBottomColor = colors[Math.floor(Math.random() * colors.length)];
    } else {
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    }
    
    container.appendChild(confetti);
    
    // Remove confetti after animation
    setTimeout(() => {
      confetti.remove();
    }, 4000);
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initElements,
    showScreen,
    showCreateRoomForm,
    showJoinRoomForm,
    hideForms,
    displayRoomInfo,
    updateWaitingMessage,
    renderBoard,
    highlightWinningCells,
    updateTurnIndicator,
    updateRoleIndicator,
    showResult,
    hideResult,
    updateReplayVotes,
    showError,
    hideError,
    clearBoard,
    getElements,
    showSnackbar,
    triggerConfetti
  };
}