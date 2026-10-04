const { numberSetting } = require("./validation.js");

/** Sliding conversation window. Token counts are estimates, not provider guarantees. */
class ContextManager {
  constructor(config = {}) {
    this.maxMessages = numberSetting(config.maxMessages, 10, "maxMessages", 0, 10000, true);
    this.maxTokens = numberSetting(config.maxTokens, 2000, "maxTokens", 0, Number.MAX_SAFE_INTEGER, true);
    this.systemPrompt = config.systemPrompt ?? "You are a helpful assistant.";
    if (typeof this.systemPrompt !== "string") throw new TypeError("systemPrompt must be a string");
    this.debug = config.debug === true;
    this.clear();
  }

  addMessage(role, content) {
    if (!["system", "user", "assistant"].includes(role) || typeof content !== "string") throw new TypeError("Invalid context message");
    const message = { role, content, timestamp: new Date().toISOString(), tokens: this._estimateTokens(content) };
    this.contextWindow.push(message);
    this.totalTokensEstimate += message.tokens;
    this._trimContext();
  }

  getContext(includeSystem = true) {
    const messages = this.contextWindow.map(({ role, content }) => ({ role, content }));
    if (includeSystem && this.systemPrompt) messages.unshift({ role: "system", content: this.systemPrompt });
    return messages;
  }

  getLastMessages(count = 5) {
    numberSetting(count, 5, "count", 0, Number.MAX_SAFE_INTEGER, true);
    return count === 0 ? [] : this.contextWindow.slice(-count).map(message => ({ ...message }));
  }
  clear() { this.contextWindow = []; this.totalTokensEstimate = 0; }
  setSystemPrompt(prompt) {
    if (typeof prompt !== "string") throw new TypeError("systemPrompt must be a string");
    this.systemPrompt = prompt;
  }
  getStats() {
    return { messageCount: this.contextWindow.length, estimatedTokens: this.totalTokensEstimate, maxMessages: this.maxMessages, maxTokens: this.maxTokens, systemPrompt: this.systemPrompt ? this.systemPrompt.substring(0, 50) + "..." : null };
  }
  _trimContext() {
    while (this.contextWindow.length && (this.contextWindow.length > this.maxMessages || this.totalTokensEstimate > this.maxTokens)) {
      this.totalTokensEstimate -= this.contextWindow.shift().tokens;
    }
  }
  _estimateTokens(text) { return Math.ceil(text.length / 4); }
  summarize() {
    if (this.contextWindow.length < 3) return "";
    const summary = this.contextWindow.slice(0, Math.floor(this.contextWindow.length / 2)).map(msg => `${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? "..." : ""}`).join("\n");
    return `Previous conversation summary:\n${summary}`;
  }
  export() {
    return { version: "1.0", timestamp: new Date().toISOString(), systemPrompt: this.systemPrompt, maxMessages: this.maxMessages, maxTokens: this.maxTokens, contextWindow: this.contextWindow.map(({ role, content, timestamp }) => ({ role, content, timestamp })), stats: this.getStats() };
  }
  import(data) {
    try {
      if (!data || !Array.isArray(data.contextWindow)) throw new TypeError("Invalid context data");
      const candidate = new ContextManager({ maxMessages: data.maxMessages ?? this.maxMessages, maxTokens: data.maxTokens ?? this.maxTokens, systemPrompt: data.systemPrompt ?? this.systemPrompt, debug: this.debug });
      for (const msg of data.contextWindow) {
        if (!msg) throw new TypeError("Invalid context message");
        candidate.addMessage(msg.role, msg.content);
      }
      this.maxMessages = candidate.maxMessages; this.maxTokens = candidate.maxTokens;
      this.systemPrompt = candidate.systemPrompt; this.contextWindow = candidate.contextWindow;
      this.totalTokensEstimate = candidate.totalTokensEstimate;
      return true;
    } catch (error) {
      if (this.debug) console.warn("[ContextManager] Import rejected", error);
      return false;
    }
  }
  injectKnowledge(knowledge) {
    if (typeof knowledge !== "string") throw new TypeError("knowledge must be a string");
    if (knowledge) this.setSystemPrompt(`${this.systemPrompt}\n\nRelevant knowledge base information:\n${knowledge}`);
  }
}

module.exports = ContextManager;
