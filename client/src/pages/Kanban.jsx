import { useState, useEffect, useRef } from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Plus, ThumbsUp, ThumbsDown, CheckCircle, GripVertical, X } from 'lucide-react';

const STAGES = ['ideation', 'script_writing', 'production_prep', 'shooting', 'review'];
const STAGE_COLORS = { ideation: 'from-violet-500/20 to-purple-500/20', script_writing: 'from-blue-500/20 to-cyan-500/20', production_prep: 'from-amber-500/20 to-yellow-500/20', shooting: 'from-emerald-500/20 to-green-500/20', review: 'from-rose-500/20 to-pink-500/20' };
const STAGE_BORDERS = { ideation: 'border-violet-500/30', script_writing: 'border-blue-500/30', production_prep: 'border-amber-500/30', shooting: 'border-emerald-500/30', review: 'border-rose-500/30' };
const PRIORITY_COLORS = { high: 'badge-red', medium: 'badge-yellow', low: 'badge-green' };

export default function Kanban() {
  const { t, isRTL } = useLang();
  const { user, hasRole } = useAuth();
  const [cards, setCards] = useState([]);
  const [creators, setCreators] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', title_ar: '', description: '', description_ar: '', stage: 'ideation', priority: 'medium', creator_id: '', assigned_to: '', shooting_date: '' });
  const dragItem = useRef(null);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    setLoading(true);
    try {
      const [c, cr, u] = await Promise.all([api.kanbanCards(), api.creators(), api.users()]);
      setCards(c); setCreators(cr); setUsers(u);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.createCard(form); setShowCreate(false); setForm({ title: '', title_ar: '', description: '', description_ar: '', stage: 'ideation', priority: 'medium', creator_id: '', assigned_to: '', shooting_date: '' }); loadData(); }
    catch (err) { console.error(err.message); }
  };

  const handleDragStart = (e, card) => { dragItem.current = card; e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = async (e, stage) => {
    e.preventDefault();
    if (dragItem.current && dragItem.current.stage !== stage) {
      try {
        await api.updateCardStage(dragItem.current.id, { stage, position: 0 });
        loadData();
      } catch (err) { console.error(err.message); }
    }
    dragItem.current = null;
  };

  const handleVote = async (cardId, vote) => {
    try {
      const updatedVotes = await api.voteCard(cardId, vote);
      // Update local state instantly without full reload
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, votes: updatedVotes } : c));
    } catch (err) { console.error(err.message); }
  };
  const handleApprove = async (cardId) => { try { await api.approveCard(cardId); loadData(); } catch (err) { console.error(err.message); } };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('kanban')}</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> {t('create_card')}
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
        {STAGES.map(stage => {
          const stageCards = cards.filter(c => c.stage === stage);
          return (
            <div key={stage} className={`flex-shrink-0 w-72 lg:w-80 kanban-column bg-gradient-to-b ${STAGE_COLORS[stage]} border ${STAGE_BORDERS[stage]}`}
              onDragOver={handleDragOver} onDrop={e => handleDrop(e, stage)}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{t(stage)}</h3>
                <span className="badge badge-gray text-xs">{stageCards.length}</span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto">
                {stageCards.map(card => (
                  <div key={card.id} className="kanban-card" draggable onDragStart={e => handleDragStart(e, card)}>
                    <div className="flex items-start gap-2 mb-2">
                      <GripVertical size={14} className="text-white/20 mt-0.5 flex-shrink-0 cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{isRTL ? card.title_ar || card.title : card.title}</p>
                        <p className="text-xs text-white/40 mt-0.5 truncate">{isRTL ? card.description_ar || card.description : card.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`badge text-[10px] ${PRIORITY_COLORS[card.priority]}`}>{t(card.priority)}</span>
                      {card.pm_approved ? <span className="badge badge-green text-[10px]">✓ {t('approve')}</span> : null}
                      {card.assigned_name && <span className="text-[10px] text-white/40">{isRTL ? card.assigned_name_ar : card.assigned_name}</span>}
                    </div>
                    {/* Voting */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button onClick={() => handleVote(card.id, 1)} className="flex items-center gap-1 text-xs text-white/40 hover:text-emerald-400 transition-colors">
                        <ThumbsUp size={13} /> {card.votes?.filter(v => v.vote === 1).length || 0}
                      </button>
                      <button onClick={() => handleVote(card.id, -1)} className="flex items-center gap-1 text-xs text-white/40 hover:text-red-400 transition-colors">
                        <ThumbsDown size={13} /> {card.votes?.filter(v => v.vote === -1).length || 0}
                      </button>
                      {hasRole('project_manager') && !card.pm_approved && (
                        <button onClick={() => handleApprove(card.id)} className="ml-auto flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300">
                          <CheckCircle size={13} /> {t('approve')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Card Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-card p-6 w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('create_card')}</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-white/60 mb-1">{t('title')} (EN)</label>
                  <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" required /></div>
                <div><label className="block text-sm text-white/60 mb-1">{t('title')} (AR)</label>
                  <input value={form.title_ar} onChange={e => setForm({...form, title_ar: e.target.value})} className="input-field" dir="rtl" /></div>
              </div>
              <div><label className="block text-sm text-white/60 mb-1">{t('description')}</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-white/60 mb-1">{t('priority')}</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="select-field">
                    <option value="high">{t('high')}</option><option value="medium">{t('medium')}</option><option value="low">{t('low')}</option>
                  </select></div>
                <div><label className="block text-sm text-white/60 mb-1">{t('shooting_date')}</label>
                  <input type="date" value={form.shooting_date} onChange={e => setForm({...form, shooting_date: e.target.value})} className="input-field" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-white/60 mb-1">{t('creator')}</label>
                  <select value={form.creator_id} onChange={e => setForm({...form, creator_id: e.target.value})} className="select-field">
                    <option value="">—</option>
                    {creators.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
                  </select></div>
                <div><label className="block text-sm text-white/60 mb-1">{t('assigned_to')}</label>
                  <select value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})} className="select-field">
                    <option value="">—</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{t('create_card')}</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
