import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
