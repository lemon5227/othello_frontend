import React from 'react';

const Cell = ({ value, onClick, isHint, hintColor }) => {
  const isFlipping = value === 'flipping';

  return (
    <div className={`cell ${isFlipping ? 'flipping' : ''}`} onClick={onClick}>
      {value && value !== 'flipping' && (
        <div className={`piece ${value}`}>
          <div className="piece-face white"></div>
          <div className="piece-face black"></div>
        </div>
      )}
      {isHint && !value && <div className={`hint ${hintColor}`}></div>}
    </div>
  );
};

export default Cell;
