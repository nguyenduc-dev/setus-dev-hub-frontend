'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Image as ImageIcon, Trash2, Pencil, AlertTriangle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

type Faction = 'Demon' | 'Knight' | 'Mutant' | 'Anomaly';

interface Character {
  id: string;
  name: string;
  type: Faction;
  hp: number;
  passiveSkill: string | null;
  activeSkill: string | null;
  specialSkill: string | null;
  imageUrl: string | null;
}

export default function CharactersPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '', type: 'Demon' as Faction, hp: 100, passiveSkill: '', activeSkill: '', specialSkill: '', imageUrl: ''
  });

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
  };

  const { data: characters, isLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: async () => {
      const res = await api.get('/characters');
      return res.data.data as Character[];
    }
  });

  const createMutation = useMutation({
    mutationFn: (newChar: Omit<Character, 'id'>) => api.post('/characters', newChar),
    onMutate: async (newChar) => {
      await queryClient.cancelQueries({ queryKey: ['characters'] });
      const previous = queryClient.getQueryData(['characters']);
      queryClient.setQueryData(['characters'], (old: any) => [{...newChar, id: 'temp-'+Date.now()}].concat(old || []));
      setIsAdding(false);
      setFormData({ name: '', type: 'Demon', hp: 100, passiveSkill: '', activeSkill: '', specialSkill: '', imageUrl: '' });
      toast.success('Character added');
      return { previous };
    },
    onError: (err, newChar, context) => {
      queryClient.setQueryData(['characters'], context?.previous);
      toast.error('Failed to create character');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/characters/${id}`),
    onSuccess: () => {
      toast.success('Character deleted');
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    }
  });

  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [deletingCharId, setDeletingCharId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '', type: 'Demon' as Faction, hp: 0, passiveSkill: '', activeSkill: '', specialSkill: '', imageUrl: ''
  });

  const updateMutation = useMutation({
    mutationFn: (updated: { id: string } & Partial<Character>) => api.patch(`/characters/${updated.id}`, updated),
    onSuccess: () => {
      toast.success('Character updated');
      setEditingCharacter(null);
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    }
  });

  const openEdit = (char: Character) => {
    setEditingCharacter(char);
    setEditFormData({
      name: char.name,
      type: char.type,
      hp: char.hp || 0,
      passiveSkill: char.passiveSkill || '',
      activeSkill: char.activeSkill || '',
      specialSkill: char.specialSkill || '',
      imageUrl: char.imageUrl || ''
    });
  };

  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [filterFaction, setFilterFaction] = useState<Faction | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Characters Roster</h1>
          <p className="text-sm text-zinc-400">Manage game entities across all factions.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]"
        >
          <Plus className="w-4 h-4" /> Add Character
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-zinc-500" />
        </div>
        <input 
          type="text"
          placeholder="Search roster by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600"
        />
      </div>

      {/* Filter Factions */}
      <div className="flex flex-wrap gap-2 mb-8">
        {['All', 'Demon', 'Knight', 'Mutant', 'Anomaly'].map((faction) => (
          <button
            key={faction}
            onClick={() => setFilterFaction(faction as any)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border",
              filterFaction === faction 
                ? "bg-indigo-500 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
                : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
            )}
          >
            {faction}
          </button>
        ))}
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
            if (editingCharacter) {
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
          <h2 className="text-lg font-semibold mb-4 text-white">New Character</h2>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if(!formData.name) return toast.error("Name is required");
              createMutation.mutate(formData);
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Left Col - Data */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Name *</label>
                <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600" placeholder="E.g., Demon Lord" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Faction *</label>
                <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value as Faction})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all">
                  {['Demon','Knight','Mutant','Anomaly'].map(f=><option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">HP (Health Points) *</label>
                <input type="number" required value={formData.hp} onChange={e=>setFormData({...formData, hp: parseInt(e.target.value) || 0})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Passive Skill</label>
                <input value={formData.passiveSkill} onChange={e=>setFormData({...formData, passiveSkill: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" placeholder="Passive effect..." />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Active Skill (1-time)</label>
                <input value={formData.activeSkill} onChange={e=>setFormData({...formData, activeSkill: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" placeholder="Active effect..." />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Special Skill (Bind)</label>
                <input value={formData.specialSkill} onChange={e=>setFormData({...formData, specialSkill: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" placeholder="Constraint / Special..." />
              </div>
            </div>

            {/* Right Col - Image Drop & Submit */}
            <div className="space-y-4 flex flex-col h-full">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 w-full border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 bg-zinc-950/30 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors group relative overflow-hidden"
              >
                {formData.imageUrl ? (
                  <img src={getImageUrl(formData.imageUrl) || ''} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-zinc-800/80 group-hover:bg-indigo-500/20 flex items-center justify-center mb-3 transition-colors">
                      <ImageIcon className="w-6 h-6 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <p className="text-sm font-medium text-zinc-400 group-hover:text-indigo-300">Click to upload Avatar</p>
                    <p className="text-xs text-zinc-600 mt-1">PNG, JPG up to 50MB</p>
                  </>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50">
                  {createMutation.isPending ? 'Saving...' : 'Save Character'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-[2rem] bg-zinc-900/50 border border-zinc-800 animate-pulse" />
          ))
        ) : characters?.filter(c => (filterFaction === 'All' || c.type === filterFaction) && c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
          <div className="col-span-full py-20 text-center bg-zinc-900/20 rounded-[2rem] border border-dashed border-zinc-800">
            <ImageIcon className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium whitespace-pre-wrap px-4">
              {searchQuery 
                ? `No roster items matching "${searchQuery}" found`
                : `No ${filterFaction !== 'All' ? filterFaction.toLowerCase() : ''} characters found in the roster`}
            </p>
            {filterFaction === 'All' && !searchQuery && (
              <button onClick={() => setIsAdding(true)} className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold underline underline-offset-4 mt-2">Add your first character</button>
            )}
          </div>
        ) : (
          characters?.filter(c => (filterFaction === 'All' || c.type === filterFaction) && c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((char: Character) => (
            <div 
              key={char.id} 
              onClick={() => setSelectedCharacter(char)}
              className="group relative bg-zinc-800/30 border border-zinc-700/40 rounded-2xl overflow-hidden backdrop-blur-md hover:bg-zinc-800/50 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-indigo-500/10"
            >
              <div className="w-full aspect-[4/3] bg-zinc-900/50 flex flex-col items-center justify-center border-b border-zinc-700/40 relative overflow-hidden">
                {char.imageUrl ? (
                  <img src={getImageUrl(char.imageUrl) || ''} alt={char.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-zinc-800 group-hover:text-zinc-600 transition-colors" />
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(char);
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-white/5"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingCharId(char.id);
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md text-red-500 hover:bg-red-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-white/5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-white text-lg truncate pr-2">{char.name}</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">HP {char.hp}</span>
                     <span className={cn(
                      "text-[10px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-md border text-white",
                      char.type === 'Demon' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      char.type === 'Knight' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      char.type === 'Mutant' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    )}>
                      {char.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Popup Modal */}
      {selectedCharacter && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedCharacter(null)} />
          
          <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <button 
              onClick={() => setSelectedCharacter(null)}
              className="absolute top-6 right-6 z-50 p-3 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-2xl transition-all"
            >
              <Plus className="w-6 h-6 rotate-45" />
            </button>

            {/* Content Left */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[60vh] md:max-h-full scrollbar-hidden">
               <div className="mb-8">
                 <div className="flex items-center gap-3 mb-4">
                    <span className={cn(
                        "inline-block text-xs uppercase tracking-[0.2em] font-black px-3 py-1 rounded-full border",
                        selectedCharacter.type === 'Demon' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                        selectedCharacter.type === 'Knight' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                        selectedCharacter.type === 'Mutant' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        "bg-purple-500/10 text-purple-500 border-purple-500/20"
                      )}>
                        {selectedCharacter.type} FACTION
                    </span>
                    <span className="text-xl font-black text-red-500 bg-red-500/10 px-4 py-1 rounded-full border border-red-500/20">
                      HP: {selectedCharacter.hp}
                    </span>
                 </div>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">{selectedCharacter.name}</h2>
               </div>

               <div className="space-y-8">
                  <div className="group">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Passive Ability</h4>
                    <p className="text-zinc-200 leading-relaxed bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 group-hover:border-zinc-700/50 transition-colors">
                      {selectedCharacter.passiveSkill || "No passive ability documented."}
                    </p>
                  </div>

                  <div className="group">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Active Ability (One-time Use)</h4>
                    <p className="text-zinc-200 leading-relaxed bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 group-hover:border-zinc-700/50 transition-colors">
                      {selectedCharacter.activeSkill || "No active ability documented."}
                    </p>
                  </div>

                  <div className="group">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Special Constraint / Bind</h4>
                    <p className="text-zinc-200 leading-relaxed bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 group-hover:border-zinc-700/50 transition-colors">
                      {selectedCharacter.specialSkill || "No special constraints documented."}
                    </p>
                  </div>
               </div>
            </div>

            {/* Illustration Right */}
            <div className="w-full md:w-[45%] bg-zinc-900 relative min-h-[300px] md:min-h-full border-t md:border-t-0 md:border-l border-zinc-800 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-white/5 opacity-50" />
                {selectedCharacter.imageUrl ? (
                    <img src={getImageUrl(selectedCharacter.imageUrl) || ''} alt={selectedCharacter.name} className="w-full h-full object-cover mix-blend-lighten" />
                ) : (
                    <div className="flex flex-col items-center gap-4">
                         <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-zinc-600" />
                         </div>
                         <span className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No Neural Sample</span>
                    </div>
                )}
                
                {/* Visual Accent */}
                <div className={cn(
                    "absolute bottom-0 right-0 w-32 h-32 blur-[80px] opacity-20",
                    selectedCharacter.type === 'Demon' ? "bg-red-500" :
                    selectedCharacter.type === 'Knight' ? "bg-blue-500" :
                    selectedCharacter.type === 'Mutant' ? "bg-emerald-500" :
                    "bg-purple-500"
                )} />
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {editingCharacter && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEditingCharacter(null)} />
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-xl font-bold text-white mb-6">Edit Character: {editingCharacter.name}</h2>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({ id: editingCharacter.id, ...editFormData });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Name</label>
                    <input required value={editFormData.name} onChange={e=>setEditFormData({...editFormData, name: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Faction</label>
                    <select value={editFormData.type} onChange={e=>setEditFormData({...editFormData, type: e.target.value as Faction})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none">
                      {['Demon','Knight','Mutant','Anomaly'].map(f=><option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">HP (Health Points)</label>
                    <input type="number" required value={editFormData.hp} onChange={e=>setEditFormData({...editFormData, hp: parseInt(e.target.value) || 0})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Passive Skill</label>
                    <input value={editFormData.passiveSkill} onChange={e=>setEditFormData({...editFormData, passiveSkill: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none" />
                  </div>
                </div>

                {/* Right Fields & Image */}
                <div className="space-y-4 flex flex-col">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Active Skill</label>
                    <input value={editFormData.activeSkill} onChange={e=>setEditFormData({...editFormData, activeSkill: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Special Skill</label>
                    <input value={editFormData.specialSkill} onChange={e=>setEditFormData({...editFormData, specialSkill: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none" />
                  </div>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-h-[100px] border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 bg-zinc-950/30 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors group relative overflow-hidden"
                  >
                    {editFormData.imageUrl ? (
                      <img src={getImageUrl(editFormData.imageUrl) || ''} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5 text-zinc-500 group-hover:text-indigo-400 mb-1" />
                        <span className="text-[10px] text-zinc-500">Change Photo</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setEditingCharacter(null)} className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={updateMutation.isPending} className="bg-amber-500 hover:bg-amber-600 text-zinc-950 px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                  {updateMutation.isPending ? 'Updating...' : 'Update Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCharId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeletingCharId(null)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Delete Character?</h2>
            <p className="text-sm text-zinc-400 mb-8 lowercase tracking-tight">This action will permanently remove the character and its associated cloud illustration. This cannot be undone.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  deleteMutation.mutate(deletingCharId);
                  setDeletingCharId(null);
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              >
                Permanently Delete
              </button>
              <button 
                onClick={() => setDeletingCharId(null)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl font-medium transition-all"
              >
                Cancel Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
