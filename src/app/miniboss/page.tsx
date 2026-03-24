'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Image as ImageIcon, Trash2, Pencil, AlertTriangle, Search, Swords, Heart, Gift } from 'lucide-react';
import Loader from '@/components/Loader';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface MiniBoss {
  id: string;
  bossName: string;
  hp: number;
  atk: number;
  effect: string | null;
  bossReward: string | null;
  imageUrl: string | null;
}

export default function MiniBossPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    bossName: '', hp: 100, atk: 10, effect: '', bossReward: '', imageUrl: ''
  });

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
  };

  const { data: bosses, isLoading } = useQuery({
    queryKey: ['minibosses'],
    queryFn: async () => {
      const res = await api.get('/minibosses');
      return res.data.data as MiniBoss[];
    }
  });

  const createMutation = useMutation({
    mutationFn: (newBoss: Omit<MiniBoss, 'id'>) => api.post('/minibosses', newBoss),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minibosses'] });
      setIsAdding(false);
      setFormData({ bossName: '', hp: 100, atk: 10, effect: '', bossReward: '', imageUrl: '' });
      toast.success('Mini Boss added');
    },
    onError: () => toast.error('Failed to create Mini Boss')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/minibosses/${id}`),
    onSuccess: () => {
      toast.success('Mini Boss deleted');
      queryClient.invalidateQueries({ queryKey: ['minibosses'] });
    }
  });

  const [editingBoss, setEditingBoss] = useState<MiniBoss | null>(null);
  const [deletingBossId, setDeletingBossId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    bossName: '', hp: 0, atk: 0, effect: '', bossReward: '', imageUrl: ''
  });

  const updateMutation = useMutation({
    mutationFn: (updated: { id: string } & Partial<MiniBoss>) => api.patch(`/minibosses/${updated.id}`, updated),
    onSuccess: () => {
      toast.success('Mini Boss updated');
      setEditingBoss(null);
      queryClient.invalidateQueries({ queryKey: ['minibosses'] });
    }
  });

  const openEdit = (boss: MiniBoss) => {
    setEditingBoss(boss);
    setEditFormData({
      bossName: boss.bossName,
      hp: boss.hp || 0,
      atk: boss.atk || 0,
      effect: boss.effect || '',
      bossReward: boss.bossReward || '',
      imageUrl: boss.imageUrl || ''
    });
  };

  const [selectedBoss, setSelectedBoss] = useState<MiniBoss | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Mini Bosses</h1>
          <p className="text-sm text-zinc-400">Manage high-level encounters and their rewards.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
        >
          <Plus className="w-4 h-4" /> Add Mini Boss
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-zinc-500" />
        </div>
        <input 
          type="text"
          placeholder="Search roster by boss name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-zinc-600"
        />
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const imageFormData = new FormData();
          imageFormData.append('image', file);
          try {
            toast.loading('Uploading image...');
            const res = await api.post('/upload', imageFormData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            const url = res.data.data.url;
            if (editingBoss) {
              setEditFormData(prev => ({ ...prev, imageUrl: url }));
            } else {
              setFormData(prev => ({ ...prev, imageUrl: url }));
            }
            toast.dismiss();
            toast.success('Image uploaded');
          } catch (err) {
            toast.dismiss();
            toast.error('Upload failed');
          }
        }}
        className="hidden" 
        accept="image/*" 
      />

      {isAdding && (
        <div className="mb-8 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
          <h2 className="text-lg font-semibold mb-4 text-white">New Mini Boss</h2>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if(!formData.bossName) return toast.error("Boss Name is required");
              createMutation.mutate(formData);
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Boss Name *</label>
                <input required value={formData.bossName} onChange={e=>setFormData({...formData, bossName: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all" placeholder="E.g., Ancient Golem" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">HP *</label>
                  <input type="number" required value={formData.hp} onChange={e=>setFormData({...formData, hp: parseInt(e.target.value) || 0})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">ATK *</label>
                  <input type="number" required value={formData.atk} onChange={e=>setFormData({...formData, atk: parseInt(e.target.value) || 0})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Effect</label>
                <textarea rows={2} value={formData.effect} onChange={e=>setFormData({...formData, effect: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all resize-none" placeholder="Special abilities..." />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Boss Reward</label>
                <input value={formData.bossReward} onChange={e=>setFormData({...formData, bossReward: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all" placeholder="E.g., +2 XP, Magic Core..." />
              </div>
            </div>

            <div className="space-y-4 flex flex-col h-full">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 w-full border-2 border-dashed border-zinc-800 hover:border-red-500/50 bg-zinc-950/30 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors group relative overflow-hidden"
              >
                {formData.imageUrl ? (
                  <img src={getImageUrl(formData.imageUrl) || ''} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-zinc-500 group-hover:text-red-400 mb-2 transition-colors" />
                    <p className="text-sm font-medium text-zinc-400">Upload Boss Art</p>
                  </>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-50">
                  {createMutation.isPending ? 'Saving...' : 'Save Boss'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative min-h-[400px]">
        {isLoading ? (
          <Loader fullScreen={false} className="absolute inset-0 z-50 bg-zinc-950/20" />
        ) : bosses?.filter(b => b.bossName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
          <div className="col-span-full py-20 text-center bg-zinc-900/20 rounded-[2rem] border border-dashed border-zinc-800 text-zinc-500">
             No Bosses recorded in the roster.
          </div>
        ) : (
          bosses?.filter(b => b.bossName.toLowerCase().includes(searchQuery.toLowerCase())).map((boss: MiniBoss) => (
            <div 
              key={boss.id} 
              onClick={() => setSelectedBoss(boss)}
              className="group relative bg-zinc-800/30 border border-zinc-700/40 rounded-2xl overflow-hidden backdrop-blur-md hover:bg-zinc-800/50 hover:border-red-500/50 transition-all cursor-pointer flex flex-col hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-red-500/10"
            >
              <div className="w-full aspect-[4/3] bg-zinc-900/50 flex flex-col items-center justify-center border-b border-zinc-700/40 relative overflow-hidden">
                {boss.imageUrl ? (
                  <img src={getImageUrl(boss.imageUrl) || ''} alt={boss.bossName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-zinc-800 group-hover:text-zinc-600 transition-colors" />
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <button onClick={(e) => {e.stopPropagation(); openEdit(boss);}} className="p-2 bg-black/60 backdrop-blur-md text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-white/5"><Pencil className="w-4 h-4" /></button>
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <button onClick={(e) => {e.stopPropagation(); setDeletingBossId(boss.id);}} className="p-2 bg-black/60 backdrop-blur-md text-red-500 hover:bg-red-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-white/5"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-white text-lg truncate pr-2">{boss.bossName}</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">HP {boss.hp}</span>
                     <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-md border text-white bg-red-500/10 text-red-400 border-red-500/20">
                       BOSS
                     </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedBoss && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedBoss(null)} />
          <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <button onClick={() => setSelectedBoss(null)} className="absolute top-6 right-6 z-50 p-3 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-2xl transition-all"><Plus className="w-6 h-6 rotate-45" /></button>
            <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[60vh] md:max-h-full scrollbar-hidden">
               <div className="mb-8">
                 <div className="flex items-center gap-3 mb-4">
                    <span className="inline-block text-xs uppercase tracking-[0.2em] font-black px-3 py-1 rounded-full border bg-red-500/10 text-red-500 border-red-500/20">MINI BOSS</span>
                    <span className="text-xl font-black text-red-500 bg-red-500/10 px-4 py-1 rounded-full border border-red-500/20">HP: {selectedBoss.hp}</span>
                    <span className="text-xl font-black text-orange-500 bg-orange-500/10 px-4 py-1 rounded-full border border-orange-500/20">ATK: {selectedBoss.atk}</span>
                 </div>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">{selectedBoss.bossName}</h2>
               </div>
               <div className="space-y-8">
                  <div className="group">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Abilities & Effect</h4>
                    <p className="text-zinc-200 leading-relaxed bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 group-hover:border-zinc-700/50 transition-colors">
                      {selectedBoss.effect || "No special effects documented."}
                    </p>
                  </div>
                  <div className="group">
                    <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <Gift className="w-3 h-3" /> Boss Reward
                    </h4>
                    <p className="text-emerald-400 leading-relaxed bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 group-hover:border-emerald-500/30 transition-colors font-medium">
                      {selectedBoss.bossReward || "No rewards specified."}
                    </p>
                  </div>
               </div>
            </div>
            <div className="w-full md:w-[45%] bg-zinc-900 relative min-h-[300px] md:min-h-full border-t md:border-t-0 md:border-l border-zinc-800 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-white/5 opacity-50" />
                {selectedBoss.imageUrl ? <img src={getImageUrl(selectedBoss.imageUrl) || ''} className="w-full h-full object-cover" /> : <div className="text-zinc-800 text-center"><Swords className="w-20 h-20 mb-2 mx-auto" /><span className="text-[10px] font-bold uppercase tracking-widest">No Boss Illustration</span></div>}
                <div className="absolute bottom-0 right-0 w-32 h-32 blur-[80px] opacity-20 bg-red-500" />
            </div>
          </div>
        </div>
      )}

      {editingBoss && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEditingBoss(null)} />
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Edit Mini Boss</h2>
            <form onSubmit={(e) => {e.preventDefault(); updateMutation.mutate({ id: editingBoss.id, ...editFormData });}} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div><label className="text-xs uppercase text-zinc-500 mb-1.5 block">Boss Name</label><input required value={editFormData.bossName} onChange={e=>setEditFormData({...editFormData, bossName: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs uppercase text-zinc-500 mb-1.5 block">HP</label><input type="number" value={editFormData.hp} onChange={e=>setEditFormData({...editFormData, hp: parseInt(e.target.value) || 0})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" /></div>
                    <div><label className="text-xs uppercase text-zinc-500 mb-1.5 block">ATK</label><input type="number" value={editFormData.atk} onChange={e=>setEditFormData({...editFormData, atk: parseInt(e.target.value) || 0})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" /></div>
                  </div>
                  <div><label className="text-xs uppercase text-zinc-500 mb-1.5 block">Reward</label><input value={editFormData.bossReward} onChange={e=>setEditFormData({...editFormData, bossReward: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" /></div>
                </div>
                <div className="space-y-4 flex flex-col">
                  <div><label className="text-xs uppercase text-zinc-500 mb-1.5 block">Effect</label><textarea rows={3} value={editFormData.effect} onChange={e=>setEditFormData({...editFormData, effect: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm resize-none text-white" /></div>
                  <div onClick={() => fileInputRef.current?.click()} className="flex-1 min-h-[100px] border-2 border-dashed border-zinc-800 hover:border-red-500/50 bg-zinc-950/30 rounded-xl flex items-center justify-center cursor-pointer transition-all overflow-hidden relative">
                    {editFormData.imageUrl ? <img src={getImageUrl(editFormData.imageUrl) || ''} className="w-full h-full object-cover" /> : <span className="text-xs text-zinc-500">Pick New Art</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setEditingBoss(null)} className="px-4 py-2 text-sm text-zinc-400">Cancel</button>
                <button type="submit" disabled={updateMutation.isPending} className="bg-red-500 px-6 py-2 rounded-lg text-sm font-bold text-white">{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingBossId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setDeletingBossId(null)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Delete Boss?</h2>
            <p className="text-sm text-zinc-400 mb-6 lowercase">Permanent removal of this encounter.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => {deleteMutation.mutate(deletingBossId); setDeletingBossId(null);}} className="w-full py-3 bg-red-500 rounded-xl text-white font-bold">Permanently Delete</button>
              <button onClick={() => setDeletingBossId(null)} className="w-full py-3 bg-zinc-800 rounded-xl text-zinc-400">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
