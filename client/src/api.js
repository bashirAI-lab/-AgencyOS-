const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('agencyos_token');
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (creds) => request('/auth/login', { method: 'POST', body: JSON.stringify(creds) }),
  me: () => request('/auth/me'),
  users: () => request('/auth/users'),
  
  // Analytics
  analytics: (params) => request(`/analytics?${new URLSearchParams(params || {})}`),
  analyticsSummary: (period, platform) => request(`/analytics/summary?period=${period || '30d'}${platform ? '&platform=' + platform : ''}`),
  creators: () => request('/analytics/creators'),
  tags: () => request('/analytics/tags'),
  manualEntry: (data) => request('/analytics/manual', { method: 'POST', body: JSON.stringify(data) }),
  
  // Kanban
  kanbanCards: () => request('/kanban'),
  createCard: (data) => request('/kanban', { method: 'POST', body: JSON.stringify(data) }),
  updateCard: (id, data) => request(`/kanban/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateCardStage: (id, data) => request(`/kanban/${id}/stage`, { method: 'PATCH', body: JSON.stringify(data) }),
  approveCard: (id) => request(`/kanban/${id}/approve`, { method: 'PATCH' }),
  voteCard: (id, vote) => request(`/kanban/${id}/vote`, { method: 'POST', body: JSON.stringify({ vote }) }),
  deleteCard: (id) => request(`/kanban/${id}`, { method: 'DELETE' }),
  
  // Sponsors
  sponsors: (params) => request(`/sponsors?${new URLSearchParams(params || {})}`),
  sponsor: (id) => request(`/sponsors/${id}`),
  createSponsor: (data) => request('/sponsors', { method: 'POST', body: JSON.stringify(data) }),
  updateSponsor: (id, data) => request(`/sponsors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addInteraction: (id, data) => request(`/sponsors/${id}/interactions`, { method: 'POST', body: JSON.stringify(data) }),
  deleteSponsor: (id) => request(`/sponsors/${id}`, { method: 'DELETE' }),
  
  // Finance
  invoices: (params) => request(`/finance?${new URLSearchParams(params || {})}`),
  invoice: (id) => request(`/finance/${id}`),
  financeSummary: () => request('/finance/summary'),
  createInvoice: (data) => request('/finance', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoiceStatus: (id, status) => request(`/finance/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteInvoice: (id) => request(`/finance/${id}`, { method: 'DELETE' }),
  downloadInvoicePdf: async (id) => {
    const token = localStorage.getItem('agencyos_token');
    const res = await fetch(`${API_BASE}/finance/${id}/pdf`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to download PDF');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  
  // Calendar
  events: (params) => request(`/calendar?${new URLSearchParams(params || {})}`),
  createEvent: (data) => request('/calendar', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id, data) => request(`/calendar/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id) => request(`/calendar/${id}`, { method: 'DELETE' }),
  
  // Tasks
  tasks: (params) => request(`/tasks?${new URLSearchParams(params || {})}`),
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTaskStatus: (id, status) => request(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  
  // Notifications
  notifications: () => request('/tasks/notifications'),
  markRead: (id) => request(`/tasks/notifications/${id}/read`, { method: 'PATCH' }),
  
  // Upload
  upload: async (file) => {
    const token = localStorage.getItem('agencyos_token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    return res.json();
  },
};
