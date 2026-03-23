'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Users, Zap, Map, LayoutDashboard, Image as ImageIcon, Trello, Video, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/characters', label: 'Characters', icon: Users },
  { href: '/cards', label: 'Cards', icon: Layers },
  { href: '/mechanics', label: 'Mechanics', icon: Zap },
  { href: '/regions', label: 'Regions', icon: Map },
  { href: '/kanban', label: 'Kanban', icon: Trello },
  { href: '/collaboration', label: 'Collaboration', icon: Video },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-800/60 bg-zinc-950/50 backdrop-blur-xl flex flex-col items-center py-8">
      <Link href="/" className="flex items-center gap-3 mb-10 px-6 w-full group cursor-pointer hover:opacity-80 transition-opacity">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center justify-center transition-transform group-hover:scale-105">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500 tracking-tight">Setus Dev Hub</h1>
      </Link>

      <nav className="flex-1 w-full px-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400" 
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300")} />
              {item.label}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-indigo-500" />
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="w-full px-4 mt-auto">
        <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 border border-zinc-800/50 flex flex-col items-start">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Workspace</p>
          <p className="text-sm font-semibold text-zinc-300">Shadow Hunters</p>
        </div>
      </div>
    </aside>
  );
}
