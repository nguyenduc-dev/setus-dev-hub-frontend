'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Layers, Users, Zap, Map, LayoutDashboard, 
  Trello, Swords, ShieldQuestion, ChevronLeft, Menu, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/characters', label: 'Characters', icon: Users },
  { href: '/cards', label: 'Cards', icon: Layers },
  { href: '/miniboss', label: 'Mini Boss', icon: Swords },
  { href: '/special-equipment', label: 'Special Equipment', icon: ShieldQuestion },
  { href: '/mechanics', label: 'Mechanics', icon: Zap },
  { href: '/regions', label: 'Regions', icon: Map },
  { href: '/kanban', label: 'Kanban', icon: Trello },
];

interface SidebarProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (val: boolean) => void;
  onCloseMobile?: () => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "h-full border-r border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl flex flex-col transition-all duration-300 ease-in-out relative",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Toggle Button - Desktop Only */}
      <button 
        onClick={() => setIsCollapsed?.(!isCollapsed)}
        className="hidden md:flex absolute -right-3 top-12 w-6 h-6 bg-zinc-900 border border-zinc-700 rounded-full items-center justify-center text-zinc-400 hover:text-white transition-all hover:scale-110 z-50 shadow-xl"
      >
        <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", isCollapsed && "rotate-180")} />
      </button>

      {/* Mobile Close Button */}
      {onCloseMobile && (
        <button 
          onClick={onCloseMobile}
          className="md:hidden absolute top-6 right-4 p-2 text-zinc-500 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Logo Section */}
      <div className={cn(
        "w-full flex items-center py-8 px-6 overflow-hidden",
        isCollapsed && "justify-center px-0"
      )}>
        <Link 
          href="/" 
          onClick={onCloseMobile}
          className={cn(
            "flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity min-w-max",
            isCollapsed && "gap-0"
          )}
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <h1 className={cn(
            "text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500 tracking-tight transition-all duration-300 ease-in-out origin-left",
            isCollapsed && "scale-0 opacity-0 w-0"
          )}>
            Setus Dev Hub
          </h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-full px-3 space-y-1.5 overflow-y-auto scrollbar-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400" 
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100",
                isCollapsed && "justify-center px-0 gap-0"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={cn(
                "w-[1.125rem] h-[1.125rem] shrink-0", 
                isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
              )} />
              
              <span className={cn(
                "transition-all duration-300 ease-in-out origin-left overflow-hidden whitespace-nowrap",
                isCollapsed ? "w-0 opacity-0 scale-0" : "w-auto opacity-100 scale-100"
              )}>
                {item.label}
              </span>

              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-indigo-500" />
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* Workspace Badge */}
      <div className={cn(
        "w-full px-3 pb-8 mt-auto overflow-hidden",
        isCollapsed && "px-2"
      )}>
        <div className={cn(
          "p-4 rounded-2xl bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 border border-zinc-800/50 flex flex-col items-start transition-all duration-300 ease-in-out",
          isCollapsed ? "items-center p-0 h-10 w-10 justify-center mx-auto" : "px-4"
        )}>
          {isCollapsed ? (
             <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-500">SH</div>
          ) : (
            <>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1.5 opacity-60">Workspace</p>
              <p className="text-sm font-black text-zinc-200 truncate w-full">Shadow Hunters</p>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
