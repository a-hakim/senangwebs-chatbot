/**
 * Node.js/Express Proxy Server for OpenRouter API
 * 
 * This proxy server keeps your API key secure on the server-side.
 * Install dependencies: npm install express node-fetch
 * 
 * Usage:
 * 1. Set OPENROUTER_API_KEY environment variable
 * 2. Run: node proxy-nodejs.js
 * 3. Configure chatbot to use: data-swc-api-base-url="http://localhost:3000/api/chat"
 */

const express = require('express');
const fetch = require('node-fetch');
const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Middleware
app.use(express.json());

// CORS - adjust origins for production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Change to your domain in production
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Validate API key
if (!OPENROUTER_API_KEY) {
  console.error('ERROR: OPENROUTER_API_KEY environment variable is not set');
  process.exit(1);
}

/**
 * Chat completion endpoint
 * POST /api/chat
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model, stream, max_tokens, temperature } = req.body;

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    if (!model) {
      return res.status(400).json({ error: 'Model is required' });
    }

    // Optional: Add rate limiting here
    // Optional: Add request logging here
    // Optional: Add user authentication here

    // Prepare OpenRouter request
    const requestBody = {
      model,
      messages,
      stream: stream || false,
      max_tokens: max_tokens || 1000,
      temperature: temperature !== undefined ? temperature : 0.7
    };

    // Make request to OpenRouter
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.referer || 'http://localhost:3000',
        'X-Title': 'SenangWebs Chatbot'
      },
      body: JSON.stringify(requestBody)
    });

    // Handle streaming response
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      response.body.pipe(res);
      
      response.body.on('end', () => {
        res.end();
      });
    } else {
      // Handle non-streaming response
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      
      res.json(data);
    }

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ OpenRouter proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`🔐 API key configured: ${OPENROUTER_API_KEY.substring(0, 10)}...`);
});
