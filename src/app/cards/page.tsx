'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Layers, Trash2, Pencil, Image as ImageIcon, AlertTriangle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

type CardType = 'Equipment' | 'Investigation' | 'Effect' | 'Support';

interface Card {
  id: string;
  name: string;
  type: CardType;
  effect: string | null;
  imageUrl: string | null;
}

export default function CardsPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '', type: 'Equipment' as CardType, effect: '', imageUrl: ''
  });

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
  };

  const { data: cards, isLoading } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const res = await api.get('/cards');
      return res.data.data as Card[];
    }
  });

  const createMutation = useMutation({
    mutationFn: (newCard: Omit<Card, 'id'>) => api.post('/cards', newCard),
    onMutate: async (newCard) => {
      await queryClient.cancelQueries({ queryKey: ['cards'] });
      const previous = queryClient.getQueryData(['cards']);
      queryClient.setQueryData(['cards'], (old: any) => [{...newCard, id: 'temp-'+Date.now()}].concat(old || []));
      setIsAdding(false);
      setFormData({ name: '', type: 'Equipment', effect: '', imageUrl: '' });
      toast.success('Card added');
      return { previous };
    },
    onError: (err, newVar, context) => {
      queryClient.setQueryData(['cards'], context?.previous);
      toast.error('Failed to create card');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cards/${id}`),
    onSuccess: () => {
      toast.success('Card deleted');
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    }
  });

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<CardType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editFormData, setEditFormData] = useState({
    name: '', type: 'Equipment' as CardType, effect: '', imageUrl: ''
  });

  const updateMutation = useMutation({
    mutationFn: (updated: { id: string } & Partial<Card>) => api.patch(`/cards/${updated.id}`, updated),
    onSuccess: () => {
      toast.success('Card updated');
      setEditingCard(null);
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    }
  });

  const openEdit = (card: Card) => {
    setEditingCard(card);
    setEditFormData({
      name: card.name,
      type: card.type,
      effect: card.effect || '',
      imageUrl: card.imageUrl || ''
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Card Library</h1>
          <p className="text-sm text-zinc-400">Manage all playable cards and their effects.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)]"
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
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-zinc-600"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {['All', 'Equipment', 'Investigation', 'Effect', 'Support'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type as any)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border",
              filterType === type
                ? "bg-purple-500 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const imgData = new FormData();
          imgData.append('image', file);
          try {
            toast.loading('Uploading...');
            const res = await api.post('/upload', imgData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const url = res.data.data.url;
            if (editingCard) setEditFormData(prev => ({ ...prev, imageUrl: url }));
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
                <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-zinc-600" placeholder="E.g., Holy Grail" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Card Type *</label>
                <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value as CardType})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all">
                  {['Equipment','Investigation','Effect','Support'].map(f=><option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Effect Description</label>
                <textarea rows={3} value={formData.effect} onChange={e=>setFormData({...formData, effect: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none" placeholder="Card effect details..." />
              </div>
            </div>

            <div className="space-y-4 flex flex-col h-full border-l border-zinc-800/50 pl-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 w-full border-2 border-dashed border-zinc-800 hover:border-purple-500/50 bg-zinc-950/30 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors group relative overflow-hidden"
              >
                {formData.imageUrl ? (
                  <img src={getImageUrl(formData.imageUrl) || ''} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-zinc-600 group-hover:text-purple-400 mb-2" />
                    <p className="text-xs font-medium text-zinc-500">Pick Card Illustration</p>
                    <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider">PNG, JPG up to 50MB</p>
                  </>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-50">
                  {createMutation.isPending ? 'Saving...' : 'Save Card'}
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
            <div key={i} className="aspect-[2/3] rounded-3xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
          ))
        ) : cards?.filter(c => (filterType === 'All' || c.type === filterType) && c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
          <div className="col-span-full py-20 text-center bg-zinc-900/20 rounded-[2rem] border border-dashed border-zinc-800">
            <Layers className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">
              {searchQuery 
                ? `No items matching "${searchQuery}" found`
                : `No ${filterType !== 'All' ? filterType.toLowerCase() : ''} cards found in the archives`}
            </p>
            {filterType === 'All' && !searchQuery && (
              <button onClick={() => setIsAdding(true)} className="text-purple-400 hover:text-purple-300 text-sm font-semibold underline underline-offset-4 mt-2">Add your first card</button>
            )}
          </div>
        ) : (
          cards?.filter(c => (filterType === 'All' || c.type === filterType) && c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((card: Card) => (
            <div
              key={card.id}
              onClick={() => setSelectedCard(card)}
              className="group relative bg-zinc-800/30 border border-zinc-700/40 rounded-2xl overflow-hidden backdrop-blur-md hover:bg-zinc-800/50 hover:border-purple-500/50 transition-all cursor-pointer flex flex-col hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-purple-500/10"
            >
              <div className="w-full aspect-[3/4] bg-zinc-900/50 flex flex-col items-center justify-center border-b border-zinc-700/40 relative overflow-hidden">
                {card.imageUrl ? (
                  <img src={getImageUrl(card.imageUrl) || ''} alt={card.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <Layers className="w-12 h-12 text-zinc-800 group-hover:text-zinc-600 transition-colors" />
                )}

                <div className="absolute top-3 left-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(card);
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
                      setDeletingCardId(card.id);
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md text-red-500 hover:bg-red-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-white/5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-white text-lg truncate pr-2">{card.name}</h3>
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-md border text-white",
                    card.type === 'Equipment' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    card.type === 'Investigation' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    card.type === 'Effect' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  )}>
                    {card.type}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Popup Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedCard(null)} />

          <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-6 right-6 z-50 p-3 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-2xl transition-all"
            >
              <Plus className="w-6 h-6 rotate-45" />
            </button>

            {/* Content Left */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[60vh] md:max-h-full scrollbar-hidden">
               <div className="mb-8">
                 <span className={cn(
                    "inline-block text-xs uppercase tracking-[0.2em] font-black px-3 py-1 rounded-full mb-4 border text-white",
                    selectedCard.type === 'Equipment' ? "bg-amber-500 balance-border border-amber-500/50" :
                    selectedCard.type === 'Investigation' ? "bg-blue-500 balance-border border-blue-500/50" :
                    selectedCard.type === 'Effect' ? "bg-red-500 balance-border border-red-500/50" :
                    "bg-emerald-500 balance-border border-emerald-500/50"
                  )}>
                    {selectedCard.type} CARD
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">{selectedCard.name}</h2>
               </div>

               <div className="space-y-8">
                  <div className="group">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Card Effect</h4>
                    <p className="text-zinc-200 text-lg leading-relaxed bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50 group-hover:border-zinc-700/50 transition-colors">
                      {selectedCard.effect || "No effect description provided."}
                    </p>
                  </div>
               </div>
            </div>

            {/* Illustration Right */}
            <div className="w-full md:w-[45%] bg-zinc-900 relative min-h-[300px] md:min-h-full border-t md:border-t-0 md:border-l border-zinc-800 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-white/5 opacity-50" />
                {selectedCard.imageUrl ? (
                    <img src={getImageUrl(selectedCard.imageUrl) || ''} alt={selectedCard.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center gap-4 text-center p-8">
                         <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center">
                            <Layers className="w-12 h-12 text-zinc-600" />
                         </div>
                         <span className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No Neural Sample</span>
                    </div>
                )}

                {/* Visual Accent */}
                <div className={cn(
                    "absolute bottom-0 right-0 w-32 h-32 blur-[80px] opacity-20",
                    selectedCard.type === 'Equipment' ? "bg-amber-500" :
                    selectedCard.type === 'Investigation' ? "bg-blue-500" :
                    selectedCard.type === 'Effect' ? "bg-red-500" :
                    "bg-emerald-500"
                )} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingCard(null)} />
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-xl font-bold text-white mb-6">Edit Card: {editingCard.name}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({ id: editingCard.id, ...editFormData });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Name</label>
                    <input required value={editFormData.name} onChange={e=>setEditFormData({...editFormData, name: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Type</label>
                    <select value={editFormData.type} onChange={e=>setEditFormData({...editFormData, type: e.target.value as CardType})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all">
                      {['Equipment','Investigation','Effect','Support'].map(f=><option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4 flex flex-col">
                   <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-h-[140px] border-2 border-dashed border-zinc-800 hover:border-purple-500/50 bg-zinc-950/30 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors group relative overflow-hidden"
                  >
                    {editFormData.imageUrl ? (
                      <img src={getImageUrl(editFormData.imageUrl) || ''} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-zinc-600 group-hover:text-purple-400 mb-1" />
                        <span className="text-[10px] text-zinc-500">Update Photo</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Effect</label>
                <textarea rows={3} value={editFormData.effect} onChange={e=>setEditFormData({...editFormData, effect: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none" />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setEditingCard(null)} className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={updateMutation.isPending} className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50 transition-all">
                  {updateMutation.isPending ? 'Updating...' : 'Update Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCardId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeletingCardId(null)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Delete Card?</h2>
            <p className="text-sm text-zinc-400 mb-8 lowercase tracking-tight">This action will permanently remove the card and its associated cloud illustration. This cannot be undone.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  deleteMutation.mutate(deletingCardId);
                  setDeletingCardId(null);
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              >
                Permanently Delete
              </button>
              <button 
                onClick={() => setDeletingCardId(null)}
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
