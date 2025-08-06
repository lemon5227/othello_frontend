export const initializeBoard = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  board[3][3] = 'white';
  board[3][4] = 'black';
  board[4][3] = 'black';
  board[4][4] = 'white';
  return board;
};

const directions = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  [-1, -1], [-1, 1], [1, -1], [1, 1]
];

export const getValidMoves = (board, player) => {
  const moves = new Set();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] !== null) continue;

      for (const [dx, dy] of directions) {
        let x = row + dx;
        let y = col + dy;
        let foundOpponent = false;

        while (
          x >= 0 && x < 8 &&
          y >= 0 && y < 8 &&
          board[x][y] !== null && 
          board[x][y] !== player &&
          board[x][y] !== 'flipping'
        ) {
          foundOpponent = true;
          x += dx;
          y += dy;
        }

        if (
          foundOpponent &&
          x >= 0 && x < 8 &&
          y >= 0 && y < 8 &&
          (board[x][y] === player || board[x][y] === 'flipping')
        ) {
          moves.add(`${row},${col}`);
          break;
        }
      }
    }
  }

  return Array.from(moves).map(pos => {
    const [row, col] = pos.split(',').map(Number);
    return [row, col];
  });
};

export const makeMove = (board, row, col, player) => {
  if (board[row][col] !== null && board[row][col] !== 'flipping') return null;

  
  const newBoard = board.map(r => r.slice());
  let flippedCells = [];

  directions.forEach(([dx, dy]) => {
    let x = row + dx;
    let y = col + dy;
    const tempFlip = [];

    while (x >= 0 && x < 8 && y >= 0 && y < 8 && 
           newBoard[x][y] !== null && 
           newBoard[x][y] !== player &&
           newBoard[x][y] !== 'flipping') {
      tempFlip.push([x, y]);
      x += dx;
      y += dy;
    }

    if (x >= 0 && x < 8 && y >= 0 && y < 8 && 
       (newBoard[x][y] === player || newBoard[x][y] === 'flipping')) {
      flippedCells.push(...tempFlip);
    }
  });

  if (flippedCells.length === 0) return null;

  
  flippedCells.forEach(([x, y]) => {
    newBoard[x][y] = player; 
  });
  
  
  newBoard[row][col] = player;
  
  
  return { 
    newBoard, 
    flippedCells,
    nextPlayer: player === 'black' ? 'white' : 'black'
  };
};

export const calculateScore = (board) => {
  let black = 0, white = 0;
  board.forEach(row => row.forEach(cell => {
    
    if (cell === 'black' || cell === 'flipping-black') black++;
    if (cell === 'white' || cell === 'flipping-white') white++;
  }));
  return { black, white };
};

export const GameHandlers = {
  local: {
    handleMove: (board, row, col, currentPlayer) => {
      return makeMove(board, row, col, currentPlayer);
    }
  },
  ai: {
    handleMove: (board, row, col, currentPlayer) => {
      return makeMove(board, row, col, currentPlayer);
    }
  },
  online: {
    handleMove: (board, row, col, currentPlayer) => {
      return makeMove(board, row, col, currentPlayer);
    }
  }
};