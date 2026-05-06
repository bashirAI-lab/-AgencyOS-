import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('agencyos_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.me().then(u => { setUser(u); setLoading(false); }).catch(() => { logout(); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const data = await api.login({ username, password });
    localStorage.setItem('agencyos_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('agencyos_token');
    setToken(null);
    setUser(null);
  };

  const hasRole = (...roles) => user && (roles.includes(user.role) || user.role === 'super_admin');

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
