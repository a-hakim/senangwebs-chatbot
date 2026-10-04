# Security

Report vulnerabilities privately through [GitHub vulnerability reporting](https://github.com/a-hakim/senangwebs-chatbot/security/advisories/new). Include the affected version, browser, reproduction steps, and expected impact. Avoid public issues containing exploit details or provider keys.

The current 1.x release line receives security fixes. Keep the package and its bundled sanitizer updated. User/AI/error text stays literal; keyword and legacy bot HTML is sanitized with DOMPurify. Applications should still control where knowledge bases and history originate.

Keep provider secrets on a server and use the exact proxy endpoint setting. Host applications own authorization, CORS policy, usage limits, history retention, and logging. The shipped proxy examples illustrate integration and require application-specific production controls.

Before release, review `npm audit`, run the browser security regressions, and obtain explicit permission before running unit tests. Dependency checks include build dependencies as well as bundled runtime dependencies.
