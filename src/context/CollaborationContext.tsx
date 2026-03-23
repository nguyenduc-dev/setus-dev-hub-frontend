'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

interface PeerStream {
  id: string;
  stream: MediaStream;
  isLocal: boolean;
  name: string;
}

interface CollaborationContextType {
  participants: { id: string, name: string }[];
  streams: PeerStream[];
  isJoined: boolean;
  isVideoMuted: boolean;
  isAudioMuted: boolean;
  participantSettings: Record<string, { volume: number, isMuted: boolean }>;
  joinRoom: () => Promise<void>;
  leaveRoom: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  updateParticipantVolume: (id: string, volume: number) => void;
  toggleParticipantMute: (id: string) => void;
  localId: string | null;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export function CollaborationProvider({ children }: { children: React.ReactNode }) {
  const { username } = useAuth();
  const { socket } = useSocket();
  const [streams, setStreams] = useState<PeerStream[]>([]);
  const [participants, setParticipants] = useState<{ id: string, name: string }[]>([]);
  const [participantSettings, setParticipantSettings] = useState<Record<string, { volume: number, isMuted: boolean }>>({});
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [localId, setLocalId] = useState<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});

  const createPeerConnection = useCallback((targetId: string, name: string) => {
    if (peersRef.current[targetId]) return peersRef.current[targetId];

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_signal', {
          targetId,
          signal: { type: 'ice-candidate', candidate: event.candidate }
        });
      }
    };

    pc.ontrack = (event) => {
      setStreams(prev => {
        const exists = prev.find(s => s.id === targetId);
        if (exists) return prev;
        return [...prev, { id: targetId, stream: event.streams[0], isLocal: false, name }];
      });
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peersRef.current[targetId] = pc;
    return pc;
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleUsersUpdate = (users: { id: string, name: string }[]) => {
      setParticipants(users);
      setLocalId(socket.id || null);
    };

    const handleSignal = async ({ senderId, signal }: any) => {
      switch (signal.type) {
        case 'offer': {
          const pc = createPeerConnection(senderId, 'Remote Dev');
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc_signal', {
            targetId: senderId,
            signal: { type: 'answer', sdp: answer }
          });
          break;
        }
        case 'answer': {
          const pc = peersRef.current[senderId];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          }
          break;
        }
        case 'ice-candidate': {
          const pc = peersRef.current[senderId];
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
          break;
        }
      }
    };

    socket.on('collaboration_users_update', handleUsersUpdate);
    socket.on('webrtc_signal', handleSignal);

    return () => {
      socket.off('collaboration_users_update', handleUsersUpdate);
      socket.off('webrtc_signal', handleSignal);
    };
  }, [socket, createPeerConnection]);

  useEffect(() => {
    if (!isJoined || !socket) return;

    participants.forEach(async (p) => {
      if (!socket.id || p.id === socket.id) return;
      if (!peersRef.current[p.id]) {
        const pc = createPeerConnection(p.id, p.name);
        if (socket.id < p.id) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc_signal', {
            targetId: p.id,
            signal: { type: 'offer', sdp: offer }
          });
        }
      }
    });

    Object.keys(peersRef.current).forEach(id => {
      if (!participants.find(p => p.id === id)) {
        peersRef.current[id].close();
        delete peersRef.current[id];
        setStreams(prev => prev.filter(s => s.id !== id));
        setParticipantSettings(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    });
  }, [participants, isJoined, createPeerConnection, socket]);

  const joinRoom = async () => {
    if (!socket) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
      setStreams([{ id: 'local', stream, isLocal: true, name: `${username} (You)` }]);
      setIsJoined(true);
      
      socket.emit('join_collaboration', { name: username || 'User' });
      toast.success('Joined conference room');
    } catch (err) {
      console.error('Failed to get local stream', err);
      toast.error('Could not access camera/microphone');
    }
  };

  const leaveRoom = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setStreams([]);
    setIsJoined(false);
    if (socket) {
      socket.emit('leave_collaboration');
    }
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};
    toast.info('Left conference room');
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isAudioMuted;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = isVideoMuted;
      });
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const updateParticipantVolume = (id: string, volume: number) => {
    setParticipantSettings(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { isMuted: false }), volume }
    }));
  };

  const toggleParticipantMute = (id: string) => {
    setParticipantSettings(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { volume: 50 }), isMuted: !(prev[id]?.isMuted) }
    }));
  };

  return (
    <CollaborationContext.Provider value={{
      participants,
      streams,
      isJoined,
      isVideoMuted,
      isAudioMuted,
      participantSettings,
      joinRoom,
      leaveRoom,
      toggleAudio,
      toggleVideo,
      updateParticipantVolume,
      toggleParticipantMute,
      localId
    }}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
}
