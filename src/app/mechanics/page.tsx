'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Edit2, Trash2, Check, X, Map, Search, Zap, Layers, ChevronRight, Save } from 'lucide-react';
import Loader from '@/components/Loader';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';

type Category = 'Matchmaking' | 'Gameplay';

interface Mechanic {
  id: string;
  category: Category;
  rules: string[];
}

export default function MechanicsPage() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<Category>('Matchmaking');
  
  const { data: mechanics, isLoading } = useQuery({
    queryKey: ['mechanics', activeCategory],
    queryFn: async () => {
      const res = await api.get(`/mechanics?category=${activeCategory}`);
      return res.data.data as Mechanic[];
    }
  });

  // We assume 1 document per category for simplicity, or grab the latest.
  const activeDocument = mechanics?.[0];
  const [localRules, setLocalRules] = useState<string[]>([]);
  // Use a ref to track which document was last synchronized into local state
  const lastLoadedId = useRef<string | null>(null);
  
  // Sync when doc loaded
  useEffect(() => {
    // We use document id if available, otherwise fallback to category for new docs
    const currentId = activeDocument?.id || activeCategory;
    
    if (!isLoading && currentId !== lastLoadedId.current) {
      setLocalRules(activeDocument?.rules || []);
      lastLoadedId.current = currentId;
    }
  }, [activeDocument, isLoading, activeCategory]);

  const saveMutation = useMutation({
    mutationFn: (rules: string[]) => {
      if (activeDocument) {
        return api.patch(`/mechanics/${activeDocument.id}`, { rules });
      } else {
        return api.post('/mechanics', { category: activeCategory, rules });
      }
    },
    onSuccess: () => {
      toast.success('Rules saved successfully');
      queryClient.invalidateQueries({ queryKey: ['mechanics', activeCategory] });
    }
  });

  const handleAddRule = () => {
    const nextIndex = localRules.length + 1;
    const newRule = `Rule #${nextIndex}: `;
    setLocalRules([...localRules, newRule]);
  };

  const handleUpdateRule = (index: number, val: string) => {
    const updated = [...localRules];
    updated[index] = val;
    setLocalRules(updated);
  };

  const handleDeleteRule = (index: number) => {
    const remaining = localRules.filter((_, i) => i !== index);
    const reindexed = remaining.map((rule, idx) => {
      // Re-index Rule #X: pattern if it exists, otherwise just keep as is (or could force it)
      if (rule.trim().startsWith('Rule #')) {
        return rule.replace(/^Rule #\d+[:\s]*/, `Rule #${idx + 1}: `);
      }
      return rule;
    });
    setLocalRules(reindexed);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Game Mechanics</h1>
          <p className="text-sm text-zinc-400">Rich text rules editor for matchmaking and gameplay.</p>
        </div>
        
        <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/50 w-full md:w-auto">
          {(['Matchmaking', 'Gameplay'] as Category[]).map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setLocalRules([]); }}
              className={`flex-1 md:w-32 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeCategory === cat ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-[#1e1e1e] border border-zinc-800/60 rounded-xl overflow-hidden flex flex-col relative shadow-2xl">
        {/* Editor Toolbar */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-[#252526]">
          <div className="flex items-center gap-2">
            <div className="text-xs text-zinc-400 uppercase tracking-widest font-semibold px-2">{activeCategory} Rules</div>
          </div>
          <button
            onClick={() => saveMutation.mutate(localRules)}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 px-4 py-1.5 rounded-md text-sm font-medium transition-colors border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
          >
            <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving...' : 'Save Document'}
          </button>
        </div>

        {/* Editor Infinite Canvas */}
        <div className="flex-1 overflow-y-auto p-8 relative scroll-smooth bg-[#1e1e1e]">
          <div className="max-w-3xl mx-auto min-h-full pb-32 relative">
            {isLoading ? (
              <Loader fullScreen={false} className="absolute inset-0 z-50 bg-zinc-950/20" />
            ) : (
              <div className="space-y-4">
                {localRules.length === 0 && (
                  <div className="text-center py-20 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
                    No rules defined for this category yet. Click the + button to start writing.
                  </div>
                )}
                {localRules.map((rule, idx) => (
                  <div key={idx} className="group relative flex items-start gap-4">
                    <div className="pt-2 text-zinc-600 font-mono text-xs opacity-50 select-none w-6 text-right">
                      {(idx + 1).toString().padStart(2, '0')}
                    </div>
                    <div className="flex-1 relative">
                      <textarea
                        className="w-full bg-transparent text-zinc-300 text-[15px] leading-relaxed resize-none focus:outline-none focus:bg-white/5 transition-colors p-2 rounded block"
                        rows={rule.split('\n').length || 1}
                        value={rule}
                        onChange={(e) => handleUpdateRule(idx, e.target.value)}
                        placeholder="Type rule here..."
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteRule(idx)}
                      className="mt-2 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Floating Add Button */}
        <button
          onClick={handleAddRule}
          className="absolute bottom-6 right-6 w-14 h-14 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center justify-center transition-transform hover:scale-105"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
