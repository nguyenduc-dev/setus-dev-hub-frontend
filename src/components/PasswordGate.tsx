'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Unlock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Artificial small delay for premium feel
    setTimeout(() => {
      const success = login(password, username);
      if (success) {
        toast.success('Access granted to Setus Game Hub');
      } else {
        setIsError(true);
        toast.error('Invalid workspace password');
        setTimeout(() => setIsError(false), 500);
      }
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-zinc-950 flex shadow-2xl overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
      </div>

      <div className="relative w-full max-w-xl mx-auto flex flex-col items-center justify-center p-8">
        <div className="w-full bg-zinc-900/40 backdrop-blur-3xl border border-white/5 p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex flex-col items-center mb-10 text-center">
            <div className={cn(
              "w-20 h-20 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-8 transition-transform duration-500 rotate-6 group-hover:rotate-0",
              isError ? "animate-shake bg-red-500/10 border-red-500/20" : "group-hover:scale-110"
            )}>
              {isSubmitting ? (
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 border-4 border-transparent border-b-purple-500/30 rounded-full animate-spin [animation-duration:1.5s]" />
                </div>
              ) : (
                <Lock className={cn("w-10 h-10 transition-colors", isError ? "text-red-500" : "text-indigo-500")} />
              )}
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-white mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              Workspace Protected
            </h1>
            <p className="text-zinc-500 text-lg max-w-xs mx-auto leading-relaxed">
              Enter the daily access code to enter the <span className="text-zinc-300 font-medium">Setus Studio</span> developer environment.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group/input">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your Name (e.g. Duc)"
                className={cn(
                  "w-full bg-zinc-950/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-lg placeholder:text-zinc-700 focus:outline-none transition-all",
                  "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30",
                  isError && "border-red-500/50 ring-2 ring-red-500/10"
                )}
                autoFocus
              />
            </div>

            <div className="relative group/input">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Workspace Password"
                className={cn(
                  "w-full bg-zinc-950/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-lg placeholder:text-zinc-700 focus:outline-none transition-all",
                  "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30",
                  isError && "border-red-500/50 ring-2 ring-red-500/10"
                )}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/input:opacity-100 transition-opacity">
                <ShieldCheck className="w-5 h-5 text-zinc-600" />
              </div>
            </div>

            <button
              disabled={isSubmitting || !password || !username}
              className={cn(
                "w-full group relative flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-2xl transition-all overflow-hidden",
                "hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 group-hover:text-white transition-colors">Enter Workspace</span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3 text-zinc-600">
              <Zap className="w-4 h-4" />
              <span className="text-xs uppercase tracking-[0.2em] font-bold">Encrypted End-to-End</span>
            </div>
            <span className="text-xs font-mono text-zinc-700">v2.0.4-HUB</span>
          </div>
        </div>

        <p className="mt-8 text-zinc-600 text-sm font-medium tracking-wide">
          © {new Date().getFullYear()} Seto Studio. All components verified.
        </p>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}
