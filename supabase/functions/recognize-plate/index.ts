import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ApiKeyData {
  key_id: string;
  api_key: string;
}

async function getAllActiveApiKeys(): Promise<ApiKeyData[]> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration');
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('plate_recognizer_api_keys')
    .select('id, api_key')
    .eq('active', true)
    .order('priority', { ascending: true });

  if (error) {
    console.error('Error fetching API keys:', error);
    return [];
  }

  return data?.map((key: any) => ({
    key_id: key.id,
    api_key: key.api_key.trim()
  })) || [];
}

async function markApiKeyAsFailed(keyId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) return;

  const supabase = createClient(supabaseUrl, supabaseKey);

  await supabase
    .from('plate_recognizer_api_keys')
    .update({ active: false })
    .eq('id', keyId)
    .catch(err => console.error('Error marking key as failed:', err));
}

async function incrementApiKeyUsage(keyId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) return;

  const supabase = createClient(supabaseUrl, supabaseKey);

  await supabase.rpc('increment_api_key_usage', { p_key_id: keyId }).catch(err => {
    console.error('Error incrementing usage:', err);
  });
}

async function tryRecognizeWithApiKey(
  apiKey: string,
  keyId: string,
  binaryBytes: Uint8Array
): Promise<{ success: boolean; data?: any; error?: string; keyId?: string; shouldFailover?: boolean }> {
  try {
    const formData = new FormData();
    formData.append('upload', new Blob([binaryBytes], { type: 'image/jpeg' }));
    formData.append('regions', 'br');

    const start = Date.now();
    const response = await fetch('https://api.platerecognizer.com/v1/plate-reader/', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
      body: formData,
    });

    const duration = Date.now() - start;
    console.log(`API response (${keyId}): ${response.status} in ${duration}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Plate Recognizer API error: ${response.status} - ${errorText}`);

      // Check if it's a retryable error
      if (response.status === 429) {
        console.warn(`Rate limit reached for key ${keyId}, marking as failed`);
        return { success: false, error: 'Rate limit', keyId, shouldFailover: true };
      }
      if (response.status === 401 || response.status === 403) {
        console.warn(`Invalid credentials for key ${keyId}, marking as failed`);
        return { success: false, error: 'Invalid credentials', keyId, shouldFailover: true };
      }

      return { success: false, error: `Status ${response.status}`, keyId, shouldFailover: true };
    }

    const data = await response.json();
    console.log(`✅ Success with key ${keyId}! Found ${data.results?.length || 0} results.`);
    return { success: true, data, keyId };
  } catch (err: any) {
    console.error(`Error calling API with key ${keyId}:`, err);
    return { success: false, error: err.message, keyId, shouldFailover: true };
  }
}

function isValidBrazilianPlate(plate: string): boolean {
  const pattern = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
  return pattern.test(plate);
}

function processPlateResponse(data: any): any {
  const plates = (data.results || [])
    .map((result: any) => {
      const rawPlate = result.plate?.toUpperCase() || '';
      const normalizedPlate = rawPlate.replace(/[^A-Z0-9]/g, '');

      return {
        plate: normalizedPlate,
        raw_plate: rawPlate,
        confidence: result.score || 0,
        region: result.region?.code || 'unknown',
      };
    })
    .filter((p: any) => isValidBrazilianPlate(p.plate));

  console.log(`Validated ${plates.length} plates as Brazilian format`);
  if (data.results?.length > 0 && plates.length === 0) {
    console.log('No plates matched Brazilian format');
  }

  return {
    plates,
    processing_time: data.processing_time,
    total_results: data.results?.length || 0
  };
}

Deno.serve(async (req) => {
  console.log('Recognize-plate function triggered');

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove data URL prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
    console.log(`Image received. Base64 length: ${base64Image.length} characters`);

    // Convert base64 to binary data
    const binaryString = atob(base64Image);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Get all active API keys from database
    const apiKeys = await getAllActiveApiKeys();

    if (apiKeys.length === 0) {
      console.error('❌ ERRO: Nenhuma chave de API ativa encontrada no banco de dados!');
      console.error('📋 Você precisa adicionar chaves no painel: Admin → API KEYS');
      return new Response(
        JSON.stringify({
          error: 'Nenhuma chave de API configurada no sistema',
          details: 'Adicione chaves no painel de Admin → API KEYS'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Found ${apiKeys.length} active API keys. Starting failover...`);

    // Try each API key with automatic failover
    for (let i = 0; i < apiKeys.length; i++) {
      const { key_id, api_key } = apiKeys[i];
      console.log(`[${i + 1}/${apiKeys.length}] Attempting API key: ${key_id}`);

      const result = await tryRecognizeWithApiKey(api_key, key_id, bytes);

      if (result.success && result.data) {
        // Success! Increment usage and return results
        if (key_id !== 'env') {
          await incrementApiKeyUsage(key_id);
        }

        const responseData = processPlateResponse(result.data);
        return new Response(
          JSON.stringify(responseData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If this key should failover, mark it as failed and try next
      if (result.shouldFailover && key_id !== 'env') {
        console.log(`Marking key ${key_id} as failed, trying next...`);
        await markApiKeyAsFailed(key_id);
      }

      // If not the last key, continue to next
      if (i < apiKeys.length - 1) {
        console.log(`Key ${key_id} failed, trying next...`);
        continue;
      }

      // Last key failed
      console.error(`All ${apiKeys.length} API keys failed`);
      return new Response(
        JSON.stringify({
          error: 'Todas as chaves de API falharam',
          details: result.error || 'Unknown error'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Nenhuma chave de API disponível' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in recognize-plate function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
