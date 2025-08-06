import React, { useEffect, useState, useRef } from 'react';
import { 
  getValidMoves,
  calculateScore,
  GameHandlers
} from './gameLogic';
import Cell from './Cell';
import '../styles/Board.css';
import { BASE_URL } from '../config';

const debug = true; // debug swtich

const Board = ({ 
  gameMode,
  board,
  setBoard,
  currentPlayer,
  setCurrentPlayer,
  scores,
  setScores,
  socket,
  peerIP,
  role,  // role of the player ('sever' or 'guest')
  playerColor, // color of the player ('black' or 'white')
  enableAI
}) => {
  const [validMoves, setValidMoves] = useState([]);
  const [winner, setWinner] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [aiMoveRequested, setAiMoveRequested] = useState(false);
  const aiProcessing = useRef(false);

  // update valid moves and check for game end conditions
  useEffect(() => {
    const moves = getValidMoves(board, currentPlayer);
    setValidMoves(moves);
  
    if (moves.length === 0) {
      const opponent = currentPlayer === 'black' ? 'white' : 'black';
      const opponentMoves = getValidMoves(board, opponent);
      
      if (opponentMoves.length === 0) {
        // Game is over: calculate final score
        const newScores = calculateScore(board);
        let winner;
        if (newScores.black > newScores.white) {
          winner = 'black';
          setWinner('Black Wins!');
        } else if (newScores.white > newScores.black) {
          winner = 'white';
          setWinner('White Wins!');
        } else {
          winner = 'draw';
          setWinner('It\'s a Tie!');
        }

        // Send game over event in online mode
        if (gameMode === 'online' && socket) {
          socket.emit('game_over', { winner });
        }
      } else {
        setCurrentPlayer(opponent);
      }
    }
  }, [board, currentPlayer, gameMode, socket]); 

  // handle opponent's move in online mode
  useEffect(() => {
    if (gameMode !== 'online' || !socket) return;
    
    const handleOpponentMove = (data) => {
      console.log('[FRONTEND] Received opponent move:', data);
      const { row, col, player } = data;
      
      const result = GameHandlers[gameMode].handleMove(board, row, col, player);
      if (!result) {
        console.error('Invalid opponent move received');
        return;
      }
      
      // filp cells for animation
      setBoard(prev => {
        const temp = prev.map(r => [...r]);
        result.flippedCells.forEach(([x, y]) => temp[x][y] = 'flipping');
        temp[row][col] = 'flipping';
        return temp;
      });
      
      setTimeout(() => {
        setBoard(result.newBoard);
        const newScores = calculateScore(result.newBoard);
        setScores(newScores);
        setCurrentPlayer(result.nextPlayer);
      }, 300);
    };
    
    socket.on('opponent_move', handleOpponentMove);
    
    // Clean up event listener
    return () => {
      socket.off('opponent_move', handleOpponentMove);
    };
  }, [board, gameMode, socket, setBoard, setScores, setCurrentPlayer]);

  // update turn state based on game mode and player color
  useEffect(() => {
    if (gameMode === 'online' && playerColor) {
      // online mode: only update turn state if player color is set
      const myTurn = currentPlayer === playerColor;
      setIsMyTurn(myTurn);
      
      if (debug) {
        console.log('Turn state updated:');
        console.log(`Player Color: ${playerColor}`);
        console.log(`Current Player: ${currentPlayer}`);
        console.log(`Is My Turn: ${myTurn}`);
      }
    } else {
      // local or AI mode: always set to true
      setIsMyTurn(true);
    }
  }, [gameMode, playerColor, currentPlayer]);


  useEffect(() => {
    if (debug) {
      console.log("Current state:");
      console.table({
        gameMode,
        role,
        playerColor,
        currentPlayer,
        isMyTurn,
        peerIP
      });
    }
  }, [gameMode, role, playerColor, currentPlayer, isMyTurn]);

  // check if AI move is needed
  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'white' && !winner) {
      // only request AI move if it's the white's turn and no winner yet
      if (!aiMoveRequested && !aiProcessing.current) {
        setAiMoveRequested(true);
      }
    }
  }, [gameMode, currentPlayer, winner, board, aiMoveRequested]);

  // ai move handling
  useEffect(() => {
    const fetchAIMove = async () => {
      if (!aiMoveRequested || aiProcessing.current) return;
      
      aiProcessing.current = true;
      const abortController = new AbortController();
      
      try {
        // Convert board to numeric format for AI
        const aiBoard = board.map(row => 
          row.map(cell => {
            if (cell === 'black') return 1;
            if (cell === 'white') return -1;
            return 0;
          })
        );
    
        const response = await fetch(`${BASE_URL}/ai/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ board: aiBoard, player: -1 }),
          signal: abortController.signal
        });
    
        if (abortController.signal.aborted) return;
    
        const moveData = await response.json();
        const aiRow = moveData.row;
        const aiCol = moveData.col;
        console.log(`[FRONTEND] AI Move: row=${aiRow}, col=${aiCol}`);
        console.log(`board:`, board);
        console.log(`currentPlayer:`, currentPlayer);
        
        const latestValidMoves = getValidMoves(board, currentPlayer);
        console.log(`[FRONTEND] Latest Valid Moves:`, latestValidMoves);
        
        if (aiRow !== null && aiCol !== null && 
            latestValidMoves.some(([r, c]) => r === aiRow && c === aiCol)) {
          
          const result = GameHandlers[gameMode].handleMove(board, aiRow, aiCol, currentPlayer);
          if (!result) return;
    
          
          setBoard(prev => {
            const temp = prev.map(r => [...r]);
            result.flippedCells.forEach(([x, y]) => temp[x][y] = 'flipping');
            temp[aiRow][aiCol] = 'flipping';
            return temp;
          });
    
          setTimeout(() => {
            setBoard(result.newBoard);
            const newScores = calculateScore(result.newBoard);
            setScores(newScores);
            setCurrentPlayer(result.nextPlayer);
            aiProcessing.current = false;
            setAiMoveRequested(false);
          }, 300);
        } else {
          
          setCurrentPlayer('black');
          aiProcessing.current = false;
          setAiMoveRequested(false);
        }
    
      } catch (error) {
        if (error.name !== 'AbortError') {
          alert("AI server is not responding. Please try again later.");
        }
        aiProcessing.current = false;
        setAiMoveRequested(false);
      }
    };
    
    if (aiMoveRequested) {
      fetchAIMove();
    }
  }, [aiMoveRequested, gameMode, currentPlayer, winner, board, setBoard, setScores, setCurrentPlayer]); 

  
  const handleCellClick = (row, col) => {
    if (
      board[row][col] !== null || 
      winner || 
      !validMoves.some(([r, c]) => r === row && c === col) ||
      (gameMode === 'online' && !isMyTurn)
    ) {
      if (debug) {
        console.log("Click rejected:");
        console.log(`Cell: row=${row}, col=${col} - value=${board[row][col]}`);
        console.log(`Winner: ${winner ? 'exists' : 'none'}`);
        console.log(`Valid Move: ${validMoves.some(([r, c]) => r === row && c === col)}`);
        console.log(`Online Mode: ${gameMode === 'online'}`);
        console.log(`My Turn: ${isMyTurn}`);
      }
      return;
    }
    
    const handler = GameHandlers[gameMode];
    const result = handler.handleMove(board, row, col, currentPlayer);
    
    if (!result) return;

    if (gameMode === 'online' && socket) {
      console.log(`[FRONTEND] Sending move: row=${row}, col=${col}, player=${currentPlayer}`);
      
      
      socket.emit('send_move', {
        row: row,
        col: col
      });
    }

    
    setBoard(prev => {
      const temp = prev.map(r => [...r]);
      result.flippedCells.forEach(([x, y]) => temp[x][y] = 'flipping');
      temp[row][col] = 'flipping';
      return temp;
    });

    setTimeout(() => {
      setBoard(result.newBoard);
      const newScores = calculateScore(result.newBoard);
      setScores(newScores);
      setCurrentPlayer(result.nextPlayer);
    }, 300);
  };

  
  useEffect(() => {
    const autoAIMove = async () => {
      if (!enableAI || !isMyTurn || gameMode !== 'online') return;
      
      try {
        console.log("[AI] Starting AI move calculation...");
        // Convert board to numeric format for AI
        const aiBoard = board.map(row => 
          row.map(cell => {
            if (cell === 'black') return 1;
            if (cell === 'white') return -1;
            return 0;
          })
        );
    
        const response = await fetch(`${BASE_URL}/ai/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            board: aiBoard,
            player: playerColor === 'black' ? 1 : -1
          })
        });
    
        const moveData = await response.json();
        console.log("[AI] Received move:", moveData);
        
        if (moveData.row !== null && moveData.col !== null) {
          
          if (validMoves.some(([r, c]) => r === moveData.row && c === moveData.col)) {
            console.log("[AI] Executing move...");
            
            handleCellClick(moveData.row, moveData.col);
          }
        }
      } catch (error) {
        console.error("[AI] Error executing move:", error);
      }
    };

    
    if (enableAI && isMyTurn) {
      const delay = Math.random() * 1000 + 500; 
      const timeoutId = setTimeout(autoAIMove, delay);
      return () => clearTimeout(timeoutId);
    }
  }, [board, currentPlayer, enableAI, isMyTurn, gameMode, playerColor, validMoves]);

  return (
    <div className="board-container">
      <h2>Current Player: {currentPlayer}</h2>
        {gameMode === 'online' && playerColor && (
        <div>
          <h3>You are: {playerColor} ({role}) {enableAI ? '(AI Controlled)' : ''}</h3>
          <h3>Status: {isMyTurn ? (enableAI ? 'AI thinking...' : 'Your turn') : 'Opponent\'s turn'}</h3>
        </div>
      )}
      
      <h3>Black: {scores.black} - White: {scores.white}</h3>

      <div className="board-wrapper">
        <div className="column-labels">
          {["A", "B", "C", "D", "E", "F", "G", "H"].map((label, i) => (
            <div key={i} className="column-label">{label}</div>
          ))}
        </div>
        <div className="main-board-area">
          <div className="row-labels">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((label, i) => (
              <div key={i} className="row-label">{label}</div>
            ))}
          </div>
          <div className="board">
            {board.flat().map((cell, index) => {
              const rowIndex = Math.floor(index / 8);
              const colIndex = index % 8;
              return (
                <Cell
                  key={`${rowIndex}-${colIndex}`}
                  value={cell}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  isHint={validMoves.some(([r, c]) => r === rowIndex && c === colIndex)}
                  hintColor={currentPlayer}
                  disabled={gameMode === 'online' && (!isMyTurn || enableAI)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {winner && (
        <div className='winner-popup'>
          <canvas id='fireworks'></canvas>
          <div className='winner-box'>
            <h2>{winner}</h2>
            <button onClick={() => window.location.reload()}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;