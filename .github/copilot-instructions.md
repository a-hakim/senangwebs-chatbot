# SenangWebs Chatbot repository instructions

Read README.md and SKILLS.md for the current architecture and public API. Keep the 1.x method signatures, attributes, UMD entry, history compatibility, and four distribution assets.

The source entry is src/js/swc.js; separate modules implement the conversation engine, transport, context, validation, knowledge base, and UI. CSS uses the swc- prefix. DOMPurify sanitizes keyword and legacy bot HTML; user, AI, fallback, and error messages always render as text.

Provider keys belong on a server. baseURL is an API root; endpointURL is an exact proxy endpoint. Clear/load/destroy invalidate pending work. Do not log conversation content unless debug is explicitly enabled.

Build with npm run build, verify packaging with npm run check:package, and verify browser integration with npm run test:browser. **Do not run unit tests without explicit permission**, following AGENTS.md. The unit command is npm test. CI enables units only through its manual approval input.

Review SECURITY.md before release. Do not publish automatically.
