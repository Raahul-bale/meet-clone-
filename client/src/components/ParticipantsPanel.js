import React from 'react';
import './ParticipantsPanel.css';

const ParticipantsPanel = ({ participants, userId, onClose }) => {
  return (
    <div className="participants-panel">
      <div className="panel-header">
        <h3>Participants ({Object.keys(participants).length})</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="participants-list">
        {Object.entries(participants).map(([id, participant]) => (
          <div key={id} className="participant-item">
            <div className="participant-info">
              <span className="participant-name">
                {id === userId ? `${participant.userName} (You)` : participant.userName}
              </span>
              
              <div className="participant-status">
                {participant.isAudioEnabled === false && (
                  <span className="status-icon muted" title="Muted">
                    <i className="fas fa-microphone-slash"></i>
                  </span>
                )}
                
                {participant.isVideoEnabled === false && (
                  <span className="status-icon video-off" title="Video off">
                    <i className="fas fa-video-slash"></i>
                  </span>
                )}
                
                {participant.isScreenSharing && (
                  <span className="status-icon sharing" title="Sharing screen">
                    <i className="fas fa-desktop"></i>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantsPanel;