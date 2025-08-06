import React from "react";
import "../styles/GameMode.css";

const GameMode = ({ onSelectMode }) => {
  return (
    <div className="game-mode">
      <h2>Select Game Mode</h2>
      <button onClick={() => onSelectMode("local")}>Local Multiplayer</button>
      <button onClick={() => onSelectMode("ai")}>Play Against AI</button>
      <button onClick={() => onSelectMode("online")}>Online Multiplayer</button>
    </div>
  );
};

export default GameMode;
