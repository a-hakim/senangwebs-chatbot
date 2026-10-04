(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["SWC"] = factory();
	else
		root["SWC"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 321
(module, __unused_webpack_exports, __webpack_require__) {

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
const DOMPurify = __webpack_require__(454);
function mountChatbot(element, chatbot) {
  let _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
    _ref$replyDuration = _ref.replyDuration,
    replyDuration = _ref$replyDuration === void 0 ? 0 : _ref$replyDuration,
    _ref$chatDisplayStyle = _ref.chatDisplayStyle,
    chatDisplayStyle = _ref$chatDisplayStyle === void 0 ? "classic" : _ref$chatDisplayStyle,
    _ref$loadHistory = _ref.loadHistory,
    loadHistory = _ref$loadHistory === void 0 ? null : _ref$loadHistory;
  const doc = element.ownerDocument,
    win = doc.defaultView;
  const create = (tag, className, text) => {
    const node = doc.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const chatDisplay = create("div", `swc-chat-display ${chatDisplayStyle === "modern" ? "swc-modern" : "swc-classic"}`);
  chatDisplay.setAttribute("role", "log");
  chatDisplay.setAttribute("aria-label", "Chat transcript");
  chatDisplay.setAttribute("aria-live", "off");
  chatDisplay.tabIndex = 0;
  const options = create("div", "swc-options-container");
  const inputContainer = create("div", "swc-input-container");
  const input = create("input", "swc-user-input");
  input.type = "text";
  input.placeholder = "Type your message...";
  input.setAttribute("aria-label", "Message");
  const send = create("button", "swc-send-button", "Send");
  send.type = "button";
  const status = create("div", "swc-status swc-visually-hidden");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");
  const typing = create("div", "swc-typing-indicator");
  typing.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 3; i++) typing.appendChild(doc.createElement("span"));
  inputContainer.append(input, send);
  element.append(chatDisplay, options, inputContainer, status);
  const owned = [chatDisplay, options, inputContainer, status];
  const previousTheme = element.style.getPropertyValue("--swc-theme-color"),
    previousName = element.style.getPropertyValue("--swc-bot-name");
  const previousThemePriority = element.style.getPropertyPriority("--swc-theme-color"),
    previousNamePriority = element.style.getPropertyPriority("--swc-bot-name");
  let busy = false,
    revision = 0,
    destroyed = false,
    frame = null,
    pendingUpdate = null,
    stop = null,
    historyController = null;
  const delays = new Map();
  const purifier = DOMPurify.sanitize ? DOMPurify : DOMPurify(win);
  function applyTheme() {
    element.style.setProperty("--swc-theme-color", chatbot.botMetadata.themeColor);
    // JSON string escaping prevents names containing quotes from corrupting CSS content values.
    element.style.setProperty("--swc-bot-name", JSON.stringify(chatbot.botMetadata.botName));
  }
  function announce(text) {
    status.textContent = text;
  }
  function setBusy(value) {
    busy = value;
    input.disabled = value;
    send.disabled = value;
    options.querySelectorAll("button").forEach(button => {
      button.disabled = value;
    });
    chatDisplay.setAttribute("aria-busy", String(value));
  }
  function scroll() {
    var _win$matchMedia;
    const reduced = (_win$matchMedia = win.matchMedia) === null || _win$matchMedia === void 0 ? void 0 : _win$matchMedia.call(win, "(prefers-reduced-motion: reduce)").matches;
    chatDisplay.scrollTo({
      top: chatDisplay.scrollHeight,
      behavior: reduced ? "auto" : "smooth"
    });
  }
  function flushUpdate() {
    if (frame !== null) {
      win.cancelAnimationFrame(frame);
      frame = null;
    }
    if (pendingUpdate) {
      const _pendingUpdate = pendingUpdate,
        node = _pendingUpdate.node,
        content = _pendingUpdate.content;
      pendingUpdate = null;
      if (node.isConnected) node.textContent = content;
    }
    if (!destroyed) scroll();
  }
  function scheduleUpdate(node, content) {
    pendingUpdate = {
      node,
      content
    };
    if (frame === null) frame = win.requestAnimationFrame(() => {
      frame = null;
      flushUpdate();
    });
  }
  function renderMessage(message) {
    const node = create("div", `swc-message swc-${message.type}-message${message.source === "api" ? " swc-ai-message" : ""}${message.source === "error" ? " swc-error-message" : ""}`);
    if (message.type === "user" || ["api", "error", "fallback"].includes(message.source)) node.textContent = message.content;else node.appendChild(purifier.sanitize(message.content, {
      USE_PROFILES: {
        html: true
      },
      FORBID_TAGS: ["style"],
      RETURN_DOM_FRAGMENT: true
    }));
    chatDisplay.appendChild(node);
    return node;
  }
  function renderOptions(items) {
    options.replaceChildren();
    options.style.display = items !== null && items !== void 0 && items.length ? "flex" : "none";
    for (const item of items || []) {
      const button = create("button", "swc-option-button", item.label);
      button.type = "button";
      button.dataset.replyId = item.reply_id;
      button.disabled = busy;
      options.appendChild(button);
    }
  }
  function renderHistory() {
    var _chatbot$chatHistory;
    chatDisplay.replaceChildren();
    applyTheme();
    for (const message of chatbot.chatHistory) renderMessage(message);
    renderOptions((_chatbot$chatHistory = chatbot.chatHistory[chatbot.chatHistory.length - 1]) === null || _chatbot$chatHistory === void 0 ? void 0 : _chatbot$chatHistory.options);
    scroll();
  }
  function removeStop() {
    var _stop;
    (_stop = stop) === null || _stop === void 0 || _stop.remove();
    stop = null;
  }
  function reset() {
    var _historyController;
    revision++;
    (_historyController = historyController) === null || _historyController === void 0 || _historyController.abort();
    historyController = null;
    for (const _ref2 of delays) {
      var _ref3 = _slicedToArray(_ref2, 2);
      const timer = _ref3[0];
      const resolve = _ref3[1];
      win.clearTimeout(timer);
      resolve(false);
    }
    delays.clear();
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = null;
    pendingUpdate = null;
    removeStop();
    typing.remove();
    setBusy(false);
    announce("");
  }
  function delay(ms) {
    if (!ms) return Promise.resolve(true);
    return new Promise(resolve => {
      const timer = win.setTimeout(() => {
        delays.delete(timer);
        resolve(true);
      }, ms);
      delays.set(timer, resolve);
    });
  }
  function addStop() {
    stop = create("button", "swc-stop-button", "Stop");
    stop.type = "button";
    stop.setAttribute("aria-label", "Stop AI response");
    stop.addEventListener("click", () => {
      chatbot.cancelAIResponse();
      stop.disabled = true;
      announce("Stopping response");
    });
    inputContainer.prepend(stop);
  }
  async function submit() {
    var _historyController2;
    let replyId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    if (destroyed || busy || chatbot.aiResponseInProgress) return;
    const message = input.value.trim();
    if (replyId === null && !message) return;
    const operation = ++revision;
    (_historyController2 = historyController) === null || _historyController2 === void 0 || _historyController2.abort();
    historyController = null;
    setBusy(true);
    announce("Assistant is replying");
    if (replyId === null) {
      renderMessage({
        type: "user",
        content: message
      });
      input.value = "";
    }
    chatDisplay.appendChild(typing);
    scroll();
    let streamingNode = null;
    const current = () => !destroyed && revision === operation;
    try {
      const wait = replyId === null ? replyDuration : Math.max(replyDuration, 500);
      if (!(await delay(wait)) || !current()) return;
      if (replyId === null && chatbot.apiClient) addStop();
      const response = replyId !== null ? chatbot.handleOptionSelection(replyId) : await chatbot.handleInput(message, {
        onStart: () => {
          if (!current()) return;
          typing.remove();
          streamingNode = renderMessage({
            type: "bot",
            content: "",
            source: "api"
          });
          streamingNode.classList.add("swc-streaming");
        },
        onChunk: chunk => {
          if (current() && streamingNode) scheduleUpdate(streamingNode, chunk.fullContent);
        }
      });
      if (!current() || response.stale || response.busy) return;
      flushUpdate();
      typing.remove();
      let displayedText = response.reply;
      if (streamingNode && response.source === "api") {
        streamingNode.textContent = response.reply;
        streamingNode.classList.remove("swc-streaming");
        if (response.cancelled && !response.reply) streamingNode.remove();
      } else {
        var _streamingNode;
        (_streamingNode = streamingNode) === null || _streamingNode === void 0 || _streamingNode.remove();
        if (response.reply) displayedText = renderMessage({
          type: "bot",
          content: response.reply,
          source: response.source
        }).textContent;
      }
      renderOptions(response.options);
      announce(response.cancelled ? `Response stopped. ${displayedText}` : `${chatbot.botMetadata.botName}: ${displayedText}`);
      scroll();
    } catch (error) {
      if (current()) {
        var _streamingNode2;
        typing.remove();
        (_streamingNode2 = streamingNode) === null || _streamingNode2 === void 0 || _streamingNode2.classList.remove("swc-streaming");
        renderMessage({
          type: "bot",
          content: "The message could not be processed. Please try again.",
          source: "error"
        });
        announce("The message could not be processed. Please try again.");
        if (chatbot.debug) console.warn("[SWC] UI operation failed", error);
      }
    } finally {
      if (current()) {
        removeStop();
        typing.remove();
        setBusy(false);
        input.focus({
          preventScroll: true
        });
      }
    }
  }
  const sendClick = () => {
    void submit();
  };
  const keydown = event => {
    if (event.key === "Enter" && !event.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      void submit();
    }
  };
  const optionClick = event => {
    const button = event.target.closest("button[data-reply-id]");
    if (button && options.contains(button)) void submit(button.dataset.replyId);
  };
  send.addEventListener("click", sendClick);
  input.addEventListener("keydown", keydown);
  options.addEventListener("click", optionClick);
  chatbot._ui = {
    reset,
    renderHistory,
    emit: (name, detail) => {
      if (!destroyed) element.dispatchEvent(new win.CustomEvent(name, {
        detail: {
          ...detail,
          timestamp: new Date().toISOString()
        }
      }));
    },
    destroy: () => {
      destroyed = true;
      reset();
      send.removeEventListener("click", sendClick);
      input.removeEventListener("keydown", keydown);
      options.removeEventListener("click", optionClick);
      owned.forEach(node => node.remove());
      if (previousTheme) element.style.setProperty("--swc-theme-color", previousTheme, previousThemePriority);else element.style.removeProperty("--swc-theme-color");
      if (previousName) element.style.setProperty("--swc-bot-name", previousName, previousNamePriority);else element.style.removeProperty("--swc-bot-name");
      if (element.chatbotInstance === chatbot) delete element.chatbotInstance;
    }
  };
  applyTheme();
  const welcome = () => {
    var _chatDisplay$lastElem;
    chatbot.init();
    renderHistory();
    announce(((_chatDisplay$lastElem = chatDisplay.lastElementChild) === null || _chatDisplay$lastElem === void 0 ? void 0 : _chatDisplay$lastElem.textContent) ?? "");
  };
  if (!loadHistory) {
    welcome();
    return;
  }
  // Parse inline JSON first; all other strings are URLs, including root-relative paths.
  if (/^\s*[\[{]/.test(loadHistory)) {
    if (!chatbot.loadHistory(loadHistory).success) welcome();
    return;
  }
  setBusy(true);
  announce("Loading conversation");
  const operation = revision;
  historyController = new AbortController();
  const historySignal = historyController.signal;
  Promise.resolve().then(() => fetch(new URL(loadHistory, doc.baseURI).href, {
    signal: historySignal
  })).then(response => {
    if (!response.ok) throw new Error("History could not be loaded");
    return response.json();
  }).then(data => {
    if (!destroyed && revision === operation) {
      if (!chatbot.loadHistory(data).success) {
        setBusy(false);
        welcome();
      }
    }
  }).catch(() => {
    if (!destroyed && revision === operation) {
      setBusy(false);
      welcome();
    }
  });
}
module.exports = {
  mountChatbot
};

/***/ },

/***/ 314
(module, __unused_webpack_exports, __webpack_require__) {

const OpenRouterAPI = __webpack_require__(74);
const ContextManager = __webpack_require__(708);
const _require = __webpack_require__(490),
  numberSetting = _require.numberSetting,
  validateKnowledgeBase = _require.validateKnowledgeBase,
  validateHistory = _require.validateHistory;
class SenangWebsChatbot {
  constructor(knowledgeBase) {
    let botMetadata = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let apiConfig = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    this.knowledgeBase = validateKnowledgeBase(knowledgeBase);
    this.currentNode = null;
    this.chatHistory = [];
    this.botMetadata = {
      botName: botMetadata.botName || "Bot",
      themeColor: botMetadata.themeColor || "#007bff",
      timestamp: new Date().toISOString()
    };
    this.apiConfig = apiConfig;
    this.mode = (apiConfig === null || apiConfig === void 0 ? void 0 : apiConfig.mode) || "keyword-only";
    if (!["keyword-only", "ai-only", "hybrid"].includes(this.mode)) throw new TypeError("Invalid conversation mode");
    this.streamingEnabled = (apiConfig === null || apiConfig === void 0 ? void 0 : apiConfig.streaming) !== false;
    this.hybridThreshold = numberSetting(apiConfig === null || apiConfig === void 0 ? void 0 : apiConfig.hybridThreshold, 0.3, "hybridThreshold", 0, 1);
    this.debug = (apiConfig === null || apiConfig === void 0 ? void 0 : apiConfig.debug) === true;
    this.aiResponseInProgress = false;
    this._activeResponse = null;
    this._generation = 0;
    this._destroyed = false;
    this._ui = null;
    this.apiClient = null;
    this.contextManager = null;
    if (apiConfig && this.mode !== "keyword-only") {
      this.apiClient = new OpenRouterAPI(apiConfig);
      this.contextManager = new ContextManager({
        systemPrompt: apiConfig.systemPrompt,
        maxMessages: apiConfig.contextMaxMessages,
        maxTokens: apiConfig.contextMaxTokens,
        debug: this.debug
      });
    }
  }
  _assertAlive() {
    if (this._destroyed) throw new Error("Chatbot has been destroyed");
  }
  init() {
    var _this$currentNode, _this$currentNode2;
    this._assertAlive();
    this.currentNode = this.knowledgeBase.find(node => node.id === "welcome") || this.knowledgeBase[0] || null;
    if (this.currentNode) this.addToHistory("bot", this.currentNode.reply, this.currentNode.id, this.currentNode.options);
    return {
      reply: ((_this$currentNode = this.currentNode) === null || _this$currentNode === void 0 ? void 0 : _this$currentNode.reply) ?? "",
      options: ((_this$currentNode2 = this.currentNode) === null || _this$currentNode2 === void 0 ? void 0 : _this$currentNode2.options) ?? null
    };
  }
  addToHistory(type, content) {
    let nodeId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    let options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    let source = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "keyword";
    let modelInfo = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date().toISOString(),
      type,
      content,
      source
    };
    if (type === "bot") {
      message.nodeId = nodeId;
      if (options !== null && options !== void 0 && options.length) message.options = options.map(option => ({
        ...option
      }));
      if (modelInfo) message.model = modelInfo.model;
    }
    this.chatHistory.push(message);
  }
  _busyResponse() {
    return {
      reply: "Please wait for the current response to complete.",
      options: null,
      source: "error",
      busy: true
    };
  }
  async handleInput(input) {
    var _bestMatch, _this$contextManager, _this$contextManager3;
    let callbacks = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this._assertAlive();
    if (this.aiResponseInProgress) return this._busyResponse();
    if (typeof input !== "string" || !input.trim()) throw new TypeError("input must be a nonempty string");
    const words = input.toLowerCase().trim().split(/\s+/);
    let bestMatch = null,
      maxScore = 0;
    for (const node of this.knowledgeBase) {
      let score = 0;
      for (const keyword of node.keyword) {
        const lower = keyword.toLowerCase();
        for (const word of words) if (word.includes(lower) || lower.includes(word)) score++;
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = node;
      }
    }
    const confidence = maxScore ? Math.min(0.5 + (maxScore - 1) * 0.1, 1) : 0;
    if (this.debug && this.mode === "hybrid") console.log("[SWC] Keyword confidence", {
      bestMatch: (_bestMatch = bestMatch) === null || _bestMatch === void 0 ? void 0 : _bestMatch.id,
      confidence
    });
    this.addToHistory("user", input);
    (_this$contextManager = this.contextManager) === null || _this$contextManager === void 0 || _this$contextManager.addMessage("user", input);
    if (this.mode === "ai-only" || this.mode === "hybrid" && (!bestMatch || confidence < this.hybridThreshold)) return this.handleAIResponse(input, callbacks);
    if (bestMatch) {
      var _this$contextManager2;
      this.currentNode = bestMatch;
      this.addToHistory("bot", bestMatch.reply, bestMatch.id, bestMatch.options);
      (_this$contextManager2 = this.contextManager) === null || _this$contextManager2 === void 0 || _this$contextManager2.addMessage("assistant", bestMatch.reply);
      return {
        reply: bestMatch.reply,
        options: bestMatch.options,
        source: "keyword",
        confidence
      };
    }
    const reply = "I'm sorry, I didn't understand that. Can you please rephrase?";
    this.addToHistory("bot", reply, null, null, "fallback");
    (_this$contextManager3 = this.contextManager) === null || _this$contextManager3 === void 0 || _this$contextManager3.addMessage("assistant", reply);
    return {
      reply,
      options: null,
      source: "fallback"
    };
  }
  async handleAIResponse(input) {
    let callbacks = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this._assertAlive();
    if (this.aiResponseInProgress) return this._busyResponse();
    if (!this.apiClient || !this.contextManager) return {
      reply: "AI features are not configured properly.",
      options: null,
      source: "error"
    };
    const state = {
      generation: this._generation,
      content: "",
      started: false,
      cancelled: false,
      terminalCalled: false,
      client: this.apiClient
    };
    this._activeResponse = state;
    this.aiResponseInProgress = true;
    const isCurrent = () => !this._destroyed && state.generation === this._generation && this._activeResponse === state;
    try {
      var _callbacks$onComplete;
      const messages = this.contextManager.getContext(true);
      const latest = messages[messages.length - 1];
      // Memory limits may evict a long input or disable memory entirely; the active question still belongs in the request.
      if (typeof input === "string" && ((latest === null || latest === void 0 ? void 0 : latest.role) !== "user" || latest.content !== input)) messages.push({
        role: "user",
        content: input
      });
      const result = await state.client.sendMessage(messages, chunk => {
        var _callbacks$onChunk;
        if (!isCurrent() || state.cancelled) return;
        state.content = chunk.fullContent;
        if (!state.started) {
          var _callbacks$onStart;
          state.started = true;
          (_callbacks$onStart = callbacks.onStart) === null || _callbacks$onStart === void 0 || _callbacks$onStart.call(callbacks);
        }
        (_callbacks$onChunk = callbacks.onChunk) === null || _callbacks$onChunk === void 0 || _callbacks$onChunk.call(callbacks, chunk);
      });
      if (!isCurrent()) return {
        reply: "",
        options: null,
        source: "api",
        stale: true
      };
      this.addToHistory("bot", result.content, null, null, "api", {
        model: result.model
      });
      this.contextManager.addMessage("assistant", result.content);
      state.terminalCalled = true;
      (_callbacks$onComplete = callbacks.onComplete) === null || _callbacks$onComplete === void 0 || _callbacks$onComplete.call(callbacks, result);
      return {
        reply: result.content,
        options: null,
        source: "api",
        model: result.model
      };
    } catch (error) {
      var _callbacks$onError2;
      if (!isCurrent()) return {
        reply: "",
        options: null,
        source: "api",
        stale: true
      };
      if (state.cancelled || error.name === "AbortError") {
        var _callbacks$onComplete2;
        if (state.content) {
          this.addToHistory("bot", state.content, null, null, "api", state.client.getModelInfo());
          this.contextManager.addMessage("assistant", state.content);
        }
        const result = {
          content: state.content,
          model: state.client.model,
          done: true,
          cancelled: true
        };
        state.terminalCalled = true;
        (_callbacks$onComplete2 = callbacks.onComplete) === null || _callbacks$onComplete2 === void 0 || _callbacks$onComplete2.call(callbacks, result);
        return {
          reply: state.content,
          options: null,
          source: "api",
          cancelled: true
        };
      }
      // Consumer callbacks are application failures, not provider failures. Never add duplicate replies.
      if (state.terminalCalled) throw error;
      if (error.consumerCallback) {
        var _callbacks$onError;
        state.terminalCalled = true;
        (_callbacks$onError = callbacks.onError) === null || _callbacks$onError === void 0 || _callbacks$onError.call(callbacks, error);
        throw error;
      }
      const reply = this._getErrorMessage(error);
      this.addToHistory("bot", reply, null, null, "error");
      state.terminalCalled = true;
      (_callbacks$onError2 = callbacks.onError) === null || _callbacks$onError2 === void 0 || _callbacks$onError2.call(callbacks, error);
      return {
        reply,
        options: null,
        source: "error"
      };
    } finally {
      if (this._activeResponse === state) {
        this._activeResponse = null;
        this.aiResponseInProgress = false;
      }
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
    var _this$apiClient, _this$contextManager4;
    return {
      enabled: !!this.apiClient,
      mode: this.mode,
      streaming: this.streamingEnabled,
      model: ((_this$apiClient = this.apiClient) === null || _this$apiClient === void 0 ? void 0 : _this$apiClient.getModelInfo()) ?? null,
      contextStats: ((_this$contextManager4 = this.contextManager) === null || _this$contextManager4 === void 0 ? void 0 : _this$contextManager4.getStats()) ?? null,
      responseInProgress: this.aiResponseInProgress
    };
  }
  handleOptionSelection(replyId) {
    var _this$contextManager5;
    this._assertAlive();
    if (this.aiResponseInProgress) return this._busyResponse();
    const node = this.knowledgeBase.find(candidate => candidate.id === replyId);
    const reply = (node === null || node === void 0 ? void 0 : node.reply) ?? "I'm sorry, I couldn't find the appropriate response. How else can I assist you?";
    if (node) this.currentNode = node;
    this.addToHistory("bot", reply, (node === null || node === void 0 ? void 0 : node.id) ?? null, node === null || node === void 0 ? void 0 : node.options, node ? "keyword" : "fallback");
    (_this$contextManager5 = this.contextManager) === null || _this$contextManager5 === void 0 || _this$contextManager5.addMessage("assistant", reply);
    return {
      reply,
      options: (node === null || node === void 0 ? void 0 : node.options) ?? null,
      source: node ? "keyword" : "fallback"
    };
  }
  exportHistory() {
    var _this$_ui;
    const history = {
      ...this.getHistory(),
      apiConfig: this.apiClient ? {
        model: this.apiClient.model,
        lastUsed: new Date().toISOString()
      } : null
    };
    const json = JSON.stringify(history, null, 2);
    (_this$_ui = this._ui) === null || _this$_ui === void 0 || _this$_ui.emit("swc:history-exported", {
      messageCount: this.chatHistory.length,
      historyJSON: json
    });
    return json;
  }
  getCurrentState() {
    var _this$currentNode3, _this$chatHistory;
    return {
      currentNodeId: ((_this$currentNode3 = this.currentNode) === null || _this$currentNode3 === void 0 ? void 0 : _this$currentNode3.id) ?? null,
      messageCount: this.chatHistory.length,
      lastMessageTimestamp: ((_this$chatHistory = this.chatHistory[this.chatHistory.length - 1]) === null || _this$chatHistory === void 0 ? void 0 : _this$chatHistory.timestamp) ?? null
    };
  }
  getHistory() {
    var _this$currentNode4;
    return {
      version: "2.0",
      timestamp: new Date().toISOString(),
      botName: this.botMetadata.botName,
      themeColor: this.botMetadata.themeColor,
      messages: JSON.parse(JSON.stringify(this.chatHistory)),
      currentNodeId: ((_this$currentNode4 = this.currentNode) === null || _this$currentNode4 === void 0 ? void 0 : _this$currentNode4.id) ?? null,
      mode: this.mode,
      apiEnabled: !!this.apiClient
    };
  }
  _invalidatePending() {
    var _this$_ui2;
    this._generation++;
    if (this._activeResponse) {
      this._activeResponse.client.cancel();
      // A cancelled transport may still be unwinding. New turns get an independent client.
      this.apiClient = new OpenRouterAPI(this.apiConfig);
    }
    this._activeResponse = null;
    this.aiResponseInProgress = false;
    (_this$_ui2 = this._ui) === null || _this$_ui2 === void 0 || _this$_ui2.reset();
  }
  loadHistory(historyData) {
    var _this$_ui3, _this$_ui4;
    this._assertAlive();
    let data, context;
    try {
      data = validateHistory(historyData);
      if (this.contextManager) {
        context = new ContextManager({
          maxMessages: this.contextManager.maxMessages,
          maxTokens: this.contextManager.maxTokens,
          systemPrompt: this.contextManager.systemPrompt,
          debug: this.debug
        });
        for (const msg of data.messages) if (msg.source !== "error") context.addMessage(msg.type === "user" ? "user" : "assistant", msg.content);
      }
    } catch (error) {
      if (this.debug) console.warn("[SWC] History rejected", error);
      return {
        success: false,
        error: error.message,
        messages: []
      };
    }
    this._invalidatePending();
    if (data.botName != null) this.botMetadata.botName = data.botName;
    if (data.themeColor != null) this.botMetadata.themeColor = data.themeColor;
    this.chatHistory = data.messages;
    this.currentNode = this.knowledgeBase.find(node => node.id === data.currentNodeId) || null;
    if (context) this.contextManager = context;
    (_this$_ui3 = this._ui) === null || _this$_ui3 === void 0 || _this$_ui3.renderHistory();
    (_this$_ui4 = this._ui) === null || _this$_ui4 === void 0 || _this$_ui4.emit("swc:history-loaded", {
      messageCount: this.chatHistory.length
    });
    return {
      success: true,
      messageCount: this.chatHistory.length,
      messages: JSON.parse(JSON.stringify(this.chatHistory))
    };
  }
  clearHistory() {
    var _this$contextManager6, _this$_ui5, _this$_ui6;
    this._assertAlive();
    this._invalidatePending();
    this.chatHistory = [];
    (_this$contextManager6 = this.contextManager) === null || _this$contextManager6 === void 0 || _this$contextManager6.clear();
    const result = this.init();
    (_this$_ui5 = this._ui) === null || _this$_ui5 === void 0 || _this$_ui5.renderHistory();
    (_this$_ui6 = this._ui) === null || _this$_ui6 === void 0 || _this$_ui6.emit("swc:history-cleared", {});
    return result;
  }
  destroy() {
    var _this$_activeResponse, _this$apiClient2, _this$contextManager7, _this$_ui7;
    if (this._destroyed) return;
    this._generation++;
    this._destroyed = true;
    (_this$_activeResponse = this._activeResponse) === null || _this$_activeResponse === void 0 || _this$_activeResponse.client.cancel();
    (_this$apiClient2 = this.apiClient) === null || _this$apiClient2 === void 0 || _this$apiClient2.cancel();
    this._activeResponse = null;
    this.aiResponseInProgress = false;
    (_this$contextManager7 = this.contextManager) === null || _this$contextManager7 === void 0 || _this$contextManager7.clear();
    (_this$_ui7 = this._ui) === null || _this$_ui7 === void 0 || _this$_ui7.destroy();
    this._ui = null;
  }
}
module.exports = SenangWebsChatbot;

/***/ },

/***/ 708
(module, __unused_webpack_exports, __webpack_require__) {

const _require = __webpack_require__(490),
  numberSetting = _require.numberSetting;

/** Sliding conversation window. Token counts are estimates, not provider guarantees. */
class ContextManager {
  constructor() {
    let config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.maxMessages = numberSetting(config.maxMessages, 10, "maxMessages", 0, 10000, true);
    this.maxTokens = numberSetting(config.maxTokens, 2000, "maxTokens", 0, Number.MAX_SAFE_INTEGER, true);
    this.systemPrompt = config.systemPrompt ?? "You are a helpful assistant.";
    if (typeof this.systemPrompt !== "string") throw new TypeError("systemPrompt must be a string");
    this.debug = config.debug === true;
    this.clear();
  }
  addMessage(role, content) {
    if (!["system", "user", "assistant"].includes(role) || typeof content !== "string") throw new TypeError("Invalid context message");
    const message = {
      role,
      content,
      timestamp: new Date().toISOString(),
      tokens: this._estimateTokens(content)
    };
    this.contextWindow.push(message);
    this.totalTokensEstimate += message.tokens;
    this._trimContext();
  }
  getContext() {
    let includeSystem = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    const messages = this.contextWindow.map(_ref => {
      let role = _ref.role,
        content = _ref.content;
      return {
        role,
        content
      };
    });
    if (includeSystem && this.systemPrompt) messages.unshift({
      role: "system",
      content: this.systemPrompt
    });
    return messages;
  }
  getLastMessages() {
    let count = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 5;
    numberSetting(count, 5, "count", 0, Number.MAX_SAFE_INTEGER, true);
    return count === 0 ? [] : this.contextWindow.slice(-count).map(message => ({
      ...message
    }));
  }
  clear() {
    this.contextWindow = [];
    this.totalTokensEstimate = 0;
  }
  setSystemPrompt(prompt) {
    if (typeof prompt !== "string") throw new TypeError("systemPrompt must be a string");
    this.systemPrompt = prompt;
  }
  getStats() {
    return {
      messageCount: this.contextWindow.length,
      estimatedTokens: this.totalTokensEstimate,
      maxMessages: this.maxMessages,
      maxTokens: this.maxTokens,
      systemPrompt: this.systemPrompt ? this.systemPrompt.substring(0, 50) + "..." : null
    };
  }
  _trimContext() {
    while (this.contextWindow.length && (this.contextWindow.length > this.maxMessages || this.totalTokensEstimate > this.maxTokens)) {
      this.totalTokensEstimate -= this.contextWindow.shift().tokens;
    }
  }
  _estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }
  summarize() {
    if (this.contextWindow.length < 3) return "";
    const summary = this.contextWindow.slice(0, Math.floor(this.contextWindow.length / 2)).map(msg => `${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? "..." : ""}`).join("\n");
    return `Previous conversation summary:\n${summary}`;
  }
  export() {
    return {
      version: "1.0",
      timestamp: new Date().toISOString(),
      systemPrompt: this.systemPrompt,
      maxMessages: this.maxMessages,
      maxTokens: this.maxTokens,
      contextWindow: this.contextWindow.map(_ref2 => {
        let role = _ref2.role,
          content = _ref2.content,
          timestamp = _ref2.timestamp;
        return {
          role,
          content,
          timestamp
        };
      }),
      stats: this.getStats()
    };
  }
  import(data) {
    try {
      if (!data || !Array.isArray(data.contextWindow)) throw new TypeError("Invalid context data");
      const candidate = new ContextManager({
        maxMessages: data.maxMessages ?? this.maxMessages,
        maxTokens: data.maxTokens ?? this.maxTokens,
        systemPrompt: data.systemPrompt ?? this.systemPrompt,
        debug: this.debug
      });
      for (const msg of data.contextWindow) {
        if (!msg) throw new TypeError("Invalid context message");
        candidate.addMessage(msg.role, msg.content);
      }
      this.maxMessages = candidate.maxMessages;
      this.maxTokens = candidate.maxTokens;
      this.systemPrompt = candidate.systemPrompt;
      this.contextWindow = candidate.contextWindow;
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

/***/ },

/***/ 799
(module) {

module.exports = [{
  id: "welcome",
  keyword: ["hello", "hi", "hey"],
  reply: 'Welcome! How can I assist you <b>today?</b> <a href="https://senangwebs.com">senangwebs.com</a>',
  options: [{
    label: "Get Help",
    reply_id: "help"
  }, {
    label: "End Chat",
    reply_id: "goodbye"
  }]
}, {
  id: "help",
  keyword: ["help", "support", "assist"],
  reply: "Sure, I can help! What do you need assistance with?",
  options: [{
    label: "Product Information",
    reply_id: "product"
  }, {
    label: "Billing",
    reply_id: "billing"
  }, {
    label: "Technical Support",
    reply_id: "tech_support"
  }]
}, {
  id: "product",
  keyword: ["product", "information"],
  reply: "Our product is designed to make your life easier. Would you like to know more about its features or pricing?",
  options: [{
    label: "Features",
    reply_id: "features"
  }, {
    label: "Pricing",
    reply_id: "pricing"
  }]
}, {
  id: "billing",
  keyword: ["billing", "payment", "invoice"],
  reply: "For billing inquiries, please visit our billing portal or contact our finance department at billing@example.com.",
  options: [{
    label: "Back to Help",
    reply_id: "help"
  }, {
    label: "End Chat",
    reply_id: "goodbye"
  }]
}, {
  id: "tech_support",
  keyword: ["technical", "support", "issue"],
  reply: "For technical support, please describe your issue in detail and well do our best to assist you."
}, {
  id: "features",
  keyword: ["features", "functionality"],
  reply: "Our product offers cutting-edge features including AI-powered analytics, real-time collaboration, and seamless integration with popular tools.",
  options: [{
    label: "Back to Product Info",
    reply_id: "product"
  }, {
    label: "End Chat",
    reply_id: "goodbye"
  }]
}, {
  id: "pricing",
  keyword: ["pricing", "cost", "plans"],
  reply: "We offer flexible pricing plans starting at $9.99/month. For detailed pricing information, please visit our website or contact our sales team.",
  options: [{
    label: "Back to Product Info",
    reply_id: "product"
  }, {
    label: "End Chat",
    reply_id: "goodbye"
  }]
}, {
  id: "goodbye",
  keyword: ["bye", "goodbye", "end"],
  reply: "Thank you for chatting with us. Have a great day!",
  options: [{
    label: "Restart Chat",
    reply_id: "welcome"
  }]
}];

/***/ },

/***/ 74
(module, __unused_webpack_exports, __webpack_require__) {

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
const _require = __webpack_require__(490),
  numberSetting = _require.numberSetting;

/** A request owns cancellation through connection setup, body reads, and retry backoff. */
class OpenRouterAPI {
  constructor() {
    let config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
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
    for (const _ref of [["baseURL", this.baseURL], ["model", this.model], ["siteName", this.siteName], ["siteUrl", this.siteUrl]]) {
      var _ref2 = _slicedToArray(_ref, 2);
      const name = _ref2[0];
      const value = _ref2[1];
      if (typeof value !== "string") throw new TypeError(`${name} must be a string`);
    }
    if (this.endpointURL !== null && typeof this.endpointURL !== "string") throw new TypeError("endpointURL must be a string");
    const rawURL = this.endpointURL || `${this.baseURL.replace(/\/+$/, "")}/chat/completions`;
    try {
      this.url = new URL(rawURL, typeof document !== "undefined" ? document.baseURI : undefined);
    } catch (_) {
      throw new TypeError("Invalid API URL; relative endpoints require a browser page");
    }
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
      if (signal.aborted) {
        Promise.resolve(promise).catch(() => {});
        abort();
        return;
      }
      signal.addEventListener("abort", abort, {
        once: true
      });
      Promise.resolve(promise).then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
    });
  }
  _callback(callback, value) {
    if (!callback) return;
    try {
      callback(value);
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      error.consumerCallback = true;
      throw error;
    }
  }
  async sendMessage(messages, onChunk, onComplete, onError) {
    if (this._request) throw new Error("A request is already in progress");
    if (!Array.isArray(messages) || messages.some(msg => !msg || !["system", "user", "assistant"].includes(msg.role) || typeof msg.content !== "string")) throw new TypeError("Invalid API messages");
    const request = {
      controller: new AbortController(),
      timedOut: false,
      delivered: false
    };
    this._request = request;
    this.abortController = request.controller;
    const timeoutId = this.timeout > 0 ? setTimeout(() => {
      request.timedOut = true;
      request.controller.abort();
    }, this.timeout) : null;
    let terminalCalled = false;
    try {
      let result;
      for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
        if (request.controller.signal.aborted) throw this._abortError(request);
        try {
          const response = await this._abortable(this._makeRequest(messages, request), request);
          if (!response.ok) {
            let data = {};
            try {
              data = await this._abortable(response.json(), request);
            } catch (error) {
              if (request.controller.signal.aborted) throw error;
            }
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
      if (!terminalCalled) {
        terminalCalled = true;
        this._callback(onError, error);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      if (this._request === request) {
        this._request = null;
        this.abortController = null;
      }
    }
  }
  _makeRequest(messages, request) {
    const headers = {
      "Content-Type": "application/json"
    };
    if (this.apiKey.trim()) headers.Authorization = `Bearer ${this.apiKey}`;
    if (this.url.hostname === "openrouter.ai") {
      headers["HTTP-Referer"] = this.siteUrl;
      headers["X-Title"] = this.siteName;
    }
    return fetch(this.url.href, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.model,
        messages: messages.map(_ref3 => {
          let role = _ref3.role,
            content = _ref3.content;
          return {
            role,
            content
          };
        }),
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: this.streaming
      }),
      signal: request.controller.signal
    });
  }
  async _handleJSONResponse(response, request) {
    var _data, _data2;
    let data;
    try {
      data = await this._abortable(response.json(), request);
    } catch (error) {
      if (error instanceof SyntaxError) throw this._providerError({
        message: "Malformed chat completion JSON"
      });
      throw error;
    }
    if ((_data = data) !== null && _data !== void 0 && _data.error) throw this._providerError(data.error);
    const content = (_data2 = data) === null || _data2 === void 0 || (_data2 = _data2.choices) === null || _data2 === void 0 || (_data2 = _data2[0]) === null || _data2 === void 0 || (_data2 = _data2.message) === null || _data2 === void 0 ? void 0 : _data2.content;
    if (typeof content !== "string") throw this._providerError({
      message: "Invalid chat completion response"
    });
    return {
      content,
      model: data.model || this.model,
      done: true
    };
  }
  _providerError(data) {
    const error = new Error(typeof (data === null || data === void 0 ? void 0 : data.message) === "string" ? data.message : "AI provider returned an invalid response");
    error.protocolError = true;
    return error;
  }
  async _handleStreamingResponse(response, onChunk, request) {
    var _response$body;
    if (!((_response$body = response.body) !== null && _response$body !== void 0 && _response$body.getReader)) throw this._providerError({
      message: "Streaming response body is unavailable"
    });
    const reader = response.body.getReader(),
      decoder = new TextDecoder();
    let buffer = "",
      fullContent = "",
      eventData = [],
      eventType = "",
      ended = false,
      finished = false;
    let model = this.model;
    const dispatch = () => {
      var _data$choices, _data$choices2, _data$choices3;
      if (!eventData.length) {
        if (eventType === "error") throw this._providerError({
          message: "AI stream failed"
        });
        eventType = "";
        return;
      }
      const payload = eventData.join("\n"),
        type = eventType;
      eventData = [];
      eventType = "";
      if (payload.trim() === "[DONE]") {
        ended = true;
        finished = true;
        return;
      }
      let data;
      try {
        data = JSON.parse(payload);
      } catch (_) {
        throw this._providerError({
          message: "Malformed stream data"
        });
      }
      if (!data || typeof data !== "object") throw this._providerError({
        message: "Invalid stream event"
      });
      if (type === "error" || data.error || ((_data$choices = data.choices) === null || _data$choices === void 0 || (_data$choices = _data$choices[0]) === null || _data$choices === void 0 ? void 0 : _data$choices.finish_reason) === "error") throw this._providerError(data.error || data);
      if (data.model) model = data.model;
      const content = (_data$choices2 = data.choices) === null || _data$choices2 === void 0 || (_data$choices2 = _data$choices2[0]) === null || _data$choices2 === void 0 || (_data$choices2 = _data$choices2.delta) === null || _data$choices2 === void 0 ? void 0 : _data$choices2.content;
      if (content != null && typeof content !== "string") throw this._providerError({
        message: "Invalid stream content"
      });
      if (content) {
        fullContent += content;
        request.delivered = true;
        this._callback(onChunk, {
          content,
          fullContent,
          done: false
        });
      }
      if ((_data$choices3 = data.choices) !== null && _data$choices3 !== void 0 && (_data$choices3 = _data$choices3[0]) !== null && _data$choices3 !== void 0 && _data$choices3.finish_reason) finished = true;
    };
    const line = value => {
      if (value === "") {
        dispatch();
        return;
      }
      if (value.startsWith(":")) return;
      const colon = value.indexOf(":"),
        field = colon < 0 ? value : value.slice(0, colon);
      const body = colon < 0 ? "" : value.slice(colon + 1).replace(/^ /, "");
      if (field === "data") eventData.push(body);
      if (field === "event") eventType = body;
    };
    const drain = eof => {
      let match;
      while (match = /\r\n|\n|\r/.exec(buffer)) {
        if (!eof && match[0] === "\r" && match.index === buffer.length - 1) break;
        const value = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        line(value);
        if (ended) return;
      }
      if (eof && !ended) {
        if (buffer) line(buffer);
        buffer = "";
        dispatch();
      }
    };
    try {
      while (!ended) {
        const _await$this$_abortabl = await this._abortable(reader.read(), request),
          done = _await$this$_abortabl.done,
          value = _await$this$_abortabl.value;
        if (done) {
          buffer += decoder.decode();
          drain(true);
          break;
        }
        buffer += decoder.decode(value, {
          stream: true
        });
        drain(false);
      }
      if (!finished) throw this._providerError({
        message: "AI stream ended before completion"
      });
      return {
        content: fullContent,
        model,
        done: true
      };
    } finally {
      try {
        reader.cancel().catch(() => {});
      } catch (_) {/* Already closed. */}
      try {
        reader.releaseLock();
      } catch (_) {/* A cancelled read may still be settling. */}
    }
  }
  _handleAPIError(status, data) {
    var _data$error;
    const message = {
      401: "Invalid API key. Please check your API key configuration.",
      403: "Access forbidden. Please check your API permissions.",
      429: "Rate limit exceeded. Please try again later."
    }[status];
    const error = new Error(message || (status >= 500 ? "AI service is temporarily unavailable. Please try again." : `API error (${status}): ${(data === null || data === void 0 || (_data$error = data.error) === null || _data$error === void 0 ? void 0 : _data$error.message) || "Request failed"}`));
    error.status = status;
    error.isRateLimit = status === 429;
    return error;
  }
  _shouldNotRetry(error) {
    return error.consumerCallback || error.protocolError || error.name === "AbortError" || error.name === "TimeoutError" || error.status != null && error.status !== 429 && error.status < 500;
  }
  cancel() {
    if (this._request) this._request.controller.abort();
  }
  getModelInfo() {
    return {
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature
    };
  }
  _sleep(ms, request) {
    return new Promise((resolve, reject) => {
      const signal = request.controller.signal;
      if (signal.aborted) {
        reject(this._abortError(request));
        return;
      }
      const abort = () => {
        clearTimeout(timer);
        reject(this._abortError(request));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", abort);
        resolve();
      }, ms);
      signal.addEventListener("abort", abort, {
        once: true
      });
    });
  }
}
module.exports = OpenRouterAPI;

/***/ },

/***/ 490
(module) {

// Shared validation for programmatic configuration and declarative attributes.
function numberSetting(value, fallback, name, min) {
  let max = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : Infinity;
  let integer = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
  if (value === undefined || value === null) return fallback;
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof number !== "number" || !Number.isFinite(number) || number < min || number > max || integer && !Number.isInteger(number)) {
    throw new TypeError(`${name} must be ${integer ? "an integer" : "a number"} between ${min} and ${max}`);
  }
  return number;
}
function validateOptions(options) {
  let ids = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  if (options == null) return;
  if (!Array.isArray(options)) throw new TypeError("options must be an array");
  for (const option of options) {
    if (!option || typeof option.label !== "string" || typeof option.reply_id !== "string" || !option.reply_id || ids && !ids.has(option.reply_id)) {
      throw new TypeError("Each option requires a label and an existing reply_id");
    }
  }
}
function validateKnowledgeBase(knowledgeBase) {
  if (!Array.isArray(knowledgeBase)) throw new TypeError("knowledgeBase must be an array");
  const ids = new Set();
  for (const node of knowledgeBase) {
    if (!node || typeof node.id !== "string" || !node.id || ids.has(node.id) || typeof node.reply !== "string" || !Array.isArray(node.keyword) || node.keyword.some(word => typeof word !== "string" || !word.trim())) {
      throw new TypeError("Knowledge nodes require unique ids, string replies, and nonempty string keywords");
    }
    ids.add(node.id);
  }
  for (const node of knowledgeBase) validateOptions(node.options, ids);
  return JSON.parse(JSON.stringify(knowledgeBase));
}
function validateHistory(input) {
  const data = typeof input === "string" ? JSON.parse(input) : input;
  if (!data || typeof data.version !== "string" || !/^[12]\./.test(data.version) || !Array.isArray(data.messages)) {
    throw new TypeError("Invalid history: expected version 1.x or 2.x and a messages array");
  }
  for (const field of ["botName", "themeColor", "currentNodeId"]) {
    if (data[field] != null && typeof data[field] !== "string") throw new TypeError(`Invalid history ${field}`);
  }
  for (const message of data.messages) {
    if (!message || !["user", "bot"].includes(message.type) || typeof message.content !== "string") throw new TypeError("Invalid history message");
    for (const field of ["id", "timestamp", "nodeId", "model"]) {
      if (message[field] != null && typeof message[field] !== "string") throw new TypeError(`Invalid message ${field}`);
    }
    if (message.source != null && !["keyword", "api", "fallback", "error"].includes(message.source)) throw new TypeError("Invalid message source");
    validateOptions(message.options);
  }
  return JSON.parse(JSON.stringify(data));
}
module.exports = {
  numberSetting,
  validateKnowledgeBase,
  validateHistory
};

/***/ },

/***/ 454
(module) {

"use strict";
/*! @license DOMPurify 3.4.16 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.16/LICENSE */

function _OverloadYield(e, d) {
	this.v = e, this.k = d;
}
function _arrayLikeToArray(r, a) {
	(null == a || a > r.length) && (a = r.length);
	for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	return n;
}
function _arrayWithHoles(r) {
	if (Array.isArray(r)) return r;
}
function _iterableToArrayLimit(r, l) {
	var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
	if (null != t) {
		var e, n, i, u, a = [], f = !0, o = !1;
		try {
			if (i = (t = t.call(r)).next, 0 === l) {
				if (Object(t) !== t) return;
				f = !1;
			} else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
		} catch (r) {
			o = !0, n = r;
		} finally {
			try {
				if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
			} finally {
				if (o) throw n;
			}
		}
		return a;
	}
}
function _nonIterableRest() {
	throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
/*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */
function _slicedToArray(r, e) {
	return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _unsupportedIterableToArray(r, a) {
	if (r) {
		if ("string" == typeof r) return _arrayLikeToArray(r, a);
		var t = {}.toString.call(r).slice(8, -1);
		return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
	}
}
function AsyncGenerator(e) {
	var t, n;
	function resume(t, n) {
		try {
			var r = e[t](n), o = r.value, u = o instanceof _OverloadYield;
			Promise.resolve(u ? o.v : o).then(function(n) {
				if (u) {
					var i = "return" === t && o.k ? t : "next";
					if (!o.k || n.done) return resume(i, n);
					n = e[i](n).value;
				}
				settle(!!r.done, n);
			}, function(e) {
				resume("throw", e);
			});
		} catch (e) {
			settle(2, e);
		}
	}
	function settle(e, r) {
		2 === e ? t.reject(r) : t.resolve({
			value: r,
			done: e
		}), (t = t.next) ? resume(t.key, t.arg) : n = null;
	}
	this._invoke = function(e, r) {
		return new Promise(function(o, u) {
			var i = {
				key: e,
				arg: r,
				resolve: o,
				reject: u,
				next: null
			};
			n ? n = n.next = i : (t = n = i, resume(e, r));
		});
	}, "function" != typeof e.return && (this.return = void 0);
}
AsyncGenerator.prototype["function" == typeof Symbol && Symbol.asyncIterator || "@@asyncIterator"] = function() {
	return this;
}, AsyncGenerator.prototype.next = function(e) {
	return this._invoke("next", e);
}, AsyncGenerator.prototype.throw = function(e) {
	return this._invoke("throw", e);
}, AsyncGenerator.prototype.return = function(e) {
	return this._invoke("return", e);
};
const entries = Object.entries;
const setPrototypeOf = Object.setPrototypeOf;
const isFrozen = Object.isFrozen;
const getPrototypeOf = Object.getPrototypeOf;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
let freeze = Object.freeze;
let seal = Object.seal;
let create = Object.create;
let _ref = typeof Reflect !== "undefined" && Reflect;
let apply = _ref.apply;
let construct = _ref.construct;
if (!freeze) freeze = function freeze(x) {
	return x;
};
if (!seal) seal = function seal(x) {
	return x;
};
if (!apply) apply = function apply(func, thisArg) {
	for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) args[_key - 2] = arguments[_key];
	return func.apply(thisArg, args);
};
if (!construct) construct = function construct(Func) {
	for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) args[_key2 - 1] = arguments[_key2];
	return new Func(...args);
};
const arrayForEach = unapply(Array.prototype.forEach);
Array.prototype.indexOf;
const arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
const arrayPop = unapply(Array.prototype.pop);
const arrayPush = unapply(Array.prototype.push);
Array.prototype.slice;
const arraySplice = unapply(Array.prototype.splice);
const arrayIsArray = Array.isArray;
const stringToLowerCase = unapply(String.prototype.toLowerCase);
const stringToString = unapply(String.prototype.toString);
const stringMatch = unapply(String.prototype.match);
const stringReplace = unapply(String.prototype.replace);
const stringIndexOf = unapply(String.prototype.indexOf);
const stringTrim = unapply(String.prototype.trim);
const numberToString = unapply(Number.prototype.toString);
const booleanToString = unapply(Boolean.prototype.toString);
const bigintToString = typeof BigInt === "undefined" ? null : unapply(BigInt.prototype.toString);
const symbolToString = typeof Symbol === "undefined" ? null : unapply(Symbol.prototype.toString);
const objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
const objectToString = unapply(Object.prototype.toString);
const regExpTest = unapply(RegExp.prototype.test);
const typeErrorCreate = unconstruct(TypeError);
/**
* Creates a new function that calls the given function with a specified thisArg and arguments.
*
* @param func - The function to be wrapped and called.
* @returns A new function that calls the given function with a specified thisArg and arguments.
*/
function unapply(func) {
	return function(thisArg) {
		if (thisArg instanceof RegExp) thisArg.lastIndex = 0;
		for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) args[_key3 - 1] = arguments[_key3];
		return apply(func, thisArg, args);
	};
}
/**
* Creates a new function that constructs an instance of the given constructor function with the provided arguments.
*
* @param func - The constructor function to be wrapped and called.
* @returns A new function that constructs an instance of the given constructor function with the provided arguments.
*/
function unconstruct(Func) {
	return function() {
		for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) args[_key4] = arguments[_key4];
		return construct(Func, args);
	};
}
/**
* Add properties to a lookup table
*
* @param set - The set to which elements will be added.
* @param array - The array containing elements to be added to the set.
* @param transformCaseFunc - An optional function to transform the case of each element before adding to the set.
* @returns The modified set with added elements.
*/
function addToSet(set, array) {
	let transformCaseFunc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : stringToLowerCase;
	if (setPrototypeOf) setPrototypeOf(set, null);
	if (!arrayIsArray(array)) return set;
	let l = array.length;
	while (l--) {
		let element = array[l];
		if (typeof element === "string") {
			const lcElement = transformCaseFunc(element);
			if (lcElement !== element) {
				if (!isFrozen(array)) array[l] = lcElement;
				element = lcElement;
			}
		}
		set[element] = true;
	}
	return set;
}
/**
* Clean up an array to harden against CSPP
*
* @param array - The array to be cleaned.
* @returns The cleaned version of the array
*/
function cleanArray(array) {
	for (let index = 0; index < array.length; index++) if (!objectHasOwnProperty(array, index)) array[index] = null;
	return array;
}
/**
* Shallow clone an object
*
* @param object - The object to be cloned.
* @returns A new object that copies the original.
*/
function clone(object) {
	const newObject = create(null);
	for (const _ref2 of entries(object)) {
		var _ref3 = _slicedToArray(_ref2, 2);
		const property = _ref3[0];
		const value = _ref3[1];
		if (objectHasOwnProperty(object, property)) {
			if (arrayIsArray(value)) newObject[property] = cleanArray(value);
			else if (value && typeof value === "object" && value.constructor === Object) newObject[property] = clone(value);
			else newObject[property] = value;
		}
	}
	return newObject;
}
/**
* Convert non-node values into strings without depending on direct property access.
*
* @param value - The value to stringify.
* @returns A string representation of the provided value.
*/
function stringifyValue(value) {
	switch (typeof value) {
		case "string": return value;
		case "number": return numberToString(value);
		case "boolean": return booleanToString(value);
		case "bigint": return bigintToString ? bigintToString(value) : "0";
		case "symbol": return symbolToString ? symbolToString(value) : "Symbol()";
		case "undefined": return objectToString(value);
		case "function":
		case "object": {
			if (value === null) return objectToString(value);
			const valueAsRecord = value;
			const valueToString = lookupGetter(valueAsRecord, "toString");
			if (typeof valueToString === "function") {
				const stringified = valueToString(valueAsRecord);
				return typeof stringified === "string" ? stringified : objectToString(stringified);
			}
			return objectToString(value);
		}
		default: return objectToString(value);
	}
}
/**
* This method automatically checks if the prop is function or getter and behaves accordingly.
*
* @param object - The object to look up the getter function in its prototype chain.
* @param prop - The property name for which to find the getter function.
* @returns The getter function found in the prototype chain or a fallback function.
*/
function lookupGetter(object, prop) {
	while (object !== null) {
		const desc = getOwnPropertyDescriptor(object, prop);
		if (desc) {
			if (desc.get) return unapply(desc.get);
			if (typeof desc.value === "function") return unapply(desc.value);
		}
		object = getPrototypeOf(object);
	}
	function fallbackValue() {
		return null;
	}
	return fallbackValue;
}
function isRegex(value) {
	try {
		regExpTest(value, "");
		return true;
	} catch (_unused) {
		return false;
	}
}
const html$1 = freeze([
	"a",
	"abbr",
	"acronym",
	"address",
	"area",
	"article",
	"aside",
	"audio",
	"b",
	"bdi",
	"bdo",
	"big",
	"blink",
	"blockquote",
	"body",
	"br",
	"button",
	"canvas",
	"caption",
	"center",
	"cite",
	"code",
	"col",
	"colgroup",
	"content",
	"data",
	"datalist",
	"dd",
	"decorator",
	"del",
	"details",
	"dfn",
	"dialog",
	"dir",
	"div",
	"dl",
	"dt",
	"element",
	"em",
	"fieldset",
	"figcaption",
	"figure",
	"font",
	"footer",
	"form",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"head",
	"header",
	"hgroup",
	"hr",
	"html",
	"i",
	"img",
	"input",
	"ins",
	"kbd",
	"label",
	"legend",
	"li",
	"main",
	"map",
	"mark",
	"marquee",
	"menu",
	"menuitem",
	"meter",
	"nav",
	"nobr",
	"ol",
	"optgroup",
	"option",
	"output",
	"p",
	"picture",
	"pre",
	"progress",
	"q",
	"rp",
	"rt",
	"ruby",
	"s",
	"samp",
	"search",
	"section",
	"select",
	"shadow",
	"slot",
	"small",
	"source",
	"spacer",
	"span",
	"strike",
	"strong",
	"style",
	"sub",
	"summary",
	"sup",
	"table",
	"tbody",
	"td",
	"template",
	"textarea",
	"tfoot",
	"th",
	"thead",
	"time",
	"tr",
	"track",
	"tt",
	"u",
	"ul",
	"var",
	"video",
	"wbr"
]);
const svg$1 = freeze([
	"svg",
	"a",
	"altglyph",
	"altglyphdef",
	"altglyphitem",
	"animatecolor",
	"animatemotion",
	"animatetransform",
	"circle",
	"clippath",
	"defs",
	"desc",
	"ellipse",
	"enterkeyhint",
	"exportparts",
	"filter",
	"font",
	"g",
	"glyph",
	"glyphref",
	"hkern",
	"image",
	"inputmode",
	"line",
	"lineargradient",
	"marker",
	"mask",
	"metadata",
	"mpath",
	"part",
	"path",
	"pattern",
	"polygon",
	"polyline",
	"radialgradient",
	"rect",
	"stop",
	"style",
	"switch",
	"symbol",
	"text",
	"textpath",
	"title",
	"tref",
	"tspan",
	"view",
	"vkern"
]);
const svgFilters = freeze([
	"feBlend",
	"feColorMatrix",
	"feComponentTransfer",
	"feComposite",
	"feConvolveMatrix",
	"feDiffuseLighting",
	"feDisplacementMap",
	"feDistantLight",
	"feDropShadow",
	"feFlood",
	"feFuncA",
	"feFuncB",
	"feFuncG",
	"feFuncR",
	"feGaussianBlur",
	"feImage",
	"feMerge",
	"feMergeNode",
	"feMorphology",
	"feOffset",
	"fePointLight",
	"feSpecularLighting",
	"feSpotLight",
	"feTile",
	"feTurbulence"
]);
const svgDisallowed = freeze([
	"animate",
	"color-profile",
	"cursor",
	"discard",
	"font-face",
	"font-face-format",
	"font-face-name",
	"font-face-src",
	"font-face-uri",
	"foreignobject",
	"hatch",
	"hatchpath",
	"mesh",
	"meshgradient",
	"meshpatch",
	"meshrow",
	"missing-glyph",
	"script",
	"set",
	"solidcolor",
	"unknown",
	"use"
]);
const mathMl$1 = freeze([
	"math",
	"menclose",
	"merror",
	"mfenced",
	"mfrac",
	"mglyph",
	"mi",
	"mlabeledtr",
	"mmultiscripts",
	"mn",
	"mo",
	"mover",
	"mpadded",
	"mphantom",
	"mroot",
	"mrow",
	"ms",
	"mspace",
	"msqrt",
	"mstyle",
	"msub",
	"msup",
	"msubsup",
	"mtable",
	"mtd",
	"mtext",
	"mtr",
	"munder",
	"munderover",
	"mprescripts"
]);
const mathMlDisallowed = freeze([
	"maction",
	"maligngroup",
	"malignmark",
	"mlongdiv",
	"mscarries",
	"mscarry",
	"msgroup",
	"mstack",
	"msline",
	"msrow",
	"semantics",
	"annotation",
	"annotation-xml",
	"mprescripts",
	"none"
]);
const text = freeze(["#text"]);
const html = freeze([
	"accept",
	"action",
	"align",
	"alt",
	"autocapitalize",
	"autocomplete",
	"autopictureinpicture",
	"autoplay",
	"background",
	"bgcolor",
	"border",
	"capture",
	"cellpadding",
	"cellspacing",
	"checked",
	"cite",
	"class",
	"clear",
	"color",
	"cols",
	"colspan",
	"command",
	"commandfor",
	"controls",
	"controlslist",
	"coords",
	"crossorigin",
	"datetime",
	"decoding",
	"default",
	"dir",
	"disabled",
	"disablepictureinpicture",
	"disableremoteplayback",
	"download",
	"draggable",
	"enctype",
	"enterkeyhint",
	"exportparts",
	"face",
	"for",
	"headers",
	"height",
	"hidden",
	"high",
	"href",
	"hreflang",
	"id",
	"inert",
	"inputmode",
	"integrity",
	"ismap",
	"kind",
	"label",
	"lang",
	"list",
	"loading",
	"loop",
	"low",
	"max",
	"maxlength",
	"media",
	"method",
	"min",
	"minlength",
	"multiple",
	"muted",
	"name",
	"nonce",
	"noshade",
	"novalidate",
	"nowrap",
	"open",
	"optimum",
	"part",
	"pattern",
	"placeholder",
	"playsinline",
	"popover",
	"popovertarget",
	"popovertargetaction",
	"poster",
	"preload",
	"pubdate",
	"radiogroup",
	"readonly",
	"rel",
	"required",
	"rev",
	"reversed",
	"role",
	"rows",
	"rowspan",
	"spellcheck",
	"scope",
	"selected",
	"shape",
	"size",
	"sizes",
	"slot",
	"span",
	"srclang",
	"start",
	"src",
	"srcset",
	"step",
	"style",
	"summary",
	"tabindex",
	"title",
	"translate",
	"type",
	"usemap",
	"valign",
	"value",
	"width",
	"wrap",
	"xmlns"
]);
const svg = freeze([
	"accent-height",
	"accumulate",
	"additive",
	"alignment-baseline",
	"amplitude",
	"ascent",
	"attributename",
	"attributetype",
	"azimuth",
	"basefrequency",
	"baseline-shift",
	"begin",
	"bias",
	"by",
	"class",
	"clip",
	"clippathunits",
	"clip-path",
	"clip-rule",
	"color",
	"color-interpolation",
	"color-interpolation-filters",
	"color-profile",
	"color-rendering",
	"cx",
	"cy",
	"d",
	"dx",
	"dy",
	"diffuseconstant",
	"direction",
	"display",
	"divisor",
	"dominant-baseline",
	"dur",
	"edgemode",
	"elevation",
	"end",
	"exponent",
	"fill",
	"fill-opacity",
	"fill-rule",
	"filter",
	"filterunits",
	"flood-color",
	"flood-opacity",
	"font-family",
	"font-size",
	"font-size-adjust",
	"font-stretch",
	"font-style",
	"font-variant",
	"font-weight",
	"fx",
	"fy",
	"g1",
	"g2",
	"glyph-name",
	"glyphref",
	"gradientunits",
	"gradienttransform",
	"height",
	"href",
	"id",
	"image-rendering",
	"in",
	"in2",
	"intercept",
	"k",
	"k1",
	"k2",
	"k3",
	"k4",
	"kerning",
	"keypoints",
	"keysplines",
	"keytimes",
	"lang",
	"lengthadjust",
	"letter-spacing",
	"kernelmatrix",
	"kernelunitlength",
	"lighting-color",
	"local",
	"marker-end",
	"marker-mid",
	"marker-start",
	"markerheight",
	"markerunits",
	"markerwidth",
	"maskcontentunits",
	"maskunits",
	"max",
	"mask",
	"mask-type",
	"media",
	"method",
	"mode",
	"min",
	"name",
	"numoctaves",
	"offset",
	"operator",
	"opacity",
	"order",
	"orient",
	"orientation",
	"origin",
	"overflow",
	"paint-order",
	"path",
	"pathlength",
	"patterncontentunits",
	"patterntransform",
	"patternunits",
	"pointer-events",
	"points",
	"preservealpha",
	"preserveaspectratio",
	"primitiveunits",
	"r",
	"rx",
	"ry",
	"radius",
	"refx",
	"refy",
	"repeatcount",
	"repeatdur",
	"restart",
	"result",
	"rotate",
	"scale",
	"seed",
	"shape-rendering",
	"slope",
	"specularconstant",
	"specularexponent",
	"spreadmethod",
	"startoffset",
	"stddeviation",
	"stitchtiles",
	"stop-color",
	"stop-opacity",
	"stroke-dasharray",
	"stroke-dashoffset",
	"stroke-linecap",
	"stroke-linejoin",
	"stroke-miterlimit",
	"stroke-opacity",
	"stroke",
	"stroke-width",
	"style",
	"surfacescale",
	"systemlanguage",
	"tabindex",
	"tablevalues",
	"targetx",
	"targety",
	"transform",
	"transform-origin",
	"text-anchor",
	"text-decoration",
	"text-orientation",
	"text-rendering",
	"textlength",
	"type",
	"u1",
	"u2",
	"unicode",
	"values",
	"vector-effect",
	"viewbox",
	"visibility",
	"version",
	"vert-adv-y",
	"vert-origin-x",
	"vert-origin-y",
	"width",
	"word-spacing",
	"wrap",
	"writing-mode",
	"xchannelselector",
	"ychannelselector",
	"x",
	"x1",
	"x2",
	"xmlns",
	"y",
	"y1",
	"y2",
	"z",
	"zoomandpan"
]);
const mathMl = freeze([
	"accent",
	"accentunder",
	"align",
	"bevelled",
	"close",
	"columnalign",
	"columnlines",
	"columnspacing",
	"columnspan",
	"denomalign",
	"depth",
	"dir",
	"display",
	"displaystyle",
	"encoding",
	"fence",
	"frame",
	"height",
	"href",
	"id",
	"largeop",
	"length",
	"linethickness",
	"lquote",
	"lspace",
	"mathbackground",
	"mathcolor",
	"mathsize",
	"mathvariant",
	"maxsize",
	"minsize",
	"movablelimits",
	"notation",
	"numalign",
	"open",
	"rowalign",
	"rowlines",
	"rowspacing",
	"rowspan",
	"rspace",
	"rquote",
	"scriptlevel",
	"scriptminsize",
	"scriptsizemultiplier",
	"selection",
	"separator",
	"separators",
	"stretchy",
	"subscriptshift",
	"supscriptshift",
	"symmetric",
	"voffset",
	"width",
	"xmlns"
]);
const xml = freeze([
	"xlink:href",
	"xml:id",
	"xlink:title",
	"xml:space",
	"xmlns:xlink"
]);
const MUSTACHE_EXPR = seal(/{{[\w\W]*|^[\w\W]*}}/g);
const ERB_EXPR = seal(/<%[\w\W]*|^[\w\W]*%>/g);
const TMPLIT_EXPR = seal(/\${[\w\W]*/g);
const DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
const ARIA_ATTR = seal(/^aria-[\-\w]+$/);
const IS_ALLOWED_URI = seal(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i);
const IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
const ATTR_WHITESPACE = seal(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g);
const DOCTYPE_NAME = seal(/^html$/i);
const CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
const ELEMENT_MARKUP_PROBE = seal(/<[/\w!]/g);
const COMMENT_MARKUP_PROBE = seal(/<[/\w]/g);
const FALLBACK_TAG_CLOSE = seal(/<\/no(script|embed|frames)/i);
const SELF_CLOSING_TAG = seal(/\/>/i);
const NODE_TYPE = {
	element: 1,
	attribute: 2,
	text: 3,
	cdataSection: 4,
	entityReference: 5,
	entityNode: 6,
	processingInstruction: 7,
	comment: 8,
	document: 9,
	documentType: 10,
	documentFragment: 11,
	notation: 12
};
const LITERAL_TEXT_ELEMENT_NAMES = [
	"style",
	"script",
	"xmp",
	"iframe",
	"noembed",
	"noframes",
	"plaintext",
	"noscript"
];
const LITERAL_TEXT_ELEMENTS = freeze(addToSet({}, LITERAL_TEXT_ELEMENT_NAMES));
const LITERAL_TEXT_CLOSE = function() {
	const map = {};
	arrayForEach(LITERAL_TEXT_ELEMENT_NAMES, (name) => {
		map[name] = seal(new RegExp("</" + name + "(?=[\\t\\n\\f\\r />])", "i"));
	});
	return freeze(map);
}();
const getGlobal = function getGlobal() {
	return typeof window === "undefined" ? null : window;
};
/**
* Creates a no-op policy for internal use only.
* Don't export this function outside this module!
* @param trustedTypes The policy factory.
* @param purifyHostElement The Script element used to load DOMPurify (to determine policy name suffix).
* @return The policy created (or null, if Trusted Types
* are not supported or creating the policy failed).
*/
const _createTrustedTypesPolicy = function _createTrustedTypesPolicy(trustedTypes, purifyHostElement) {
	if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") return null;
	let suffix = null;
	const ATTR_NAME = "data-tt-policy-suffix";
	if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) suffix = purifyHostElement.getAttribute(ATTR_NAME);
	const policyName = "dompurify" + (suffix ? "#" + suffix : "");
	try {
		return trustedTypes.createPolicy(policyName, {
			createHTML(html) {
				return html;
			},
			createScriptURL(scriptUrl) {
				return scriptUrl;
			}
		});
	} catch (_) {
		console.warn("TrustedTypes policy " + policyName + " could not be created.");
		return null;
	}
};
const _createHooksMap = function _createHooksMap() {
	return {
		afterSanitizeAttributes: [],
		afterSanitizeElements: [],
		afterSanitizeShadowDOM: [],
		beforeSanitizeAttributes: [],
		beforeSanitizeElements: [],
		beforeSanitizeShadowDOM: [],
		uponSanitizeAttribute: [],
		uponSanitizeElement: [],
		uponSanitizeShadowNode: []
	};
};
/**
* Resolve a set-valued configuration option: a fresh set built from
* cfg[key] when it is an own array property (seeded with a clone of
* options.base when given, case-normalized via options.transform),
* the fallback set otherwise.
*
* @param cfg the cloned, prototype-free configuration object
* @param key the configuration property to read
* @param fallback the set to use when the option is absent or not an array
* @param options transform and optional base set to merge into
* @returns the resolved set
*/
const _resolveSetOption = function _resolveSetOption(cfg, key, fallback, options) {
	return objectHasOwnProperty(cfg, key) && arrayIsArray(cfg[key]) ? addToSet(options.base ? clone(options.base) : {}, cfg[key], options.transform) : fallback;
};
/**
* Resolve an object-valued configuration option: a prototype-free clone
* of cfg[key] when it is an own, truthy object property, else a fresh
* fallback built by makeFallback (fresh on every parse, so a previous
* parse can never leak state into the next one).
*
* @param cfg the cloned, prototype-free configuration object
* @param key the configuration property to read
* @param makeFallback builds the fallback value when the option is absent
* @returns the resolved object
*/
const _resolveObjectOption = function _resolveObjectOption(cfg, key, makeFallback) {
	const value = objectHasOwnProperty(cfg, key) ? cfg[key] : void 0;
	return value && typeof value === "object" ? clone(value) : makeFallback();
};
function createDOMPurify() {
	let window = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
	const DOMPurify = (root) => createDOMPurify(root);
	DOMPurify.version = "3.4.16";
	DOMPurify.removed = [];
	if (!window || !window.document || window.document.nodeType !== NODE_TYPE.document || !window.Element) {
		DOMPurify.isSupported = false;
		return DOMPurify;
	}
	let document = window.document;
	const originalDocument = document;
	const currentScript = originalDocument.currentScript;
	window.DocumentFragment;
	const HTMLTemplateElement = window.HTMLTemplateElement, Node = window.Node, Element = window.Element, NodeFilter = window.NodeFilter;
	window.NamedNodeMap === void 0 && (window.NamedNodeMap || window.MozNamedAttrMap);
	window.HTMLFormElement;
	const DOMParser = window.DOMParser, trustedTypes = window.trustedTypes;
	const ElementPrototype = Element.prototype;
	const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
	const remove = lookupGetter(ElementPrototype, "remove");
	const removeAttributeNode = lookupGetter(ElementPrototype, "removeAttributeNode");
	const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
	const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
	const getParentNode = lookupGetter(ElementPrototype, "parentNode");
	const getShadowRoot = lookupGetter(ElementPrototype, "shadowRoot");
	const getAttributes = lookupGetter(ElementPrototype, "attributes");
	const getNodeType = Node && Node.prototype ? lookupGetter(Node.prototype, "nodeType") : null;
	const getNodeName = Node && Node.prototype ? lookupGetter(Node.prototype, "nodeName") : null;
	const getOwnerDocument = Node && Node.prototype ? lookupGetter(Node.prototype, "ownerDocument") : null;
	const _readNodeType = function _readNodeType(node) {
		return getNodeType ? getNodeType(node) : node.nodeType;
	};
	const _readNodeName = function _readNodeName(node) {
		return getNodeName ? getNodeName(node) : node.nodeName;
	};
	if (typeof HTMLTemplateElement === "function") {
		const template = document.createElement("template");
		if (template.content && template.content.ownerDocument) document = template.content.ownerDocument;
	}
	let trustedTypesPolicy;
	let emptyHTML = "";
	let defaultTrustedTypesPolicy;
	let defaultTrustedTypesPolicyResolved = false;
	let IN_TRUSTED_TYPES_POLICY = 0;
	const _assertNotInTrustedTypesPolicy = function _assertNotInTrustedTypesPolicy() {
		if (IN_TRUSTED_TYPES_POLICY > 0) throw typeErrorCreate("A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the \"DOMPurify and Trusted Types\" section of the README.");
	};
	const _createTrustedHTML = function _createTrustedHTML(html) {
		_assertNotInTrustedTypesPolicy();
		IN_TRUSTED_TYPES_POLICY++;
		try {
			return trustedTypesPolicy.createHTML(html);
		} finally {
			IN_TRUSTED_TYPES_POLICY--;
		}
	};
	const _createTrustedScriptURL = function _createTrustedScriptURL(scriptUrl) {
		_assertNotInTrustedTypesPolicy();
		IN_TRUSTED_TYPES_POLICY++;
		try {
			return trustedTypesPolicy.createScriptURL(scriptUrl);
		} finally {
			IN_TRUSTED_TYPES_POLICY--;
		}
	};
	const _getDefaultTrustedTypesPolicy = function _getDefaultTrustedTypesPolicy() {
		if (!defaultTrustedTypesPolicyResolved) {
			defaultTrustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
			defaultTrustedTypesPolicyResolved = true;
		}
		return defaultTrustedTypesPolicy;
	};
	const _document = document, implementation = _document.implementation, createNodeIterator = _document.createNodeIterator, createDocumentFragment = _document.createDocumentFragment, getElementsByTagName = _document.getElementsByTagName;
	const importNode = originalDocument.importNode;
	let hooks = _createHooksMap();
	/**
	* Expose whether this browser supports running the full DOMPurify.
	*/
	DOMPurify.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation && implementation.createHTMLDocument !== void 0;
	const MUSTACHE_EXPR$1 = MUSTACHE_EXPR, ERB_EXPR$1 = ERB_EXPR, TMPLIT_EXPR$1 = TMPLIT_EXPR, DATA_ATTR$1 = DATA_ATTR, ARIA_ATTR$1 = ARIA_ATTR, IS_SCRIPT_OR_DATA$1 = IS_SCRIPT_OR_DATA, ATTR_WHITESPACE$1 = ATTR_WHITESPACE, CUSTOM_ELEMENT$1 = CUSTOM_ELEMENT;
	let IS_ALLOWED_URI$1 = IS_ALLOWED_URI;
	/**
	* We consider the elements and attributes below to be safe. Ideally
	* don't add any new ones but feel free to remove unwanted ones.
	*/
	let ALLOWED_TAGS = null;
	const DEFAULT_ALLOWED_TAGS = addToSet({}, [
		...html$1,
		...svg$1,
		...svgFilters,
		...mathMl$1,
		...text
	]);
	let ALLOWED_ATTR = null;
	const DEFAULT_ALLOWED_ATTR = addToSet({}, [
		...html,
		...svg,
		...mathMl,
		...xml
	]);
	let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
		tagNameCheck: {
			writable: true,
			configurable: false,
			enumerable: true,
			value: null
		},
		attributeNameCheck: {
			writable: true,
			configurable: false,
			enumerable: true,
			value: null
		},
		allowCustomizedBuiltInElements: {
			writable: true,
			configurable: false,
			enumerable: true,
			value: false
		}
	}));
	let FORBID_TAGS = null;
	let FORBID_ATTR = null;
	const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
		tagCheck: {
			writable: true,
			configurable: false,
			enumerable: true,
			value: null
		},
		attributeCheck: {
			writable: true,
			configurable: false,
			enumerable: true,
			value: null
		}
	}));
	let ALLOW_ARIA_ATTR = true;
	let ALLOW_DATA_ATTR = true;
	let ALLOW_UNKNOWN_PROTOCOLS = false;
	let ALLOW_SELF_CLOSE_IN_ATTR = true;
	let SAFE_FOR_TEMPLATES = false;
	let SAFE_FOR_XML = true;
	let WHOLE_DOCUMENT = false;
	let SET_CONFIG = false;
	let SET_CONFIG_ALLOWED_TAGS = null;
	let SET_CONFIG_ALLOWED_ATTR = null;
	let FORCE_BODY = false;
	let RETURN_DOM = false;
	let RETURN_DOM_FRAGMENT = false;
	let RETURN_TRUSTED_TYPE = false;
	let SANITIZE_DOM = true;
	let SANITIZE_NAMED_PROPS = false;
	const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
	let KEEP_CONTENT = true;
	let IN_PLACE = false;
	let USE_PROFILES = {};
	let FORBID_CONTENTS = null;
	const DEFAULT_FORBID_CONTENTS = addToSet({}, [
		"annotation-xml",
		"audio",
		"colgroup",
		"desc",
		"foreignobject",
		"head",
		"iframe",
		"math",
		"mi",
		"mn",
		"mo",
		"ms",
		"mtext",
		"noembed",
		"noframes",
		"noscript",
		"plaintext",
		"script",
		"selectedcontent",
		"style",
		"svg",
		"template",
		"thead",
		"title",
		"video",
		"xmp"
	]);
	let DATA_URI_TAGS = null;
	const DEFAULT_DATA_URI_TAGS = addToSet({}, [
		"audio",
		"video",
		"img",
		"source",
		"image",
		"track"
	]);
	let URI_SAFE_ATTRIBUTES = null;
	const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, [
		"alt",
		"class",
		"for",
		"id",
		"label",
		"name",
		"pattern",
		"placeholder",
		"role",
		"summary",
		"title",
		"value",
		"style",
		"xmlns"
	]);
	const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
	const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
	const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
	let NAMESPACE = HTML_NAMESPACE;
	let IS_EMPTY_INPUT = false;
	let ALLOWED_NAMESPACES = null;
	const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [
		MATHML_NAMESPACE,
		SVG_NAMESPACE,
		HTML_NAMESPACE
	], stringToString);
	const DEFAULT_MATHML_TEXT_INTEGRATION_POINTS = freeze([
		"mi",
		"mo",
		"mn",
		"ms",
		"mtext"
	]);
	let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS);
	const DEFAULT_HTML_INTEGRATION_POINTS = freeze(["annotation-xml"]);
	let HTML_INTEGRATION_POINTS = addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS);
	const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, [
		"title",
		"style",
		"font",
		"a",
		"script"
	]);
	let PARSER_MEDIA_TYPE = null;
	const SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
	const DEFAULT_PARSER_MEDIA_TYPE = "text/html";
	let transformCaseFunc = null;
	let CONFIG = null;
	const formElement = document.createElement("form");
	const isRegexOrFunction = function isRegexOrFunction(testValue) {
		return testValue instanceof RegExp || testValue instanceof Function;
	};
	/**
	* _parseConfig
	*
	* @param cfg optional config literal
	*/
	const _parseConfig = function _parseConfig() {
		let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		if (CONFIG && CONFIG === cfg) return;
		if (!cfg || typeof cfg !== "object") cfg = {};
		cfg = clone(cfg);
		PARSER_MEDIA_TYPE = SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
		transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
		ALLOWED_TAGS = _resolveSetOption(cfg, "ALLOWED_TAGS", DEFAULT_ALLOWED_TAGS, { transform: transformCaseFunc });
		ALLOWED_ATTR = _resolveSetOption(cfg, "ALLOWED_ATTR", DEFAULT_ALLOWED_ATTR, { transform: transformCaseFunc });
		ALLOWED_NAMESPACES = _resolveSetOption(cfg, "ALLOWED_NAMESPACES", DEFAULT_ALLOWED_NAMESPACES, { transform: stringToString });
		URI_SAFE_ATTRIBUTES = _resolveSetOption(cfg, "ADD_URI_SAFE_ATTR", DEFAULT_URI_SAFE_ATTRIBUTES, {
			transform: transformCaseFunc,
			base: DEFAULT_URI_SAFE_ATTRIBUTES
		});
		DATA_URI_TAGS = _resolveSetOption(cfg, "ADD_DATA_URI_TAGS", DEFAULT_DATA_URI_TAGS, {
			transform: transformCaseFunc,
			base: DEFAULT_DATA_URI_TAGS
		});
		FORBID_CONTENTS = _resolveSetOption(cfg, "FORBID_CONTENTS", DEFAULT_FORBID_CONTENTS, { transform: transformCaseFunc });
		FORBID_TAGS = _resolveSetOption(cfg, "FORBID_TAGS", clone({}), { transform: transformCaseFunc });
		FORBID_ATTR = _resolveSetOption(cfg, "FORBID_ATTR", clone({}), { transform: transformCaseFunc });
		USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES && typeof cfg.USE_PROFILES === "object" ? clone(cfg.USE_PROFILES) : cfg.USE_PROFILES : false;
		ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
		ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
		ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
		ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
		SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
		SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false;
		WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
		RETURN_DOM = cfg.RETURN_DOM || false;
		RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
		RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
		FORCE_BODY = cfg.FORCE_BODY || false;
		SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
		SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
		KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
		IN_PLACE = cfg.IN_PLACE || false;
		IS_ALLOWED_URI$1 = isRegex(cfg.ALLOWED_URI_REGEXP) ? cfg.ALLOWED_URI_REGEXP : IS_ALLOWED_URI;
		NAMESPACE = typeof cfg.NAMESPACE === "string" ? cfg.NAMESPACE : HTML_NAMESPACE;
		MATHML_TEXT_INTEGRATION_POINTS = _resolveObjectOption(cfg, "MATHML_TEXT_INTEGRATION_POINTS", () => addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS));
		HTML_INTEGRATION_POINTS = _resolveObjectOption(cfg, "HTML_INTEGRATION_POINTS", () => addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS));
		const customElementHandling = _resolveObjectOption(cfg, "CUSTOM_ELEMENT_HANDLING", () => create(null));
		CUSTOM_ELEMENT_HANDLING = create(null);
		if (objectHasOwnProperty(customElementHandling, "tagNameCheck") && isRegexOrFunction(customElementHandling.tagNameCheck)) CUSTOM_ELEMENT_HANDLING.tagNameCheck = customElementHandling.tagNameCheck;
		if (objectHasOwnProperty(customElementHandling, "attributeNameCheck") && isRegexOrFunction(customElementHandling.attributeNameCheck)) CUSTOM_ELEMENT_HANDLING.attributeNameCheck = customElementHandling.attributeNameCheck;
		if (objectHasOwnProperty(customElementHandling, "allowCustomizedBuiltInElements") && typeof customElementHandling.allowCustomizedBuiltInElements === "boolean") CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = customElementHandling.allowCustomizedBuiltInElements;
		seal(CUSTOM_ELEMENT_HANDLING);
		if (SAFE_FOR_TEMPLATES) ALLOW_DATA_ATTR = false;
		if (RETURN_DOM_FRAGMENT) RETURN_DOM = true;
		if (USE_PROFILES) {
			ALLOWED_TAGS = addToSet({}, text);
			ALLOWED_ATTR = create(null);
			if (USE_PROFILES.html === true) {
				addToSet(ALLOWED_TAGS, html$1);
				addToSet(ALLOWED_ATTR, html);
			}
			if (USE_PROFILES.svg === true) {
				addToSet(ALLOWED_TAGS, svg$1);
				addToSet(ALLOWED_ATTR, svg);
				addToSet(ALLOWED_ATTR, xml);
			}
			if (USE_PROFILES.svgFilters === true) {
				addToSet(ALLOWED_TAGS, svgFilters);
				addToSet(ALLOWED_ATTR, svg);
				addToSet(ALLOWED_ATTR, xml);
			}
			if (USE_PROFILES.mathMl === true) {
				addToSet(ALLOWED_TAGS, mathMl$1);
				addToSet(ALLOWED_ATTR, mathMl);
				addToSet(ALLOWED_ATTR, xml);
			}
		}
		EXTRA_ELEMENT_HANDLING.tagCheck = null;
		EXTRA_ELEMENT_HANDLING.attributeCheck = null;
		if (objectHasOwnProperty(cfg, "ADD_TAGS")) {
			if (typeof cfg.ADD_TAGS === "function") EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
			else if (arrayIsArray(cfg.ADD_TAGS)) {
				if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) ALLOWED_TAGS = clone(ALLOWED_TAGS);
				addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
			}
		}
		if (objectHasOwnProperty(cfg, "ADD_ATTR")) {
			if (typeof cfg.ADD_ATTR === "function") EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
			else if (arrayIsArray(cfg.ADD_ATTR)) {
				if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) ALLOWED_ATTR = clone(ALLOWED_ATTR);
				addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
			}
		}
		if (objectHasOwnProperty(cfg, "ADD_FORBID_CONTENTS") && arrayIsArray(cfg.ADD_FORBID_CONTENTS)) {
			if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) FORBID_CONTENTS = clone(FORBID_CONTENTS);
			addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
		}
		if (KEEP_CONTENT) ALLOWED_TAGS["#text"] = true;
		if (WHOLE_DOCUMENT) addToSet(ALLOWED_TAGS, [
			"html",
			"head",
			"body"
		]);
		if (ALLOWED_TAGS.table) {
			addToSet(ALLOWED_TAGS, ["tbody"]);
			delete FORBID_TAGS.tbody;
		}
		if (cfg.TRUSTED_TYPES_POLICY) {
			if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") throw typeErrorCreate("TRUSTED_TYPES_POLICY configuration option must provide a \"createHTML\" hook.");
			if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") throw typeErrorCreate("TRUSTED_TYPES_POLICY configuration option must provide a \"createScriptURL\" hook.");
			const previousTrustedTypesPolicy = trustedTypesPolicy;
			trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
			try {
				emptyHTML = _createTrustedHTML("");
			} catch (error) {
				trustedTypesPolicy = previousTrustedTypesPolicy;
				throw error;
			}
		} else if (cfg.TRUSTED_TYPES_POLICY === null) {
			trustedTypesPolicy = void 0;
			emptyHTML = "";
		} else {
			if (trustedTypesPolicy === void 0) trustedTypesPolicy = _getDefaultTrustedTypesPolicy();
			if (trustedTypesPolicy && typeof emptyHTML === "string") emptyHTML = _createTrustedHTML("");
		}
		if (freeze) freeze(cfg);
		CONFIG = cfg;
	};
	const ALL_SVG_TAGS = addToSet({}, [
		...svg$1,
		...svgFilters,
		...svgDisallowed
	]);
	const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
	/**
	* Namespace rules for an element in the SVG namespace.
	*
	* @param tagName the element's lowercase tag name
	* @param parent the (possibly simulated) parent node
	* @param parentTagName the parent's lowercase tag name
	* @returns true if a spec-compliant parser could produce this element
	*/
	const _checkSvgNamespace = function _checkSvgNamespace(tagName, parent, parentTagName) {
		if (parent.namespaceURI === HTML_NAMESPACE) return tagName === "svg";
		if (parent.namespaceURI === MATHML_NAMESPACE) return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
		return Boolean(ALL_SVG_TAGS[tagName]);
	};
	/**
	* Namespace rules for an element in the MathML namespace.
	*
	* @param tagName the element's lowercase tag name
	* @param parent the (possibly simulated) parent node
	* @param parentTagName the parent's lowercase tag name
	* @returns true if a spec-compliant parser could produce this element
	*/
	const _checkMathMlNamespace = function _checkMathMlNamespace(tagName, parent, parentTagName) {
		if (parent.namespaceURI === HTML_NAMESPACE) return tagName === "math";
		if (parent.namespaceURI === SVG_NAMESPACE) return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
		return Boolean(ALL_MATHML_TAGS[tagName]);
	};
	/**
	* Namespace rules for an element in the HTML namespace.
	*
	* @param tagName the element's lowercase tag name
	* @param parent the (possibly simulated) parent node
	* @param parentTagName the parent's lowercase tag name
	* @returns true if a spec-compliant parser could produce this element
	*/
	const _checkHtmlNamespace = function _checkHtmlNamespace(tagName, parent, parentTagName) {
		if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) return false;
		if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) return false;
		return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
	};
	/**
	* @param element a DOM element whose namespace is being checked
	* @returns Return false if the element has a
	*  namespace that a spec-compliant parser would never
	*  return. Return true otherwise.
	*/
	const _checkValidNamespace = function _checkValidNamespace(element) {
		let parent = getParentNode(element);
		if (!parent || !parent.tagName) parent = {
			namespaceURI: NAMESPACE,
			tagName: "template"
		};
		const tagName = stringToLowerCase(element.tagName);
		const parentTagName = stringToLowerCase(parent.tagName);
		if (!ALLOWED_NAMESPACES[element.namespaceURI]) return false;
		if (element.namespaceURI === SVG_NAMESPACE) return _checkSvgNamespace(tagName, parent, parentTagName);
		if (element.namespaceURI === MATHML_NAMESPACE) return _checkMathMlNamespace(tagName, parent, parentTagName);
		if (element.namespaceURI === HTML_NAMESPACE) return _checkHtmlNamespace(tagName, parent, parentTagName);
		if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) return true;
		return false;
	};
	/**
	* _forceRemove
	*
	* @param node a DOM node
	*/
	const _forceRemove = function _forceRemove(node) {
		arrayPush(DOMPurify.removed, { element: node });
		try {
			getParentNode(node).removeChild(node);
		} catch (_) {
			remove(node);
			if (!getParentNode(node)) throw typeErrorCreate("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place");
		}
	};
	/**
	* _stripAttributeNode
	*
	* Remove a single Attr node case/namespace-exactly on an attribute-teardown
	* path. Name-based removeAttribute() ASCII-lowercases its lookup key for an
	* HTML element in an HTML document and so silently misses a case-preserved
	* handler (e.g. `ONERROR` off an XML/XHTML import) - the same defect
	* _removeAttribute() was fixed for, which a name-based call would reintroduce
	* on these IN_PLACE teardown paths. Unlike _removeAttribute this does not
	* record into DOMPurify.removed: the neutralize passes intentionally do not
	* book-keep. A clobbered/detached node falls back to best-effort name-based
	* removal.
	*
	* @param element the element to strip the attribute from
	* @param attribute the Attr node to remove
	* @param name the attribute's name, for the fallback path
	*/
	const _stripAttributeNode = function _stripAttributeNode(element, attribute, name) {
		try {
			removeAttributeNode(element, attribute);
		} catch (_) {
			try {
				element.removeAttribute(name);
			} catch (_) {}
		}
	};
	/**
	* _neutralizeRoot
	*
	* Fail-closed teardown of an in-place root after the sanitize walk aborts
	* (campaign-3 F2). An internal throw mid-walk — e.g. a page-registered
	* custom element's reaction detaches a node so `_forceRemove`'s deliberate
	* parentless guard throws, or any other re-entrant engine mutation — would
	* otherwise leave the caller's *live* tree half-sanitized, with everything
	* after the abort point still carrying its handlers. There is no safe way
	* to resume the walk (the tree mutated under us), so we strip the root bare:
	* remove every child and every attribute, then let the caller's catch see
	* the original error. Clobber-safe (cached `remove`/`childNodes`/`attributes`
	* getters; the root was already clobber-pre-flighted at the IN_PLACE entry).
	*
	* @param root the in-place root to empty
	*/
	const _neutralizeRoot = function _neutralizeRoot(root) {
		_neutralizeSubtree(root);
		const childNodes = getChildNodes(root);
		if (childNodes) {
			const snapshot = [];
			arrayForEach(childNodes, (child) => {
				arrayPush(snapshot, child);
			});
			arrayForEach(snapshot, (child) => {
				try {
					remove(child);
				} catch (_) {}
			});
		}
		const attributes = getAttributes(root);
		if (attributes) for (let i = attributes.length - 1; i >= 0; --i) {
			const attribute = attributes[i];
			const name = attribute && attribute.name;
			if (typeof name === "string") _stripAttributeNode(root, attribute, name);
		}
	};
	/**
	* _removeAttribute
	*
	* Name-based getAttributeNode()/removeAttribute() ASCII-lowercase their
	* lookup key for HTML elements in an HTML document, so they silently miss an
	* attribute whose stored qualified name still contains uppercase ASCII
	* letters. That happens when the node came from a case-preserving source
	* (an XML/XHTML document imported via importNode(), or createAttributeNS()),
	* where e.g. `ONERROR` survives the walk: the policy check lowercases to
	* `onerror` and rejects it, but `removeAttribute('ONERROR')` looks up
	* `onerror` and finds nothing. Remove the exact Attr node instead, which is
	* case- and namespace-exact, and fall back to name-based removal only when
	* the caller could not supply the node.
	*
	* @param name an Attribute name
	* @param element a DOM node
	* @param attr the exact Attr node to remove, when the caller has it
	*/
	const _removeAttribute = function _removeAttribute(name, element, attr) {
		if (!attr) try {
			attr = element.getAttributeNode(name);
		} catch (_) {
			attr = null;
		}
		arrayPush(DOMPurify.removed, {
			attribute: attr || null,
			from: element
		});
		try {
			if (attr) removeAttributeNode(element, attr);
			else element.removeAttribute(name);
		} catch (_) {
			try {
				element.removeAttribute(name);
			} catch (_) {}
		}
		if (name === "is") {
			if (RETURN_DOM || RETURN_DOM_FRAGMENT) try {
				_forceRemove(element);
			} catch (_) {}
			else try {
				element.setAttribute(name, "");
			} catch (_) {}
		}
	};
	/**
	* _stripDisallowedAttributes
	*
	* Removes every attribute the active configuration does not allow from a
	* single element, using the same allowlist as the main attribute pass (so
	* `on*` handlers go, but no `/^on/` blocklist is introduced). Used only to
	* neutralise nodes that are being discarded from an in-place tree.
	*
	* @param element the element to strip
	*/
	const _stripDisallowedAttributes = function _stripDisallowedAttributes(element) {
		const attributes = getAttributes(element);
		if (!attributes) return;
		for (let i = attributes.length - 1; i >= 0; --i) {
			const attribute = attributes[i];
			const name = attribute && attribute.name;
			if (typeof name !== "string" || ALLOWED_ATTR[transformCaseFunc(name)]) continue;
			_stripAttributeNode(element, attribute, name);
		}
	};
	/**
	* _neutralizeSubtree
	*
	* Completes the audit-5 F1 fix across every removal path. The KEEP_CONTENT
	* move-hoist neutralises only disallowed-tag removals; clobber, mXSS-canary,
	* namespace, comment, processing-instruction and KEEP_CONTENT:false removals
	* all drop their subtree wholesale via `_forceRemove`. On the IN_PLACE path
	* those dropped nodes are detached from the caller's LIVE tree but a
	* handler-bearing original among them (an `<img onerror>`/`<video>` that was
	* loading) keeps its queued resource event, which fires in page scope after
	* sanitize returns. This walks a removed subtree and strips every attribute
	* the active configuration does not allow — so `on*` handlers are cancelled
	* through the SAME allowlist that governs kept nodes, not a separate `/^on/`
	* blocklist. Run synchronously before sanitize returns, i.e. before any
	* queued event can fire. Hook-free by design: these nodes leave the output,
	* so firing attribute hooks for them would be surprising. Clobber-safe reads;
	* a doomed clobbered node may shadow `removeAttribute` (its own attributes are
	* irrelevant — it is discarded — while its non-clobbered descendants, e.g.
	* the `<img>`, are reached and scrubbed).
	*
	* @param root the root of a removed subtree to neutralise
	*/
	const _neutralizeSubtree = function _neutralizeSubtree(root) {
		const stack = [root];
		while (stack.length > 0) {
			const node = stack.pop();
			if (_readNodeType(node) === NODE_TYPE.element) _stripDisallowedAttributes(node);
			const childNodes = getChildNodes(node);
			if (childNodes) for (let i = childNodes.length - 1; i >= 0; --i) stack.push(childNodes[i]);
		}
	};
	/**
	* _neutralizePatchLinkage
	*
	* IN_PLACE entry pre-pass (declarative-partial-updates / streaming
	* hardening, https://github.com/WICG/declarative-partial-updates).
	*
	* The main walk strips patch linkage (`for`/`patchsrc`) and removes range
	* markers (PIs / markup comments) node-by-node, in document order, AS it
	* reaches each node. On a live in-place root that leaves a window: from the
	* moment the root is connected until the walk arrives at a given node, that
	* node's linkage is live. A patch applied on connection/stream can fire as
	* a microtask during the walk and inject or teleport an unsanitized DOM
	* range into a region the iterator has already passed and will not revisit,
	* so the post-return "tree is sanitized" contract is violated. Sweep the
	* whole tree once up front and sever every linkage before the walk begins,
	* closing that window.
	*
	* This CANNOT undo a patch that already fired before sanitize ran — that is
	* the irreducible "do not IN_PLACE a live-connected attacker tree" caveat —
	* but it closes everything from sanitize-start onward. Gated on SAFE_FOR_XML
	* to group with the rest of the declarative-partial-updates handling and
	* stay overridable, consistent with the codebase.
	*
	* Clobber-safe traversal (cached childNodes getter); per-node try/catch so a
	* clobbered root cannot defeat the sweep of its non-clobbered descendants.
	*
	* NOTE (pending real-Chrome confirmation, see test/declarative-patch-probe
	* .html Q1): this mirrors the existing policy of keeping `for` on
	* <label>/<output>. If the shipping feature can drive a patch through a
	* surviving `for`-on-label/output + `id` pair, this pre-pass and the
	* attribute check at _isBasicCustomElement's caller must additionally drop
	* that pair on the IN_PLACE path. Left as-is until the taxonomy is verified.
	*
	* @param root the in-place root to sweep
	*/
	/**
	* Central policy for declarative-partial-updates patch-linkage attributes,
	* shared by the _neutralizePatchLinkage pre-pass and _isValidAttribute so
	* the two sites cannot drift: `patchsrc` always links, `for` links
	* everywhere except on <label>/<output>, and the whole policy is gated on
	* SAFE_FOR_XML (see the rationale block in _isValidAttribute).
	*
	* @param lcName the transformCaseFunc'd attribute name
	* @param lcTag the transformCaseFunc'd tag name of the carrying element
	* @return true if the attribute is patch linkage and must be dropped
	*/
	const _isPatchLinkageAttribute = function _isPatchLinkageAttribute(lcName, lcTag) {
		if (!SAFE_FOR_XML) return false;
		if (lcName === "patchsrc") return true;
		return lcName === "for" && lcTag !== "label" && lcTag !== "output";
	};
	const _neutralizePatchLinkage = function _neutralizePatchLinkage(root) {
		if (!SAFE_FOR_XML) return;
		const stack = [root];
		while (stack.length > 0) {
			const node = stack.pop();
			const nodeType = _readNodeType(node);
			if (nodeType === NODE_TYPE.processingInstruction || nodeType === NODE_TYPE.comment && regExpTest(COMMENT_MARKUP_PROBE, node.data)) {
				try {
					remove(node);
				} catch (_) {}
				continue;
			}
			if (nodeType === NODE_TYPE.element) {
				const element = node;
				const lcTag = transformCaseFunc(_readNodeName(node));
				try {
					if (element.hasAttribute && element.hasAttribute("patchsrc")) element.removeAttribute("patchsrc");
					if (element.hasAttribute && element.hasAttribute("for") && _isPatchLinkageAttribute("for", lcTag)) element.removeAttribute("for");
				} catch (_) {}
			}
			const childNodes = getChildNodes(node);
			if (childNodes) for (let i = childNodes.length - 1; i >= 0; --i) stack.push(childNodes[i]);
		}
	};
	/**
	* _initDocument
	*
	* @param dirty - a string of dirty markup
	* @return a DOM, filled with the dirty markup
	*/
	const _initDocument = function _initDocument(dirty) {
		let doc = null;
		let leadingWhitespace = null;
		if (FORCE_BODY) dirty = "<remove></remove>" + dirty;
		else {
			const matches = stringMatch(dirty, /^[\r\n\t ]+/);
			leadingWhitespace = matches && matches[0];
		}
		if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) dirty = "<html xmlns=\"http://www.w3.org/1999/xhtml\"><head></head><body>" + dirty + "</body></html>";
		const dirtyPayload = trustedTypesPolicy ? _createTrustedHTML(dirty) : dirty;
		if (NAMESPACE === HTML_NAMESPACE) try {
			doc = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
		} catch (_) {}
		if (!doc || !doc.documentElement) {
			doc = implementation.createDocument(NAMESPACE, "template", null);
			try {
				doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
			} catch (_) {}
		}
		const body = doc.body || doc.documentElement;
		if (dirty && leadingWhitespace) body.insertBefore(document.createTextNode(leadingWhitespace), body.childNodes[0] || null);
		if (NAMESPACE === HTML_NAMESPACE) return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? "html" : "body")[0];
		return WHOLE_DOCUMENT ? doc.documentElement : body;
	};
	/**
	* Creates a NodeIterator object that you can use to traverse filtered lists of nodes or elements in a document.
	*
	* @param root The root element or node to start traversing on.
	* @return The created NodeIterator
	*/
	const _createNodeIterator = function _createNodeIterator(root) {
		const doc = getOwnerDocument ? getOwnerDocument(root) : root.ownerDocument;
		return createNodeIterator.call(doc || root, root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION, null);
	};
	/**
	* Replace template expression syntax (mustache, ERB, template
	* literal) with a space; shared by all SAFE_FOR_TEMPLATES scrub
	* sites. Order matters: mustache, then ERB, then template literal.
	*
	* @param value the string to scrub
	* @returns the scrubbed string
	*/
	const _stripTemplateExpressions = function _stripTemplateExpressions(value) {
		value = stringReplace(value, MUSTACHE_EXPR$1, " ");
		value = stringReplace(value, ERB_EXPR$1, " ");
		value = stringReplace(value, TMPLIT_EXPR$1, " ");
		return value;
	};
	/**
	* Strip template-engine expressions ({{...}}, ${...}, <%...%>) from the
	* character data of an element subtree. Used as the final safety net for
	* SAFE_FOR_TEMPLATES on every DOM-returning code path so that expressions
	* which only form after text-node normalization (e.g. fragments split across
	* stripped elements) cannot survive into a template-evaluating framework.
	*
	* Walks text/comment/CDATA/processing-instruction nodes and mutates `.data`
	* in place rather than round-tripping through innerHTML. This preserves
	* descendant node references (important for IN_PLACE callers), avoids a
	* serialize/reparse cycle, and reads literal character data — which means
	* `<%...%>` in text content matches the ERB regex against its real bytes
	* instead of the HTML-entity-escaped form innerHTML would produce.
	*
	* Attribute values are not visited here; SAFE_FOR_TEMPLATES handling for
	* attributes is performed during the per-node `_sanitizeAttributes` pass.
	*
	* @param node The root element whose character data should be scrubbed.
	*/
	const _scrubTemplateExpressions2 = function _scrubTemplateExpressions(node) {
		var _node$querySelectorAl;
		node.normalize();
		const doc = getOwnerDocument ? getOwnerDocument(node) : node.ownerDocument;
		const walker = createNodeIterator.call(doc || node, node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_CDATA_SECTION | NodeFilter.SHOW_PROCESSING_INSTRUCTION, null);
		let currentNode = walker.nextNode();
		while (currentNode) {
			currentNode.data = _stripTemplateExpressions(currentNode.data);
			currentNode = walker.nextNode();
		}
		const templates = (_node$querySelectorAl = node.querySelectorAll) === null || _node$querySelectorAl === void 0 ? void 0 : _node$querySelectorAl.call(node, "template");
		if (templates) arrayForEach(templates, (tmpl) => {
			if (_isDocumentFragment(tmpl.content)) _scrubTemplateExpressions2(tmpl.content);
		});
	};
	/**
	* _isClobbered
	*
	* Detect DOM-clobbering on HTMLFormElement nodes. Form is the only HTML
	* interface with [LegacyOverrideBuiltIns]; a descendant element with a
	* `name` attribute matching a prototype property shadows that property
	* on direct reads. We use this check at the IN_PLACE entry-point and
	* during attribute sanitization to refuse clobbered forms.
	*
	* @param element element to check for clobbering attacks
	* @return true if clobbered, false if safe
	*/
	const _isClobbered = function _isClobbered(element) {
		const realTagName = getNodeName ? getNodeName(element) : null;
		if (typeof realTagName !== "string") return false;
		if (transformCaseFunc(realTagName) !== "form") return false;
		return typeof element.nodeName !== "string" || typeof element.textContent !== "string" || typeof element.removeChild !== "function" || element.attributes !== getAttributes(element) || typeof element.removeAttribute !== "function" || typeof element.removeAttributeNode !== "function" || typeof element.getAttributeNode !== "function" || typeof element.setAttribute !== "function" || typeof element.namespaceURI !== "string" || typeof element.insertBefore !== "function" || typeof element.hasChildNodes !== "function" || element.nodeType !== getNodeType(element) || element.childNodes !== getChildNodes(element);
	};
	/**
	* Checks whether the given value is a DocumentFragment from any realm.
	*
	* The realm-independent replacement reads `nodeType` through the cached
	* Node.prototype getter and compares to the DOCUMENT_FRAGMENT_NODE
	* constant (11). nodeType is a numeric value resolved from the node's
	* internal slot, identical across realms for the same kind of node.
	*
	* @param value object to check
	* @return true if value is a DocumentFragment-shaped node from any realm
	*/
	const _isDocumentFragment = function _isDocumentFragment(value) {
		if (!getNodeType || typeof value !== "object" || value === null) return false;
		try {
			return getNodeType(value) === NODE_TYPE.documentFragment;
		} catch (_) {
			return false;
		}
	};
	/**
	* Checks whether the given object is a DOM node, including nodes that
	* originate from a different window/realm (e.g. an iframe's
	* contentDocument). The previous `value instanceof Node` check was
	* realm-bound: nodes from a different window failed it, causing
	* sanitize() to silently stringify them and reset IN_PLACE to false,
	* returning the original node unsanitized. See GHSA-4w3q-35jp-p934.
	*
	* @param value object to check whether it's a DOM node
	* @return true if value is a DOM node from any realm
	*/
	const _isNode = function _isNode(value) {
		if (!getNodeType || typeof value !== "object" || value === null) return false;
		try {
			return typeof getNodeType(value) === "number";
		} catch (_) {
			return false;
		}
	};
	function _executeHooks(hooks, currentNode, data) {
		if (hooks.length === 0) return;
		arrayForEach(hooks, (hook) => {
			hook.call(DOMPurify, currentNode, data, CONFIG);
		});
	}
	/**
	* Structural-threat checks that condemn a node regardless of the
	* allowlists: mXSS via namespace confusion, risky CSS construction,
	* processing instructions, markup-bearing comments. Pure predicate;
	* the caller removes. Check order is load-bearing.
	*
	* @param currentNode the node to inspect
	* @param tagName the node's transformCaseFunc'd tag name
	* @return true if the node must be removed
	*/
	const _isUnsafeNode = function _isUnsafeNode(currentNode, tagName) {
		if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.textContent) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.innerHTML)) return true;
		if (SAFE_FOR_XML && currentNode.namespaceURI === HTML_NAMESPACE && LITERAL_TEXT_ELEMENTS[tagName] && (_isNode(currentNode.firstElementChild) || typeof currentNode.textContent === "string" && regExpTest(LITERAL_TEXT_CLOSE[tagName], currentNode.textContent))) return true;
		if (currentNode.nodeType === NODE_TYPE.processingInstruction) return true;
		if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(COMMENT_MARKUP_PROBE, currentNode.data)) return true;
		return false;
	};
	/**
	* Evaluate a CUSTOM_ELEMENT_HANDLING check (a RegExp or a predicate
	* function, per the validation in _parseConfig) against a name.
	* Additional arguments are forwarded to predicate functions - the
	* attributeNameCheck predicate receives the tag name as its second
	* argument. A null/absent check never matches.
	*
	* @param check the configured tagNameCheck / attributeNameCheck value
	* @param name the name to test
	* @param args extra arguments forwarded to a predicate function
	* @return true if the check matches the name
	*/
	const _matchesNameCheck = function _matchesNameCheck(check, name) {
		if (check instanceof RegExp) return regExpTest(check, name);
		if (check instanceof Function) {
			for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) args[_key - 2] = arguments[_key];
			return Boolean(check(name, ...args));
		}
		return false;
	};
	/**
	* Handle a node whose tag is forbidden or not allowlisted: keep
	* allowed custom elements (false return exits _sanitizeElements
	* early - the namespace and fallback-tag removal checks are
	* intentionally skipped for kept custom elements), else hoist
	* content per KEEP_CONTENT and remove.
	*
	* A kept custom element is the ONLY case in which this function
	* returns false, so the caller uses that return value to run the
	* afterSanitizeElements hook on the kept element and keep the
	* element-hook lifecycle consistent with normal allowlisted
	* elements (GHSA-c2j3-45gr-mqc4).
	*
	* @param currentNode the disallowed node
	* @param tagName the node's transformCaseFunc'd tag name
	* @return true if the node was removed, false if kept
	*/
	const _sanitizeDisallowedNode = function _sanitizeDisallowedNode(currentNode, tagName, root) {
		if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName) && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) return false;
		if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
			const parentNode = getParentNode(currentNode);
			const childNodes = getChildNodes(currentNode);
			if (childNodes && parentNode) {
				const childCount = childNodes.length;
				for (let i = childCount - 1; i >= 0; --i) {
					const hoisted = currentNode === root ? cloneNode(childNodes[i], true) : childNodes[i];
					parentNode.insertBefore(hoisted, getNextSibling(currentNode));
				}
			}
		}
		_forceRemove(currentNode);
		return true;
	};
	/**
	* Fork a hook-mutable allowlist off its shared binding the first time a
	* (possibly lazily-installed) uponSanitize* hook is about to see it, so the
	* hook cannot widen the per-instance default or the setConfig binding by
	* reference and leak past the call. Returns the set unchanged once it is
	* already call-local, so repeated calls across elements are idempotent.
	*
	* @param hookList the uponSanitize* hook array for this event
	* @param set the current ALLOWED_TAGS / ALLOWED_ATTR binding
	* @param defaultSet the per-instance DEFAULT_ALLOWED_* constant
	* @param setConfigSet the captured setConfig() binding, or null
	* @return a call-local clone if a hook is present and set is still shared,
	*   else set unchanged
	*/
	const _forkSharedAllowlist = function _forkSharedAllowlist(hookList, set, defaultSet, setConfigSet) {
		if (hookList.length === 0) return set;
		return set === defaultSet || set === setConfigSet ? clone(set) : set;
	};
	/**
	* Shared guard for a node that a hook has detached from the walk tree,
	* used after each element-hook site in _sanitizeElements. Detaching is a
	* long-standing user pattern (issue #469; draw.io-style foreignObject
	* filtering). Per the cached, unclobberable parentNode getter the node is
	* genuinely out of the tree, so it can reach neither the serialized
	* output nor an IN_PLACE live tree; treat it as removed and stop
	* processing it. Without this guard, the unsafe-node / namespace checks
	* would call _forceRemove on a parentless node and hit the REPORT-3
	* fail-closed throw — which exists for nodes DOMPurify wants gone but
	* *cannot* detach (clobbered / parentless roots), the opposite of a node
	* that is already safely gone. The walk root is exempt: a detached
	* IN_PLACE root is legitimate input and must still be fully sanitized,
	* and a kill-decision on it must keep hitting the REPORT-3 throw.
	*
	* Nodes detached by hooks stay the hook's responsibility for placement:
	* they are not recorded in DOMPurify.removed, so the post-walk IN_PLACE
	* pass (which iterates DOMPurify.removed) does not reach them. But a
	* hook-detached subtree can still hold a queued resource-event handler -
	* e.g. an <img onload> that began loading when the caller built the live
	* tree - which fires in page scope after sanitize returns even though the
	* handler never reached the returned tree. That is the audit-5 F1 hazard,
	* and the documented node.remove() hook pattern walks straight into it.
	* So on the IN_PLACE path we neutralize the detached subtree inline,
	* stripping its non-allow-listed attributes before returning, exactly as
	* the post-walk pass does for _forceRemove'd subtrees.
	*
	* @param currentNode the node a hook may have detached
	* @param root the current walk root
	* @return true if the node is detached and now handled, false otherwise
	*/
	const _handleHookDetachedNode = function _handleHookDetachedNode(currentNode, root) {
		if (currentNode === root || getParentNode(currentNode) !== null) return false;
		if (IN_PLACE) _neutralizeSubtree(currentNode);
		return true;
	};
	/**
	* _sanitizeElements
	*
	* @protect nodeName
	* @protect textContent
	* @protect removeChild
	* @param currentNode to check for permission to exist
	* @return true if node was killed, false if left alive
	*/
	const _sanitizeElements = function _sanitizeElements(currentNode, root) {
		_executeHooks(hooks.beforeSanitizeElements, currentNode, null);
		if (_handleHookDetachedNode(currentNode, root)) return true;
		if (_isClobbered(currentNode)) {
			_forceRemove(currentNode);
			return true;
		}
		const tagName = transformCaseFunc(_readNodeName(currentNode));
		ALLOWED_TAGS = _forkSharedAllowlist(hooks.uponSanitizeElement, ALLOWED_TAGS, DEFAULT_ALLOWED_TAGS, SET_CONFIG_ALLOWED_TAGS);
		_executeHooks(hooks.uponSanitizeElement, currentNode, {
			tagName,
			allowedTags: ALLOWED_TAGS
		});
		if (_handleHookDetachedNode(currentNode, root)) return true;
		if (_isUnsafeNode(currentNode, tagName)) {
			_forceRemove(currentNode);
			return true;
		}
		if (FORBID_TAGS[tagName] || !(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && !ALLOWED_TAGS[tagName]) {
			const removed = _sanitizeDisallowedNode(currentNode, tagName, root);
			if (removed === false) {
				_executeHooks(hooks.afterSanitizeElements, currentNode, null);
				if (_handleHookDetachedNode(currentNode, root)) return true;
			}
			return removed;
		}
		if (_readNodeType(currentNode) === NODE_TYPE.element && !_checkValidNamespace(currentNode)) {
			_forceRemove(currentNode);
			return true;
		}
		if ((tagName === "noscript" || tagName === "noembed" || tagName === "noframes") && regExpTest(FALLBACK_TAG_CLOSE, currentNode.innerHTML)) {
			_forceRemove(currentNode);
			return true;
		}
		if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
			const content = _stripTemplateExpressions(currentNode.textContent);
			if (currentNode.textContent !== content) {
				arrayPush(DOMPurify.removed, { element: currentNode.cloneNode() });
				currentNode.textContent = content;
			}
		}
		_executeHooks(hooks.afterSanitizeElements, currentNode, null);
		return _handleHookDetachedNode(currentNode, root);
	};
	/**
	* _isValidAttribute
	*
	* @param lcTag Lowercase tag name of containing element.
	* @param lcName Lowercase attribute name.
	* @param value Attribute value.
	* @return Returns true if `value` is valid, otherwise false.
	*/
	const _isValidAttribute = function _isValidAttribute(lcTag, lcName, value) {
		if (FORBID_ATTR[lcName]) return false;
		if (_isPatchLinkageAttribute(lcName, lcTag)) return false;
		if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document || value in formElement)) return false;
		const nameIsPermitted = ALLOWED_ATTR[lcName] || EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag);
		if (ALLOW_DATA_ATTR && regExpTest(DATA_ATTR$1, lcName)) return true;
		if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$1, lcName)) return true;
		if (!nameIsPermitted) return _isBasicCustomElement(lcTag) && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName, lcTag) || lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value);
		if (URI_SAFE_ATTRIBUTES[lcName]) return true;
		if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) return true;
		if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag]) return true;
		if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) return true;
		return !value;
	};
	const RESERVED_CUSTOM_ELEMENT_NAMES = addToSet({}, [
		"annotation-xml",
		"color-profile",
		"font-face",
		"font-face-format",
		"font-face-name",
		"font-face-src",
		"font-face-uri",
		"missing-glyph"
	]);
	/**
	* _isBasicCustomElement
	* checks if at least one dash is included in tagName, and it's not the first char
	* for more sophisticated checking see https://github.com/sindresorhus/validate-element-name
	*
	* @param tagName name of the tag of the node to sanitize
	* @returns Returns true if the tag name meets the basic criteria for a custom element, otherwise false.
	*/
	const _isBasicCustomElement = function _isBasicCustomElement(tagName) {
		return !RESERVED_CUSTOM_ELEMENT_NAMES[stringToLowerCase(tagName)] && regExpTest(CUSTOM_ELEMENT$1, tagName);
	};
	/**
	* Wrap an attribute value in the matching Trusted Types object when
	* the active policy requires it. Namespaced attributes pass through
	* unchanged (no TT support yet, see
	* https://bugs.chromium.org/p/chromium/issues/detail?id=1305293).
	*
	* @param lcTag lowercase tag name of the containing element
	* @param lcName lowercase attribute name
	* @param namespaceURI the attribute's namespace, if any
	* @param value the attribute value to wrap
	* @return the value, wrapped when Trusted Types demand it
	*/
	const _applyTrustedTypesToAttribute = function _applyTrustedTypesToAttribute(lcTag, lcName, namespaceURI, value) {
		if (trustedTypesPolicy && typeof trustedTypes === "object" && typeof trustedTypes.getAttributeType === "function" && !namespaceURI) switch (trustedTypes.getAttributeType(lcTag, lcName)) {
			case "TrustedHTML": return _createTrustedHTML(value);
			case "TrustedScriptURL": return _createTrustedScriptURL(value);
		}
		return value;
	};
	/**
	* Write a modified attribute value back onto the element. On
	* success, re-probe for clobbering introduced by the new value and
	* remove the element when found; otherwise, when this writeback is the
	* recreate half of the SANITIZE_NAMED_PROPS remove-and-recreate, pop the
	* removal entry that path recorded so it does not show as removed. On
	* failure, remove the attribute instead.
	*
	* Returns true only on a clean write (the value was set and the new value
	* introduced no clobbering). The caller uses that, together with its own
	* knowledge of whether this attribute pushed a DOMPurify.removed record, to
	* decide whether to pop that record. The pop must happen ONLY for the
	* named-prop remove-and-recreate; popping on any other value change (trim,
	* template scrubbing, Trusted Types) would consume an unrelated _forceRemove
	* subtree-cleanup record and let that detached subtree keep a live event
	* handler through the IN_PLACE neutralization pass (SO-001).
	*
	* @param currentNode the element carrying the attribute
	* @param name the attribute name as present on the element
	* @param namespaceURI the attribute's namespace, if any
	* @param value the new attribute value
	* @return true if the value was written without introducing clobbering
	*/
	const _setAttributeValue = function _setAttributeValue(currentNode, name, namespaceURI, value) {
		try {
			if (namespaceURI) currentNode.setAttributeNS(namespaceURI, name, value);
			else currentNode.setAttribute(name, value);
			if (_isClobbered(currentNode)) {
				_forceRemove(currentNode);
				return false;
			}
			return true;
		} catch (_) {
			_removeAttribute(name, currentNode);
			return false;
		}
	};
	/**
	* _sanitizeAttributes
	*
	* @protect attributes
	* @protect nodeName
	* @protect removeAttribute
	* @protect setAttribute
	*
	* @param currentNode to sanitize
	* @param root the current walk root
	*/
	const _sanitizeAttributes = function _sanitizeAttributes(currentNode, root) {
		_executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
		if (_handleHookDetachedNode(currentNode, root)) return;
		const attributes = currentNode.attributes;
		if (!attributes || _isClobbered(currentNode)) return;
		ALLOWED_ATTR = _forkSharedAllowlist(hooks.uponSanitizeAttribute, ALLOWED_ATTR, DEFAULT_ALLOWED_ATTR, SET_CONFIG_ALLOWED_ATTR);
		const hookEvent = {
			attrName: "",
			attrValue: "",
			keepAttr: true,
			allowedAttributes: ALLOWED_ATTR,
			forceKeepAttr: void 0
		};
		let l = attributes.length;
		const lcTag = transformCaseFunc(currentNode.nodeName);
		while (l--) {
			const attr = attributes[l];
			const name = attr.name, namespaceURI = attr.namespaceURI, attrValue = attr.value;
			const lcName = transformCaseFunc(name);
			const initValue = attrValue;
			let value = name === "value" ? initValue : stringTrim(initValue);
			let recreatedNamedProp = false;
			hookEvent.attrName = lcName;
			hookEvent.attrValue = value;
			hookEvent.keepAttr = true;
			hookEvent.forceKeepAttr = void 0;
			_executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
			value = hookEvent.attrValue;
			if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name") && stringIndexOf(value, SANITIZE_NAMED_PROPS_PREFIX) !== 0) {
				_removeAttribute(name, currentNode, attr);
				value = SANITIZE_NAMED_PROPS_PREFIX + value;
				recreatedNamedProp = true;
			}
			if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, value)) {
				_removeAttribute(name, currentNode, attr);
				continue;
			}
			if (lcName === "attributename" && stringMatch(value, "href")) {
				_removeAttribute(name, currentNode, attr);
				continue;
			}
			if (hookEvent.forceKeepAttr) continue;
			if (!hookEvent.keepAttr) {
				_removeAttribute(name, currentNode, attr);
				continue;
			}
			if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(SELF_CLOSING_TAG, value)) {
				_removeAttribute(name, currentNode, attr);
				continue;
			}
			if (SAFE_FOR_TEMPLATES) value = _stripTemplateExpressions(value);
			if (!_isValidAttribute(lcTag, lcName, value)) {
				_removeAttribute(name, currentNode, attr);
				continue;
			}
			value = _applyTrustedTypesToAttribute(lcTag, lcName, namespaceURI, value);
			if (value !== initValue) {
				if (_setAttributeValue(currentNode, name, namespaceURI, value) && recreatedNamedProp) arrayPop(DOMPurify.removed);
			}
		}
		_executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
		_handleHookDetachedNode(currentNode, root);
	};
	/**
	* _sanitizeShadowDOM
	*
	* @param fragment to iterate over recursively
	*/
	const _sanitizeShadowDOM2 = function _sanitizeShadowDOM(fragment) {
		let shadowNode = null;
		const shadowIterator = _createNodeIterator(fragment);
		_executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
		while (shadowNode = shadowIterator.nextNode()) {
			_executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
			_sanitizeElements(shadowNode, fragment);
			_sanitizeAttributes(shadowNode, fragment);
			if (_isDocumentFragment(shadowNode.content)) _sanitizeShadowDOM2(shadowNode.content);
			if (_readNodeType(shadowNode) === NODE_TYPE.element) {
				const innerSr = getShadowRoot(shadowNode);
				if (_isDocumentFragment(innerSr)) {
					_sanitizeAttachedShadowRoots(innerSr);
					_sanitizeShadowDOM2(innerSr);
				}
			}
		}
		_executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
	};
	/**
	* _sanitizeAttachedShadowRoots
	*
	* Walks `root` and feeds every attached shadow root we encounter into
	* the existing _sanitizeShadowDOM pipeline. The default node iterator
	* does not descend into shadow trees, so nodes inside an attached
	* shadow root would otherwise be skipped entirely.
	*
	* Two real input paths put attached shadow roots in front of us:
	*   1. IN_PLACE on a DOM node that already has shadow roots attached.
	*   2. DOM-node input where importNode(dirty, true) deep-clones the
	*      shadow root because it was created with `clonable: true`.
	*
	* This pass runs once, up front, so the main iteration loop (and the
	* existing _sanitizeShadowDOM template-content recursion) stay
	* untouched — string-input paths are not affected.
	*
	* @param root the subtree root to walk for attached shadow roots
	*/
	const _sanitizeAttachedShadowRoots = function _sanitizeAttachedShadowRoots(root) {
		const stack = [{
			node: root,
			shadow: null
		}];
		while (stack.length > 0) {
			const item = stack.pop();
			if (item.shadow) {
				_sanitizeShadowDOM2(item.shadow);
				continue;
			}
			const node = item.node;
			const isElement = _readNodeType(node) === NODE_TYPE.element;
			const childNodes = getChildNodes(node);
			if (childNodes) for (let i = childNodes.length - 1; i >= 0; --i) stack.push({
				node: childNodes[i],
				shadow: null
			});
			if (isElement) {
				const rootName = getNodeName ? getNodeName(node) : null;
				if (typeof rootName === "string" && transformCaseFunc(rootName) === "template") {
					const content = node.content;
					if (_isDocumentFragment(content)) stack.push({
						node: content,
						shadow: null
					});
				}
			}
			if (isElement) {
				const sr = getShadowRoot(node);
				if (_isDocumentFragment(sr)) stack.push({
					node: null,
					shadow: sr
				}, {
					node: sr,
					shadow: null
				});
			}
		}
	};
	DOMPurify.sanitize = function(dirty) {
		let cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		let body = null;
		let importedNode = null;
		let currentNode = null;
		let returnNode = null;
		IS_EMPTY_INPUT = !dirty;
		if (IS_EMPTY_INPUT) dirty = "<!-->";
		if (typeof dirty !== "string" && !_isNode(dirty)) {
			dirty = stringifyValue(dirty);
			if (typeof dirty !== "string") throw typeErrorCreate("dirty is not a string, aborting");
		}
		if (!DOMPurify.isSupported) return dirty;
		if (SET_CONFIG) {
			ALLOWED_TAGS = SET_CONFIG_ALLOWED_TAGS;
			ALLOWED_ATTR = SET_CONFIG_ALLOWED_ATTR;
		} else _parseConfig(cfg);
		if (hooks.uponSanitizeElement.length > 0 || hooks.uponSanitizeAttribute.length > 0) ALLOWED_TAGS = clone(ALLOWED_TAGS);
		if (hooks.uponSanitizeAttribute.length > 0) ALLOWED_ATTR = clone(ALLOWED_ATTR);
		DOMPurify.removed = [];
		const inPlace = IN_PLACE && typeof dirty !== "string" && _isNode(dirty);
		if (inPlace) {
			_neutralizePatchLinkage(dirty);
			const nn = _readNodeName(dirty);
			if (typeof nn === "string") {
				const tagName = transformCaseFunc(nn);
				if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
					_neutralizeRoot(dirty);
					throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
				}
			}
			if (_isClobbered(dirty)) {
				_neutralizeRoot(dirty);
				throw typeErrorCreate("root node is clobbered and cannot be sanitized in-place");
			}
			try {
				_sanitizeAttachedShadowRoots(dirty);
			} catch (error) {
				_neutralizeRoot(dirty);
				throw error;
			}
		} else if (_isNode(dirty)) {
			body = _initDocument("<!---->");
			importedNode = body.ownerDocument.importNode(dirty, true);
			if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") body = importedNode;
			else if (importedNode.nodeName === "HTML") body = importedNode;
			else body.appendChild(importedNode);
			_sanitizeAttachedShadowRoots(body);
		} else {
			if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && dirty.indexOf("<") === -1) return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(dirty) : dirty;
			body = _initDocument(dirty);
			if (!body) return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
		}
		if (body && FORCE_BODY) _forceRemove(body.firstChild);
		const walkRoot = inPlace ? dirty : body;
		try {
			const nodeIterator = _createNodeIterator(walkRoot);
			while (currentNode = nodeIterator.nextNode()) {
				_sanitizeElements(currentNode, walkRoot);
				_sanitizeAttributes(currentNode, walkRoot);
				if (_isDocumentFragment(currentNode.content)) _sanitizeShadowDOM2(currentNode.content);
			}
		} catch (error) {
			if (inPlace) {
				_neutralizeRoot(dirty);
				arrayForEach(DOMPurify.removed, (entry) => {
					if (entry.element) _neutralizeSubtree(entry.element);
				});
			}
			throw error;
		}
		if (inPlace) {
			let rootWasRemoved = false;
			arrayForEach(DOMPurify.removed, (entry) => {
				if (entry.element) {
					if (entry.element === dirty) rootWasRemoved = true;
					_neutralizeSubtree(entry.element);
				}
			});
			if (rootWasRemoved) throw typeErrorCreate("a node selected for removal could not be safely returned; refusing to sanitize in place");
			if (SAFE_FOR_TEMPLATES) _scrubTemplateExpressions2(dirty);
			return dirty;
		}
		if (RETURN_DOM) {
			if (SAFE_FOR_TEMPLATES) _scrubTemplateExpressions2(body);
			if (RETURN_DOM_FRAGMENT) {
				returnNode = createDocumentFragment.call(body.ownerDocument);
				while (body.firstChild) returnNode.appendChild(body.firstChild);
			} else returnNode = body;
			if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) returnNode = importNode.call(originalDocument, returnNode, true);
			return returnNode;
		}
		let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
		if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
		if (SAFE_FOR_TEMPLATES) serializedHTML = _stripTemplateExpressions(serializedHTML);
		return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(serializedHTML) : serializedHTML;
	};
	DOMPurify.setConfig = function() {
		let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		_parseConfig(cfg);
		SET_CONFIG = true;
		SET_CONFIG_ALLOWED_TAGS = ALLOWED_TAGS;
		SET_CONFIG_ALLOWED_ATTR = ALLOWED_ATTR;
	};
	DOMPurify.clearConfig = function() {
		CONFIG = null;
		SET_CONFIG = false;
		SET_CONFIG_ALLOWED_TAGS = null;
		SET_CONFIG_ALLOWED_ATTR = null;
		trustedTypesPolicy = defaultTrustedTypesPolicy;
		emptyHTML = "";
	};
	DOMPurify.isValidAttribute = function(tag, attr, value) {
		if (!CONFIG) _parseConfig({});
		const lcTag = transformCaseFunc(tag);
		const lcName = transformCaseFunc(attr);
		return _isValidAttribute(lcTag, lcName, value);
	};
	DOMPurify.addHook = function(entryPoint, hookFunction) {
		if (typeof hookFunction !== "function") return;
		if (!objectHasOwnProperty(hooks, entryPoint)) return;
		arrayPush(hooks[entryPoint], hookFunction);
	};
	DOMPurify.removeHook = function(entryPoint, hookFunction) {
		if (!objectHasOwnProperty(hooks, entryPoint)) return;
		if (hookFunction !== void 0) {
			const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
			return index === -1 ? void 0 : arraySplice(hooks[entryPoint], index, 1)[0];
		}
		return arrayPop(hooks[entryPoint]);
	};
	DOMPurify.removeHooks = function(entryPoint) {
		if (!objectHasOwnProperty(hooks, entryPoint)) return;
		hooks[entryPoint] = [];
	};
	DOMPurify.removeAllHooks = function() {
		hooks = _createHooksMap();
	};
	return DOMPurify;
}
var purify_default = createDOMPurify();
module.exports = purify_default;

//# sourceMappingURL=purify.cjs.js.map

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ContextManager: () => (/* reexport default from dynamic */ _context_manager_js__WEBPACK_IMPORTED_MODULE_2___default.a),
/* harmony export */   OpenRouterAPI: () => (/* reexport default from dynamic */ _openrouter_client_js__WEBPACK_IMPORTED_MODULE_1___default.a),
/* harmony export */   SenangWebsChatbot: () => (/* reexport default from dynamic */ _chatbot_js__WEBPACK_IMPORTED_MODULE_0___default.a),
/* harmony export */   defaultKnowledgeBase: () => (/* reexport default from dynamic */ _default_knowledge_base_js__WEBPACK_IMPORTED_MODULE_3___default.a),
/* harmony export */   initializeChatbot: () => (/* binding */ initializeChatbot)
/* harmony export */ });
/* harmony import */ var _chatbot_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(314);
/* harmony import */ var _chatbot_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_chatbot_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _openrouter_client_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(74);
/* harmony import */ var _openrouter_client_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_openrouter_client_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _context_manager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(708);
/* harmony import */ var _context_manager_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_context_manager_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _default_knowledge_base_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(799);
/* harmony import */ var _default_knowledge_base_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_default_knowledge_base_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _chatbot_ui_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(321);
/* harmony import */ var _chatbot_ui_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_chatbot_ui_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _validation_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(490);
/* harmony import */ var _validation_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_validation_js__WEBPACK_IMPORTED_MODULE_5__);







function initializeChatbot() {
  let customKnowledgeBase = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  if (typeof document === "undefined") return;
  document.querySelectorAll("[data-swc]").forEach(element => {
    if (element.chatbotInstance || !customKnowledgeBase && element.hasAttribute("data-swc-manual-init")) return;
    const attr = name => element.getAttribute(`data-swc-${name}`);
    const apiKey = attr("api-key"),
      baseURL = attr("api-base-url"),
      endpointURL = attr("api-endpoint");
    const mode = attr("api-mode") || (apiKey || baseURL || endpointURL ? "hybrid" : "keyword-only");
    try {
      var _chatbot$apiClient;
      const apiConfig = mode === "keyword-only" ? null : {
        mode,
        apiKey: apiKey || "",
        baseURL: baseURL || undefined,
        endpointURL: endpointURL || undefined,
        model: attr("api-model") || undefined,
        streaming: attr("api-streaming") !== "false",
        maxTokens: attr("api-max-tokens"),
        temperature: attr("api-temperature"),
        systemPrompt: attr("system-prompt") ?? undefined,
        contextMaxMessages: attr("context-max-messages"),
        contextMaxTokens: attr("context-max-tokens"),
        hybridThreshold: attr("hybrid-threshold"),
        timeout: attr("api-timeout"),
        retryAttempts: attr("api-retry-attempts"),
        retryDelay: attr("api-retry-delay"),
        debug: attr("debug") === "true",
        siteName: attr("bot-name") || "Bot",
        siteUrl: window.location.origin
      };
      const replyDuration = (0,_validation_js__WEBPACK_IMPORTED_MODULE_5__.numberSetting)(attr("reply-duration"), 0, "replyDuration", 0, 2147483647, true);
      const chatbot = new (_chatbot_js__WEBPACK_IMPORTED_MODULE_0___default())(customKnowledgeBase ?? (_default_knowledge_base_js__WEBPACK_IMPORTED_MODULE_3___default()), {
        botName: attr("bot-name") || "Bot",
        themeColor: attr("theme-color") || "#007bff"
      }, apiConfig);
      element.chatbotInstance = chatbot;
      try {
        (0,_chatbot_ui_js__WEBPACK_IMPORTED_MODULE_4__.mountChatbot)(element, chatbot, {
          replyDuration,
          chatDisplayStyle: attr("chat-display") || "classic",
          loadHistory: attr("load")
        });
      } catch (error) {
        chatbot.destroy();
        delete element.chatbotInstance;
        throw error;
      }
      if (apiKey && ((_chatbot$apiClient = chatbot.apiClient) === null || _chatbot$apiClient === void 0 ? void 0 : _chatbot$apiClient.url.hostname) === "openrouter.ai") console.warn("[SWC] Client-side API keys are visible to visitors. Use a server-side proxy in production.");
    } catch (error) {
      // One malformed widget must not prevent other widgets from initializing.
      console.error("[SWC] Initialization failed:", error.message);
      element.dispatchEvent(new CustomEvent("swc:error", {
        detail: {
          code: "configuration",
          message: error.message
        }
      }));
    }
  });
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  window.initializeChatbot = initializeChatbot;
  window.OpenRouterAPI = window.OpenRouterAPI || (_openrouter_client_js__WEBPACK_IMPORTED_MODULE_1___default());
  window.ContextManager = window.ContextManager || (_context_manager_js__WEBPACK_IMPORTED_MODULE_2___default());
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => initializeChatbot(), {
    once: true
  });else initializeChatbot();
}
})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});