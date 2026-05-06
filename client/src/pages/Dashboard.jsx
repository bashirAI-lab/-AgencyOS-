import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { api } from '../api';
import { Eye, Heart, MessageCircle, Share2, Users, TrendingUp, Download, FileSpreadsheet, Plus } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'];
const platformColors = { tiktok: '#000000', instagram: '#E4405F', x: '#1DA1F2', snapchat: '#FFFC00', youtube: '#FF0000' };
const platformIcons = { tiktok: '♪', instagram: '📷', x: '𝕏', snapchat: '👻', youtube: '▶' };

function formatNum(n) {
  if (!n) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

export default function Dashboard() {
  const { t, isRTL } = useLang();
  const [summary, setSummary] = useState(null);
  const [creators, setCreators] = useState([]);
  const [tags, setTags] = useState([]);
  const [period, setPeriod] = useState('30d');
  const [platformFilter, setPlatformFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ creator_id: '', platform: 'snapchat', date: new Date().toISOString().split('T')[0], views: 0, likes: 0, comments: 0, shares: 0, followers: 0 });

  useEffect(() => {
    loadData();
  }, [period, platformFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, c, tg] = await Promise.all([
        api.analyticsSummary(period, platformFilter),
        api.creators(),
        api.tags()
      ]);
      setSummary(s);
      setCreators(c);
      setTags(tg);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.manualEntry(manualForm);
      setShowManual(false);
      loadData();
    } catch (err) { console.error(err.message); }
  };

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241);
    doc.text('AgencyOS Analytics Report', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Period: ${period}`, 14, 30);
    doc.setDrawColor(99, 102, 241);
    doc.line(14, 33, 196, 33);

    if (summary?.summary) {
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Summary', 14, 42);
      doc.autoTable({
        startY: 46,
        head: [['Metric', 'Value']],
        body: [
          ['Total Views', formatNum(summary.summary.total_views)],
          ['Total Likes', formatNum(summary.summary.total_likes)],
          ['Total Comments', formatNum(summary.summary.total_comments)],
          ['Avg Engagement', (summary.summary.avg_engagement || 0).toFixed(2) + '%'],
          ['Active Creators', summary.summary.active_creators],
        ],
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
      });
    }

    if (summary?.topCreators?.length) {
      doc.text('Top Creators', 14, doc.lastAutoTable.finalY + 12);
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 16,
        head: [['Creator', 'Platform', 'Views', 'Engagement']],
        body: summary.topCreators.map(c => [c.display_name, c.platform, formatNum(c.total_views), (c.avg_engagement || 0).toFixed(2) + '%']),
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
      });
    }
    doc.save('AgencyOS_Analytics_Report.pdf');
  };

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    if (summary?.viewsOverTime) {
      const ws = XLSX.utils.json_to_sheet(summary.viewsOverTime);
      XLSX.utils.book_append_sheet(wb, ws, 'Views Over Time');
    }
    if (summary?.platformBreakdown) {
      const ws2 = XLSX.utils.json_to_sheet(summary.platformBreakdown);
      XLSX.utils.book_append_sheet(wb, ws2, 'Platform Breakdown');
    }
    if (summary?.topCreators) {
      const ws3 = XLSX.utils.json_to_sheet(summary.topCreators);
      XLSX.utils.book_append_sheet(wb, ws3, 'Top Creators');
    }
    XLSX.writeFile(wb, 'AgencyOS_Analytics.xlsx');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const s = summary?.summary || {};
  const totalDonutViews = (summary?.platformBreakdown || []).reduce((acc, curr) => acc + curr.views, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('analytics')}</h1>
          <p className="text-white/40 text-sm mt-1">{t('active_creators')}: {s.active_creators || 0}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="select-field w-auto text-sm" id="period-filter">
            <option value="7d">{t('last_7_days')}</option>
            <option value="30d">{t('last_30_days')}</option>
            <option value="90d">{t('last_90_days')}</option>
          </select>
          <button onClick={() => setShowManual(true)} className="btn-secondary text-sm flex items-center gap-2">
            <Plus size={16} /> {t('manual_entry')}
          </button>
          <button onClick={exportPDF} className="btn-secondary text-sm flex items-center gap-2">
            <Download size={16} /> {t('export_pdf')}
          </button>
          <button onClick={exportExcel} className="btn-secondary text-sm flex items-center gap-2">
            <FileSpreadsheet size={16} /> {t('export_excel')}
          </button>
        </div>
      </div>
      
      {/* Platform Filter Tags */}
      <div className="flex flex-wrap gap-2">
        {['', 'tiktok', 'instagram', 'x', 'snapchat', 'youtube'].map(p => (
          <button key={p} onClick={() => setPlatformFilter(p)} 
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              platformFilter === p 
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}>
            {p === '' ? t('all') : <span className="capitalize">{platformIcons[p]} {p}</span>}
          </button>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('total_views'), value: formatNum(s.total_views), icon: Eye, color: 'from-blue-500 to-cyan-500' },
          { label: t('total_likes'), value: formatNum(s.total_likes), icon: Heart, color: 'from-pink-500 to-rose-500' },
          { label: t('total_comments'), value: formatNum(s.total_comments), icon: MessageCircle, color: 'from-purple-500 to-violet-500' },
          { label: t('engagement_rate'), value: (s.avg_engagement || 0).toFixed(2) + '%', icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
        ].map((m, i) => (
          <div key={i} className="metric-card animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/40 text-sm">{m.label}</p>
                <p className="text-3xl font-bold mt-2">{m.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center opacity-80`}>
                <m.icon size={22} />
              </div>
            </div>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${m.color}`} />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Views over time - Line chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">{t('views_over_time')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={summary?.viewsOverTime || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} tickFormatter={formatNum} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Platform breakdown - Donut */}
        <div className="glass-card p-6 flex flex-col min-h-[420px]">
          <h3 className="text-lg font-semibold mb-4">{t('platform_breakdown')}</h3>
          <div className="flex-1 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={summary?.platformBreakdown || []} dataKey="views" nameKey="platform" cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={3}>
                  {(summary?.platformBreakdown || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {(summary?.platformBreakdown || []).map((p, i) => (
                <div key={p.platform} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="capitalize text-white/60">{p.platform}</span>
                  </div>
                  <span className="font-semibold">{totalDonutViews > 0 ? ((p.views / totalDonutViews) * 100).toFixed(1) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Platform bar chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">{t('platform_breakdown')} - {t('views')}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={summary?.platformBreakdown || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="platform" stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" tickFormatter={formatNum} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
            <Bar dataKey="views" fill="#6366f1" radius={[8, 8, 0, 0]} />
            <Bar dataKey="likes" fill="#ec4899" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Creator cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('top_creators')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(summary?.topCreators || []).map((c, i) => (
            <div key={c.id} className="glass-card-hover p-5 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-lg font-bold">
                  {c.is_agency_account ? 'A' : c.display_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-sm">{isRTL ? c.display_name_ar : c.display_name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <span>{platformIcons[c.platform] || '🌐'}</span>
                    <span className="capitalize">{c.platform}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-white/40">{t('views')}</p>
                  <p className="font-semibold text-sm">{formatNum(c.total_views)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-white/40">Eng%</p>
                  <p className="font-semibold text-sm">{(c.avg_engagement || 0).toFixed(1)}%</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-white/40">Eng%</p>
                  <p className="font-semibold text-sm">{(c.avg_engagement || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManual && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowManual(false)}>
          <div className="glass-card p-6 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{t('snapchat_entry')}</h3>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">{t('creator')}</label>
                <select value={manualForm.creator_id} onChange={e => setManualForm({...manualForm, creator_id: e.target.value})} className="select-field" required>
                  <option value="">{t('all_creators')}</option>
                  {creators.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">{t('date')}</label>
                <input type="date" value={manualForm.date} onChange={e => setManualForm({...manualForm, date: e.target.value})} className="input-field" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['views','likes','comments','shares','followers'].map(f => (
                  <div key={f}>
                    <label className="block text-sm text-white/60 mb-1">{t(f)}</label>
                    <input type="number" value={manualForm[f]} onChange={e => setManualForm({...manualForm, [f]: parseInt(e.target.value)||0})} className="input-field" min="0" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{t('submit')}</button>
                <button type="button" onClick={() => setShowManual(false)} className="btn-secondary flex-1">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
