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
      console.error(`Plate Recognizer API error: ${response.status} - ${errorText}`);
      
      // Return a 200 with error info so the frontend can show a nice message
      return new Response(
        JSON.stringify({ 
          error: `API do Plate Recognizer retornou erro ${response.status}`, 
          details: errorText,
          status: response.status 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Plate Recognizer API success!');

    if (keyId) {
      await incrementApiKeyUsage(keyId);
    }

    // Function to check if plate matches Brazilian format (Legacy or Mercosul)
    const isValidBrazilianPlate = (plate: string): boolean => {
      // Common pattern: 7 characters, always starts with 3 letters
      // 1-3: letters
      // 4: digit
      // 5: letter (mercosul) OR digit (legacy)
      // 6-7: digits
      const pattern = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
      return pattern.test(plate);
    };

    // Extract plates from response and filter
    const plates = (data.results || [])
      .map((result: any) => {
        const rawPlate = result.plate?.toUpperCase() || '';
        // Normalize: remove dashes, spaces, etc.
        const normalizedPlate = rawPlate.replace(/[^A-Z0-9]/g, '');
        
        return {
          plate: normalizedPlate,
          raw_plate: rawPlate,
          confidence: result.score || 0,
          region: result.region?.code || 'unknown',
        };
      })
      .filter((p: any) => isValidBrazilianPlate(p.plate));

    console.log(`Results: ${data.results?.length || 0} total, ${plates.length} validated as Brazilian format`);
    if (plates.length > 0) {
      console.log('Detected plates:', plates.map((p: any) => p.plate).join(', '));
    }

    return new Response(
      JSON.stringify({ 
        plates, 
        processing_time: data.processing_time,
        total_results: data.results?.length || 0 
      }),
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
