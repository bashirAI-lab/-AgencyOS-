import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { api } from '../api';
import { Plus, X, Search, Phone, Mail, Globe, DollarSign, FileText, Calendar, Edit } from 'lucide-react';

const STATUS_COLORS = { lead: 'badge-purple', negotiating: 'badge-yellow', active: 'badge-green', completed: 'badge-gray' };
const fmt = (n) => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

export default function Sponsors() {
  const { t, isRTL } = useLang();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  
  const [form, setForm] = useState({ name: '', name_ar: '', contact_person: '', email: '', phone: '', website: '', status: 'lead', notes: '', deal_value: 0 });
  const [interactionForm, setInteractionForm] = useState({ type: 'meeting', subject: '', notes: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => { loadData(); }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try { setSponsors(await api.sponsors(filter ? { status: filter } : {})); }
    catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSelect = async (id) => {
    try {
      const data = await api.sponsor(id);
      setSelected(data);
    } catch (err) { console.error(err.message); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (showEdit) {
        await api.updateSponsor(selected.id, form);
        handleSelect(selected.id);
      } else {
        await api.createSponsor(form);
      }
      setShowCreate(false);
      setShowEdit(false);
      setForm({ name: '', name_ar: '', contact_person: '', email: '', phone: '', website: '', status: 'lead', notes: '', deal_value: 0 });
      loadData();
    } catch (err) { console.error(err.message); }
  };

  const handleInteraction = async (e) => {
    e.preventDefault();
    try {
      await api.addInteraction(selected.id, interactionForm);
      setShowAddInteraction(false);
      setInteractionForm({ type: 'meeting', subject: '', notes: '', date: new Date().toISOString().split('T')[0] });
      handleSelect(selected.id); // Reload selected details
    } catch (err) { console.error(err.message); }
  };

  const updateStatus = async (id, status) => {
    try {
      const s = sponsors.find(x => x.id === id);
      await api.updateSponsor(id, { ...s, status });
      loadData();
      if (selected?.id === id) handleSelect(id);
    } catch (err) { console.error(err.message); }
  };

  const filtered = sponsors.filter(s => (s.name?.toLowerCase() || '').includes(search.toLowerCase()) || (s.contact_person?.toLowerCase() || '').includes(search.toLowerCase()));

  if (loading && sponsors.length === 0) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <h1 className="text-2xl font-bold">{t('sponsor_crm')}</h1>
        <button onClick={() => { setShowEdit(false); setForm({ name: '', name_ar: '', contact_person: '', email: '', phone: '', website: '', status: 'lead', notes: '', deal_value: 0 }); setShowCreate(true); }} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> {t('add_sponsor')}</button>
      </div>

      <div className="flex gap-6 h-full overflow-hidden">
        {/* Left Side: List Table */}
        <div className={`glass-card flex flex-col flex-1 ${selected ? 'hidden lg:flex lg:w-1/2' : 'w-full'}`}>
          <div className="p-4 border-b border-white/10 space-y-3 shrink-0">
            <div className="relative">
              <Search className={`absolute top-2.5 ${isRTL ? 'right-3' : 'left-3'} text-white/40`} size={16} />
              <input type="text" placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} className={`input-field w-full ${isRTL ? 'pr-9' : 'pl-9'}`} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {['', 'lead', 'negotiating', 'active', 'completed'].map(s => (
                <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${filter === s ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                  {s ? t(s) : t('all')}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#0f172a] shadow-md z-10">
                <tr className="border-b border-white/10 text-white/40 text-left">
                  <th className="px-4 py-3">{t('name')}</th>
                  <th className="px-4 py-3">{t('contact_person')}</th>
                  <th className="px-4 py-3">{t('status')}</th>
                  <th className="px-4 py-3 text-right">{t('deal_value')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} onClick={() => handleSelect(s.id)} className={`border-b border-white/5 cursor-pointer transition-colors ${selected?.id === s.id ? 'bg-primary-500/10' : 'hover:bg-white/5'}`}>
                    <td className="px-4 py-3 font-medium">{isRTL ? s.name_ar || s.name : s.name}</td>
                    <td className="px-4 py-3 text-white/60">{s.contact_person}</td>
                    <td className="px-4 py-3"><span className={`badge ${STATUS_COLORS[s.status]}`}>{t(s.status)}</span></td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(s.deal_value)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-white/40">{t('no_sponsors_found')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Detail Panel */}
        {selected && (
          <div className="glass-card flex flex-col flex-1 w-full lg:w-1/2 overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-white/10 flex items-start justify-between shrink-0 bg-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{isRTL ? selected.name_ar || selected.name : selected.name}</h2>
                  <button onClick={() => { setForm(selected); setShowEdit(true); setShowCreate(true); }} className="p-1.5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-colors"><Edit size={16} /></button>
                </div>
                <p className="text-sm text-white/60 mt-1">{selected.contact_person}</p>
                <div className="flex gap-2 mt-3">
                  {['lead', 'negotiating', 'active', 'completed'].map(st => (
                    <button key={st} onClick={() => updateStatus(selected.id, st)} className={`text-xs px-2 py-1 rounded-md border transition-colors ${selected.status === st ? 'border-primary-500 text-primary-400 bg-primary-500/10' : 'border-white/10 text-white/40 hover:bg-white/10'}`}>
                      {t(st)}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-white/10 rounded-lg"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2"><Phone size={14} className="text-white/40" /> <span>{selected.phone || '—'}</span></div>
                <div className="flex items-center gap-2"><Mail size={14} className="text-white/40" /> <span className="truncate">{selected.email || '—'}</span></div>
                <div className="flex items-center gap-2 col-span-2"><Globe size={14} className="text-white/40" /> <span>{selected.website || '—'}</span></div>
              </div>

              {selected.financial && (
                <div>
                  <h3 className="font-semibold text-sm mb-3">{t('revenue_summary')}</h3>
                  <div className="bg-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/50">{t('deal_value')}</span>
                      <span className="font-bold text-primary-400">{fmt(selected.deal_value)}</span>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div><p className="text-xs text-white/40 mb-1">{t('invoiced')}</p><p className="font-bold text-blue-400">{fmt(selected.financial.invoiced)}</p></div>
                      <div><p className="text-xs text-white/40 mb-1">{t('paid')}</p><p className="font-bold text-emerald-400">{fmt(selected.financial.paid)}</p></div>
                      <div><p className="text-xs text-white/40 mb-1">{t('outstanding')}</p><p className="font-bold text-red-400">{fmt(selected.financial.outstanding)}</p></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{t('interactions')}</h3>
                  <button onClick={() => setShowAddInteraction(true)} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"><Plus size={12}/> {t('add')}</button>
                </div>
                <div className="space-y-3">
                  {selected.interactions?.length === 0 ? <p className="text-sm text-white/30 text-center py-2">No interactions logged</p> : null}
                  {selected.interactions?.map(i => (
                    <div key={i.id} className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-primary-400 capitalize flex items-center gap-1">
                          {i.type === 'meeting' ? <Calendar size={12}/> : i.type === 'call' ? <Phone size={12}/> : <Mail size={12}/>}
                          {i.type}
                        </span>
                        <span className="text-xs text-white/40">{i.date?.slice(0, 10)}</span>
                      </div>
                      <p className="font-medium text-sm mt-1">{i.subject}</p>
                      {i.notes && <p className="text-xs text-white/60 mt-1">{i.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Sponsor Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-card p-6 w-full max-w-lg animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{showEdit ? t('edit') : t('add_sponsor')}</h3>
              <button onClick={() => { setShowCreate(false); setShowEdit(false); }} className="p-1 hover:bg-white/10 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-white/60 mb-1">{t('name')} (EN)</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required /></div>
                <div><label className="block text-sm text-white/60 mb-1">{t('name')} (AR)</label><input value={form.name_ar} onChange={e => setForm({...form, name_ar: e.target.value})} className="input-field" dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-white/60 mb-1">{t('contact_person')}</label><input value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-white/60 mb-1">{t('deal_value')}</label><input type="number" value={form.deal_value} onChange={e => setForm({...form, deal_value: parseFloat(e.target.value)||0})} className="input-field" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-white/60 mb-1">{t('email')}</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-white/60 mb-1">{t('phone')}</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" /></div>
              </div>
              <div><label className="block text-sm text-white/60 mb-1">{t('notes')}</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-field" rows={2} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{showEdit ? t('save') : t('submit')}</button>
                <button type="button" onClick={() => { setShowCreate(false); setShowEdit(false); }} className="btn-secondary flex-1">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Interaction Modal */}
      {showAddInteraction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAddInteraction(false)}>
          <div className="glass-card p-6 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{t('log_interaction')}</h3>
            <form onSubmit={handleInteraction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/60 mb-1">{t('type')}</label>
                  <select value={interactionForm.type} onChange={e => setInteractionForm({...interactionForm, type: e.target.value})} className="select-field">
                    <option value="meeting">Meeting</option><option value="call">Call</option><option value="email">Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">{t('date')}</label>
                  <input type="date" value={interactionForm.date} onChange={e => setInteractionForm({...interactionForm, date: e.target.value})} className="input-field" required />
                </div>
              </div>
              <div><label className="block text-sm text-white/60 mb-1">{t('subject')}</label><input value={interactionForm.subject} onChange={e => setInteractionForm({...interactionForm, subject: e.target.value})} className="input-field" required /></div>
              <div><label className="block text-sm text-white/60 mb-1">{t('notes')}</label><textarea value={interactionForm.notes} onChange={e => setInteractionForm({...interactionForm, notes: e.target.value})} className="input-field" rows={3} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{t('submit')}</button>
                <button type="button" onClick={() => setShowAddInteraction(false)} className="btn-secondary flex-1">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
