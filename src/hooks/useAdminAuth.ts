import { useState, useEffect } from 'react';

interface AdminSession {
  username: string;
  role: string;
  token: string;
  timestamp: number;
}

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminRole, setAdminRole] = useState<string>('');

  useEffect(() => {
    const validateSession = () => {
      try {
        const adminDataStr = localStorage.getItem('admin_session');
        if (!adminDataStr) {
          setIsLoading(false);
          return;
        }

        const adminData: AdminSession = JSON.parse(adminDataStr);

        if (!adminData.username || !adminData.token || !adminData.timestamp || !adminData.role) {
          localStorage.removeItem('admin_session');
          setIsLoading(false);
          return;
        }

        const now = Date.now();
        const sessionDuration = 24 * 60 * 60 * 1000;

        if (now - adminData.timestamp < sessionDuration) {
          setIsAuthenticated(true);
          setAdminUsername(adminData.username);
          setAdminRole(adminData.role);
        } else {
          localStorage.removeItem('admin_session');
        }
      } catch (error) {
        console.error('Error validating session:', error);
        localStorage.removeItem('admin_session');
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!username || !password) {
        return { success: false, error: 'Usuário e senha são obrigatórios' };
      }

      if (username.length < 3 || username.length > 50) {
        return { success: false, error: 'Nome de usuário inválido' };
      }

      if (password.length < 6 || password.length > 100) {
        return { success: false, error: 'Senha deve ter entre 6 e 100 caracteres' };
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        return { success: false, error: 'Erro de configuração do servidor' };
      }

      const apiUrl = `${supabaseUrl}/functions/v1/admin-login`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Falha na autenticação' }));
        return { success: false, error: errorData.error || 'Usuário ou senha inválidos' };
      }

      const data = await response.json();

      if (!data.success || !data.token || !data.admin || !data.admin.role) {
        return { success: false, error: 'Resposta inválida do servidor' };
      }

      const sessionData: AdminSession = {
        username: data.admin.username,
        role: data.admin.role,
        token: data.token,
        timestamp: Date.now()
      };

      localStorage.setItem('admin_session', JSON.stringify(sessionData));

      setIsAuthenticated(true);
      setAdminUsername(data.admin.username);
      setAdminRole(data.admin.role);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erro de conexão com o servidor' };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_session');
    setIsAuthenticated(false);
    setAdminUsername('');
    setAdminRole('');
  };

  const getSessionToken = (): string | null => {
    try {
      const adminDataStr = localStorage.getItem('admin_session');
      if (!adminDataStr) return null;

      const adminData: AdminSession = JSON.parse(adminDataStr);
      return adminData.token || null;
    } catch (error) {
      console.error('Error getting session token:', error);
      return null;
    }
  };

  const isSuperAdmin = () => {
    return adminRole === 'super_admin';
  };

  return {
    isAuthenticated,
    isLoading,
    adminUsername,
    adminRole,
    isSuperAdmin,
    login,
    logout,
    getSessionToken
  };
}
