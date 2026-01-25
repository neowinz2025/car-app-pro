import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('PLATE_RECOGNIZER_API_KEY');
    if (!apiKey) {
      console.error('PLATE_RECOGNIZER_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Extract plates from response
    const plates = data.results?.map((result: any) => ({
      plate: result.plate?.toUpperCase() || '',
      confidence: result.score || 0,
      region: result.region?.code || 'unknown',
    })) || [];

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
