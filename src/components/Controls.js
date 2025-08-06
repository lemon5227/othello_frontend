import { FaMicrophone } from 'react-icons/fa';
import React, { useState } from 'react';
import { GameHandlers, calculateScore } from './gameLogic';
import { BASE_URL } from '../config';

const Controls = ({ 
  board,
  currentPlayer,
  setBoard,
  setScores,
  setCurrentPlayer,
  onReset,
  gameMode
}) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  
  const handleVoiceCommand = async () => {  
    if (isListening) return;
    
    setIsListening(true);
    setError(null);
    
    try {
      console.log("[Voice] Starting voice recognition...");
      const response = await fetch(`${BASE_URL}/speech/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          board: board,
          currentPlayer: currentPlayer
        })
      });
        if (!response.ok) {
        throw new Error(`Voice recognition failed (${response.status})`);
      }      const data = await response.json();
      console.log("[Voice] Server response:", data);
      
      if (!data.valid) {
        throw new Error(data.error || 'Invalid voice command');
      }

      const { row, col } = data.position;
      console.log("[Voice] Received position:", { row, col });

        console.log("[Voice] Attempting move:", { row, col, currentPlayer });
      const result = GameHandlers[gameMode].handleMove(board, row, col, currentPlayer);
      
      if (!result) {
        console.log("[Voice] Move was rejected by game handler");
        throw new Error('Invalid move position');
      }

      console.log("[Voice] Move is valid, applying changes...");
      console.log("[Voice] Move result:", result);
      
      
      setBoard(prev => {
        const temp = prev.map(r => [...r]);
        result.flippedCells.forEach(([x, y]) => {
          temp[x][y] = 'flipping';
          console.log(`[Voice] Flipping cell at ${x},${y}`);
        });
        temp[row][col] = 'flipping';
        return temp;
      });
      
      
      setTimeout(() => {
        setBoard(result.newBoard);
        const newScores = calculateScore(result.newBoard);
        setScores(newScores);
        setCurrentPlayer(result.nextPlayer);
        console.log("[Voice] Move completed successfully");
      }, 300);
      
    } catch (err) {
      console.error("[Voice] Error:", err);
      setError(err.message || 'voice command failed');
    } finally {
      setIsListening(false);
    }
  };

  return (
    <div className="controls-container">
      <button onClick={onReset}>
        reset game
      </button>
      
      <button
        className={`voice-control ${isListening ? 'listening' : ''}`}
        onClick={handleVoiceCommand}
        disabled={isListening}
      >
        <FaMicrophone style={{ 
          width: 20, 
          height: 20, 
          marginRight: 8,
          color: isListening ? '#ff0000' : '#fff' 
        }}/>
        {isListening ? 'listening...' : 'voice recognition'}
      </button>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Controls;