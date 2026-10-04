const { numberSetting } = require("./validation.js");

/** A request owns cancellation through connection setup, body reads, and retry backoff. */
class OpenRouterAPI {
  constructor(config = {}) {
    this.apiKey = config.apiKey ?? "";
    this.baseURL = config.baseURL || "https://openrouter.ai/api/v1";
    this.endpointURL = config.endpointURL || null;
    this.model = config.model || "openai/gpt-3.5-turbo";
    this.maxTokens = numberSetting(config.maxTokens, 500, "maxTokens", 1, 32768, true);
    this.temperature = numberSetting(config.temperature, 0.7, "temperature", 0, 2);
    this.streaming = config.streaming !== false;
    this.siteName = config.siteName || "SenangWebs Chatbot";
    this.siteUrl = config.siteUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
    this.timeout = numberSetting(config.timeout, 30000, "timeout", 0, 2147483647, true);
    this.retryAttempts = numberSetting(config.retryAttempts, 2, "retryAttempts", 0, 10, true);
    this.retryDelay = numberSetting(config.retryDelay, 1000, "retryDelay", 0, 2147483647, true);
    this.debug = config.debug === true;
    this.abortController = null;
    this._request = null;
    this.validateConfig();
  }

  validateConfig() {
    for (const [name, value] of [["baseURL", this.baseURL], ["model", this.model], ["siteName", this.siteName], ["siteUrl", this.siteUrl]]) {
      if (typeof value !== "string") throw new TypeError(`${name} must be a string`);
    }
    if (this.endpointURL !== null && typeof this.endpointURL !== "string") throw new TypeError("endpointURL must be a string");
    const rawURL = this.endpointURL || `${this.baseURL.replace(/\/+$/, "")}/chat/completions`;
    try { this.url = new URL(rawURL, typeof document !== "undefined" ? document.baseURI : undefined); }
    catch (_) { throw new TypeError("Invalid API URL; relative endpoints require a browser page"); }
    if (!["http:", "https:"].includes(this.url.protocol) || this.url.username || this.url.password) throw new TypeError("API URL must use HTTP or HTTPS without embedded credentials");
    if (typeof this.apiKey !== "string") throw new TypeError("apiKey must be a string");
    if (this.url.hostname === "openrouter.ai" && !this.apiKey.trim()) throw new Error("OpenRouter API key is required");
  }

  _abortError(request) {
    const error = new Error(request.timedOut ? "Request timed out" : "Request cancelled by user");
    error.name = request.timedOut ? "TimeoutError" : "AbortError";
    return error;
  }

  _abortable(promise, request) {
    const signal = request.controller.signal;
    return new Promise((resolve, reject) => {
      const abort = () => reject(this._abortError(request));
      if (signal.aborted) { Promise.resolve(promise).catch(() => {}); abort(); return; }
      signal.addEventListener("abort", abort, { once: true });
      Promise.resolve(promise).then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
    });
  }

  _callback(callback, value) {
    if (!callback) return;
    try { callback(value); } catch (cause) {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      error.consumerCallback = true;
      throw error;
    }
  }

  async sendMessage(messages, onChunk, onComplete, onError) {
    if (this._request) throw new Error("A request is already in progress");
    if (!Array.isArray(messages) || messages.some(msg => !msg || !["system", "user", "assistant"].includes(msg.role) || typeof msg.content !== "string")) throw new TypeError("Invalid API messages");
    const request = { controller: new AbortController(), timedOut: false, delivered: false };
    this._request = request;
    this.abortController = request.controller;
    const timeoutId = this.timeout > 0 ? setTimeout(() => { request.timedOut = true; request.controller.abort(); }, this.timeout) : null;
    let terminalCalled = false;
    try {
      let result;
      for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
        if (request.controller.signal.aborted) throw this._abortError(request);
        try {
          const response = await this._abortable(this._makeRequest(messages, request), request);
          if (!response.ok) {
            let data = {};
            try { data = await this._abortable(response.json(), request); } catch (error) { if (request.controller.signal.aborted) throw error; }
            throw this._handleAPIError(response.status, data);
          }
          result = this.streaming ? await this._handleStreamingResponse(response, onChunk, request) : await this._handleJSONResponse(response, request);
          break;
        } catch (error) {
          if (request.controller.signal.aborted) throw this._abortError(request);
          if (attempt === this.retryAttempts || request.delivered || this._shouldNotRetry(error)) throw error;
          if (this.debug) console.warn("[OpenRouterAPI] Retrying request", attempt + 1);
          await this._sleep(Math.min(this.retryDelay * 2 ** attempt, 2147483647), request);
        }
      }
      if (request.controller.signal.aborted) throw this._abortError(request);
      terminalCalled = true;
      this._callback(onComplete, result);
      return result;
    } catch (error) {
      if (!terminalCalled) { terminalCalled = true; this._callback(onError, error); }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      if (this._request === request) { this._request = null; this.abortController = null; }
    }
  }

  _makeRequest(messages, request) {
    const headers = { "Content-Type": "application/json" };
    if (this.apiKey.trim()) headers.Authorization = `Bearer ${this.apiKey}`;
    if (this.url.hostname === "openrouter.ai") { headers["HTTP-Referer"] = this.siteUrl; headers["X-Title"] = this.siteName; }
    return fetch(this.url.href, {
      method: "POST", headers,
      body: JSON.stringify({ model: this.model, messages: messages.map(({ role, content }) => ({ role, content })), max_tokens: this.maxTokens, temperature: this.temperature, stream: this.streaming }),
      signal: request.controller.signal,
    });
  }

  async _handleJSONResponse(response, request) {
    let data;
    try { data = await this._abortable(response.json(), request); }
    catch (error) {
      if (error instanceof SyntaxError) throw this._providerError({ message: "Malformed chat completion JSON" });
      throw error;
    }
    if (data?.error) throw this._providerError(data.error);
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw this._providerError({ message: "Invalid chat completion response" });
    return { content, model: data.model || this.model, done: true };
  }

  _providerError(data) {
    const error = new Error(typeof data?.message === "string" ? data.message : "AI provider returned an invalid response");
    error.protocolError = true;
    return error;
  }

  async _handleStreamingResponse(response, onChunk, request) {
    if (!response.body?.getReader) throw this._providerError({ message: "Streaming response body is unavailable" });
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let buffer = "", fullContent = "", eventData = [], eventType = "", ended = false, finished = false;
    let model = this.model;
    const dispatch = () => {
      if (!eventData.length) {
        if (eventType === "error") throw this._providerError({ message: "AI stream failed" });
        eventType = ""; return;
      }
      const payload = eventData.join("\n"), type = eventType;
      eventData = []; eventType = "";
      if (payload.trim() === "[DONE]") { ended = true; finished = true; return; }
      let data;
      try { data = JSON.parse(payload); } catch (_) { throw this._providerError({ message: "Malformed stream data" }); }
      if (!data || typeof data !== "object") throw this._providerError({ message: "Invalid stream event" });
      if (type === "error" || data.error || data.choices?.[0]?.finish_reason === "error") throw this._providerError(data.error || data);
      if (data.model) model = data.model;
      const content = data.choices?.[0]?.delta?.content;
      if (content != null && typeof content !== "string") throw this._providerError({ message: "Invalid stream content" });
      if (content) {
        fullContent += content; request.delivered = true;
        this._callback(onChunk, { content, fullContent, done: false });
      }
      if (data.choices?.[0]?.finish_reason) finished = true;
    };
    const line = value => {
      if (value === "") { dispatch(); return; }
      if (value.startsWith(":")) return;
      const colon = value.indexOf(":"), field = colon < 0 ? value : value.slice(0, colon);
      const body = colon < 0 ? "" : value.slice(colon + 1).replace(/^ /, "");
      if (field === "data") eventData.push(body);
      if (field === "event") eventType = body;
    };
    const drain = eof => {
      let match;
      while ((match = /\r\n|\n|\r/.exec(buffer))) {
        if (!eof && match[0] === "\r" && match.index === buffer.length - 1) break;
        const value = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        line(value);
        if (ended) return;
      }
      if (eof && !ended) { if (buffer) line(buffer); buffer = ""; dispatch(); }
    };
    try {
      while (!ended) {
        const { done, value } = await this._abortable(reader.read(), request);
        if (done) { buffer += decoder.decode(); drain(true); break; }
        buffer += decoder.decode(value, { stream: true }); drain(false);
      }
      if (!finished) throw this._providerError({ message: "AI stream ended before completion" });
      return { content: fullContent, model, done: true };
    } finally {
      try { reader.cancel().catch(() => {}); } catch (_) { /* Already closed. */ }
      try { reader.releaseLock(); } catch (_) { /* A cancelled read may still be settling. */ }
    }
  }

  _handleAPIError(status, data) {
    const message = { 401: "Invalid API key. Please check your API key configuration.", 403: "Access forbidden. Please check your API permissions.", 429: "Rate limit exceeded. Please try again later." }[status];
    const error = new Error(message || (status >= 500 ? "AI service is temporarily unavailable. Please try again." : `API error (${status}): ${data?.error?.message || "Request failed"}`));
    error.status = status; error.isRateLimit = status === 429;
    return error;
  }

  _shouldNotRetry(error) {
    return error.consumerCallback || error.protocolError || error.name === "AbortError" || error.name === "TimeoutError" || (error.status != null && error.status !== 429 && error.status < 500);
  }

  cancel() { if (this._request) this._request.controller.abort(); }
  getModelInfo() { return { model: this.model, maxTokens: this.maxTokens, temperature: this.temperature }; }
  _sleep(ms, request) {
    return new Promise((resolve, reject) => {
      const signal = request.controller.signal;
      if (signal.aborted) { reject(this._abortError(request)); return; }
      const abort = () => { clearTimeout(timer); reject(this._abortError(request)); };
      const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, ms);
      signal.addEventListener("abort", abort, { once: true });
    });
  }
}

module.exports = OpenRouterAPI;
