/**
 * Cloudflare Workers Proxy for OpenRouter API
 * 
 * Deploy this as a Cloudflare Worker to create a secure proxy.
 * Your API key is stored as an environment variable in Cloudflare.
 * 
 * Setup:
 * 1. Create a new Cloudflare Worker
 * 2. Add environment variable: OPENROUTER_API_KEY
 * 3. Deploy this code
 * 4. Configure chatbot: data-swc-api-base-url="https://your-worker.workers.dev/chat"
 * 
 * Deploy with Wrangler:
 * wrangler secret put OPENROUTER_API_KEY
 * wrangler deploy
 */

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Change to your domain in production
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Handle incoming requests
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get URL path
  const url = new URL(request.url);

  // Health check endpoint
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ 
      status: 'ok',
      timestamp: new Date().toISOString()
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
  }

  // Chat endpoint
  if (url.pathname === '/chat' && request.method === 'POST') {
    return handleChatRequest(request);
  }

  // 404 for other paths
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 
      'Content-Type': 'application/json',
      ...corsHeaders 
    }
  });
}

/**
 * Handle chat completion request
 */
async function handleChatRequest(request) {
  try {
    // Get API key from environment
    const apiKey = OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return jsonResponse({ error: 'API key not configured' }, 500);
    }

    // Parse request body
    const body = await request.json();
    const { messages, model, stream, max_tokens, temperature } = body;

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return jsonResponse({ error: 'Invalid messages format' }, 400);
    }

    if (!model) {
      return jsonResponse({ error: 'Model is required' }, 400);
    }

    // Optional: Add rate limiting using Cloudflare KV
    // Optional: Add request logging using Cloudflare Analytics Engine
    // Optional: Add authentication using Cloudflare Access

    // Prepare request body
    const requestBody = {
      model,
      messages,
      stream: stream || false,
      max_tokens: max_tokens || 1000,
      temperature: temperature !== undefined ? temperature : 0.7
    };

    // Make request to OpenRouter
    const openrouterResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': request.headers.get('Referer') || 'https://your-site.com',
        'X-Title': 'SenangWebs Chatbot'
      },
      body: JSON.stringify(requestBody)
    });

    // Handle streaming response
    if (stream) {
      return new Response(openrouterResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...corsHeaders
        }
      });
    }

    // Handle non-streaming response
    const data = await openrouterResponse.json();
    
    return new Response(JSON.stringify(data), {
      status: openrouterResponse.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return jsonResponse({ 
      error: 'Internal server error',
      message: error.message 
    }, 500);
  }
}

/**
 * Helper function to create JSON response
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}
