import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { api } from '../api';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

const TYPE_COLORS = { shoot: 'bg-blue-500', meeting: 'bg-yellow-500', deadline: 'bg-red-500', general: 'bg-primary-500' };

export default function Calendar() {
  const { t, isRTL } = useLang();
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', title_ar: '', description: '', type: 'general', date: '', start_time: '09:00', end_time: '17:00' });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => { loadEvents(); }, [month, year]);

  const loadEvents = async () => {
    setLoading(true);
    try { setEvents(await api.events({ month: month + 1, year })); }
    catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.createEvent(form); setShowCreate(false); loadEvents(); setForm({ title: '', title_ar: '', description: '', type: 'general', date: '', start_time: '09:00', end_time: '17:00' }); }
    catch (err) { console.error(err.message); }
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const monthName = currentDate.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });
  const weekDays = isRTL
    ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const handleDayClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDay({ day, dateStr, events: getEventsForDay(day) });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('calendar')}</h1>
        <button onClick={() => { setShowCreate(true); setForm({ ...form, date: selectedDay?.dateStr || todayStr }); }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> {t('add_event')}
        </button>
      </div>

      {/* Calendar Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold">{monthName}</h2>
            <button onClick={goToday} className="text-xs text-primary-400 hover:text-primary-300 mt-1">{t('today')}</button>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs">
          {[{ type: 'shoot', label: t('shoot'), color: 'bg-blue-500' }, { type: 'meeting', label: t('meeting'), color: 'bg-yellow-500' }, { type: 'deadline', label: t('deadline'), color: 'bg-red-500' }].map(l => (
            <div key={l.type} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              <span className="text-white/60">{l.label}</span>
            </div>
          ))}
        </div>

        {/* Week header */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map(d => (
            <div key={d} className="text-center text-xs text-white/40 font-medium py-2">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = getEventsForDay(day);
            const isToday = dateStr === todayStr;
            const isSelected = selectedDay?.day === day;

            return (
              <div key={day} onClick={() => handleDayClick(day)}
                className={`aspect-square p-1 rounded-xl cursor-pointer transition-all hover:bg-white/10 relative
                  ${isToday ? 'bg-primary-500/20 border border-primary-500/30' : ''}
                  ${isSelected ? 'bg-white/10 ring-2 ring-primary-500/50' : ''}`}>
                <span className={`text-xs font-medium ${isToday ? 'text-primary-400' : 'text-white/60'}`}>{day}</span>
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((ev, ei) => (
                    <div key={ei} className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[ev.type] || TYPE_COLORS.general}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Events */}
      {selectedDay && (
        <div className="glass-card p-6 animate-fade-in">
          <h3 className="font-semibold mb-4">
            {new Date(selectedDay.dateStr).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          {selectedDay.events.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-6">No events</p>
          ) : (
            <div className="space-y-2">
              {selectedDay.events.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <div className={`w-1 h-10 rounded-full ${TYPE_COLORS[ev.type] || TYPE_COLORS.general}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{isRTL ? ev.title_ar || ev.title : ev.title}</p>
                    <p className="text-xs text-white/40">{ev.start_time} - {ev.end_time} • {t(ev.type)}</p>
                  </div>
                  <button onClick={async () => { await api.deleteEvent(ev.id); loadEvents(); setSelectedDay({...selectedDay, events: selectedDay.events.filter(e => e.id !== ev.id)}); }}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-400"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-card p-6 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('add_event')}</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-white/60 mb-1">{t('title')} (EN)</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" required /></div>
                <div><label className="block text-sm text-white/60 mb-1">{t('title')} (AR)</label><input value={form.title_ar} onChange={e => setForm({...form, title_ar: e.target.value})} className="input-field" dir="rtl" /></div>
              </div>
              <div><label className="block text-sm text-white/60 mb-1">{t('event_type')}</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="select-field">
                  <option value="shoot">{t('shoot')}</option><option value="meeting">{t('meeting')}</option><option value="deadline">{t('deadline')}</option><option value="general">{t('general')}</option>
                </select></div>
              <div><label className="block text-sm text-white/60 mb-1">{t('date')}</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-white/60 mb-1">Start</label><input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-white/60 mb-1">End</label><input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="input-field" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{t('add_event')}</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
