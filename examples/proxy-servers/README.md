# Proxy Server Examples

Secure server-side proxy implementations for SenangWebs Chatbot with OpenRouter API integration.

## Why Use a Proxy?

**Security**: Keep your API key on the server, never exposed to client browsers.

Benefits:
- ✅ API key stays secure
- ✅ Implement rate limiting
- ✅ Add authentication
- ✅ Monitor usage
- ✅ Control costs
- ✅ Production-ready

## Available Implementations

### 1. Node.js/Express (`proxy-nodejs.js`)

**Best for**: Node.js applications, modern JavaScript projects

**Setup:**
```bash
# Copy package.json
cp proxy-package.json package.json

# Install dependencies
npm install

# Set API key
export OPENROUTER_API_KEY="sk-or-v1-..."

# Run server
npm start

# Or with auto-reload during development
npm run dev
```

**Endpoints:**
- `POST /api/chat` - Chat completions (with streaming support)
- `GET /api/health` - Health check

**Configure chatbot:**
```html
<div data-swc 
     data-swc-api-mode="ai-only"
     data-swc-api-base-url="http://localhost:3000/api/chat"
     data-swc-api-model="openai/gpt-3.5-turbo">
</div>
```

### 2. PHP (`proxy-php.php`)

**Best for**: Traditional PHP hosting, shared hosting, WordPress sites

**Setup:**
```bash
# 1. Upload proxy-php.php to your server
# Example: /var/www/html/api/chat.php

# 2. Set API key in the file or use environment variable
# Edit proxy-php.php:
define('OPENROUTER_API_KEY', 'sk-or-v1-...');

# 3. Ensure PHP cURL extension is enabled
php -m | grep curl
```

**Configure chatbot:**
```html
<div data-swc 
     data-swc-api-mode="ai-only"
     data-swc-api-base-url="https://yourdomain.com/api/chat.php"
     data-swc-api-model="openai/gpt-3.5-turbo">
</div>
```

**Requirements:**
- PHP 7.4 or higher
- cURL extension enabled
- Write permissions for error logging

### 3. Cloudflare Workers (`proxy-cloudflare-worker.js`)

**Best for**: Edge computing, global distribution, serverless deployment

**Setup:**
```bash
# 1. Install Wrangler CLI
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Create new project
mkdir openrouter-proxy
cd openrouter-proxy
wrangler init

# 4. Copy proxy-cloudflare-worker.js to src/index.js

# 5. Set API key as secret
wrangler secret put OPENROUTER_API_KEY

# 6. Deploy
wrangler deploy
```

**Configure chatbot:**
```html
<div data-swc 
     data-swc-api-mode="ai-only"
     data-swc-api-base-url="https://your-worker.workers.dev/chat"
     data-swc-api-model="openai/gpt-3.5-turbo">
</div>
```

**Benefits:**
- Free tier: 100,000 requests/day
- Global edge network
- Auto-scaling
- Zero maintenance

## Testing Your Proxy

### Test Health Endpoint

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-11-02T10:30:00.000Z"}
```

### Test Chat Endpoint

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

Expected response:
```json
{
  "id": "gen-...",
  "model": "openai/gpt-3.5-turbo",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you today?"
    }
  }]
}
```

### Test Streaming

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Count to 5"}],
    "stream": true
  }'
```

## Security Configuration

### Production Checklist

1. **Environment Variables**
   ```bash
   # Never hardcode API keys
   export OPENROUTER_API_KEY="sk-or-v1-..."
   ```

2. **CORS Configuration**
   ```javascript
   // Restrict to your domain only
   res.header('Access-Control-Allow-Origin', 'https://yourdomain.com');
   ```

3. **Rate Limiting**
   ```javascript
   // Add rate limiting middleware
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   app.use('/api/', limiter);
   ```

4. **Authentication**
   ```javascript
   // Add JWT or API key authentication
   const authenticateUser = (req, res, next) => {
     const token = req.headers.authorization;
     if (!isValidToken(token)) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
     next();
   };
   app.use('/api/', authenticateUser);
   ```

5. **Request Logging**
   ```javascript
   // Log all requests for monitoring
   app.use((req, res, next) => {
     console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
     next();
   });
   ```

6. **HTTPS**
   ```bash
   # Always use HTTPS in production
   # Use Let's Encrypt for free SSL certificates
   ```

## Deployment Options

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY proxy-nodejs.js package.json ./
RUN npm install --production
EXPOSE 3000
CMD ["node", "proxy-nodejs.js"]
```

Build and run:
```bash
docker build -t chatbot-proxy .
docker run -p 3000:3000 -e OPENROUTER_API_KEY="sk-or-v1-..." chatbot-proxy
```

### PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start proxy-nodejs.js --name chatbot-proxy
pm2 save
pm2 startup
```

### systemd Service

Create `/etc/systemd/system/chatbot-proxy.service`:
```ini
[Unit]
Description=Chatbot Proxy Server
After=network.target

[Service]
Type=simple
User=www-data
Environment=OPENROUTER_API_KEY=sk-or-v1-...
WorkingDirectory=/var/www/proxy
ExecStart=/usr/bin/node proxy-nodejs.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable chatbot-proxy
sudo systemctl start chatbot-proxy
```

## Monitoring

### Basic Logging

```javascript
// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Add error logging
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});
```

### Advanced Monitoring

Consider using:
- **Winston** - Structured logging
- **Prometheus** - Metrics collection
- **Sentry** - Error tracking
- **DataDog** - Application monitoring

## Cost Management

### Estimate Costs

```javascript
// Track token usage
let totalTokens = 0;
app.post('/api/chat', async (req, res) => {
  const response = await apiCall();
  totalTokens += response.usage.total_tokens;
  console.log(`Total tokens used: ${totalTokens}`);
});
```

### Set Budget Limits

```javascript
// Add budget check
const MAX_DAILY_TOKENS = 100000;
if (dailyTokens > MAX_DAILY_TOKENS) {
  return res.status(429).json({ 
    error: 'Daily budget exceeded' 
  });
}
```

## Troubleshooting

### Common Issues

**Issue: "ECONNREFUSED"**
```
Solution: Check if proxy server is running
→ Run: npm start
```

**Issue: "API key not configured"**
```
Solution: Set environment variable
→ export OPENROUTER_API_KEY="sk-or-v1-..."
```

**Issue: "CORS error in browser"**
```
Solution: Check CORS headers match your domain
→ Update Access-Control-Allow-Origin header
```

**Issue: "Streaming not working"**
```
Solution: Ensure proxy pipes response correctly
→ Check response.body.pipe(res) in streaming code
```

## Support

- GitHub Issues: https://github.com/a-hakim/senangwebs-chatbot/issues
- Documentation: See `QUICKSTART_OPENROUTER.md`
- Examples: See `proxy-example.html`

## License

MIT License - See LICENSE.md
