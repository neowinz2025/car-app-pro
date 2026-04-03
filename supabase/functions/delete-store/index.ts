import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DeleteStoreRequest {
  id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { id }: DeleteStoreRequest = await req.json();

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID da loja é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Primeiro buscamos se a loja tem logo para deletar do storage se necessário
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

    const { error: deleteError } = await supabase
      .from('stores')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting store:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Erro ao excluir loja: ' + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in delete-store function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
