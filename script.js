const board = document.getElementById('board');
const status = document.getElementById('status');
const resetBtn = document.getElementById('reset');

let cells = [];
let turn = 'X';
let gameOver = false;

function init() {
  board.innerHTML = '';
  cells = [];
  
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.addEventListener('click', handleClick);
    board.appendChild(cell);
    cells.push(cell);
  }
  
  status.innerHTML = '<span class="status-icon">🎮</span><span>Your turn (X)</span>';
  resetBtn.classList.remove('visible');
  gameOver = false;
  turn = 'X';
}

function handleClick(e) {
  if (gameOver) return;
  
  const idx = e.target.dataset.index;
  if (e.target.textContent || e.target.classList.contains('taken')) return;
  
  // Add the mark with animation
  e.target.textContent = turn;
  e.target.classList.add('taken', turn.toLowerCase());
  
  // Check for win
  const winCombo = checkWin(turn);
  if (winCombo) {
    status.innerHTML = `<span class="status-icon">🏆</span><span>${turn} wins!</span>`;
    gameOver = true;
    highlightWinner(winCombo);
    resetBtn.classList.add('visible');
    document.querySelector('.container').classList.add('celebration');
    return;
  }
  
  // Check for draw
  if (cells.every(c => c.classList.contains('taken'))) {
    status.innerHTML = '<span class="status-icon">🤝</span><span>Draw!</span>';
    gameOver = true;
    resetBtn.classList.add('visible');
    return;
  }
  
  // Switch turns
  turn = turn === 'X' ? 'O' : 'X';
  status.innerHTML = `<span class="status-icon">🎮</span><span>Your turn (${turn})</span>`;
}

function checkWin(player) {
  const winComb = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],  // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8],  // Columns
    [0, 4, 8], [2, 4, 6]              // Diagonals
  ];
  
  for (const combo of winComb) {
    if (combo.every(i => cells[i].textContent === player)) {
      return combo;
    }
  }
  return null;
}

function highlightWinner(combo) {
  combo.forEach(i => {
    cells[i].classList.add('win');
  });
}

resetBtn.addEventListener('click', init);

// Initialize the game
init();
