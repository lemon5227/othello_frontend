import React, { useState, useEffect } from "react";
import Board from "./components/Board";
import Controls from "./components/Controls";
import GameMode from "./components/GameMode";
import { initializeBoard } from "./components/gameLogic";
import "./App.css";
import io from 'socket.io-client';
import { BASE_URL } from './config';
import flowerImg from './assets/flower.png';
import leafImg from './assets/leaf.png';
import snowImg from './assets/snowflake.png';
import cocoImg from './assets/coco.png';
import Particles from "@tsparticles/react";
import { loadFireworksPreset } from "@tsparticles/preset-fireworks";

function App() {
  const [gameMode, setGameMode] = useState(null);
  const [board, setBoard] = useState(initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState('black');
  const [scores, setScores] = useState({ black: 2, white: 2 });
  const [socket, setSocket] = useState(null);
  const [showOnlineSetup, setShowOnlineSetup] = useState(false);
  const [localIP, setLocalIP] = useState('');
  const [peerIP, setPeerIP] = useState('');
  const [role, setRole] = useState(null);
  const [season, setSeason] = useState('spring');
  const [serverStatus, setServerStatus] = useState('not_started'); 
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [playerColor, setPlayerColor] = useState(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [enableAI, setEnableAI] = useState(false);

  
  const resetGame = () => {
    const newBoard = initializeBoard();
    setBoard(newBoard);
    
    // ensure correct starting player
    if (gameMode === 'online') {
      // black moves first
      setCurrentPlayer('black');
    } else {
      //in local mode too
      setCurrentPlayer('black');
    }
    
    setScores({ black: 2, white: 2 });
  };

  const startServer = () => {
    if (socket && role === 'server') {
      setServerStatus('starting');
      socket.emit('start_server');
    }
  };

  const handleSetPlayerColor = (data) => {
    setPlayerColor(data.color);
    console.log(`Set player color to ${data.color}`);
    if (data.color === 'black') {
      setCurrentPlayer('black');
    } else {
      setCurrentPlayer('white');
    }
    
    //if server listening: start the game
    if (serverStatus === 'listening') {
      resetGame();
    }
  };

  useEffect(() => {
    if (gameMode) {
      if (gameMode === 'online') {
        setShowOnlineSetup(true);
        setConnectionStatus('disconnected');
        
        const newSocket = io(`${BASE_URL}`, {
          transports: ['websocket'],
          reconnection: true,
        });
        setSocket(newSocket);
        
        newSocket.on('local_ip', (data) => {
          setLocalIP(data.ip);
        });

        newSocket.on('server_started', (data) => {
          setServerStatus('listening');
          console.log('Server started with IP:', data.ip);
          console.log('Server listening for connections...');
        });

        newSocket.on('server_error', (data) => {
          alert(`Server start failed: ${data.message}`);
          setServerStatus('not_started');
          setConnectionStatus('disconnected');
        });

        newSocket.on('client_connected', (data) => {
          console.log('Client connected:', data.client_ip);
          setServerStatus('connected');
          setShowOnlineSetup(false);
          if (role === 'server') {
            setPlayerColor('black');  //server always black
            setCurrentPlayer('black');
            resetGame();
          }
        });

        newSocket.on('set_player_color', handleSetPlayerColor);
        
        newSocket.on('connection_established', (data) => {
          console.log('Connected to server at:', data.server_ip);
          setShowOnlineSetup(false);
          setConnectionStatus('connected');
          if (role === 'client') {
            setPlayerColor('white');  //client always white
            setCurrentPlayer('black');
            resetGame();
          }
        });
        
        newSocket.on('connection_failed', (data) => {
          alert(`Connection failed: ${data.message}`);
          setConnectionStatus('disconnected');
        });
        
        newSocket.on('opponent_move', (data) => {
          console.log('Received opponent move:', data);
        });
        
        return () => {
          newSocket.disconnect();
        };
      } else {
        //reset game state
        const newBoard = initializeBoard();
        setBoard(newBoard);
        setCurrentPlayer('black');
        setScores({ black: 2, white: 2 });
        setShowOnlineSetup(false);
      }
    }
  }, [gameMode, role]);

  //handle online game state
  useEffect(() => {
    if (gameMode === 'online' && connectionStatus === 'connected' && playerColor) {
      setShowOnlineSetup(false);
      setCurrentPlayer('black');
      resetGame();
    }
  }, [gameMode, connectionStatus, playerColor]);

  useEffect(() => {
    if (gameMode === 'online' && socket) {
      socket.on('local_ip', (data) => {
        setLocalIP(data.ip);
      });

      socket.on('server_started', (data) => {
        setServerStatus('listening');
        console.log('Server started with IP:', data.ip);
        console.log('Server listening for connections...');
      });

      socket.on('server_error', (data) => {
        alert(`Server start failed: ${data.message}`);
        setServerStatus('not_started');
        setConnectionStatus('disconnected');
      });

      socket.on('client_connected', (data) => {
        console.log('Client connected:', data.client_ip);
        setServerStatus('connected');
        if (role === 'server') {
          setPlayerColor('black');
        }
      });

      socket.on('set_player_color', handleSetPlayerColor);
      
      socket.on('connection_established', (data) => {
        console.log('Connected to server at:', data.server_ip);
        setConnectionStatus('connected');
        if (role === 'client') {
          setPlayerColor('white');
        }
      });
      
      socket.on('connection_failed', (data) => {
        alert(`Connection failed: ${data.message}`);
        setConnectionStatus('disconnected');
      });
      
      socket.on('opponent_move', (data) => {
        console.log('Received opponent move:', data);
      });

      return () => {
        socket.off('local_ip');
        socket.off('server_started');
        socket.off('server_error');
        socket.off('client_connected');
        socket.off('set_player_color');
        socket.off('connection_established');
        socket.off('connection_failed');
        socket.off('opponent_move');
      };
    }
  }, [gameMode, socket, role]);

  //start online game
  const startOnlineGame = () => {
    if (socket) {
      if (role === 'client' && !peerIP) {
        alert('Please enter server IP address');
        return;
      }
      
      if (role === 'client') {
        setConnectionStatus('connecting');
        socket.emit('connect_to_server', { ip: peerIP });
      } else if (role === 'server') {
        //server mode starts the server
        startServer();
      }
    }
  };

  //handle canceling online mode
  const handleCancelOnline = () => {
    if (socket) {
      if (role === 'server' && serverStatus !== 'not_started') {
        socket.emit('stop_server');
      }
      socket.disconnect();
      setSocket(null);
    }
    setGameMode(null);
    setShowOnlineSetup(false);
    setPeerIP('');
    setServerStatus('not_started');
    setConnectionStatus('disconnected');
    setPlayerColor(null);
  };

  //return to mode selection
  const handleBackToMode = () => {
    if (socket) {
      if (role === 'server' && serverStatus !== 'not_started') {
        socket.emit('end_game');
      }
      socket.disconnect();
      setSocket(null);
    }
    setShowOnlineSetup(false);
    setPeerIP('');
    setServerStatus('not_started');
    setConnectionStatus('disconnected');
    setPlayerColor(null);
    setGameMode(null);
    resetGame();
  };

  const renderServerStatus = () => {
    switch (serverStatus) {
      case 'not_started':
        return <span>Server not started</span>;
      case 'starting':
        return <span className="status-info">Starting server...</span>;
      case 'listening':
        return <span className="status-success">Server listening on {localIP}</span>;
      case 'connected':
        return <span className="status-connected">Client connected!</span>;
      default:
        return null;
    }
  };

  useEffect(() => {
    const canvas = document.getElementById('falling-elements');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    let img = new window.Image();
    if (season === 'spring') img.src = flowerImg;
    else if (season === 'summer') img.src = cocoImg;
    else if (season === 'autumn') img.src = leafImg;
    else img.src = snowImg;

    const elements = [];
    const elementCount = 25; // Reduced element count
    for (let i = 0; i < elementCount; i++) {
      elements.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.5 + Math.random() * 1.5, // Slower speed
        size: 20 + Math.random() * 20, // Smaller size
        angle: Math.random() * 2 * Math.PI,
        angularSpeed: (Math.random() - 0.5) * 0.01,
        opacity: 0.5 + Math.random() * 0.5, // Random opacity
      });
    }

    let animationId;
    function animate() {
      ctx.clearRect(0, 0, width, height);
      for (let el of elements) {
        el.y += el.speed;
        el.angle += el.angularSpeed;
        if (el.y > height) {
          el.y = -el.size;
          el.x = Math.random() * width;
        }
        ctx.save();
        ctx.globalAlpha = el.opacity;
        ctx.translate(el.x, el.y);
        ctx.rotate(el.angle);
        ctx.drawImage(img, -el.size / 2, -el.size / 2, el.size, el.size);
        ctx.restore();
      }
      animationId = requestAnimationFrame(animate);
    }

    img.onload = animate;

    function handleResize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if(ctx) {
        ctx.clearRect(0, 0, width, height);
      }
    };
  }, [season]);

  //render online setup UI
   const renderOnlineSetup = () => (
    <div className="online-setup">
      <h2>Online Game Setup</h2>
      
      <div className="ip-info">
        <label>Your IP: <strong>{localIP}</strong></label>
      </div>      <div className="ai-control">
        <label className="ai-label">
          <input 
            type="checkbox" 
            checked={enableAI} 
            onChange={(e) => setEnableAI(e.target.checked)}
          />
          Let AI Play This Game
        </label>
      </div>
      {role === 'client' && (
        <div className="server-input">
          <label>Server IP Address:</label>
          <input 
            type="text"
            value={peerIP}
            onChange={(e) => setPeerIP(e.target.value)}
            placeholder="Enter server IP"
          />
        </div>
      )}
      
      <div className="role-selection">
        <h3>Select your role:</h3>
        <div className="role-buttons">
          <button 
            className={`role-btn ${role === 'server' ? 'selected' : ''}`}
            onClick={() => setRole('server')}
          >
            Server (Black)
          </button>
          <button 
            className={`role-btn ${role === 'client' ? 'selected' : ''}`}
            onClick={() => setRole('client')}
          >
            Client (White)
          </button>
        </div>
      </div>
      
      {role === 'server' && (
        <div className="server-controls">
          <button 
            className="server-button"
            onClick={startServer}
            disabled={serverStatus !== 'not_started'}
          >
            Start Server
          </button>
          <div className="server-status">
            {renderServerStatus()}
          </div>
        </div>
      )}
      
      {role === 'server' ? (
        <div className="connection-status">
          {serverStatus === 'listening' && (
            <p className="waiting-message">Waiting for client connection...</p>
          )}
        </div>
      ) : (
        <button 
          className="connect-button"
          onClick={startOnlineGame}
          disabled={!peerIP || connectionStatus === 'connecting'}
        >
          {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect to Server'}
        </button>
      )}
      
      <button className="cancel-button" onClick={handleCancelOnline}>
        Cancel
      </button>
    </div>
  );

  useEffect(() => {
    const total = scores.black + scores.white;
    if (total === 64) {
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 5000);
    }
  }, [scores]);

  return (
    <div className={`App season-${season}`}>
      <canvas id="falling-elements"></canvas>
      <img src="logo_othello.png" alt="Logo Othello" className="logo"></img>
      <h1 className="game-title">Nature's Othello</h1>

        <div className="season-select">
        <div className="season-buttons">
          <button 
            className={`season-button ${season === 'spring' ? 'active' : ''}`} 
            onClick={() => setSeason('spring')}
          >
            🌸 Spring
          </button>
          <button 
            className={`season-button ${season === 'summer' ? 'active' : ''}`} 
            onClick={() => setSeason('summer')}
          >
            ☀️ Summer
          </button>
          <button 
            className={`season-button ${season === 'autumn' ? 'active' : ''}`} 
            onClick={() => setSeason('autumn')}
          >
            🍂 Autumn
          </button>
          <button 
            className={`season-button ${season === 'winter' ? 'active' : ''}`} 
            onClick={() => setSeason('winter')}
          >
            ❄️ Winter
          </button>
        </div>
      </div>

      {!gameMode ? (
        <GameMode onSelectMode={setGameMode} />
      ) : showOnlineSetup ? (
        renderOnlineSetup()
      ) : (
        <>
          <button className="back-button" onClick={handleBackToMode}>
            ⬅ Back to Mode Selection
          </button>
          
          <Board
            gameMode={gameMode}
            board={board}
            setBoard={setBoard}
            currentPlayer={currentPlayer}
            setCurrentPlayer={setCurrentPlayer}
            scores={scores}
            setScores={setScores}
            socket={socket}
            peerIP={peerIP}
            role={role}
            playerColor={playerColor}
            enableAI={enableAI} //pass AI assistance state
          />
          
          <Controls
            board={board}
            currentPlayer={currentPlayer}
            setBoard={setBoard}
            setScores={setScores}
            setCurrentPlayer={setCurrentPlayer}
            onReset={resetGame}
            gameMode={gameMode}
          />
        </>
      )}

      {showFireworks && (
        <Particles
          id="tsparticles"
          options={{ preset: "fireworks" }}
          init={async (engine) => {
            await loadFireworksPreset(engine);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 1000,
            pointerEvents: "none"
          }}
        />
      )}
    </div>
  );
}

export default App;