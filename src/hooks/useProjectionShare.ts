import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STORAGE_KEY = 'projection_share_token';

export function useProjectionShare() {
  const [generating, setGenerating] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });

  const persist = (token: string | null) => {
    setShareToken(token);
    try {
      if (token) localStorage.setItem(STORAGE_KEY, token);
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!shareToken) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('projection_share_tokens' as any) as any)
      .select('id')
      .eq('token', shareToken)
      .eq('active', true)
      .maybeSingle()
      .then(({ data }: { data: unknown }) => {
        if (!data) persist(null);
      });
  }, []);

  const generateShareLink = useCallback(async (label?: string) => {
    try {
      setGenerating(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('projection_share_tokens' as any) as any)
        .insert({ label: label ?? 'Dashboard Compartilhado' })
        .select('token')
        .single();

      if (error) throw error;

      const token = (data as { token: string }).token;
      persist(token);

      const url = `${window.location.origin}/projecao/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link gerado e copiado!');
      return token;
    } catch (err) {
      console.error('Error generating share link:', err);
      toast.error('Erro ao gerar link de compartilhamento');
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const copyShareLink = useCallback(async (token: string) => {
    const url = `${window.location.origin}/projecao/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  }, []);

  const revokeShareLink = useCallback(async () => {
    if (!shareToken) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('projection_share_tokens' as any) as any)
        .update({ active: false })
        .eq('token', shareToken);
      persist(null);
      toast.success('Link revogado');
    } catch {
      toast.error('Erro ao revogar link');
    }
  }, [shareToken]);

  return { generateShareLink, copyShareLink, revokeShareLink, generating, shareToken };
}
