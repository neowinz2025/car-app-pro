import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Store {
  id: string;
  name: string;
  address?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useStores() {
  const [loading, setLoading] = useState(false);

  const getAllStores = async (): Promise<Store[]> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading stores:', error);
      toast.error('Erro ao carregar lojas');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getActiveStores = async (): Promise<Store[]> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading active stores:', error);
      toast.error('Erro ao carregar lojas ativas');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getStoreById = async (id: string): Promise<Store | null> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading store:', error);
      toast.error('Erro ao carregar loja');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createStore = async (
    name: string,
    logoFile?: File,
    address?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      let logoUrl: string | undefined;

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('store-logos')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('store-logos')
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
      }

      const { error } = await supabase
        .from('stores')
        .insert({
          name,
          address,
          logo_url: logoUrl,
          is_active: true,
        });

      if (error) throw error;

      toast.success('Loja criada com sucesso!');
      return true;
    } catch (error) {
      console.error('Error creating store:', error);
      toast.error('Erro ao criar loja');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateStore = async (
    id: string,
    name: string,
    logoFile?: File,
    removeLogo?: boolean,
    address?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      let logoUrl: string | null | undefined;

      if (removeLogo) {
        const { data: store } = await supabase
          .from('stores')
          .select('logo_url')
          .eq('id', id)
          .maybeSingle();

        if (store?.logo_url) {
          const urlParts = store.logo_url.split('/store-logos/');
          if (urlParts.length > 1) {
            const path = decodeURIComponent(urlParts[1]);
            await supabase.storage.from('store-logos').remove([path]);
          }
        }
        logoUrl = null;
      } else if (logoFile) {
        const { data: store } = await supabase
          .from('stores')
          .select('logo_url')
          .eq('id', id)
          .maybeSingle();

        if (store?.logo_url) {
          const urlParts = store.logo_url.split('/store-logos/');
          if (urlParts.length > 1) {
            const path = decodeURIComponent(urlParts[1]);
            await supabase.storage.from('store-logos').remove([path]);
          }
        }

        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('store-logos')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('store-logos')
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
      }

      const updateData: any = {
        name,
        address,
        updated_at: new Date().toISOString(),
      };

      if (logoUrl !== undefined) {
        updateData.logo_url = logoUrl;
      }

      const { error } = await supabase
        .from('stores')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Loja atualizada com sucesso!');
      return true;
    } catch (error) {
      console.error('Error updating store:', error);
      toast.error('Erro ao atualizar loja');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggleStoreStatus = async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('stores')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Loja ${isActive ? 'ativada' : 'desativada'} com sucesso!`);
      return true;
    } catch (error) {
      console.error('Error toggling store status:', error);
      toast.error('Erro ao alterar status da loja');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteStore = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);

      const { data: store } = await supabase
        .from('stores')
        .select('logo_url')
        .eq('id', id)
        .maybeSingle();

      if (store?.logo_url) {
        const urlParts = store.logo_url.split('/store-logos/');
        if (urlParts.length > 1) {
          const path = decodeURIComponent(urlParts[1]);
          await supabase.storage.from('store-logos').remove([path]);
        }
      }

      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Loja excluída com sucesso!');
      return true;
    } catch (error) {
      console.error('Error deleting store:', error);
      toast.error('Erro ao excluir loja');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getAllStores,
    getActiveStores,
    getStoreById,
    createStore,
    updateStore,
    toggleStoreStatus,
    deleteStore,
  };
}
