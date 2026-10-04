---
name: senangwebs-chatbot
description: Website chatbot with keyword replies, OpenRouter-compatible AI, and hybrid mode.
version: 1.4.0
package: senangwebs-chatbot
---

# SenangWebs Chatbot

Read README.md, package.json, and relevant source modules before changing the library. Preserve the 1.x signatures, attributes, UMD bundle, CSS prefix `swc-`, and 1.x/2.x history compatibility.

The entry is `src/js/swc.js`. The conversation engine, transport, context, validation, default knowledge base, and DOM mounting are separate modules. Distribution assets are `swc.css`, `swc.min.css`, `swc.js`, and `swc.min.js` in dist.

```javascript
new SWC.SenangWebsChatbot(knowledgeBase, botMetadata, apiConfig)
SWC.initializeChatbot(knowledgeBase)
```

Use `data-swc-manual-init` when supplying a custom or asynchronously loaded knowledge base. Access mounted instances through `element.chatbotInstance`. Use `data-swc-api-endpoint` / `endpointURL` for an exact proxy URL; `data-swc-api-base-url` / `baseURL` are API roots. Keep real provider keys on the server.

Use bundled DOMPurify for keyword/legacy bot HTML; user, AI, fallback, and error content stays text during live display and history restoration. Clear/load/destroy invalidate all pending work. Cancellation preserves partial text once and completes with `cancelled: true`.

Exports are `SenangWebsChatbot`, `initializeChatbot`, `defaultKnowledgeBase`, `OpenRouterAPI`, and `ContextManager`. History events are `swc:history-exported` (`historyJSON`), `swc:history-loaded`, and `swc:history-cleared`. Invalid widget configuration emits `swc:error`.

Validation commands are `npm run build`, `npm run check:package`, `npm audit`, and `npm run test:browser`. **Do not run unit tests without explicit permission**, following AGENTS.md. The unit command is `npm test`; CI only enables it through the manual workflow approval checkbox. See SECURITY.md.
