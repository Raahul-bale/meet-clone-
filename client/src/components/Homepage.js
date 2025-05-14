import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import './HomePage.css';

const HomePage = () => {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  const createRoom = () => {
    const newRoomId = uuidv4();
    if (userName.trim()) {
      localStorage.setItem('userName', userName);
      navigate(`/room/${newRoomId}`);
    } else {
      alert('Please enter your name');
    }
  };

  const joinRoom = () => {
    if (roomId.trim() && userName.trim()) {
      localStorage.setItem('userName', userName);
      navigate(`/room/${roomId}`);
    } else {
      alert('Please enter room ID and your name');
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <h1>Google Meet Clone</h1>
        <div className="input-container">
          <input
            type="text"
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
        <div className="button-container">
          <button className="create-btn" onClick={createRoom}>
            Create new meeting
          </button>
          <div className="join-container">
            <input
              type="text"
              placeholder="Enter room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <button className="join-btn" onClick={joinRoom}>
              Join meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;