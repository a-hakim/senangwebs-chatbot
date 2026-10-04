const { test, expect } = require('@playwright/test');
const kb = [{ id: 'welcome', keyword: ['hello'], reply: '<b>Welcome</b>', options: [{ label: 'Help', reply_id: 'help' }] }, { id: 'help', keyword: ['help'], reply: 'Help reply' }];
async function init(page, attrs = {}) {
  await page.goto('/tests/fixtures/browser.html');
  await page.evaluate(({ kb, attrs }) => {
    for (const [name, value] of Object.entries(attrs)) document.querySelector('#host').setAttribute(`data-swc-${name}`, value);
    SWC.initializeChatbot(kb);
  }, { kb, attrs });
}
async function send(page, text = 'question') { await page.getByRole('textbox', { name: 'Message', exact: true }).fill(text); await page.getByRole('button', { name: 'Send', exact: true }).click(); }
async function streamMock(page) {
  await page.evaluate(() => {
    window.calls = [];
    window.fetch = async (url, init) => {
      calls.push({ url, headers: init.headers, body: JSON.parse(init.body) });
      return new Response(new ReadableStream({ start(controller) { window.streamController = controller; }, cancel() { window.streamCancelled = true; } }));
    };
    window.pushChunk = text => streamController.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`));
    window.finishStream = () => { streamController.enqueue(new TextEncoder().encode('data: [DONE]\n\n')); streamController.close(); };
  });
}
const ai = { 'api-mode': 'ai-only', 'api-endpoint': '/mock/chat' };

test('sanitizes knowledge and imported HTML, while restored AI remains literal text', async ({ page }) => {
  await init(page);
  await page.evaluate(() => {
    window.xss = false;
    const bot = document.querySelector('#host').chatbotInstance;
    bot.loadHistory({ version: '1.0', messages: [
      { type: 'bot', content: '<b>safe</b><a href="jav&#x61;script:window.xss=true">unsafe</a><img src="/missing" onerror="window.xss=true"><svg onload="window.xss=true"></svg><iframe srcdoc="<script>window.xss=true</script>"></iframe>' },
      { type: 'bot', source: 'api', content: '<b>AI literal</b>' },
      { type: 'bot', source: 'error', content: '<b>Error literal</b>' },
      { type: 'user', content: '<img src=x onerror=window.xss=true>' },
    ] });
  });
  const messages = page.locator('.swc-message');
  await expect(messages.nth(0).locator('b')).toHaveText('safe');
  await expect(messages.nth(0).locator('a')).not.toHaveAttribute('href', /javascript/i);
  await expect(messages.nth(0).locator('[onerror],svg,iframe,script')).toHaveCount(0);
  await expect(messages.nth(1)).toHaveText('<b>AI literal</b>'); await expect(messages.nth(1).locator('b')).toHaveCount(0);
  await expect(messages.nth(2)).toHaveText('<b>Error literal</b>'); await expect(messages.nth(3).locator('img')).toHaveCount(0);
  expect(await page.evaluate(() => window.xss)).toBe(false);
});

test('relative endpoint and JSON completions work without proxy authorization headers', async ({ page }) => {
  await init(page, { ...ai, 'api-streaming': 'false', 'api-temperature': '0', 'context-max-messages': '0' });
  await page.route('**/mock/chat', async route => {
    const request = route.request(); expect(request.postDataJSON().stream).toBe(false); expect(request.postDataJSON().temperature).toBe(0);
    expect(request.postDataJSON().messages.at(-1)).toEqual({ role: 'user', content: 'question' });
    expect(request.headers().authorization).toBeUndefined(); expect(request.headers()['x-title']).toBeUndefined();
    await route.fulfill({ json: { choices: [{ message: { content: '<b>literal</b>' } }] } });
  });
  await send(page);
  await expect(page.locator('.swc-ai-message')).toHaveText('<b>literal</b>'); await expect(page.locator('.swc-ai-message b')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
});

test('delayed streaming remains stoppable and cancellation persists partial output once', async ({ page }) => {
  await init(page, { ...ai, 'reply-duration': '100' }); await streamMock(page); await send(page);
  await expect(page.getByRole('button', { name: 'Stop AI response' })).toBeVisible();
  await page.evaluate(() => pushChunk('partial'));
  await expect(page.locator('.swc-ai-message')).toHaveText('partial');
  await page.getByRole('button', { name: 'Stop AI response' }).click();
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
  await expect(page.locator('.swc-ai-message')).toHaveCount(1);
  expect(await page.evaluate(() => document.querySelector('#host').chatbotInstance.getHistory().messages.filter(msg => msg.source === 'api').map(msg => msg.content))).toEqual(['partial']);
  expect(await page.evaluate(() => window.streamCancelled)).toBe(true);
});

test('clear and load during streaming suppress stale replies and reset context', async ({ page }) => {
  await init(page, ai); await streamMock(page); await send(page);
  await expect(page.getByRole('button', { name: 'Stop AI response' })).toBeVisible();
  await page.evaluate(() => { pushChunk('old'); document.querySelector('#host').chatbotInstance.clearHistory(); });
  await expect(page.locator('.swc-message')).toHaveCount(1); await expect(page.locator('.swc-message')).toHaveText('Welcome');
  expect(await page.evaluate(() => document.querySelector('#host').chatbotInstance.contextManager.getStats().messageCount)).toBe(0);
  await send(page, 'second'); await expect(page.getByRole('button', { name: 'Stop AI response' })).toBeVisible();
  await page.evaluate(() => document.querySelector('#host').chatbotInstance.loadHistory({ version: '2.0', messages: [{ type: 'bot', content: 'loaded' }] }));
  await expect(page.locator('.swc-message')).toHaveText('loaded'); await expect(page.locator('.swc-stop-button')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
});

test('destroy cancels queued input and preserves host content and reinitialization', async ({ page }) => {
  await init(page, { 'reply-duration': '1000' }); await send(page, 'hello');
  await page.evaluate(() => { const bot = document.querySelector('#host').chatbotInstance; bot.destroy(); bot.destroy(); SWC.initializeChatbot(SWC.defaultKnowledgeBase); });
  await expect(page.locator('.swc-chat-display')).toHaveCount(1); await expect(page.locator('#host-content')).toHaveText('Host content');
  await expect(page.locator('.swc-user-message')).toHaveCount(0);
});

test('rapid option selection is serialized and buttons never submit the host form', async ({ page }) => {
  await init(page);
  await page.evaluate(() => {
    window.submissions = 0; document.querySelector('form').addEventListener('submit', event => { event.preventDefault(); submissions++; });
    const button = document.querySelector('.swc-option-button'); button.click(); button.click();
  });
  await expect(page.locator('.swc-message').last()).toHaveText('Help reply'); await expect(page.locator('.swc-message')).toHaveCount(2);
  expect(await page.evaluate(() => window.submissions)).toBe(0);
});

test('clear during reply delay prevents queued replies', async ({ page }) => {
  await init(page, { 'reply-duration': '1000' }); await send(page, 'hello');
  await page.evaluate(() => document.querySelector('#host').chatbotInstance.clearHistory());
  await expect(page.locator('.swc-message')).toHaveCount(1); await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.querySelector('#host').chatbotInstance.getHistory().messages.length)).toBe(1);
});

test('invalid history falls back to welcome and exports the documented event field', async ({ page }) => {
  await init(page, { load: '{"version":"2.0","messages":[{"type":"bot","content":7}]}' });
  await expect(page.locator('.swc-message')).toHaveText('Welcome');
  const exported = await page.evaluate(() => {
    const element = document.querySelector('#host'); let detail;
    element.addEventListener('swc:history-exported', event => { detail = event.detail; }, { once: true }); element.chatbotInstance.exportHistory(); return detail;
  });
  expect(JSON.parse(exported.historyJSON).messages).toHaveLength(1);
});

test('bad widget configuration does not stop other widgets', async ({ page }) => {
  await page.goto('/tests/fixtures/browser.html');
  await page.evaluate(({ kb }) => {
    const bad = document.createElement('div'); bad.setAttribute('data-swc', ''); bad.setAttribute('data-swc-reply-duration', '-1'); document.body.prepend(bad);
    const second = document.createElement('div'); second.id = 'second'; second.setAttribute('data-swc', ''); document.body.append(second);
    SWC.initializeChatbot(kb); SWC.initializeChatbot(kb);
  }, { kb });
  await expect(page.locator('.swc-chat-display')).toHaveCount(2);
  await expect(page.locator('#second .swc-message')).toHaveText('Welcome');
});

test('keyboard, focus, reduced motion, and mobile layout remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 }); await page.emulateMedia({ reducedMotion: 'reduce' }); await init(page);
  const input = page.getByRole('textbox', { name: 'Message', exact: true }); await input.fill('hello'); await input.press('Enter');
  await expect(input).toBeFocused(); await expect(page.getByRole('status')).toContainText('Welcome');
  await expect(page.getByRole('log', { name: 'Chat transcript' })).toHaveAttribute('aria-busy', 'false');
  expect(await input.evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe('none');
  expect(await page.locator('.swc-message').first().evaluate(node => getComputedStyle(node).animationName)).toBe('none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('stream bursts coalesce animation updates and errors restore controls', async ({ page }) => {
  await init(page, ai); await streamMock(page);
  await page.evaluate(() => { window.frameCalls = 0; const original = requestAnimationFrame; window.requestAnimationFrame = fn => { frameCalls++; return original(fn); }; });
  await send(page); await expect(page.getByRole('button', { name: 'Stop AI response' })).toBeVisible();
  await page.evaluate(() => { for (let i = 0; i < 100; i++) pushChunk('x'); finishStream(); });
  await expect(page.locator('.swc-ai-message')).toHaveText('x'.repeat(100));
  expect(await page.evaluate(() => frameCalls)).toBeLessThan(10);
  await send(page, 'failure'); await expect(page.getByRole('button', { name: 'Stop AI response' })).toBeVisible();
  await page.evaluate(() => { streamController.enqueue(new TextEncoder().encode('event: error\ndata: {"error":{"message":"Failed"}}\n\n')); streamController.close(); });
  await expect(page.locator('.swc-error-message')).toHaveCount(1); await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
});

test('minified CDN assets expose the same API and widget behavior', async ({ page }) => {
  await page.route('**/dist/swc.js', route => route.fulfill({ path: require('node:path').resolve('dist/swc.min.js'), contentType: 'text/javascript' }));
  await page.route('**/dist/swc.css', route => route.fulfill({ path: require('node:path').resolve('dist/swc.min.css'), contentType: 'text/css' }));
  await init(page);
  expect(await page.evaluate(() => ['SenangWebsChatbot', 'initializeChatbot', 'OpenRouterAPI', 'ContextManager'].every(name => typeof SWC[name] === 'function'))).toBe(true);
  await send(page, 'hello'); await expect(page.locator('.swc-bot-message')).toHaveCount(2);
});

test('external knowledge base mounts after loading with the custom greeting', async ({ page }) => {
  await page.goto('/examples/advanced-features/03-external-knowledge-base.html');
  await expect(page.getByRole('status').first()).toHaveText('Knowledge base loaded.');
  await expect(page.locator('.swc-bot-message')).toContainText('Shop support');
  await page.getByRole('button', { name: 'Delivery', exact: true }).click();
  await expect(page.locator('.swc-message').last()).toHaveText('Delivery usually takes three business days.');
});

test('clearing during an external history load prevents later restoration', async ({ page }) => {
  await page.goto('/tests/fixtures/browser.html');
  await page.evaluate(({ kb }) => {
    window.fetch = () => new Promise(resolve => { window.releaseHistory = () => resolve(Response.json({ version: '2.0', messages: [{ type: 'bot', content: 'stale history' }] })); });
    const element = document.querySelector('#host'); element.setAttribute('data-swc-load', '/history.json'); SWC.initializeChatbot(kb);
  }, { kb });
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
  await page.evaluate(() => { document.querySelector('#host').chatbotInstance.clearHistory(); releaseHistory(); });
  await expect(page.locator('.swc-message')).toHaveText('Welcome');
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
});
