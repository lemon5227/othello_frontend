import React from "react";

const GameMode = ({ onSelectMode }) => {
  return (
    <div className="game-mode glass-panel">
      <h2>Select Game Mode</h2>
      <button onClick={() => onSelectMode("local")}>Local Multiplayer</button>
      <button onClick={() => onSelectMode("ai")}>Play Against AI</button>
      <button onClick={() => onSelectMode("online")}>Online Multiplayer</button>
    </div>
  );
};

export default GameMode;
