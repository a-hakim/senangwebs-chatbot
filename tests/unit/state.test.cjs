const { test } = require('node:test');
const assert = require('node:assert/strict');
const SenangWebsChatbot = require('../../src/js/chatbot.js');
const ContextManager = require('../../src/js/context-manager.js');
const kb = [{ id: 'welcome', keyword: ['hello'], reply: '<b>Welcome</b>', options: [{ label: 'Help', reply_id: 'help' }] }, { id: 'help', keyword: ['support'], reply: 'Help' }];
const config = { mode: 'ai-only', endpointURL: 'https://example.test/chat', streaming: false, retryAttempts: 0 };
const history = messages => ({ version: '2.0', messages });

test('keyword, hybrid, and AI routing maintain consistent context', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ choices: [{ message: { content: 'AI reply' } }] }); });
  const bot = new SenangWebsChatbot(kb, {}, { ...config, mode: 'hybrid', hybridThreshold: 0 });
  assert.equal((await bot.handleInput('hello')).source, 'keyword'); assert.equal(calls, 0);
  assert.equal((await bot.handleInput('unmatched')).source, 'api'); assert.equal(calls, 1);
  bot.handleOptionSelection('help'); assert.equal(bot.contextManager.getContext().at(-1).content, 'Help');
  bot.clearHistory(); assert.equal(bot.contextManager.getStats().messageCount, 0);
});

test('empty knowledge bases initialize and route without crashing', async () => {
  const bot = new SenangWebsChatbot([]);
  assert.deepEqual(bot.init(), { reply: '', options: null });
  assert.equal((await bot.handleInput('hello')).source, 'fallback');
  assert.throws(() => new SenangWebsChatbot([{ id: 'bad', keyword: [4], reply: '' }]));
  assert.throws(() => new SenangWebsChatbot([{ ...kb[0], options: [{ label: 'broken', reply_id: 'absent' }] }]));
});

test('invalid imports are atomic and returned history is detached', () => {
  const bot = new SenangWebsChatbot(kb, {}, config); bot.init();
  const before = bot.getHistory();
  assert.equal(bot.loadHistory({ version: '2.0', botName: 'changed', messages: [{ type: 'bot', content: 7 }] }).success, false);
  assert.deepEqual(bot.chatHistory, before.messages); assert.equal(bot.botMetadata.botName, before.botName);
  assert.equal(bot.loadHistory(history([{ type: 'user', content: 'restored' }, { type: 'bot', content: 'reply', source: 'api' }])).success, true);
  assert.deepEqual(bot.contextManager.getContext().slice(1), [{ role: 'user', content: 'restored' }, { role: 'assistant', content: 'reply' }]);
  const copy = bot.getHistory(); copy.messages[0].content = 'mutated'; assert.equal(bot.chatHistory[0].content, 'restored');
});

test('clear and load invalidate pending responses; immediate new turns are independent', async t => {
  let release;
  t.mock.method(globalThis, 'fetch', () => new Promise(resolve => { release = resolve; }));
  const bot = new SenangWebsChatbot(kb, {}, config);
  const pending = bot.handleInput('old');
  assert.equal((await bot.handleInput('overlap')).busy, true);
  assert.equal(bot.chatHistory.filter(msg => msg.type === 'user').length, 1);
  bot.clearHistory();
  t.mock.restoreAll();
  t.mock.method(globalThis, 'fetch', async () => Response.json({ choices: [{ message: { content: 'new reply' } }] }));
  const next = await bot.handleInput('new'); assert.equal(next.reply, 'new reply');
  release(Response.json({ choices: [{ message: { content: 'stale' } }] }));
  assert.equal((await pending).stale, true); assert.equal(bot.chatHistory.some(msg => msg.content === 'stale'), false);
  assert.equal(bot.contextManager.getContext().some(msg => msg.content === 'old'), false);
  bot.loadHistory(history([])); assert.equal(bot.contextManager.getStats().messageCount, 0);
});

test('cancellation preserves partial text once and completes without error notification', async t => {
  const bytes = new TextEncoder().encode('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n');
  t.mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(bytes); } })));
  const bot = new SenangWebsChatbot(kb, {}, { ...config, streaming: true });
  let completed = 0, errors = 0;
  const result = await bot.handleInput('question', { onChunk: () => bot.cancelAIResponse(), onComplete: response => { completed++; assert.equal(response.cancelled, true); }, onError: () => errors++ });
  assert.equal(result.cancelled, true); assert.equal(result.reply, 'partial'); assert.equal(completed, 1); assert.equal(errors, 0);
  assert.equal(bot.chatHistory.filter(msg => msg.type === 'bot').length, 1); assert.equal(bot.aiResponseInProgress, false);
});

test('destroy is idempotent and terminates pending work', async t => {
  t.mock.method(globalThis, 'fetch', () => new Promise(() => {}));
  const bot = new SenangWebsChatbot([], {}, config); const pending = bot.handleInput('hello');
  bot.destroy(); bot.destroy(); assert.equal((await pending).stale, true);
  await assert.rejects(bot.handleInput('new'), /destroyed/);
});

test('context limits and imports enforce bounds without partial replacement', () => {
  const context = new ContextManager({ maxMessages: 0, maxTokens: 0 }); context.addMessage('user', 'hello'); assert.equal(context.getStats().messageCount, 0);
  const limited = new ContextManager({ maxMessages: 2, maxTokens: 2 }); limited.addMessage('user', '123456789'); assert.equal(limited.getStats().estimatedTokens, 0);
  limited.addMessage('user', 'hi'); const before = limited.export();
  assert.equal(limited.import({ contextWindow: [{ role: 'user', content: 'ok' }, { role: 'bad', content: 'invalid' }] }), false);
  assert.deepEqual(limited.contextWindow, before.contextWindow.map(msg => ({ ...msg, tokens: 1 })));
  assert.throws(() => new ContextManager({ maxMessages: -1 }));
});
