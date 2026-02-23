/**
 * Main Entry Point - Bootstraps UI state
 * Coordinates between socket and UI modules
 */

// Game state (managed here, not in UI)
const gameState = {
  roomId: null,
  passKey: null,
  role: null,
  board: Array(9).fill(null),
  turn: null,
  status: 'menu', // menu | waiting | playing | ended
  winner: null
};

// Server URL - change this for production
const SERVER_URL = window.SERVER_URL || 'http://localhost:3000';

/**
 * Initialize the application
 */
function init() {
  // Initialize UI elements
  initElements();
  
  // Initialize socket and register callbacks
  initSocket(SERVER_URL);
  registerSocketCallbacks();
  
  // Bind UI event handlers
  bindEventHandlers();
  
  // Show menu screen
  showScreen('menu-screen');
}

/**
 * Register socket event callbacks
 */
function registerSocketCallbacks() {
  registerCallbacks({
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onRoomCreated: handleRoomCreated,
    onGameStart: handleGameStart,
    onBoardUpdate: handleBoardUpdate,
    onReplayVote: handleReplayVote,
    onPlayerLeft: handlePlayerLeft,
    onError: handleError
  });
}

/**
 * Bind UI event handlers
 */
function bindEventHandlers() {
  const elements = getElements();
  
  // Menu buttons
  elements.createRoomBtn.addEventListener('click', () => {
    showCreateRoomForm();
  });
  
  elements.joinRoomBtn.addEventListener('click', () => {
    showJoinRoomForm();
  });
  
  // Create room form
  elements.createBackBtn.addEventListener('click', () => {
    hideForms();
  });
  
  elements.createSubmitBtn.addEventListener('click', handleCreateRoom);
  
  elements.createPassKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleCreateRoom();
    }
  });
  
  // Join room form
  elements.joinBackBtn.addEventListener('click', () => {
    hideForms();
  });
  
  elements.joinSubmitBtn.addEventListener('click', handleJoinRoom);
  
  elements.joinPassKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  });
  
  // Lobby buttons
  elements.copyRoomIdBtn.addEventListener('click', () => {
    copyToClipboard(gameState.roomId, elements.copyRoomIdBtn);
  });
  
  elements.copyPassKeyBtn.addEventListener('click', () => {
    copyToClipboard(gameState.passKey, elements.copyPassKeyBtn);
  });
  
  // Game buttons
  elements.replayBtn.addEventListener('click', handleReplayRequest);
  elements.leaveBtn.addEventListener('click', handleLeaveRoom);
  
  // Board cells
  elements.cells.forEach((cell, index) => {
    cell.addEventListener('click', () => {
      handleCellClick(index);
    });
  });
  
  // Error modal
  elements.errorCloseBtn.addEventListener('click', () => {
    hideError();
  });
}

/**
 * Copy text to clipboard with visual feedback
 * @param {string} text - Text to copy
 * @param {HTMLElement} button - The button element that was clicked
 */
function copyToClipboard(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    // Visual feedback
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.classList.add('copied');
    
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('copied');
    }, 1500);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

// ==================== Event Handlers ====================

function handleConnect() {
  console.log('Connected to server');
}

function handleDisconnect() {
  console.log('Disconnected from server');
  showError('Disconnected from server. Please refresh the page.');
}

function handleCreateRoom() {
  const elements = getElements();
  const passKey = elements.createPassKeyInput.value.trim();
  
  if (passKey.length < 4 || passKey.length > 20) {
    showError('Pass key must be 4-20 characters');
    return;
  }
  
  gameState.passKey = passKey;
  createRoom(passKey);
}

function handleJoinRoom() {
  const elements = getElements();
  const roomId = elements.joinRoomIdInput.value.trim().toUpperCase();
  const passKey = elements.joinPassKeyInput.value.trim();
  
  if (roomId.length !== 6) {
    showError('Room ID must be 6 characters');
    return;
  }
  
  if (passKey.length < 4 || passKey.length > 20) {
    showError('Pass key must be 4-20 characters');
    return;
  }
  
  gameState.roomId = roomId;
  gameState.passKey = passKey;
  joinRoom(roomId, passKey);
}

function handleRoomCreated(data) {
  gameState.roomId = data.roomId;
  gameState.status = 'waiting';
  
  // Display room info in lobby
  displayRoomInfo(gameState.roomId, gameState.passKey);
  updateWaitingMessage('Waiting for opponent to join...');
  
  // Show lobby screen
  hideForms();
  showScreen('lobby-screen');
}

function handleGameStart(data) {
  gameState.board = data.board;
  gameState.turn = data.turn;
  gameState.role = data.role;
  gameState.status = 'playing';
  gameState.winner = null;
  
  // Update UI
  clearBoard();
  hideResult();
  renderBoard(gameState.board);
  updateTurnIndicator(gameState.turn, gameState.role);
  updateRoleIndicator(gameState.role);
  
  // Remove celebration class if present
  const elements = getElements();
  elements.board.classList.remove('celebration');
  
  // Show game screen
  showScreen('game-screen');
}

function handleBoardUpdate(data) {
  gameState.board = data.board;
  gameState.turn = data.turn;
  gameState.winner = data.winner;
  
  // Update UI
  renderBoard(gameState.board);
  
  if (data.winner) {
    gameState.status = 'ended';
    showResult(data.winner, gameState.role);
    
    // Highlight winning cells if there's a winner (not draw)
    if (data.winner !== 'draw') {
      const winningIndices = findWinningLine(data.board);
      if (winningIndices) {
        highlightWinningCells(winningIndices);
        // Add celebration animation to the board
        const elements = getElements();
        elements.board.classList.add('celebration');
      }
    }
  } else {
    updateTurnIndicator(gameState.turn, gameState.role);
  }
}

function handleReplayVote(data) {
  updateReplayVotes(data.votes);
}

function handlePlayerLeft() {
  gameState.status = 'waiting';
  showError('Your opponent left the game');
  
  // Reset game state
  gameState.roomId = null;
  gameState.passKey = null;
  gameState.role = null;
  gameState.board = Array(9).fill(null);
  gameState.turn = null;
  gameState.winner = null;
  
  // Clear the board and UI
  clearBoard();
  hideResult();
  
  // Return to menu screen with buttons visible
  showScreen('menu-screen');
  // Hide forms and show menu buttons
  const elements = getElements();
  elements.createRoomForm.classList.add('hidden');
  elements.joinRoomForm.classList.add('hidden');
  elements.createRoomForm.style.display = 'none';
  elements.joinRoomForm.style.display = 'none';
  elements.createPassKeyInput.value = '';
  elements.joinRoomIdInput.value = '';
  elements.joinPassKeyInput.value = '';
}

function handleError(data) {
  showError(data.message);
}

function handleCellClick(index) {
  // Only allow moves when playing and it's your turn
  if (gameState.status !== 'playing') {
    return;
  }
  
  if (gameState.turn !== gameState.role) {
    showSnackbar("Wait for your turn");
    return;
  }
  
  // Check if cell is empty (client-side check for better UX)
  if (gameState.board[index] !== null) {
    showSnackbar("Cell already taken");
    return;
  }
  
  makeMove(gameState.roomId, index);
}

function handleReplayRequest() {
  requestReplay(gameState.roomId);
}

function handleLeaveRoom() {
  leaveRoom(gameState.roomId);
  
  // Reset game state
  gameState.roomId = null;
  gameState.passKey = null;
  gameState.role = null;
  gameState.board = Array(9).fill(null);
  gameState.turn = null;
  gameState.status = 'menu';
  gameState.winner = null;
  
  // Clear board and remove celebration
  clearBoard();
  const elements = getElements();
  elements.board.classList.remove('celebration');
  
  // Return to menu
  showScreen('menu-screen');
}

/**
 * Find the winning line indices
 * @param {Array} board - The game board
 * @returns {Array|null} - Array of winning indices or null
 */
function findWinningLine(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];
  
  for (const line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }
  
  return null;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);