import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useProjectionShare() {
  const [generating, setGenerating] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);

  const generateShareLink = useCallback(async (label?: string) => {
    try {
      setGenerating(true);
      const { data, error } = await supabase
        .from('projection_share_tokens')
        .insert({ label: label ?? 'Dashboard Compartilhado' })
        .select('token')
        .single();

      if (error) throw error;

      const token = data.token as string;
      setShareToken(token);

      const url = `${window.location.origin}/projecao/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência!');
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

  return { generateShareLink, copyShareLink, generating, shareToken };
}
