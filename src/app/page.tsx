import { Users, Layers, Zap, Map, Swords, ShieldQuestion } from 'lucide-react';
import Link from 'next/link';

const stats = [
  { name: 'Characters', href: '/characters', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { name: 'Cards', href: '/cards', icon: Layers, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { name: 'Mini Bosses', href: '/miniboss', icon: Swords, color: 'text-red-500', bg: 'bg-red-500/10' },
  { name: 'Special Equipment', href: '/special-equipment', icon: ShieldQuestion, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { name: 'Mechanics', href: '/mechanics', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { name: 'Regions', href: '/regions', icon: Map, color: 'text-zinc-400', bg: 'bg-zinc-400/10' },
];

export default function Dashboard() {
  return (
    <div className="w-full h-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2 mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Welcome to Setus Hub</h1>
        <p className="text-zinc-400">Manage internal entities and rules for Shadow Hunters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="group relative flex flex-col items-start justify-between min-h-[160px] p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 hover:bg-zinc-800/40 hover:border-zinc-700/50 transition-all cursor-pointer overflow-hidden backdrop-blur-sm shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-zinc-900/20 group-hover:opacity-100 opacity-0 transition-opacity" />
              
              <div className={`p-3 rounded-xl ${item.bg} mb-4`}>
                <Icon className={`w-6 h-6 ${item.color}`} />
              </div>
              
              <div>
                <h3 className="font-semibold text-zinc-100 text-lg">{item.name}</h3>
                <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1 group-hover:text-zinc-400 transition-colors">
                  View Database
                  <svg className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
