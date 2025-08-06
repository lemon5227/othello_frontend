import React from 'react';
import '../styles/Cell.css';

const Cell = ({ row, col, value, onClick, isHint, hintColor }) => {
  return (
    <div className={`cell ${value === 'flipping' ? 'flipping' : ''}`} onClick={onClick}>
      {value && value !== 'filpping'&&<div className={`piece ${value}`}></div>}
      {isHint && !value && <div className={`piece hint ${hintColor}`}>
        <span className='hint-text'>{String.fromCharCode(65+col)}{row+1}</span>  
      </div>}
    </div>
  );
};

export default Cell;
