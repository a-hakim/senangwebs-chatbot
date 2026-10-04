const OpenRouterAPI = require("./openrouter-client.js");
const ContextManager = require("./context-manager.js");
const { numberSetting, validateKnowledgeBase, validateHistory } = require("./validation.js");

class SenangWebsChatbot {
  constructor(knowledgeBase, botMetadata = {}, apiConfig = null) {
    this.knowledgeBase = validateKnowledgeBase(knowledgeBase);
    this.currentNode = null;
    this.chatHistory = [];
    this.botMetadata = { botName: botMetadata.botName || "Bot", themeColor: botMetadata.themeColor || "#007bff", timestamp: new Date().toISOString() };
    this.apiConfig = apiConfig;
    this.mode = apiConfig?.mode || "keyword-only";
    if (!["keyword-only", "ai-only", "hybrid"].includes(this.mode)) throw new TypeError("Invalid conversation mode");
    this.streamingEnabled = apiConfig?.streaming !== false;
    this.hybridThreshold = numberSetting(apiConfig?.hybridThreshold, 0.3, "hybridThreshold", 0, 1);
    this.debug = apiConfig?.debug === true;
    this.aiResponseInProgress = false;
    this._activeResponse = null;
    this._generation = 0;
    this._destroyed = false;
    this._ui = null;
    this.apiClient = null;
    this.contextManager = null;
    if (apiConfig && this.mode !== "keyword-only") {
      this.apiClient = new OpenRouterAPI(apiConfig);
      this.contextManager = new ContextManager({ systemPrompt: apiConfig.systemPrompt, maxMessages: apiConfig.contextMaxMessages, maxTokens: apiConfig.contextMaxTokens, debug: this.debug });
    }
  }

  _assertAlive() { if (this._destroyed) throw new Error("Chatbot has been destroyed"); }
  init() {
    this._assertAlive();
    this.currentNode = this.knowledgeBase.find(node => node.id === "welcome") || this.knowledgeBase[0] || null;
    if (this.currentNode) this.addToHistory("bot", this.currentNode.reply, this.currentNode.id, this.currentNode.options);
    return { reply: this.currentNode?.reply ?? "", options: this.currentNode?.options ?? null };
  }

  addToHistory(type, content, nodeId = null, options = null, source = "keyword", modelInfo = null) {
    const message = { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`, timestamp: new Date().toISOString(), type, content, source };
    if (type === "bot") {
      message.nodeId = nodeId;
      if (options?.length) message.options = options.map(option => ({ ...option }));
      if (modelInfo) message.model = modelInfo.model;
    }
    this.chatHistory.push(message);
  }

  _busyResponse() { return { reply: "Please wait for the current response to complete.", options: null, source: "error", busy: true }; }

  async handleInput(input, callbacks = {}) {
    this._assertAlive();
    if (this.aiResponseInProgress) return this._busyResponse();
    if (typeof input !== "string" || !input.trim()) throw new TypeError("input must be a nonempty string");
    const words = input.toLowerCase().trim().split(/\s+/);
    let bestMatch = null, maxScore = 0;
    for (const node of this.knowledgeBase) {
      let score = 0;
      for (const keyword of node.keyword) {
        const lower = keyword.toLowerCase();
        for (const word of words) if (word.includes(lower) || lower.includes(word)) score++;
      }
      if (score > maxScore) { maxScore = score; bestMatch = node; }
    }
    const confidence = maxScore ? Math.min(0.5 + (maxScore - 1) * 0.1, 1) : 0;
    if (this.debug && this.mode === "hybrid") console.log("[SWC] Keyword confidence", { bestMatch: bestMatch?.id, confidence });
    this.addToHistory("user", input);
    this.contextManager?.addMessage("user", input);
    if (this.mode === "ai-only" || (this.mode === "hybrid" && (!bestMatch || confidence < this.hybridThreshold))) return this.handleAIResponse(input, callbacks);
    if (bestMatch) {
      this.currentNode = bestMatch;
      this.addToHistory("bot", bestMatch.reply, bestMatch.id, bestMatch.options);
      this.contextManager?.addMessage("assistant", bestMatch.reply);
      return { reply: bestMatch.reply, options: bestMatch.options, source: "keyword", confidence };
    }
    const reply = "I'm sorry, I didn't understand that. Can you please rephrase?";
    this.addToHistory("bot", reply, null, null, "fallback");
    this.contextManager?.addMessage("assistant", reply);
    return { reply, options: null, source: "fallback" };
  }

  async handleAIResponse(input, callbacks = {}) {
    this._assertAlive();
    if (this.aiResponseInProgress) return this._busyResponse();
    if (!this.apiClient || !this.contextManager) return { reply: "AI features are not configured properly.", options: null, source: "error" };
    const state = { generation: this._generation, content: "", started: false, cancelled: false, terminalCalled: false, client: this.apiClient };
    this._activeResponse = state;
    this.aiResponseInProgress = true;
    const isCurrent = () => !this._destroyed && state.generation === this._generation && this._activeResponse === state;
    try {
      const messages = this.contextManager.getContext(true);
      const latest = messages[messages.length - 1];
      // Memory limits may evict a long input or disable memory entirely; the active question still belongs in the request.
      if (typeof input === "string" && (latest?.role !== "user" || latest.content !== input)) messages.push({ role: "user", content: input });
      const result = await state.client.sendMessage(messages, chunk => {
        if (!isCurrent() || state.cancelled) return;
        state.content = chunk.fullContent;
        if (!state.started) { state.started = true; callbacks.onStart?.(); }
        callbacks.onChunk?.(chunk);
      });
      if (!isCurrent()) return { reply: "", options: null, source: "api", stale: true };
      this.addToHistory("bot", result.content, null, null, "api", { model: result.model });
      this.contextManager.addMessage("assistant", result.content);
      state.terminalCalled = true;
      callbacks.onComplete?.(result);
      return { reply: result.content, options: null, source: "api", model: result.model };
    } catch (error) {
      if (!isCurrent()) return { reply: "", options: null, source: "api", stale: true };
      if (state.cancelled || error.name === "AbortError") {
        if (state.content) {
          this.addToHistory("bot", state.content, null, null, "api", state.client.getModelInfo());
          this.contextManager.addMessage("assistant", state.content);
        }
        const result = { content: state.content, model: state.client.model, done: true, cancelled: true };
        state.terminalCalled = true;
        callbacks.onComplete?.(result);
        return { reply: state.content, options: null, source: "api", cancelled: true };
      }
      // Consumer callbacks are application failures, not provider failures. Never add duplicate replies.
      if (state.terminalCalled) throw error;
      if (error.consumerCallback) {
        state.terminalCalled = true;
        callbacks.onError?.(error);
        throw error;
      }
      const reply = this._getErrorMessage(error);
      this.addToHistory("bot", reply, null, null, "error");
      state.terminalCalled = true;
      callbacks.onError?.(error);
      return { reply, options: null, source: "error" };
    } finally {
      if (this._activeResponse === state) { this._activeResponse = null; this.aiResponseInProgress = false; }
    }
  }

  cancelAIResponse() {
    if (!this._activeResponse) return false;
    this._activeResponse.cancelled = true;
    this._activeResponse.client.cancel();
    return true;
  }

  _getErrorMessage(error) {
    if (error.status === 401) return "API authentication failed. Please check your API configuration.";
    if (error.status === 429) return "Too many requests. Please wait a moment and try again.";
    if (error.name === "TimeoutError") return "The AI request timed out. Please try again.";
    return "The AI service could not complete your request. Please try again.";
  }

  _enhancePromptWithKnowledge(input) {
    const relevant = this.knowledgeBase.filter(node => node.keyword.some(word => input.toLowerCase().includes(word.toLowerCase())));
    if (relevant.length && this.contextManager) this.contextManager.injectKnowledge(relevant.map(node => `Topic: ${node.id}\nInformation: ${node.reply}`).join("\n\n"));
  }
  getAPIStatus() {
    return { enabled: !!this.apiClient, mode: this.mode, streaming: this.streamingEnabled, model: this.apiClient?.getModelInfo() ?? null, contextStats: this.contextManager?.getStats() ?? null, responseInProgress: this.aiResponseInProgress };
  }

  handleOptionSelection(replyId) {
    this._assertAlive();
    if (this.aiResponseInProgress) return this._busyResponse();
    const node = this.knowledgeBase.find(candidate => candidate.id === replyId);
    const reply = node?.reply ?? "I'm sorry, I couldn't find the appropriate response. How else can I assist you?";
    if (node) this.currentNode = node;
    this.addToHistory("bot", reply, node?.id ?? null, node?.options, node ? "keyword" : "fallback");
    this.contextManager?.addMessage("assistant", reply);
    return { reply, options: node?.options ?? null, source: node ? "keyword" : "fallback" };
  }

  exportHistory() {
    const history = { ...this.getHistory(), apiConfig: this.apiClient ? { model: this.apiClient.model, lastUsed: new Date().toISOString() } : null };
    const json = JSON.stringify(history, null, 2);
    this._ui?.emit("swc:history-exported", { messageCount: this.chatHistory.length, historyJSON: json });
    return json;
  }
  getCurrentState() { return { currentNodeId: this.currentNode?.id ?? null, messageCount: this.chatHistory.length, lastMessageTimestamp: this.chatHistory[this.chatHistory.length - 1]?.timestamp ?? null }; }
  getHistory() {
    return { version: "2.0", timestamp: new Date().toISOString(), botName: this.botMetadata.botName, themeColor: this.botMetadata.themeColor, messages: JSON.parse(JSON.stringify(this.chatHistory)), currentNodeId: this.currentNode?.id ?? null, mode: this.mode, apiEnabled: !!this.apiClient };
  }

  _invalidatePending() {
    this._generation++;
    if (this._activeResponse) {
      this._activeResponse.client.cancel();
      // A cancelled transport may still be unwinding. New turns get an independent client.
      this.apiClient = new OpenRouterAPI(this.apiConfig);
    }
    this._activeResponse = null; this.aiResponseInProgress = false;
    this._ui?.reset();
  }

  loadHistory(historyData) {
    this._assertAlive();
    let data, context;
    try {
      data = validateHistory(historyData);
      if (this.contextManager) {
        context = new ContextManager({ maxMessages: this.contextManager.maxMessages, maxTokens: this.contextManager.maxTokens, systemPrompt: this.contextManager.systemPrompt, debug: this.debug });
        for (const msg of data.messages) if (msg.source !== "error") context.addMessage(msg.type === "user" ? "user" : "assistant", msg.content);
      }
    } catch (error) {
      if (this.debug) console.warn("[SWC] History rejected", error);
      return { success: false, error: error.message, messages: [] };
    }
    this._invalidatePending();
    if (data.botName != null) this.botMetadata.botName = data.botName;
    if (data.themeColor != null) this.botMetadata.themeColor = data.themeColor;
    this.chatHistory = data.messages;
    this.currentNode = this.knowledgeBase.find(node => node.id === data.currentNodeId) || null;
    if (context) this.contextManager = context;
    this._ui?.renderHistory();
    this._ui?.emit("swc:history-loaded", { messageCount: this.chatHistory.length });
    return { success: true, messageCount: this.chatHistory.length, messages: JSON.parse(JSON.stringify(this.chatHistory)) };
  }

  clearHistory() {
    this._assertAlive();
    this._invalidatePending(); this.chatHistory = []; this.contextManager?.clear();
    const result = this.init();
    this._ui?.renderHistory(); this._ui?.emit("swc:history-cleared", {});
    return result;
  }

  destroy() {
    if (this._destroyed) return;
    this._generation++; this._destroyed = true;
    this._activeResponse?.client.cancel(); this.apiClient?.cancel();
    this._activeResponse = null; this.aiResponseInProgress = false;
    this.contextManager?.clear();
    this._ui?.destroy(); this._ui = null;
  }
}

module.exports = SenangWebsChatbot;
