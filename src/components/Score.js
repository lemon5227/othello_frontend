// Score.js
import React from 'react';

const Score = ({ blackScore, whiteScore }) => {
  return (
    <div className="score">
      <h3>Score</h3>
      <p>Black: {blackScore}</p>
      <p>White: {whiteScore}</p>
    </div>
  );
};

export default Score;
