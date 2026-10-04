# Examples

Build the library with `npm run build`, run `node scripts/serve-examples.cjs`, and open `http://127.0.0.1:8777/examples/index.html`.

| Example | Demonstrates |
|---|---|
| `basic/01-simple-chatbot.html` | Automatic keyword widget initialization |
| `basic/02-custom-knowledge-base.html` | Manual initialization with custom nodes |
| `advanced-features/01-chat-history.html` | History import, export, clearing, and application-owned storage |
| `advanced-features/02-external-knowledge-base.html` | Legacy declarative history-loading demo; `data-swc-load` loads history |
| `advanced-features/03-external-knowledge-base.html` | Fetching an external JSON knowledge base before mounting |
| `api-integration/01-ai-only-mode.html` | Direct-key AI experiments; replace with an exact proxy endpoint for production |
| `api-integration/02-hybrid-mode.html` | Keyword matching followed by AI fallback |
| `api-integration/03-interactive-testing.html` | Local configuration and AI experiments |
| `api-integration/04-secure-proxy-setup.html` | Client/proxy integration contract |

Use `data-swc-api-endpoint="/api/chat"` for the complete proxy URL. `data-swc-api-base-url` is an API root and appends `/chat/completions`. The proxy examples require application-specific authentication, CORS, abuse, and cost controls before deployment. Their server implementation has not been hardened by the library-readiness work.

Use `data-swc-manual-init` before fetching a custom knowledge base, then call `initializeChatbot(data.knowledgeBase)` or `initializeChatbot(SWC.defaultKnowledgeBase)` on failure. Use `element.chatbotInstance.destroy()` before removing or replacing a mounted widget.

Browser regressions use mock transport and require no provider keys. Install Playwright's Chromium, Firefox, and WebKit, then run `npm run test:browser`. Unit tests require explicit permission before `npm test`, following AGENTS.md.
