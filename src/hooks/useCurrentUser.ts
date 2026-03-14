import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CurrentUser {
  id: string;
  name: string;
  cpf: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERADOR';
  store_id: string | null;
  active: boolean;
}

export interface StoreInfo {
  id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      setLoading(true);

      const sessionStr = localStorage.getItem('user_session');
      if (!sessionStr) {
        setCurrentUser(null);
        setStoreInfo(null);
        return;
      }

      const session = JSON.parse(sessionStr);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.id)
        .maybeSingle();

      if (error) throw error;

      setCurrentUser(data);

      if (data?.store_id) {
        const { data: store } = await supabase
          .from('stores')
          .select('id, name, logo_url, address')
          .eq('id', data.store_id)
          .maybeSingle();
        setStoreInfo(store);
      } else {
        setStoreInfo(null);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
      setCurrentUser(null);
      setStoreInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = () => currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = () => currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const getStoreId = () => currentUser?.store_id;

  return {
    currentUser,
    storeInfo,
    loading,
    isSuperAdmin,
    isAdmin,
    getStoreId,
    reload: loadCurrentUser,
  };
}
