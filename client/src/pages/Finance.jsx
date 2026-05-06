import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { api } from '../api';
import { Plus, X, Download, DollarSign, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const STATUS_COLORS = { draft: 'badge-gray', sent: 'badge-blue', paid: 'badge-green', overdue: 'badge-red' };
const fmt = (n) => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

export default function Finance() {
  const { t, isRTL } = useLang();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [sponsors, setSponsors] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: 'invoice', sponsor_id: '', client_name: '', client_email: '', tax_rate: 0.15, due_date: '', notes: '', items: [{ description: '', quantity: 1, unit_price: 0 }] });

  useEffect(() => { loadData(); }, [filter]);
  const loadData = async () => {
    setLoading(true);
    try {
      const [inv, sum, sp] = await Promise.all([api.invoices(filter ? { status: filter } : {}), api.financeSummary(), api.sponsors()]);
      setInvoices(inv); setSummary(sum); setSponsors(sp);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.createInvoice(form); setShowCreate(false); loadData(); setForm({ type: 'invoice', sponsor_id: '', client_name: '', client_email: '', tax_rate: 0.15, due_date: '', notes: '', items: [{ description: '', quantity: 1, unit_price: 0 }] }); }
    catch (err) { console.error(err.message); }
  };

  const updateStatus = async (id, status) => {
    try { await api.updateInvoiceStatus(id, status); loadData(); } catch (err) { console.error(err.message); }
  };

  const downloadPDF = async (inv) => {
    try {
      await api.downloadInvoicePdf(inv.id);
    } catch (err) {
      console.error(err.message);
    }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unit_price: 0 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };
  const calcSubtotal = () => form.items.reduce((s, it) => s + (it.quantity || 0) * (it.unit_price || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  const s = summary?.summary || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('finance')}</h1>
        <div className="flex gap-2">
          <button onClick={() => { setForm({ ...form, type: 'invoice' }); setShowCreate(true); }} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> {t('create_invoice')}</button>
          <button onClick={() => { setForm({ ...form, type: 'quotation' }); setShowCreate(true); }} className="btn-secondary flex items-center gap-2 text-sm"><Plus size={16} /> {t('create_quotation')}</button>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('total_revenue'), value: fmt(s.total_revenue), icon: DollarSign, color: 'from-primary-500 to-primary-700' },
          { label: t('paid'), value: fmt(s.paid), icon: TrendingUp, color: 'from-emerald-500 to-green-600' },
          { label: t('sent'), value: fmt(s.pending), icon: FileText, color: 'from-blue-500 to-blue-700' },
          { label: t('overdue'), value: fmt(s.overdue), icon: AlertCircle, color: 'from-red-500 to-red-700' },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="flex items-start justify-between">
              <div><p className="text-white/40 text-sm">{m.label}</p><p className="text-2xl font-bold mt-1">{m.value}</p></div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center opacity-80`}><m.icon size={18} /></div>
            </div>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${m.color}`} />
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      {summary?.monthly?.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">{t('monthly_revenue')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={summary.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} formatter={v => fmt(v)} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['', 'draft', 'sent', 'paid', 'overdue'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-xl text-sm transition-all ${filter === s ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
            {s ? t(s) : t('all')} {s === '' ? `(${invoices.length})` : ''}
          </button>
        ))}
      </div>

      {/* Invoices table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10 text-white/40">
              <th className="px-4 py-3 text-start">{t('invoice_number')}</th>
              <th className="px-4 py-3 text-start">{t('client_name')}</th>
              <th className="px-4 py-3 text-start">{t('type')}</th>
              <th className="px-4 py-3 text-start">{t('status')}</th>
              <th className="px-4 py-3 text-end">{t('total')}</th>
              <th className="px-4 py-3 text-start">{t('due_date')}</th>
              <th className="px-4 py-3 text-end">{t('actions')}</th>
            </tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="table-row">
                  <td className="px-4 py-3 font-mono text-primary-400">{inv.invoice_number}</td>
                  <td className="px-4 py-3">{inv.client_name || inv.sponsor_name}</td>
                  <td className="px-4 py-3 capitalize">{inv.type}</td>
                  <td className="px-4 py-3"><span className={`badge ${STATUS_COLORS[inv.status]}`}>{t(inv.status)}</span></td>
                  <td className="px-4 py-3 text-end font-semibold">{fmt(inv.total)}</td>
                  <td className="px-4 py-3 text-white/40">{inv.due_date}</td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => downloadPDF(inv)} className="p-1.5 hover:bg-white/10 rounded-lg" title={t('download_pdf')}><Download size={14} /></button>
                      {inv.status === 'draft' && <button onClick={() => updateStatus(inv.id, 'sent')} className="text-xs btn-secondary py-1 px-2">{t('sent')}</button>}
                      {inv.status === 'sent' && <button onClick={() => updateStatus(inv.id, 'paid')} className="text-xs btn-primary py-1 px-2">{t('paid')}</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-card p-6 w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{form.type === 'quotation' ? t('create_quotation') : t('create_invoice')}</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-white/60 mb-1">{t('sponsor_name')}</label>
                  <select value={form.sponsor_id} onChange={e => { const sp = sponsors.find(s => s.id === e.target.value); setForm({...form, sponsor_id: e.target.value, client_name: sp?.name || '', client_email: sp?.email || ''}); }} className="select-field">
                    <option value="">—</option>{sponsors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select></div>
                <div><label className="block text-sm text-white/60 mb-1">{t('client_name')}</label>
                  <input value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} className="input-field" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-white/60 mb-1">{t('email')}</label>
                  <input type="email" value={form.client_email} onChange={e => setForm({...form, client_email: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-white/60 mb-1">{t('due_date')}</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="input-field" /></div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-white/60">{t('items')}</label>
                  <button type="button" onClick={addItem} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"><Plus size={12} /> {t('add_item')}</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5"><input placeholder={t('description')} value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="input-field text-sm" required /></div>
                      <div className="col-span-2"><input type="number" placeholder={t('quantity')} value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value)||0)} className="input-field text-sm" min="1" /></div>
                      <div className="col-span-3"><input type="number" placeholder={t('unit_price')} value={item.unit_price} onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value)||0)} className="input-field text-sm" min="0" step="0.01" /></div>
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="text-sm font-mono">{fmt((item.quantity||0) * (item.unit_price||0))}</span>
                        {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-300"><X size={14} /></button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/40">{t('subtotal')}</span><span>{fmt(calcSubtotal())}</span></div>
                <div className="flex justify-between"><span className="text-white/40">{t('tax')}</span><span>{fmt(calcSubtotal() * form.tax_rate)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t border-white/10 pt-2"><span>{t('total')}</span><span className="text-primary-400">{fmt(calcSubtotal() * (1 + form.tax_rate))}</span></div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{t('create_invoice')}</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
