---
name: senangwebs-chatbot
description: Customizable website chatbot with keyword-based responses, OpenRouter AI integration, and hybrid mode.
version: 1.3.2
package: senangwebs-chatbot
---

# SenangWebs Chatbot (SWC)

## Quick Reference

- **Purpose**: Embeddable chatbot with keyword matching, AI (OpenRouter), or hybrid conversation modes
- **Entry**: `dist/swc.js` (UMD bundle), source entry `src/js/swc.js`
- **Dist assets**: `swc.css`, `swc.min.css`, `swc.js`, `swc.min.js`
- **Dependencies**: none
- **Scripts**: `npm run build`, `npm run dev`, `npm run test`

## Workflow

Start in `C:\wamp64\www\sw-libraries\senangwebs-chatbot`. Read `README.md`, `package.json`, and touched source files. Match existing patterns, CSS prefix `swc-`.

## HTML Data Attributes

| Attribute | Description |
|---|---|
| `data-swc` | Chatbot container flag |
| `data-swc-theme-color` | Primary theme color (hex) |
| `data-swc-bot-name` | Display name for the bot |
| `data-swc-chat-display` | `"modern"` or `"classic"` |
| `data-swc-api-mode` | `"keyword-only"`, `"ai-only"`, or `"hybrid"` |
| `data-swc-api-key` | OpenRouter API key (use proxy in production) |
| `data-swc-api-model` | OpenRouter model name |
| `data-swc-system-prompt` | System prompt for AI mode |
| `data-swc-api-base-url` | Custom OpenRouter-compatible API root or proxy endpoint |
| `data-swc-greeting` | Initial bot greeting message |

## JavaScript API

### Core
```js
new SenangWebsChatbot(container, options)
```

### Chat History
```js
chatbot.exportHistory()   // returns JSON
chatbot.loadHistory(json)
chatbot.clearHistory()
```

### AI Control
```js
chatbot.cancelAIResponse()  // cancels streaming response
```

### Utilities
```js
new OpenRouterAPI(config)     // standalone OpenRouter client
new ContextManager(config)    // conversation context management
```

### Custom Events
`swc:history-exported`, `swc:history-loaded`, `swc:history-cleared`

## Focus Areas

- Three conversation modes: keyword-only (fast, local), AI-only (OpenRouter streaming), hybrid (keyword first, fallback to AI)
- Streaming response display with typing indicators
- Proxy pattern for API key security (never expose keys client-side in examples)
- Chat history import/export as JSON, localStorage persistence
- Context management for multi-turn AI conversations
- Theming: colors, bot name, modern/classic display styles

## Implementation Guidance

- NEVER expose real API keys in example code or README; always show proxy pattern
- Preserve backward compatibility for all attributes and method signatures
- Test streaming responses handle cancellation and error states gracefully
- Verify keyword matching priority in hybrid mode
- Keep npm metadata pointed at `dist/swc.js`; the bundle must expose `SenangWebsChatbot`, `initializeChatbot`, and `defaultKnowledgeBase`
- `npm run build` must emit exactly the four distributable assets in `dist`: `swc.css`, `swc.min.css`, `swc.js`, `swc.min.js`

## Validation

```bash
npm run build
npm run dev      # for manual testing with browser
npm test         # placeholder
```
