'use client';

import { useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Settings, Monitor, MessageSquare, User, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollaboration } from '@/context/CollaborationContext';

export default function CollaborationPage() {
  const {
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
  } = useCollaboration();

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Collaboration Room</h1>
          <p className="text-sm text-zinc-400">High-fidelity video conferencing for game dev syncs.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-zinc-300">{participants.length || (isJoined ? 1 : 0)} Active Developers</span>
          </div>
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!isJoined ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-3xl">
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6">
            <Video className="w-10 h-10 text-indigo-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Ready to join?</h2>
          <p className="text-zinc-500 mb-8 text-center max-w-sm">
            Check your camera and microphone settings before entering the developer workspace.
          </p>
          <button
            onClick={joinRoom}
            className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105"
          >
            Join Conference
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Video Grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 auto-rows-fr overflow-y-auto pr-2 custom-scrollbar">
            {streams.map((peer) => (
              <VideoCard 
                key={peer.id} 
                peer={peer} 
                isLocal={peer.id === 'local'} 
                isVideoMuted={peer.id === 'local' && isVideoMuted}
                settings={participantSettings[peer.id] || { volume: 50, isMuted: false }}
                onUpdateVolume={(v) => updateParticipantVolume(peer.id, v)}
                onToggleMute={() => toggleParticipantMute(peer.id)}
              />
            ))}
            
            {/* Participants without a stream yet */}
            {participants.filter(p => !streams.find(s => s.id === p.id) && p.id !== localId).map((p) => {
              const settings = participantSettings[p.id] || { volume: 50, isMuted: false };
              return (
                <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center relative overflow-hidden group shadow-2xl transition-all hover:border-zinc-700">
                  <div className={cn("absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5", settings.isMuted ? "opacity-40 grayscale" : "")} />
                  
                  {/* Remote Controls Overlay */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all z-30 translate-x-2 group-hover:translate-x-0">
                    <button 
                      onClick={() => toggleParticipantMute(p.id)}
                      className={cn(
                        "p-2 rounded-xl border backdrop-blur-md transition-all",
                        settings.isMuted ? "bg-red-500/20 border-red-500/50 text-red-500" : "bg-black/40 border-white/10 text-white hover:bg-black/60"
                      )}
                    >
                      {settings.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Volume Slider Overlay */}
                  <div className="absolute bottom-16 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all z-30 translate-y-2 group-hover:translate-y-0">
                    <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-3">
                      <Volume2 className="w-3 h-3 text-zinc-400" />
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={settings.volume}
                        onChange={(e) => updateParticipantVolume(p.id, parseInt(e.target.value))}
                        className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <span className="text-[10px] font-mono text-zinc-400 w-6">{settings.volume}%</span>
                    </div>
                  </div>

                  <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600 text-3xl font-bold shadow-inner relative">
                    {p.name.substring(0, 2).toUpperCase()}
                    {settings.isMuted && (
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center border-4 border-zinc-900">
                        <VolumeX className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <User className="w-3 h-3 text-indigo-400" />
                    <span className="text-xs font-semibold text-white">{p.name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-center gap-4 py-6">
            <button
              onClick={toggleAudio}
              className={cn(
                "p-4 rounded-2xl border transition-all hover:scale-110",
                isAudioMuted ? "bg-red-500/10 border-red-500 text-red-500" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              )}
            >
              {isAudioMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <button
              onClick={toggleVideo}
              className={cn(
                "p-4 rounded-2xl border transition-all hover:scale-110",
                isVideoMuted ? "bg-red-500/10 border-red-500 text-red-500" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              )}
            >
              {isVideoMuted ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
            <button className="p-4 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-2xl transition-all hover:scale-110">
              <Monitor className="w-6 h-6" />
            </button>
            <div className="w-px h-8 bg-zinc-800 mx-2" />
            <button
              onClick={leaveRoom}
              className="p-4 bg-red-500 text-white rounded-2xl transition-all hover:scale-110 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface PeerStream {
  id: string;
  stream: MediaStream;
  isLocal: boolean;
  name: string;
}

function VideoCard({ 
  peer, 
  isLocal, 
  isVideoMuted, 
  settings, 
  onUpdateVolume, 
  onToggleMute 
}: { 
  peer: PeerStream; 
  isLocal: boolean; 
  isVideoMuted: boolean;
  settings: { volume: number, isMuted: boolean };
  onUpdateVolume: (v: number) => void;
  onToggleMute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream, isVideoMuted]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = settings.volume / 100;
    }
  }, [settings.volume]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl relative overflow-hidden group shadow-2xl aspect-video">
      {isVideoMuted ? (
        <div className="absolute inset-0 z-10 bg-zinc-950 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                <VideoOff className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="text-sm font-medium text-zinc-500">Camera is off</p>
        </div>
      ) : null}
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || settings.isMuted}
        className={cn("w-full h-full object-cover transform transition-transform group-hover:scale-105 mirror-video", isLocal ? "scale-x-[-1]" : "")}
      />

      {!isLocal && (
        <>
          {/* Remote Controls Overlay */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all z-30 translate-x-2 group-hover:translate-x-0">
            <button 
              onClick={onToggleMute}
              className={cn(
                "p-2 rounded-xl border backdrop-blur-md transition-all",
                settings.isMuted ? "bg-red-500/20 border-red-500/50 text-red-500" : "bg-black/40 border-white/10 text-white hover:bg-black/60"
              )}
            >
              {settings.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Volume Slider Overlay */}
          <div className="absolute bottom-16 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all z-30 translate-y-2 group-hover:translate-y-0">
            <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-3">
              <Volume2 className="w-3 h-3 text-zinc-400" />
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={settings.volume}
                onChange={(e) => onUpdateVolume(parseInt(e.target.value))}
                className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-[10px] font-mono text-zinc-400 w-6">{settings.volume}%</span>
            </div>
          </div>
        </>
      )}

      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-semibold text-white">{peer.name}</span>
        {settings.isMuted && !isLocal && (
          <div className="flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-[10px] text-red-400 font-bold uppercase">
             Muted
          </div>
        )}
      </div>
    </div>
  );
}
