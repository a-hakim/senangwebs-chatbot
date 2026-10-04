const { test } = require('node:test');
const assert = require('node:assert/strict');
const OpenRouterAPI = require('../../src/js/openrouter-client.js');
const messages = [{ role: 'user', content: 'Hello' }];
const create = options => new OpenRouterAPI({ endpointURL: 'https://example.test/api/chat', retryAttempts: 0, ...options });
const json = (content = 'Hello') => Response.json({ choices: [{ message: { content } }], model: 'mock/model' });
function sse(text, split = 1) {
  const bytes = new TextEncoder().encode(text);
  return new Response(new ReadableStream({ start(controller) {
    for (let i = 0; i < bytes.length; i += split) controller.enqueue(bytes.slice(i, i + split));
    controller.close();
  } }));
}

test('exact endpoint, proxy headers, JSON mode, and zero temperature', async t => {
  let request;
  t.mock.method(globalThis, 'fetch', async (url, init) => { request = { url, init }; return json(); });
  const result = await create({ streaming: false, temperature: 0 }).sendMessage(messages);
  assert.equal(result.content, 'Hello'); assert.equal(result.model, 'mock/model');
  assert.equal(request.url, 'https://example.test/api/chat');
  assert.deepEqual(request.init.headers, { 'Content-Type': 'application/json' });
  assert.equal(JSON.parse(request.init.body).stream, false); assert.equal(JSON.parse(request.init.body).temperature, 0);
});

test('API roots append the route and OpenRouter alone gets attribution', async t => {
  let request;
  t.mock.method(globalThis, 'fetch', async (url, init) => { request = { url, init }; return json(); });
  const client = new OpenRouterAPI({ apiKey: 'example', streaming: false, baseURL: 'https://openrouter.ai/api/v1/' });
  await client.sendMessage(messages);
  assert.equal(request.url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(request.init.headers.Authorization, 'Bearer example'); assert.ok('X-Title' in request.init.headers);
  assert.throws(() => new OpenRouterAPI(), /key is required/);
});

test('SSE handles byte-split UTF-8, split CRLF, comments, usage, and EOF marker', async t => {
  const events = ': keepalive\r\n\r\ndata: {"model":"mock/model","choices":[{"delta":{"content":"你好 👋"}}]}\r\n\r\ndata: {"choices":[{"delta":{},"finish_reason":"stop"}]}\r\n\r\ndata: {"choices":[],"usage":{"total_tokens":2}}\r\n\r\ndata: [DONE]';
  t.mock.method(globalThis, 'fetch', async () => sse(events));
  const chunks = [];
  const result = await create().sendMessage(messages, chunk => chunks.push(chunk.fullContent));
  assert.equal(result.content, '你好 👋'); assert.equal(result.model, 'mock/model');
  assert.deepEqual(chunks, ['你好 👋']);
});

test('SSE multiline data and bare CR separators', async t => {
  t.mock.method(globalThis, 'fetch', async () => sse('data: {"choices":\rdata: [{"delta":{"content":"ok"},"finish_reason":"stop"}]}\r\r', 2));
  assert.equal((await create().sendMessage(messages)).content, 'ok');
});

test('provider errors and truncated output fail once without retrying partial content', async t => {
  for (const suffix of ['event: error\ndata: {"error":{"message":"Provider failed"}}\n\n', '', 'data: {broken}\n\n']) {
    let requests = 0, errors = 0, completed = 0;
    t.mock.method(globalThis, 'fetch', async () => { requests++; return sse('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n' + suffix, 5); });
    await assert.rejects(create({ retryAttempts: 2 }).sendMessage(messages, () => {}, () => completed++, () => errors++));
    assert.equal(requests, 1); assert.equal(errors, 1); assert.equal(completed, 0);
    t.mock.restoreAll();
  }
});

test('transient HTTP failures retry, authentication failures do not', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => ++calls === 1 ? Response.json({ error: {} }, { status: 503 }) : json());
  await create({ streaming: false, retryAttempts: 1, retryDelay: 0 }).sendMessage(messages);
  assert.equal(calls, 2);
  t.mock.restoreAll(); calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ error: {} }, { status: 401 }); });
  await assert.rejects(create({ retryAttempts: 2 }).sendMessage(messages), /Invalid API key/); assert.equal(calls, 1);
});

test('cancel during connection setup ends the request without retry', async t => {
  let calls = 0, errors = 0;
  t.mock.method(globalThis, 'fetch', () => { calls++; return new Promise(() => {}); });
  const client = create({ retryAttempts: 2 });
  const pending = client.sendMessage(messages, null, null, () => errors++);
  client.cancel();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(calls, 1); assert.equal(errors, 1); assert.equal(client.abortController, null);
});

test('cancel during backoff prevents a new fetch', async t => {
  let calls = 0, backoffStarted;
  const started = new Promise(resolve => { backoffStarted = resolve; });
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({}, { status: 429 }); });
  const client = create({ retryAttempts: 2, retryDelay: 10000 });
  const sleep = client._sleep.bind(client);
  t.mock.method(client, '_sleep', (...args) => { backoffStarted(); return sleep(...args); });
  const pending = client.sendMessage(messages);
  await started; client.cancel(); await assert.rejects(pending, { name: 'AbortError' }); assert.equal(calls, 1);
});

test('timeout remains active after headers arrive and releases the reader', async t => {
  let cancelled = false;
  t.mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({ cancel() { cancelled = true; } })));
  await assert.rejects(create({ timeout: 20, retryAttempts: 2 }).sendMessage(messages), { name: 'TimeoutError' });
  assert.equal(cancelled, true);
});

test('consumer exceptions never retry or cause both terminal callbacks', async t => {
  let calls = 0, errors = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return sse('data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n'); });
  await assert.rejects(create({ retryAttempts: 2 }).sendMessage(messages, () => { throw new Error('consumer'); }, null, () => errors++), /consumer/);
  assert.equal(calls, 1); assert.equal(errors, 1);
  errors = 0;
  await assert.rejects(create().sendMessage(messages, null, () => { throw new Error('complete consumer'); }, () => errors++), /complete consumer/);
  assert.equal(errors, 0);
});

test('invalid configuration is rejected and zero retry/timeout settings are retained', () => {
  for (const config of [{ temperature: NaN }, { retryAttempts: -1 }, { maxTokens: 1.5 }, { endpointURL: 'javascript:alert(1)' }]) assert.throws(() => create(config));
  const client = create({ temperature: 0, retryAttempts: 0, timeout: 0, retryDelay: 0 });
  assert.equal(client.timeout, 0); assert.equal(client.retryAttempts, 0); assert.equal(client.retryDelay, 0);
});
