'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface Region {
  id: string;
  orderNumber: number;
  nameAndDescription: string;
  effect: string | null;
}

export default function RegionsPage() {
  const queryClient = useQueryClient();
  
  const { data: regions, isLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const res = await api.get('/regions');
      return res.data.data as Region[];
    }
  });

  const [newRow, setNewRow] = useState({ orderNumber: 1, nameAndDescription: '', effect: '' });

  const createMutation = useMutation({
    mutationFn: (newReg: Omit<Region, 'id'>) => api.post('/regions', newReg),
    onSuccess: () => {
      toast.success('Region added inline');
      setNewRow({ orderNumber: (regions?.length || 0) + 2, nameAndDescription: '', effect: '' });
      queryClient.invalidateQueries({ queryKey: ['regions'] });
    },
    onError: () => toast.error('Failed to create region. Ensure STT is unique.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/regions/${id}`),
    onSuccess: () => {
      toast.success('Region deleted');
      queryClient.invalidateQueries({ queryKey: ['regions'] });
    }
  });

  const handleAddRow = () => {
    if (!newRow.nameAndDescription) return toast.error('Name & Desc is required');
    createMutation.mutate(newRow);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Game Regions</h1>
          <p className="text-sm text-zinc-400">Board layout with inline spreadsheet editing.</p>
        </div>
      </div>

      <div className="bg-[#1e1e1e] border border-zinc-800/60 rounded-xl overflow-hidden shadow-2xl flex-1 flex flex-col relative">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/80 border-b border-zinc-800 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <th className="px-6 py-4 w-20 text-center">STT</th>
                <th className="px-6 py-4 w-1/3">Region Name & Description</th>
                <th className="px-6 py-4">Effect / Trigger</th>
                <th className="px-6 py-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-zinc-500 animate-pulse">Loading regions...</td>
                </tr>
              )}
              {regions?.map((region) => (
                <tr key={region.id} className="group hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 font-mono text-sm">
                      {region.orderNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{region.nameAndDescription}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-emerald-400/90 whitespace-pre-wrap">{region.effect || '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => deleteMutation.mutate(region.id)}
                      className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* Inline Add Row */}
              <tr className="bg-emerald-950/20 hover:bg-emerald-900/30 transition-colors group">
                <td className="px-6 py-4 text-center align-top">
                  <input
                    type="number"
                    value={regions ? (regions.length > 0 ? regions[regions.length - 1].orderNumber + 1 : 1) : newRow.orderNumber}
                    onChange={(e) => setNewRow({ ...newRow, orderNumber: parseInt(e.target.value) || 1 })}
                    className="w-12 text-center bg-zinc-900 border border-zinc-700 rounded py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </td>
                <td className="px-6 py-4 align-top">
                  <textarea
                    rows={2}
                    placeholder="Enter Region Name & Story Description..."
                    value={newRow.nameAndDescription}
                    onChange={(e) => setNewRow({ ...newRow, nameAndDescription: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddRow();
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Press <kbd className="bg-zinc-800 px-1 rounded">Enter</kbd> to save immediately</p>
                </td>
                <td className="px-6 py-4 align-top">
                  <textarea
                    rows={2}
                    placeholder="E.g., HP -1 when entering"
                    value={newRow.effect}
                    onChange={(e) => setNewRow({ ...newRow, effect: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddRow();
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                  />
                </td>
                <td className="px-6 py-4 text-center align-top">
                  <button
                    onClick={handleAddRow}
                    disabled={createMutation.isPending}
                    className="p-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg transition-colors font-medium shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
