import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Plus, X, CheckCircle, Clock, AlertCircle, User } from 'lucide-react';

const STATUS_COLORS = { pending: 'badge-yellow', in_progress: 'badge-blue', completed: 'badge-green' };
const STATUS_ICONS = { pending: Clock, in_progress: AlertCircle, completed: CheckCircle };
const ROLE_LABELS = { scriptwriter: 'scriptwriter', camera_operator: 'camera_operator', set_manager: 'set_manager', editor: 'editor', sound_engineer: 'sound_engineer' };

export default function Tasks() {
  const { t, isRTL } = useLang();
  const { user, hasRole } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [cards, setCards] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', title_ar: '', description: '', kanban_card_id: '', assigned_to: '', assigned_role: 'scriptwriter', due_date: '' });

  useEffect(() => { loadData(); }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tk, u, c] = await Promise.all([
        api.tasks(filter ? { status: filter } : {}),
        api.users(),
        api.kanbanCards()
      ]);
      setTasks(tk); setUsers(u); setCards(c);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createTask(form);
      setShowCreate(false);
      setForm({ title: '', title_ar: '', description: '', kanban_card_id: '', assigned_to: '', assigned_role: 'scriptwriter', due_date: '' });
      loadData();
    } catch (err) { console.error(err.message); }
  };

  const updateStatus = async (id, status) => {
    try { await api.updateTaskStatus(id, status); loadData(); }
    catch (err) { console.error(err.message); }
  };

  const statusCounts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('task_management')}</h1>
        {hasRole('project_manager', 'super_admin') && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> {t('assign_task')}
          </button>
        )}
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: '', label: t('all'), count: statusCounts.all, color: 'from-primary-500 to-primary-700', icon: User },
          { key: 'pending', label: t('pending'), count: statusCounts.pending, color: 'from-yellow-500 to-amber-600', icon: Clock },
          { key: 'in_progress', label: t('in_progress'), count: statusCounts.in_progress, color: 'from-blue-500 to-blue-700', icon: AlertCircle },
          { key: 'completed', label: t('completed'), count: statusCounts.completed, color: 'from-emerald-500 to-green-600', icon: CheckCircle },
        ].map((s) => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`metric-card text-start transition-all ${filter === s.key ? 'ring-2 ring-primary-500/50' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/40 text-sm">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.count}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center opacity-80`}>
                <s.icon size={18} />
              </div>
            </div>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${s.color}`} />
          </button>
        ))}
      </div>

      {/* Tasks list */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="px-4 py-3 text-start">{t('title')}</th>
                <th className="px-4 py-3 text-start">{t('role')}</th>
                <th className="px-4 py-3 text-start">{t('assigned_to')}</th>
                <th className="px-4 py-3 text-start">{t('kanban')}</th>
                <th className="px-4 py-3 text-start">{t('status')}</th>
                <th className="px-4 py-3 text-start">{t('due_date')}</th>
                <th className="px-4 py-3 text-end">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, i) => {
                const StatusIcon = STATUS_ICONS[task.status] || Clock;
                return (
                  <tr key={task.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{isRTL ? task.title_ar || task.title : task.title}</p>
                        {task.description && <p className="text-xs text-white/30 mt-0.5 truncate max-w-xs">{task.description}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-purple text-xs capitalize">
                        {t(task.assigned_role) || task.assigned_role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {(isRTL ? task.assigned_name_ar : task.assigned_name)?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm">{isRTL ? task.assigned_name_ar : task.assigned_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white/40">{task.card_title || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_COLORS[task.status]} flex items-center gap-1 w-fit`}>
                        <StatusIcon size={12} />
                        {t(task.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40">{task.due_date || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {task.status === 'pending' && (
                          <button onClick={() => updateStatus(task.id, 'in_progress')}
                            className="text-xs px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors">
                            {t('in_progress')}
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button onClick={() => updateStatus(task.id, 'completed')}
                            className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors">
                            {t('completed')}
                          </button>
                        )}
                        {task.status === 'completed' && (
                          <span className="text-xs text-emerald-400">✓</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {tasks.length === 0 && (
          <div className="text-center py-12 text-white/30">
            <ListTodo size={40} className="mx-auto mb-3 opacity-30" />
            <p>No tasks found</p>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-card p-6 w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('assign_task')}</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/60 mb-1">{t('title')} (EN)</label>
                  <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">{t('title')} (AR)</label>
                  <input value={form.title_ar} onChange={e => setForm({...form, title_ar: e.target.value})} className="input-field" dir="rtl" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">{t('description')}</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/60 mb-1">{t('role')}</label>
                  <select value={form.assigned_role} onChange={e => setForm({...form, assigned_role: e.target.value})} className="select-field">
                    {Object.keys(ROLE_LABELS).map(r => (
                      <option key={r} value={r}>{t(r)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">{t('assigned_to')}</label>
                  <select value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})} className="select-field" required>
                    <option value="">—</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/60 mb-1">{t('kanban')}</label>
                  <select value={form.kanban_card_id} onChange={e => setForm({...form, kanban_card_id: e.target.value})} className="select-field">
                    <option value="">—</option>
                    {cards.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">{t('due_date')}</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="input-field" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{t('assign_task')}</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
