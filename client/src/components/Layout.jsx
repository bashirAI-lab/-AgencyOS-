import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { api } from '../api';
import { LayoutDashboard, Kanban, Users, DollarSign, CalendarDays, ListTodo, LogOut, Menu, X, Bell, Globe, ChevronDown } from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, key: 'dashboard' },
  { path: '/kanban', icon: Kanban, key: 'kanban' },
  { path: '/sponsors', icon: Users, key: 'sponsors' },
  { path: '/finance', icon: DollarSign, key: 'finance' },
  { path: '/calendar', icon: CalendarDays, key: 'calendar' },
  { path: '/tasks', icon: ListTodo, key: 'tasks' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { t, toggle, lang, isRTL } = useLang();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    api.notifications().then(setNotifications).catch(() => {});
  }, [location]);

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen flex bg-surface-900">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-50 w-72 bg-surface-800/80 backdrop-blur-xl border-white/5 
        ${isRTL ? 'border-l' : 'border-r'} transform transition-transform duration-300 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-lg">A</div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">{t('app_name')}</h1>
              <p className="text-xs text-white/40">Management Ecosystem</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <item.icon size={20} />
              <span>{t(item.key)}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center font-semibold text-sm">
              {user?.full_name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{isRTL ? user?.full_name_ar : user?.full_name}</p>
              <p className="text-xs text-white/40">{t(user?.role)}</p>
            </div>
          </div>
          <button onClick={logout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut size={18} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-surface-800/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/10">
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold capitalize">
              {t(navItems.find(n => n.path === location.pathname)?.key || 'dashboard')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button onClick={toggle} className="p-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 text-sm">
              <Globe size={18} />
              <span className="hidden sm:inline">{lang === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className="p-2.5 rounded-xl hover:bg-white/10 transition-colors relative">
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">{unread}</span>
                )}
              </button>
              {showNotifs && (
                <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-12 w-80 glass-card p-2 max-h-96 overflow-y-auto z-50 animate-fade-in`}>
                  <p className="px-3 py-2 text-sm font-semibold border-b border-white/5">{t('notifications')}</p>
                  {notifications.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-white/40 text-center">{t('no_notifications')}</p>
                  ) : notifications.slice(0, 10).map(n => (
                    <div key={n.id} className={`px-3 py-2.5 hover:bg-white/5 rounded-lg cursor-pointer text-sm ${!n.is_read ? 'bg-primary-500/5' : ''}`}
                      onClick={() => { api.markRead(n.id); setNotifications(ns => ns.map(x => x.id === n.id ? {...x, is_read: 1} : x)); }}>
                      <p className="font-medium">{n.title}</p>
                      <p className="text-white/40 text-xs mt-0.5">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
