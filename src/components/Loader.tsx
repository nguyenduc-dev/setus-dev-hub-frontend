'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  fullScreen?: boolean;
  className?: string;
}

export default function Loader({ fullScreen = true, className }: LoaderProps) {
  return (
    <div className={cn(
      "flex items-center justify-center bg-zinc-950/20 backdrop-blur-[2px]",
      fullScreen ? "fixed inset-0 z-[9999] bg-zinc-950" : "w-full h-full min-h-[200px]",
      className
    )}>
      <div className="relative">
        <div className="w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-purple-500/30 rounded-full animate-spin [animation-duration:1.5s]" />
        <div className="absolute -inset-4 bg-indigo-500/5 blur-2xl rounded-full animate-pulse" />
      </div>
    </div>
  );
}
