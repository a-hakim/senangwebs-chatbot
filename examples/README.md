# SenangWebs Chatbot - Examples

Comprehensive examples demonstrating all features of SenangWebs Chatbot library.

## Directory Structure

```
examples/
├── basic/                          # Basic chatbot examples
├── api-integration/                # AI-powered features with OpenRouter
├── proxy-servers/                  # Secure server-side proxy implementations
├── advanced-features/              # Advanced functionality demos
└── README.md                       # This file
```

## Quick Start

### 1. Basic Chatbot (No AI)

Start here if you're new to SenangWebs Chatbot:

- **`basic/01-simple-chatbot.html`** - Traditional keyword-based chatbot

**Features:**

- Zero configuration needed
- No API keys required
- Instant responses
- Perfect for FAQ chatbots

**Quick Run:**

```bash
# Just open in browser
open basic/01-simple-chatbot.html
```

---

## API Integration (AI-Powered)

Examples using OpenRouter API for AI-powered conversations:

### Prerequisites

- OpenRouter API key from [openrouter.ai](https://openrouter.ai/)
- Modern web browser

### Examples

1. **`api-integration/01-ai-only-mode.html`**

   - Pure AI-powered chatbot
   - All responses from AI models
   - Real-time streaming
   - Best for: Open-ended conversations

2. **`api-integration/02-hybrid-mode.html`**

   - Smart routing between keywords and AI
   - Fast keyword responses for common queries
   - AI fallback for complex questions
   - Best for: Customer support, FAQ with flexibility

3. **`api-integration/03-interactive-testing.html`**

   - Test different AI models
   - Configure parameters in real-time
   - Compare responses
   - Best for: Development and testing

4. **`api-integration/04-secure-proxy-setup.html`**
   - Production-ready security setup
   - Server-side proxy examples
   - No exposed API keys
   - Best for: Production deployments

**Quick Run:**

```bash
# Open any AI example and enter your API key
open api-integration/01-ai-only-mode.html
```

⚠️ **Security Note:** Examples 1-3 are for development only. Use proxy setup (#4) for production!

---

## Proxy Servers (Production Security)

Server-side proxies to keep API keys secure:

### Available Implementations

1. **`proxy-servers/proxy-nodejs.js`**

   - Node.js/Express server
   - Full streaming support
   - Health check endpoint

   ```bash
   cd proxy-servers
   npm install
   export OPENROUTER_API_KEY="your-key"
   npm start
   ```

2. **`proxy-servers/proxy-php.php`**

   - PHP implementation
   - Works on shared hosting
   - Easy WordPress integration

   ```bash
   # Upload to server
   # Edit API key in file
   # Access: yourdomain.com/proxy-php.php
   ```

3. **`proxy-servers/proxy-cloudflare-worker.js`**

   - Serverless edge computing
   - Global CDN distribution
   - Free tier: 100k requests/day

   ```bash
   npm install -g wrangler
   wrangler secret put OPENROUTER_API_KEY
   wrangler deploy
   ```

**Documentation:** See `proxy-servers/README.md` for complete setup guide.

---

## Advanced Features

Advanced functionality demonstrations:

1. **`advanced-features/01-chat-history.html`**

   - Save/load conversation history
   - Export chat as JSON
   - Import previous conversations
   - Clear history
   - Best for: Session persistence

2. **`advanced-features/02-external-knowledge-base.html`**
   - Load knowledge base from JSON file
   - Dynamic content loading
   - Declarative configuration
   - Best for: Large FAQ databases

**Quick Run:**

```bash
open advanced-features/01-chat-history.html
```

---

## Examples Quick Reference

| Example                                             | Type     | Difficulty   | API Needed | Best For            |
| --------------------------------------------------- | -------- | ------------ | ---------- | ------------------- |
| `basic/01-simple-chatbot.html`                      | Keyword  | Beginner     | ❌         | FAQ, Simple bots    |
| `api-integration/01-ai-only-mode.html`              | AI       | Intermediate | ✅         | Conversational AI   |
| `api-integration/02-hybrid-mode.html`               | Hybrid   | Intermediate | ✅         | Customer support    |
| `api-integration/03-interactive-testing.html`       | Testing  | Advanced     | ✅         | Development         |
| `api-integration/04-secure-proxy-setup.html`        | Security | Advanced     | ✅         | Production setup    |
| `advanced-features/01-chat-history.html`            | Feature  | Intermediate | ❌         | Session persistence |
| `advanced-features/02-external-knowledge-base.html` | Feature  | Intermediate | ❌         | Dynamic content     |

---

## Learning Path

### For Beginners

1. Start with `basic/01-simple-chatbot.html`
2. Understand keyword matching
3. Try `advanced-features/01-chat-history.html`
4. Learn about history persistence

### For AI Integration

1. Get OpenRouter API key
2. Try `api-integration/01-ai-only-mode.html`
3. Explore `api-integration/02-hybrid-mode.html`
4. Test with `api-integration/03-interactive-testing.html`

### For Production Deployment

1. Understand security concerns
2. Review `api-integration/04-secure-proxy-setup.html`
3. Choose your proxy (Node.js/PHP/Cloudflare)
4. Deploy from `proxy-servers/` directory
5. Configure chatbot to use proxy endpoint

---

## Configuration Quick Reference

### Basic Attributes

```html
<div
  data-swc
  data-swc-theme-color="#007bff"
  data-swc-bot-name="Assistant"
  data-swc-chat-display="modern"
></div>
```

### AI Integration

```html
<div
  data-swc
  data-swc-api-mode="hybrid"
  data-swc-api-key="your-key"
  data-swc-api-model="openai/gpt-3.5-turbo"
  data-swc-system-prompt="You are helpful"
></div>
```

### Secure Proxy

```html
<div
  data-swc
  data-swc-api-mode="ai-only"
  data-swc-api-base-url="https://your-domain.com/api/chat"
  data-swc-api-model="openai/gpt-3.5-turbo"
></div>
```

---

## Troubleshooting

### "Can't find swc.js/swc.css"

```bash
# Build the project first
cd ..
npm install
npm run build
```

### "API key not working"

- Check key is valid at [openrouter.ai/keys](https://openrouter.ai/keys)
- Ensure you have credits
- Check browser console for errors

### "Proxy connection failed"

- Ensure proxy server is running
- Check API base URL is correct
- Verify CORS settings

---

## Contributing

Contributions are welcome! Please fork the repository, make your changes, and submit a pull request.

---

## License

MIT License
