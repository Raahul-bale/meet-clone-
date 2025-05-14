import React from 'react';
import './Controls.css';

const Controls = ({
  toggleAudio,
  toggleVideo,
  shareScreen,
  audioEnabled,
  videoEnabled,
  isScreenSharing,
  toggleChat,
  toggleParticipants,
  endCall
}) => {
  return (
    <div className="controls">
      <button 
        className={`control-btn ${audioEnabled ? 'enabled' : 'disabled'}`}
        onClick={toggleAudio} 
        title={audioEnabled ? 'Mute' : 'Unmute'}
      >
        <i className={`fas fa-${audioEnabled ? 'microphone' : 'microphone-slash'}`}></i>
      </button>
      
      <button 
        className={`control-btn ${videoEnabled ? 'enabled' : 'disabled'}`}
        onClick={toggleVideo} 
        title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        <i className={`fas fa-${videoEnabled ? 'video' : 'video-slash'}`}></i>
      </button>
      
      <button 
        className={`control-btn ${isScreenSharing ? 'sharing' : ''}`}
        onClick={shareScreen} 
        title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
      >
        <i className="fas fa-desktop"></i>
      </button>
      
      <button 
        className="control-btn"
        onClick={toggleChat} 
        title="Chat"
      >
        <i className="fas fa-comment"></i>
      </button>
      
      <button 
        className="control-btn"
        onClick={toggleParticipants} 
        title="Participants"
      >
        <i className="fas fa-users"></i>
      </button>
      
      <button 
        className="control-btn end-call"
        onClick={endCall} 
        title="End call"
      >
        <i className="fas fa-phone-slash"></i>
      </button>
    </div>
  );
};

export default Controls;