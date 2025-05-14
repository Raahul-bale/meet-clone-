import React, { useEffect, useRef } from 'react';
import './VideoGrid.css';

const VideoGrid = ({ stream, userVideo, peers, userId, userName, isScreenSharing, videoEnabled }) => {
  // Use a single ref object for all peer videos
  const peerVideos = useRef({});

  // Calculate grid layout
  const totalParticipants = Object.keys(peers).length + 1; // +1 for self
  let gridClass = 'video-grid';
  
  if (totalParticipants <= 1) {
    gridClass += ' single';
  } else if (totalParticipants <= 4) {
    gridClass += ' grid-2';
  } else if (totalParticipants <= 9) {
    gridClass += ' grid-3';
  } else {
    gridClass += ' grid-4';
  }

  useEffect(() => {
    // Set the stream for each peer video
    Object.keys(peers).forEach(peerId => {
      const videoElement = peerVideos.current[peerId];
      if (videoElement && peers[peerId].peer && peers[peerId].peer.stream) {
        videoElement.srcObject = peers[peerId].peer.stream;
      }
    });
  }, [peers]);

  return (
    <div className={gridClass}>
      {/* Local user video */}
      <div className="video-container">
        <video 
          ref={userVideo} 
          autoPlay 
          playsInline 
          muted 
          className={!videoEnabled ? 'video-off' : ''}
        />
        {!videoEnabled && (
          <div className="video-placeholder">
            <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
          </div>
        )}
        <div className="name-tag">
          {userName} {isScreenSharing && '(Screen)'}
        </div>
      </div>
      
      {/* Remote peer videos */}
      {Object.keys(peers).map((peerId) => {
        const peerName = peers[peerId].userName;
        const isVideoEnabled = !(peers[peerId].isVideoEnabled === false);
        
        return (
          <div className="video-container" key={peerId}>
            <video 
              ref={el => peerVideos.current[peerId] = el} 
              autoPlay 
              playsInline 
              className={!isVideoEnabled ? 'video-off' : ''}
            />
            {!isVideoEnabled && (
              <div className="video-placeholder">
                <div className="avatar">{peerName.charAt(0).toUpperCase()}</div>
              </div>
            )}
            <div className="name-tag">
              {peerName} {peers[peerId].isScreenSharing && '(Screen)'}
            </div>
            {peers[peerId].isAudioEnabled === false && (
              <div className="muted-indicator">🔇</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default VideoGrid;