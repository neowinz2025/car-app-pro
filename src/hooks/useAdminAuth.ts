import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [adminUsername, setAdminUsername] = useState<string>('');

  useEffect(() => {
    const adminData = localStorage.getItem('admin_session');
    if (adminData) {
      const { username, timestamp } = JSON.parse(adminData);
      const now = Date.now();
      const sessionDuration = 24 * 60 * 60 * 1000;

      if (now - timestamp < sessionDuration) {
        setIsAuthenticated(true);
        setAdminUsername(username);
      } else {
        localStorage.removeItem('admin_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle();

      if (error || !data) {
        return false;
      }

      await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      localStorage.setItem('admin_session', JSON.stringify({
        username: data.username,
        timestamp: Date.now()
      }));

      setIsAuthenticated(true);
      setAdminUsername(data.username);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_session');
    setIsAuthenticated(false);
    setAdminUsername('');
  };

  return {
    isAuthenticated,
    isLoading,
    adminUsername,
    login,
    logout
  };
}
