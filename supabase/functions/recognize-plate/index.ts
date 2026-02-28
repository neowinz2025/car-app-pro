import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getNextApiKey() {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data, error } = await supabase.rpc('get_next_api_key');

  if (error || !data || data.length === 0) {
    throw new Error('No API keys available');
  }

  return data[0];
}

async function incrementApiKeyUsage(keyId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  await supabase.rpc('increment_api_key_usage', { p_key_id: keyId });
}

Deno.serve(async (req) => {
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

    let apiKey: string;
    let keyId: string;

    try {
      const keyData = await getNextApiKey();
      apiKey = keyData.api_key;
      keyId = keyData.key_id;
      console.log('Using API key from database rotation system');
    } catch (error) {
      console.log('Database API keys not available, falling back to env variable');
      const envKey = Deno.env.get('PLATE_RECOGNIZER_API_KEY');
      if (!envKey) {
        console.error('No API keys available');
        return new Response(
          JSON.stringify({ error: 'API key not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      apiKey = envKey;
      keyId = '';
    }

    // Remove data URL prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    console.log('Calling Plate Recognizer API...');

    const formData = new FormData();
    formData.append('upload', base64Image);
    formData.append('regions', 'br'); // Brazil region for better accuracy

    const response = await fetch('https://api.platerecognizer.com/v1/plate-reader/', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Plate Recognizer API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to recognize plate', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Plate Recognizer response:', JSON.stringify(data));

    if (keyId) {
      await incrementApiKeyUsage(keyId);
      console.log('API key usage incremented');
    }

    // Function to check if plate matches Mercosul format (ABC1D23)
    const isMercosulPlate = (plate: string): boolean => {
      // Mercosul format: 3 letters + 1 digit + 1 letter + 2 digits
      const mercosulPattern = /^[A-Z]{3}\d[A-Z]\d{2}$/;
      return mercosulPattern.test(plate);
    };

    // Extract plates from response and filter only Mercosul format
    const allPlates = data.results?.map((result: any) => ({
      plate: result.plate?.toUpperCase() || '',
      confidence: result.score || 0,
      region: result.region?.code || 'unknown',
    })) || [];

    // Filter to only include Mercosul plates
    const plates = allPlates.filter((p: any) => isMercosulPlate(p.plate));

    console.log(`Filtered ${allPlates.length} plates to ${plates.length} Mercosul plates`);

    return new Response(
      JSON.stringify({ plates, processing_time: data.processing_time }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
