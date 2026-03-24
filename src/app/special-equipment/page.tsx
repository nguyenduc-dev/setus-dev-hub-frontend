'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Image as ImageIcon, Trash2, Pencil, AlertTriangle, Search, ShieldQuestion, Sparkles, Layers } from 'lucide-react';
import Loader from '@/components/Loader';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SpecialEquipment {
  id: string;
  name: string;
  effect: string | null;
  imageUrl: string | null;
}

export default function SpecialEquipmentPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '', effect: '', imageUrl: ''
  });

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
  };

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['special-equipment'],
    queryFn: async () => {
      const res = await api.get('/special-equipment');
      return res.data.data as SpecialEquipment[];
    }
  });

  const createMutation = useMutation({
    mutationFn: (newEquip: Omit<SpecialEquipment, 'id'>) => api.post('/special-equipment', newEquip),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special-equipment'] });
      setIsAdding(false);
      setFormData({ name: '', effect: '', imageUrl: '' });
      toast.success('Special Equipment added');
    },
    onError: () => toast.error('Failed to create Special Equipment')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/special-equipment/${id}`),
    onSuccess: () => {
      toast.success('Equipment deleted');
      queryClient.invalidateQueries({ queryKey: ['special-equipment'] });
    }
  });

  const [editingEquip, setEditingEquip] = useState<SpecialEquipment | null>(null);
  const [deletingEquipId, setDeletingEquipId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '', effect: '', imageUrl: ''
  });

  const updateMutation = useMutation({
    mutationFn: (updated: { id: string } & Partial<SpecialEquipment>) => api.patch(`/special-equipment/${updated.id}`, updated),
    onSuccess: () => {
      toast.success('Equipment updated');
      setEditingEquip(null);
      queryClient.invalidateQueries({ queryKey: ['special-equipment'] });
    }
  });

  const openEdit = (equip: SpecialEquipment) => {
    setEditingEquip(equip);
    setEditFormData({
      name: equip.name,
      effect: equip.effect || '',
      imageUrl: equip.imageUrl || ''
    });
  };

  const [selectedEquip, setSelectedEquip] = useState<SpecialEquipment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Special Equipment</h1>
          <p className="text-sm text-zinc-400">Library of rare and unique gear items.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          <Plus className="w-4 h-4" /> Add Card
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-zinc-500" />
        </div>
        <input 
          type="text"
          placeholder="Search items by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600"
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
            toast.loading('Uploading...');
            const res = await api.post('/upload', imageFormData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            const url = res.data.data.url;
            if (editingEquip) setEditFormData(prev => ({ ...prev, imageUrl: url }));
            else setFormData(prev => ({ ...prev, imageUrl: url }));
            toast.dismiss();
            toast.success('Uploaded');
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
          <h2 className="text-lg font-semibold mb-4 text-white">New Library Card</h2>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if(!formData.name) return toast.error("Name is required");
              createMutation.mutate(formData);
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Card Name *</label>
                <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600" placeholder="E.g., Aegis Shield" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Effect Description</label>
                <textarea rows={3} value={formData.effect} onChange={e=>setFormData({...formData, effect: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none" placeholder="Item effect details..." />
              </div>
            </div>

            <div className="space-y-4 flex flex-col h-full border-l border-zinc-800/50 pl-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 w-full border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 bg-zinc-950/30 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors group relative overflow-hidden"
              >
                {formData.imageUrl ? (
                  <img src={getImageUrl(formData.imageUrl) || ''} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-zinc-600 group-hover:text-emerald-400 mb-2" />
                    <p className="text-xs font-medium text-zinc-500">Pick Card Illustration</p>
                    <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider text-center">PNG, JPG up to 50MB</p>
                  </>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50">
                   Save Card
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative min-h-[400px]">
        {isLoading ? (
          <Loader fullScreen={false} className="absolute inset-0 z-50 bg-zinc-950/20" />
        ) : equipment?.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
          <div className="col-span-full py-20 text-center bg-zinc-900/20 rounded-[2rem] border border-dashed border-zinc-800 text-zinc-500">
            No items found in the archives.
          </div>
        ) : (
          equipment?.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item: SpecialEquipment) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedEquip(item)}
              className="group relative bg-zinc-800/30 border border-zinc-700/40 rounded-2xl overflow-hidden backdrop-blur-md hover:bg-zinc-800/50 hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="w-full aspect-[3/4] bg-zinc-900/50 flex flex-col items-center justify-center border-b border-zinc-700/40 relative overflow-hidden">
                {item.imageUrl ? (
                  <img src={getImageUrl(item.imageUrl) || ''} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <Layers className="w-12 h-12 text-zinc-800 group-hover:text-zinc-600 transition-colors" />
                )}
                
                <div className="absolute top-3 left-3 flex gap-2">
                  <button onClick={(e) => {e.stopPropagation(); openEdit(item);}} className="p-2 bg-black/60 backdrop-blur-md text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-white/5"><Pencil className="w-4 h-4" /></button>
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <button onClick={(e) => {e.stopPropagation(); setDeletingEquipId(item.id);}} className="p-2 bg-black/60 backdrop-blur-md text-red-500 hover:bg-red-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-white/5"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-5 text-center sm:text-left">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-white text-lg truncate pr-2">{item.name}</h3>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-md border text-white bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    SPECIAL
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedEquip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEquip(null)} />
          <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <button onClick={() => setSelectedEquip(null)} className="absolute top-6 right-6 z-50 p-3 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-2xl transition-all"><Plus className="w-6 h-6 rotate-45" /></button>
            <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[60vh] md:max-h-full scrollbar-hidden">
               <div className="mb-8 text-center sm:text-left">
                  <span className="inline-block text-xs uppercase tracking-[0.2em] font-black px-3 py-1 rounded-full mb-4 border text-white bg-emerald-500 balance-border border-emerald-500/50">SPECIAL GRADE</span>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">{selectedEquip.name}</h2>
               </div>
               <div className="space-y-8">
                  <div className="group">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Item Effect</h4>
                    <p className="text-zinc-200 text-lg leading-relaxed bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50 group-hover:border-zinc-700/50 transition-colors italic">
                      "{selectedEquip.effect || "No effect documented."}"
                    </p>
                  </div>
               </div>
            </div>
            <div className="w-full md:w-[45%] bg-zinc-900 relative min-h-[300px] md:min-h-full border-t md:border-t-0 md:border-l border-zinc-800 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-white/5 opacity-50" />
                {selectedEquip.imageUrl ? <img src={getImageUrl(selectedEquip.imageUrl) || ''} className="w-full h-full object-cover" /> : <div className="text-zinc-800 text-center"><Layers className="w-20 h-20 mb-2 mx-auto" /><span className="text-[10px] font-bold uppercase tracking-widest">No Item Illustration</span></div>}
                <div className="absolute bottom-0 right-0 w-32 h-32 blur-[80px] opacity-20 bg-emerald-500" />
            </div>
          </div>
        </div>
      )}

      {editingEquip && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEditingEquip(null)} />
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Edit Equipment</h2>
            <form onSubmit={(e) => {e.preventDefault(); updateMutation.mutate({ id: editingEquip.id, ...editFormData });}} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div><label className="text-xs uppercase text-zinc-500 mb-1.5 block">Item Name</label><input required value={editFormData.name} onChange={e=>setEditFormData({...editFormData, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" /></div>
                  <div onClick={() => fileInputRef.current?.click()} className="flex-1 min-h-[140px] border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 bg-zinc-950/30 rounded-xl flex items-center justify-center cursor-pointer transition-all overflow-hidden relative">
                    {editFormData.imageUrl ? <img src={getImageUrl(editFormData.imageUrl) || ''} className="w-full h-full object-cover" /> : <span className="text-xs text-zinc-500">Pick New Art</span>}
                  </div>
                </div>
                <div className="space-y-4 flex flex-col">
                  <div><label className="text-xs uppercase text-zinc-500 mb-1.5 block">Effect</label><textarea rows={8} value={editFormData.effect} onChange={e=>setEditFormData({...editFormData, effect: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm resize-none text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" /></div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setEditingEquip(null)} className="px-4 py-2 text-sm text-zinc-400">Cancel</button>
                <button type="submit" disabled={updateMutation.isPending} className="bg-emerald-500 px-6 py-2 rounded-lg text-sm font-bold text-zinc-950">{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingEquipId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setDeletingEquipId(null)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Discard Item?</h2>
            <p className="text-sm text-zinc-400 mb-6 lowercase">Permanent removal from the library.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => {deleteMutation.mutate(deletingEquipId); setDeletingEquipId(null);}} className="w-full py-3 bg-red-500 rounded-xl text-white font-bold">Discard Permanently</button>
              <button onClick={() => setDeletingEquipId(null)} className="w-full py-3 bg-zinc-800 rounded-xl text-zinc-400">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
