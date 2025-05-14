import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import './MeetingRoom.css';
import Controls from './Controls';
import VideoGrid from './VideoGrid';
import ChatPanel from './Chatpanel';
import ParticipantsPanel from './ParticipantsPanel';

const MeetingRoom = () => {
  const { roomId } = useParams();
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef({});
  const [peers, setPeers] = useState({});
  const [stream, setStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState({});
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const screenTrackRef = useRef(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    // Get stored username or generate one
    const storedName = localStorage.getItem('userName') || `User-${Math.floor(Math.random() * 1000)}`;
    setUserName(storedName);
    const uid = Math.random().toString(36).substring(2, 15);
    setUserId(uid);

    // Connect to socket
    socketRef.current = io.connect(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');

    // Get media stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(currentStream => {
        setStream(currentStream);
        if (userVideo.current) {
          userVideo.current.srcObject = currentStream;
        }

        // Join room
        socketRef.current.emit('join-room', roomId, uid, storedName);

        // Listen for room participants
        socketRef.current.on('room-participants', allParticipants => {
          setParticipants(allParticipants);
        });

        // Handle when new user connects
        socketRef.current.on('user-connected', (newUserId, newUserName) => {
          console.log(`User connected: ${newUserName}`);
          
          // Add to participants
          setParticipants(prev => ({
            ...prev,
            [newUserId]: { userName: newUserName }
          }));
          
          // Create peer connection for the new user
          const peer = createPeer(newUserId, socketRef.current.id, currentStream);
          
          peersRef.current = {
            ...peersRef.current,
            [newUserId]: { peer }
          };
          
          setPeers(prev => ({
            ...prev,
            [newUserId]: { peer, userName: newUserName }
          }));
        });

        // Handle incoming signal
        socketRef.current.on('signal', ({ from, signal }) => {
          if (!peersRef.current[from]) {
            // Create receiving peer if it doesn't exist
            const peer = addPeer(from, signal, currentStream);
            
            peersRef.current = {
              ...peersRef.current,
              [from]: { peer }
            };
            
            const peerUserName = participants[from]?.userName || 'Unknown User';
            
            setPeers(prev => ({
              ...prev,
              [from]: { peer, userName: peerUserName }
            }));
          } else {
            // Signal the existing peer
            peersRef.current[from].peer.signal(signal);
          }
        });

        // Handle user disconnect
        socketRef.current.on('user-disconnected', userId => {
          console.log(`User disconnected: ${userId}`);
          if (peersRef.current[userId]) {
            peersRef.current[userId].peer.destroy();
            
            const newPeersRef = { ...peersRef.current };
            delete newPeersRef[userId];
            peersRef.current = newPeersRef;
            
            setPeers(prev => {
              const newPeers = { ...prev };
              delete newPeers[userId];
              return newPeers;
            });
            
            setParticipants(prev => {
              const newParticipants = { ...prev };
              delete newParticipants[userId];
              return newParticipants;
            });
          }
        });

        // Handle incoming chat messages
        socketRef.current.on('receive-message', (message) => {
          setMessages(prev => [...prev, message]);
        });

        // Handle audio toggle events
        socketRef.current.on('user-toggle-audio', (userId, isEnabled) => {
          setParticipants(prev => ({
            ...prev,
            [userId]: {
              ...prev[userId],
              isAudioEnabled: isEnabled
            }
          }));
        });

        // Handle video toggle events
        socketRef.current.on('user-toggle-video', (userId, isEnabled) => {
          setParticipants(prev => ({
            ...prev,
            [userId]: {
              ...prev[userId],
              isVideoEnabled: isEnabled
            }
          }));
        });

        // Handle screen sharing events
        socketRef.current.on('user-started-sharing', (sharingUserId) => {
          setParticipants(prev => ({
            ...prev,
            [sharingUserId]: {
              ...prev[sharingUserId],
              isScreenSharing: true
            }
          }));
        });

        socketRef.current.on('user-stopped-sharing', (sharingUserId) => {
          setParticipants(prev => ({
            ...prev,
            [sharingUserId]: {
              ...prev[sharingUserId],
              isScreenSharing: false
            }
          }));
        });
      })
      .catch(err => {
        console.error("Error accessing media devices:", err);
        alert("Unable to access camera and microphone. Please make sure they're connected and permissions are granted.");
      });

    // Cleanup on component unmount
    return () => {
      // Stop all tracks
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections
      Object.values(peersRef.current).forEach(({ peer }) => {
        peer.destroy();
      });
      
      // Close socket connection
      socketRef.current.disconnect();
    };
  }, [roomId]);

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream
    });

    peer.on('signal', signal => {
      socketRef.current.emit('signal', { to: userToSignal, from: callerID, signal });
    });

    return peer;
  };

  const addPeer = (callerID, incomingSignal, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream
    });

    peer.on('signal', signal => {
      socketRef.current.emit('signal', { to: callerID, from: userId, signal });
    });

    peer.signal(incomingSignal);

    return peer;
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        socketRef.current.emit('toggle-audio', audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        socketRef.current.emit('toggle-video', videoTrack.enabled);
      }
    }
  };

  const shareScreen = () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenTrackRef.current) {
        screenTrackRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Replace screen share track with camera track
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(newStream => {
          const videoTrack = newStream.getVideoTracks()[0];
          
          // Replace track in all peers
          Object.values(peersRef.current).forEach(({ peer }) => {
            const sender = peer.getSenders().find(s => s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          });
          
          // Update local state
          setIsScreenSharing(false);
          socketRef.current.emit('stop-sharing');
          
          // Update stream
          if (userVideo.current) {
            userVideo.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Error accessing camera:", err);
        });
    } else {
      // Start screen sharing
      navigator.mediaDevices.getDisplayMedia({ cursor: true })
        .then(screenStream => {
          const screenTrack = screenStream.getVideoTracks()[0];
          screenTrackRef.current = screenStream;
          
          // Replace camera track with screen track in all peers
          Object.values(peersRef.current).forEach(({ peer }) => {
            const sender = peer.getSenders().find(s => s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(screenTrack);
            }
          });
          
          // Handle when user stops sharing via browser UI
          screenTrack.onended = () => {
            shareScreen();  // This will trigger the "stop sharing" logic
          };
          
          // Update local state
          setIsScreenSharing(true);
          socketRef.current.emit('start-sharing');
          
          // Update local video display
          if (userVideo.current) {
            userVideo.current.srcObject = screenStream;
          }
        })
        .catch(err => {
          console.error("Error sharing screen:", err);
        });
    }
  };

  const sendMessage = (message) => {
    const messageData = {
      content: message,
      sender: userName,
      senderId: userId,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, messageData]);
    socketRef.current.emit('send-message', message);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(
      () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      },
      (err) => console.error('Could not copy room ID: ', err)
    );
  };

  return (
    <div className="meeting-room">
      <div className="room-header">
        <h2>Meeting: {roomId}</h2>
        <button className="copy-btn" onClick={copyRoomId}>
          {isCopied ? 'Copied!' : 'Copy Room ID'}
        </button>
      </div>
      
      <div className="main-content">
        <VideoGrid
          stream={stream}
          userVideo={userVideo}
          peers={peers}
          userId={userId}
          userName={userName}
          isScreenSharing={isScreenSharing}
          videoEnabled={videoEnabled}
        />
        
        {showChat && (
          <ChatPanel
            messages={messages}
            sendMessage={sendMessage}
            userId={userId}
            onClose={() => setShowChat(false)}
          />
        )}
        
        {showParticipants && (
          <ParticipantsPanel
            participants={participants}
            userId={userId}
            onClose={() => setShowParticipants(false)}
          />
        )}
      </div>
      
      <Controls
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        shareScreen={shareScreen}
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        isScreenSharing={isScreenSharing}
        toggleChat={() => setShowChat(!showChat)}
        toggleParticipants={() => setShowParticipants(!showParticipants)}
        endCall={() => window.location.href = '/'}
      />
    </div>
  );
};

export default MeetingRoom;