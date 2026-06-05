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

/***/ 708
(module) {

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Context Manager
 * Manages conversation context for AI interactions
 * Implements sliding window for context management
 */
var ContextManager = /*#__PURE__*/function () {
  function ContextManager() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _classCallCheck(this, ContextManager);
    this.maxMessages = config.maxMessages || 10;
    this.systemPrompt = config.systemPrompt || "You are a helpful assistant.";
    this.contextWindow = [];
    this.totalTokensEstimate = 0;
    this.maxTokens = config.maxTokens || 2000; // Context token limit
    this.debug = config.debug || false;
  }

  /**
   * Add message to context
   * @param {string} role - Message role: 'system', 'user', or 'assistant'
   * @param {string} content - Message content
   */
  return _createClass(ContextManager, [{
    key: "addMessage",
    value: function addMessage(role, content) {
      if (!role || !content) {
        console.warn("[ContextManager] Invalid message: role and content are required");
        return;
      }
      var message = {
        role: role,
        content: content,
        timestamp: new Date().toISOString(),
        tokens: this._estimateTokens(content)
      };
      this.contextWindow.push(message);
      this.totalTokensEstimate += message.tokens;
      if (this.debug) {
        console.log("[ContextManager] Added ".concat(role, " message (").concat(message.tokens, " tokens)"));
        console.log("[ContextManager] Total messages: ".concat(this.contextWindow.length, ", estimated tokens: ").concat(this.totalTokensEstimate));
      }

      // Trim context if needed
      this._trimContext();
    }

    /**
     * Get formatted context for API
     * @param {boolean} includeSystem - Include system prompt
     * @returns {Array} Array of message objects for API
     */
  }, {
    key: "getContext",
    value: function getContext() {
      var includeSystem = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      var messages = [];

      // Add system prompt if requested
      if (includeSystem && this.systemPrompt) {
        messages.push({
          role: "system",
          content: this.systemPrompt
        });
      }

      // Add context window messages (without metadata)
      this.contextWindow.forEach(function (msg) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
      if (this.debug) {
        console.log("[ContextManager] Returning ".concat(messages.length, " messages for API"));
      }
      return messages;
    }

    /**
     * Get last N messages from context
     * @param {number} count - Number of messages to retrieve
     * @returns {Array} Last N messages
     */
  }, {
    key: "getLastMessages",
    value: function getLastMessages() {
      var count = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 5;
      return this.contextWindow.slice(-count);
    }

    /**
     * Clear all context except system prompt
     */
  }, {
    key: "clear",
    value: function clear() {
      this.contextWindow = [];
      this.totalTokensEstimate = 0;
      if (this.debug) {
        console.log("[ContextManager] Context cleared");
      }
    }

    /**
     * Update system prompt
     * @param {string} prompt - New system prompt
     */
  }, {
    key: "setSystemPrompt",
    value: function setSystemPrompt(prompt) {
      this.systemPrompt = prompt;
      if (this.debug) {
        console.log("[ContextManager] System prompt updated");
      }
    }

    /**
     * Get context statistics
     * @returns {Object} Context statistics
     */
  }, {
    key: "getStats",
    value: function getStats() {
      return {
        messageCount: this.contextWindow.length,
        estimatedTokens: this.totalTokensEstimate,
        maxMessages: this.maxMessages,
        maxTokens: this.maxTokens,
        systemPrompt: this.systemPrompt ? this.systemPrompt.substring(0, 50) + "..." : null
      };
    }

    /**
     * Trim context to stay within limits
     * Uses sliding window approach - removes oldest messages first
     * Always keeps at least one exchange (user + assistant)
     * @private
     */
  }, {
    key: "_trimContext",
    value: function _trimContext() {
      // Trim by message count
      while (this.contextWindow.length > this.maxMessages) {
        var removed = this.contextWindow.shift();
        this.totalTokensEstimate = Math.max(0, this.totalTokensEstimate - removed.tokens);
        if (this.debug) {
          console.log("[ContextManager] Removed oldest message (".concat(removed.role, "), ").concat(this.contextWindow.length, " remaining"));
        }
      }

      // Trim by token count (more aggressive if needed)
      while (this.totalTokensEstimate > this.maxTokens && this.contextWindow.length > 2) {
        var _removed = this.contextWindow.shift();
        this.totalTokensEstimate = Math.max(0, this.totalTokensEstimate - _removed.tokens);
        if (this.debug) {
          console.log("[ContextManager] Removed message to reduce tokens (".concat(_removed.role, "), ").concat(this.totalTokensEstimate, " tokens remaining"));
        }
      }
    }

    /**
     * Estimate token count for a message
     * Simple approximation: ~4 characters per token
     * @private
     */
  }, {
    key: "_estimateTokens",
    value: function _estimateTokens(text) {
      if (!text) return 0;

      // Rough estimation: 1 token ≈ 4 characters for English text
      // This is a simplified approach; real tokenization is more complex
      return Math.ceil(text.length / 4);
    }

    /**
     * Summarize context for long conversations
     * Creates a summary of older messages to reduce token count
     * @returns {string} Summary of context
     */
  }, {
    key: "summarize",
    value: function summarize() {
      if (this.contextWindow.length < 3) {
        return "";
      }

      // Get first half of messages
      var messagesToSummarize = this.contextWindow.slice(0, Math.floor(this.contextWindow.length / 2));

      // Create summary
      var summary = messagesToSummarize.map(function (msg) {
        var preview = msg.content.substring(0, 100);
        return "".concat(msg.role, ": ").concat(preview).concat(msg.content.length > 100 ? "..." : "");
      }).join("\n");
      return "Previous conversation summary:\n".concat(summary);
    }

    /**
     * Export context for persistence
     * @returns {Object} Serializable context data
     */
  }, {
    key: "export",
    value: function _export() {
      return {
        version: "1.0",
        timestamp: new Date().toISOString(),
        systemPrompt: this.systemPrompt,
        maxMessages: this.maxMessages,
        maxTokens: this.maxTokens,
        contextWindow: this.contextWindow.map(function (msg) {
          return {
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          };
        }),
        stats: this.getStats()
      };
    }

    /**
     * Import context from exported data
     * @param {Object} data - Exported context data
     * @returns {boolean} Success status
     */
  }, {
    key: "import",
    value: function _import(data) {
      var _this = this;
      try {
        if (!data || !data.contextWindow || !Array.isArray(data.contextWindow)) {
          throw new Error("Invalid context data format");
        }

        // Clear existing context
        this.clear();

        // Import settings
        if (data.systemPrompt) {
          this.systemPrompt = data.systemPrompt;
        }
        if (data.maxMessages) {
          this.maxMessages = data.maxMessages;
        }
        if (data.maxTokens) {
          this.maxTokens = data.maxTokens;
        }

        // Import messages
        data.contextWindow.forEach(function (msg) {
          _this.addMessage(msg.role, msg.content);
        });
        if (this.debug) {
          console.log("[ContextManager] Imported ".concat(this.contextWindow.length, " messages"));
        }
        return true;
      } catch (error) {
        console.error("[ContextManager] Import failed:", error);
        return false;
      }
    }

    /**
     * Inject knowledge base context into system prompt
     * @param {string} knowledge - Knowledge base information
     */
  }, {
    key: "injectKnowledge",
    value: function injectKnowledge(knowledge) {
      if (!knowledge) return;
      var enhancedPrompt = "".concat(this.systemPrompt, "\n\nRelevant knowledge base information:\n").concat(knowledge);
      this.setSystemPrompt(enhancedPrompt);
      if (this.debug) {
        console.log("[ContextManager] Knowledge injected into system prompt");
      }
    }
  }]);
}(); // Export for use in other modules
if ( true && module.exports) {
  module.exports = ContextManager;
}

/***/ },

/***/ 74
(module) {

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _regeneratorRuntime() { "use strict"; var r = _regenerator(), e = r.m(_regeneratorRuntime), t = (Object.getPrototypeOf ? Object.getPrototypeOf(e) : e.__proto__).constructor; function n(r) { var e = "function" == typeof r && r.constructor; return !!e && (e === t || "GeneratorFunction" === (e.displayName || e.name)); } var o = { "throw": 1, "return": 2, "break": 3, "continue": 3 }; function a(r) { var e, t; return function (n) { e || (e = { stop: function stop() { return t(n.a, 2); }, "catch": function _catch() { return n.v; }, abrupt: function abrupt(r, e) { return t(n.a, o[r], e); }, delegateYield: function delegateYield(r, o, a) { return e.resultName = o, t(n.d, _regeneratorValues(r), a); }, finish: function finish(r) { return t(n.f, r); } }, t = function t(r, _t, o) { n.p = e.prev, n.n = e.next; try { return r(_t, o); } finally { e.next = n.n; } }), e.resultName && (e[e.resultName] = n.v, e.resultName = void 0), e.sent = n.v, e.next = n.n; try { return r.call(this, e); } finally { n.p = e.prev, n.n = e.next; } }; } return (_regeneratorRuntime = function _regeneratorRuntime() { return { wrap: function wrap(e, t, n, o) { return r.w(a(e), t, n, o && o.reverse()); }, isGeneratorFunction: n, mark: r.m, awrap: function awrap(r, e) { return new _OverloadYield(r, e); }, AsyncIterator: _regeneratorAsyncIterator, async: function async(r, e, t, o, u) { return (n(e) ? _regeneratorAsyncGen : _regeneratorAsync)(a(r), e, t, o, u); }, keys: _regeneratorKeys, values: _regeneratorValues }; })(); }
function _regeneratorValues(e) { if (null != e) { var t = e["function" == typeof Symbol && Symbol.iterator || "@@iterator"], r = 0; if (t) return t.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) return { next: function next() { return e && r >= e.length && (e = void 0), { value: e && e[r++], done: !e }; } }; } throw new TypeError(_typeof(e) + " is not iterable"); }
function _regeneratorKeys(e) { var n = Object(e), r = []; for (var t in n) r.unshift(t); return function e() { for (; r.length;) if ((t = r.pop()) in n) return e.value = t, e.done = !1, e; return e.done = !0, e; }; }
function _regeneratorAsync(n, e, r, t, o) { var a = _regeneratorAsyncGen(n, e, r, t, o); return a.next().then(function (n) { return n.done ? n.value : a.next(); }); }
function _regeneratorAsyncGen(r, e, t, o, n) { return new _regeneratorAsyncIterator(_regenerator().w(r, e, t, o), n || Promise); }
function _regeneratorAsyncIterator(t, e) { function n(r, o, i, f) { try { var c = t[r](o), u = c.value; return u instanceof _OverloadYield ? e.resolve(u.v).then(function (t) { n("next", t, i, f); }, function (t) { n("throw", t, i, f); }) : e.resolve(u).then(function (t) { c.value = t, i(c); }, function (t) { return n("throw", t, i, f); }); } catch (t) { f(t); } } var r; this.next || (_regeneratorDefine2(_regeneratorAsyncIterator.prototype), _regeneratorDefine2(_regeneratorAsyncIterator.prototype, "function" == typeof Symbol && Symbol.asyncIterator || "@asyncIterator", function () { return this; })), _regeneratorDefine2(this, "_invoke", function (t, o, i) { function f() { return new e(function (e, r) { n(t, i, e, r); }); } return r = r ? r.then(f, f) : f(); }, !0); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _OverloadYield(e, d) { this.v = e, this.k = d; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * OpenRouter API Client
 * Handles communication with OpenRouter (OpenAI-compatible) API
 * Supports streaming responses and error handling
 */
var OpenRouterAPI = /*#__PURE__*/function () {
  function OpenRouterAPI(config) {
    _classCallCheck(this, OpenRouterAPI);
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || "https://openrouter.ai/api/v1";
    this.model = config.model || "openai/gpt-3.5-turbo";
    this.maxTokens = config.maxTokens || 500;
    this.temperature = config.temperature || 0.7;
    this.siteName = config.siteName || "SenangWebs Chatbot";
    this.siteUrl = config.siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
    this.timeout = config.timeout || 30000; // 30 seconds
    this.retryAttempts = config.retryAttempts || 2;
    this.retryDelay = config.retryDelay || 1000; // 1 second
    this.debug = config.debug || false;
    this.abortController = null;
    this.validateConfig();
  }

  /**
   * Validate configuration
   * @throws {Error} if configuration is invalid
   */
  return _createClass(OpenRouterAPI, [{
    key: "validateConfig",
    value: function validateConfig() {
      if (!this.apiKey || this.apiKey.trim() === "") {
        throw new Error("OpenRouter API key is required");
      }
      if (!this.baseURL || !this.baseURL.startsWith("http")) {
        throw new Error("Invalid base URL");
      }
      if (this.maxTokens < 1 || this.maxTokens > 32768) {
        console.warn("maxTokens should be between 1 and 32768, using default 500");
        this.maxTokens = 500;
      }
      if (this.temperature < 0 || this.temperature > 2) {
        console.warn("temperature should be between 0 and 2, using default 0.7");
        this.temperature = 0.7;
      }
    }

    /**
     * Send message to OpenRouter API with streaming support
     * @param {Array} messages - Array of message objects {role, content}
     * @param {Function} onChunk - Callback for each chunk of streamed data
     * @param {Function} onComplete - Callback when streaming is complete
     * @param {Function} onError - Callback for errors
     * @returns {Promise<Object>} Complete response object
     */
  }, {
    key: "sendMessage",
    value: (function () {
      var _sendMessage = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(messages, onChunk, onComplete, onError) {
        var attempt, lastError, response, errorData, result, delay;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              attempt = 0;
              lastError = null;
            case 2:
              if (!(attempt <= this.retryAttempts)) {
                _context.next = 35;
                break;
              }
              _context.prev = 3;
              if (this.debug) {
                console.log("[OpenRouterAPI] Attempt ".concat(attempt + 1, "/").concat(this.retryAttempts + 1));
                console.log("[OpenRouterAPI] Sending messages:", messages);
              }
              _context.next = 7;
              return this._makeRequest(messages);
            case 7:
              response = _context.sent;
              if (response.ok) {
                _context.next = 13;
                break;
              }
              _context.next = 11;
              return response.json()["catch"](function () {
                return {};
              });
            case 11:
              errorData = _context.sent;
              throw this._handleAPIError(response.status, errorData);
            case 13:
              _context.next = 15;
              return this._handleStreamingResponse(response, onChunk);
            case 15:
              result = _context.sent;
              if (onComplete) {
                onComplete(result);
              }
              return _context.abrupt("return", result);
            case 20:
              _context.prev = 20;
              _context.t0 = _context["catch"](3);
              lastError = _context.t0;
              if (this.debug) {
                console.error("[OpenRouterAPI] Attempt ".concat(attempt + 1, " failed:"), _context.t0);
              }

              // Don't retry on certain errors
              if (!this._shouldNotRetry(_context.t0)) {
                _context.next = 27;
                break;
              }
              if (onError) {
                onError(_context.t0);
              }
              throw _context.t0;
            case 27:
              attempt++;

              // Wait before retry (exponential backoff)
              if (!(attempt <= this.retryAttempts)) {
                _context.next = 33;
                break;
              }
              delay = this.retryDelay * Math.pow(2, attempt - 1);
              if (this.debug) {
                console.log("[OpenRouterAPI] Retrying in ".concat(delay, "ms..."));
              }
              _context.next = 33;
              return this._sleep(delay);
            case 33:
              _context.next = 2;
              break;
            case 35:
              // All retries failed
              if (onError) {
                onError(lastError);
              }
              throw lastError;
            case 37:
            case "end":
              return _context.stop();
          }
        }, _callee, this, [[3, 20]]);
      }));
      function sendMessage(_x, _x2, _x3, _x4) {
        return _sendMessage.apply(this, arguments);
      }
      return sendMessage;
    }()
    /**
     * Make HTTP request to OpenRouter API
     * @private
     */
    )
  }, {
    key: "_makeRequest",
    value: (function () {
      var _makeRequest2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(messages) {
        var _this = this;
        var timeoutId, response;
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              this.abortController = new AbortController();
              timeoutId = setTimeout(function () {
                return _this.abortController.abort();
              }, this.timeout);
              _context2.prev = 2;
              _context2.next = 5;
              return fetch("".concat(this.baseURL, "/chat/completions"), {
                method: "POST",
                headers: {
                  Authorization: "Bearer ".concat(this.apiKey),
                  "Content-Type": "application/json",
                  "HTTP-Referer": this.siteUrl,
                  "X-Title": this.siteName
                },
                body: JSON.stringify({
                  model: this.model,
                  messages: messages,
                  max_tokens: this.maxTokens,
                  temperature: this.temperature,
                  stream: true
                }),
                signal: this.abortController.signal
              });
            case 5:
              response = _context2.sent;
              clearTimeout(timeoutId);
              return _context2.abrupt("return", response);
            case 10:
              _context2.prev = 10;
              _context2.t0 = _context2["catch"](2);
              clearTimeout(timeoutId);
              throw _context2.t0;
            case 14:
              _context2.prev = 14;
              // Clean up timeout in all cases
              clearTimeout(timeoutId);
              return _context2.finish(14);
            case 17:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this, [[2, 10, 14, 17]]);
      }));
      function _makeRequest(_x5) {
        return _makeRequest2.apply(this, arguments);
      }
      return _makeRequest;
    }()
    /**
     * Handle streaming response from API
     * @private
     */
    )
  }, {
    key: "_handleStreamingResponse",
    value: (function () {
      var _handleStreamingResponse2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(response, onChunk) {
        var reader, decoder, buffer, fullContent, _yield$reader$read, done, value, lines, _iterator, _step, line, trimmedLine, _data$choices, _data$choices2, data, content;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              reader = response.body.getReader();
              decoder = new TextDecoder();
              buffer = "";
              fullContent = "";
              _context3.prev = 4;
            case 5:
              if (false) // removed by dead control flow
{}
              _context3.next = 8;
              return reader.read();
            case 8:
              _yield$reader$read = _context3.sent;
              done = _yield$reader$read.done;
              value = _yield$reader$read.value;
              if (!done) {
                _context3.next = 13;
                break;
              }
              return _context3.abrupt("break", 41);
            case 13:
              buffer += decoder.decode(value, {
                stream: true
              });
              lines = buffer.split("\n");
              buffer = lines.pop() || ""; // Keep incomplete line in buffer
              _iterator = _createForOfIteratorHelper(lines);
              _context3.prev = 17;
              _iterator.s();
            case 19:
              if ((_step = _iterator.n()).done) {
                _context3.next = 31;
                break;
              }
              line = _step.value;
              trimmedLine = line.trim();
              if (!(trimmedLine === "")) {
                _context3.next = 24;
                break;
              }
              return _context3.abrupt("continue", 29);
            case 24:
              if (!(trimmedLine === "data: [DONE]")) {
                _context3.next = 26;
                break;
              }
              return _context3.abrupt("continue", 29);
            case 26:
              if (trimmedLine.startsWith("data: ")) {
                _context3.next = 28;
                break;
              }
              return _context3.abrupt("continue", 29);
            case 28:
              try {
                data = JSON.parse(trimmedLine.substring(6));
                content = (_data$choices = data.choices) === null || _data$choices === void 0 || (_data$choices = _data$choices[0]) === null || _data$choices === void 0 || (_data$choices = _data$choices.delta) === null || _data$choices === void 0 ? void 0 : _data$choices.content;
                if (content) {
                  fullContent += content;
                  if (onChunk) {
                    onChunk({
                      content: content,
                      fullContent: fullContent,
                      done: false
                    });
                  }
                }

                // Check if streaming is finished
                if ((_data$choices2 = data.choices) !== null && _data$choices2 !== void 0 && (_data$choices2 = _data$choices2[0]) !== null && _data$choices2 !== void 0 && _data$choices2.finish_reason) {
                  if (this.debug) {
                    console.log("[OpenRouterAPI] Stream finished:", data.choices[0].finish_reason);
                  }
                }
              } catch (parseError) {
                if (this.debug) {
                  console.warn("[OpenRouterAPI] Failed to parse SSE data:", trimmedLine, parseError);
                }
              }
            case 29:
              _context3.next = 19;
              break;
            case 31:
              _context3.next = 36;
              break;
            case 33:
              _context3.prev = 33;
              _context3.t0 = _context3["catch"](17);
              _iterator.e(_context3.t0);
            case 36:
              _context3.prev = 36;
              _iterator.f();
              return _context3.finish(36);
            case 39:
              _context3.next = 5;
              break;
            case 41:
              return _context3.abrupt("return", {
                content: fullContent,
                model: this.model,
                done: true
              });
            case 44:
              _context3.prev = 44;
              _context3.t1 = _context3["catch"](4);
              if (!(_context3.t1.name === "AbortError")) {
                _context3.next = 48;
                break;
              }
              throw new Error("Request cancelled by user");
            case 48:
              throw _context3.t1;
            case 49:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this, [[4, 44], [17, 33, 36, 39]]);
      }));
      function _handleStreamingResponse(_x6, _x7) {
        return _handleStreamingResponse2.apply(this, arguments);
      }
      return _handleStreamingResponse;
    }()
    /**
     * Handle API errors and create meaningful error messages
     * @private
     */
    )
  }, {
    key: "_handleAPIError",
    value: function _handleAPIError(status, errorData) {
      var _errorData$error;
      var errorMessage = ((_errorData$error = errorData.error) === null || _errorData$error === void 0 ? void 0 : _errorData$error.message) || "Unknown error occurred";
      switch (status) {
        case 401:
          return new Error("Invalid API key. Please check your OpenRouter API key.");
        case 403:
          return new Error("Access forbidden. Please check your API key permissions.");
        case 429:
          var error = new Error("Rate limit exceeded. Please try again later.");
          error.isRateLimit = true;
          return error;
        case 500:
        case 502:
        case 503:
          return new Error("OpenRouter service is temporarily unavailable. Please try again.");
        case 400:
          return new Error("Bad request: ".concat(errorMessage));
        default:
          return new Error("API error (".concat(status, "): ").concat(errorMessage));
      }
    }

    /**
     * Check if error should not be retried
     * @private
     */
  }, {
    key: "_shouldNotRetry",
    value: function _shouldNotRetry(error) {
      // Don't retry on auth errors, bad requests, or user cancellation
      if (error.message.includes("Invalid API key")) return true;
      if (error.message.includes("Access forbidden")) return true;
      if (error.message.includes("Bad request")) return true;
      if (error.message.includes("cancelled by user")) return true;
      return false;
    }

    /**
     * Cancel ongoing request
     */
  }, {
    key: "cancel",
    value: function cancel() {
      if (this.abortController) {
        this.abortController.abort();
        if (this.debug) {
          console.log("[OpenRouterAPI] Request cancelled");
        }
      }
    }

    /**
     * Get model information
     */
  }, {
    key: "getModelInfo",
    value: function getModelInfo() {
      return {
        model: this.model,
        maxTokens: this.maxTokens,
        temperature: this.temperature
      };
    }

    /**
     * Sleep utility for retry delays
     * @private
     */
  }, {
    key: "_sleep",
    value: function _sleep(ms) {
      return new Promise(function (resolve) {
        return setTimeout(resolve, ms);
      });
    }
  }]);
}(); // Export for use in other modules
if ( true && module.exports) {
  module.exports = OpenRouterAPI;
}

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
/* harmony export */   SenangWebsChatbot: () => (/* binding */ SenangWebsChatbot),
/* harmony export */   defaultKnowledgeBase: () => (/* binding */ defaultKnowledgeBase),
/* harmony export */   initializeChatbot: () => (/* binding */ initializeChatbot)
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; var r = _regenerator(), e = r.m(_regeneratorRuntime), t = (Object.getPrototypeOf ? Object.getPrototypeOf(e) : e.__proto__).constructor; function n(r) { var e = "function" == typeof r && r.constructor; return !!e && (e === t || "GeneratorFunction" === (e.displayName || e.name)); } var o = { "throw": 1, "return": 2, "break": 3, "continue": 3 }; function a(r) { var e, t; return function (n) { e || (e = { stop: function stop() { return t(n.a, 2); }, "catch": function _catch() { return n.v; }, abrupt: function abrupt(r, e) { return t(n.a, o[r], e); }, delegateYield: function delegateYield(r, o, a) { return e.resultName = o, t(n.d, _regeneratorValues(r), a); }, finish: function finish(r) { return t(n.f, r); } }, t = function t(r, _t, o) { n.p = e.prev, n.n = e.next; try { return r(_t, o); } finally { e.next = n.n; } }), e.resultName && (e[e.resultName] = n.v, e.resultName = void 0), e.sent = n.v, e.next = n.n; try { return r.call(this, e); } finally { n.p = e.prev, n.n = e.next; } }; } return (_regeneratorRuntime = function _regeneratorRuntime() { return { wrap: function wrap(e, t, n, o) { return r.w(a(e), t, n, o && o.reverse()); }, isGeneratorFunction: n, mark: r.m, awrap: function awrap(r, e) { return new _OverloadYield(r, e); }, AsyncIterator: _regeneratorAsyncIterator, async: function async(r, e, t, o, u) { return (n(e) ? _regeneratorAsyncGen : _regeneratorAsync)(a(r), e, t, o, u); }, keys: _regeneratorKeys, values: _regeneratorValues }; })(); }
function _regeneratorValues(e) { if (null != e) { var t = e["function" == typeof Symbol && Symbol.iterator || "@@iterator"], r = 0; if (t) return t.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) return { next: function next() { return e && r >= e.length && (e = void 0), { value: e && e[r++], done: !e }; } }; } throw new TypeError(_typeof(e) + " is not iterable"); }
function _regeneratorKeys(e) { var n = Object(e), r = []; for (var t in n) r.unshift(t); return function e() { for (; r.length;) if ((t = r.pop()) in n) return e.value = t, e.done = !1, e; return e.done = !0, e; }; }
function _regeneratorAsync(n, e, r, t, o) { var a = _regeneratorAsyncGen(n, e, r, t, o); return a.next().then(function (n) { return n.done ? n.value : a.next(); }); }
function _regeneratorAsyncGen(r, e, t, o, n) { return new _regeneratorAsyncIterator(_regenerator().w(r, e, t, o), n || Promise); }
function _regeneratorAsyncIterator(t, e) { function n(r, o, i, f) { try { var c = t[r](o), u = c.value; return u instanceof _OverloadYield ? e.resolve(u.v).then(function (t) { n("next", t, i, f); }, function (t) { n("throw", t, i, f); }) : e.resolve(u).then(function (t) { c.value = t, i(c); }, function (t) { return n("throw", t, i, f); }); } catch (t) { f(t); } } var r; this.next || (_regeneratorDefine2(_regeneratorAsyncIterator.prototype), _regeneratorDefine2(_regeneratorAsyncIterator.prototype, "function" == typeof Symbol && Symbol.asyncIterator || "@asyncIterator", function () { return this; })), _regeneratorDefine2(this, "_invoke", function (t, o, i) { function f() { return new e(function (e, r) { n(t, i, e, r); }); } return r = r ? r.then(f, f) : f(); }, !0); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _OverloadYield(e, d) { this.v = e, this.k = d; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// SenangWebs Chatbot Library


// Import API classes if they exist (for modular usage)
// These classes can also be included separately in HTML
var OpenRouterAPI, ContextManager;

// Try to import classes (for webpack bundling)
try {
  if (true) {
    OpenRouterAPI = __webpack_require__(74);
    ContextManager = __webpack_require__(708);
  }
} catch (e) {
  // Classes will be loaded from global scope or separate script tags
}

// Make classes available globally if not already defined
if (typeof window !== "undefined") {
  if (!window.OpenRouterAPI && typeof OpenRouterAPI !== "undefined") {
    window.OpenRouterAPI = OpenRouterAPI;
  }
  if (!window.ContextManager && typeof ContextManager !== "undefined") {
    window.ContextManager = ContextManager;
  }

  // Use global classes if available
  OpenRouterAPI = window.OpenRouterAPI || OpenRouterAPI;
  ContextManager = window.ContextManager || ContextManager;
}
var SenangWebsChatbot = /*#__PURE__*/function () {
  function SenangWebsChatbot(knowledgeBase) {
    var botMetadata = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var apiConfig = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    _classCallCheck(this, SenangWebsChatbot);
    this.knowledgeBase = knowledgeBase;
    this.currentNode = null;
    this.chatHistory = [];
    this.botMetadata = {
      botName: botMetadata.botName || "Bot",
      themeColor: botMetadata.themeColor || "#007bff",
      timestamp: new Date().toISOString()
    };

    // API Configuration
    this.apiConfig = apiConfig;
    this.mode = (apiConfig === null || apiConfig === void 0 ? void 0 : apiConfig.mode) || "keyword-only"; // 'keyword-only', 'ai-only', 'hybrid'
    this.streamingEnabled = (apiConfig === null || apiConfig === void 0 ? void 0 : apiConfig.streaming) !== false;
    this.aiResponseInProgress = false;
    this.hybridThreshold = (apiConfig === null || apiConfig === void 0 ? void 0 : apiConfig.hybridThreshold) || 0.3; // Lower default for better keyword matching

    // Initialize API client and context manager if API is configured
    if (apiConfig && apiConfig.apiKey) {
      try {
        // Check if OpenRouterAPI class is available
        if (typeof OpenRouterAPI !== "undefined") {
          this.apiClient = new OpenRouterAPI(apiConfig);
        } else {
          console.error("[SWC] OpenRouterAPI class not found. Please include openrouter-client.js");
          this.apiClient = null;
        }

        // Check if ContextManager class is available
        if (typeof ContextManager !== "undefined") {
          this.contextManager = new ContextManager({
            systemPrompt: apiConfig.systemPrompt || "You are a helpful assistant.",
            maxMessages: apiConfig.contextMaxMessages || 10,
            maxTokens: apiConfig.contextMaxTokens || 2000,
            debug: apiConfig.debug || false
          });
        } else {
          console.error("[SWC] ContextManager class not found. Please include context-manager.js");
          this.contextManager = null;
        }
      } catch (error) {
        console.error("[SWC] Error initializing API components:", error);
        this.apiClient = null;
        this.contextManager = null;
      }
    } else {
      this.apiClient = null;
      this.contextManager = null;
    }
  }
  return _createClass(SenangWebsChatbot, [{
    key: "init",
    value: function init() {
      this.currentNode = this.knowledgeBase.find(function (node) {
        return node.id === "welcome";
      }) || this.knowledgeBase[0];
      var response = {
        reply: this.currentNode.reply,
        options: this.currentNode.options
      };

      // Add welcome message to history
      this.addToHistory("bot", this.currentNode.reply, this.currentNode.id, this.currentNode.options);
      return response;
    }
  }, {
    key: "addToHistory",
    value: function addToHistory(type, content) {
      var nodeId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
      var source = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "keyword";
      var modelInfo = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;
      var message = {
        id: "msg-".concat(Date.now(), "-").concat(Math.random().toString(36).substring(2, 11)),
        timestamp: new Date().toISOString(),
        type: type,
        content: content,
        source: source // 'keyword', 'api', or 'fallback'
      };
      if (type === "bot") {
        message.nodeId = nodeId;
        if (options && options.length > 0) {
          message.options = options;
        }
        if (modelInfo) {
          message.model = modelInfo.model;
        }
      }
      this.chatHistory.push(message);
    }
  }, {
    key: "handleInput",
    value: function () {
      var _handleInput = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(input) {
        var _this = this;
        var callbacks,
          lowercaseInput,
          words,
          keywordScores,
          bestMatch,
          maxScore,
          confidence,
          fallbackReply,
          _args = arguments;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              callbacks = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
              lowercaseInput = input.toLowerCase();
              words = lowercaseInput.split(/\s+/); // Add user message to history
              this.addToHistory("user", input);

              // Add user message to context if API is enabled
              if (this.contextManager) {
                this.contextManager.addMessage("user", input);
              }

              // Keyword matching
              keywordScores = {};
              this.knowledgeBase.forEach(function (node) {
                keywordScores[node.id] = 0;
                node.keyword.forEach(function (keyword) {
                  var lowercaseKeyword = keyword.toLowerCase();
                  words.forEach(function (word) {
                    if (word.includes(lowercaseKeyword) || lowercaseKeyword.includes(word)) {
                      keywordScores[node.id]++;
                    }
                  });
                });
              });
              bestMatch = null;
              maxScore = 0;
              Object.entries(keywordScores).forEach(function (_ref) {
                var _ref2 = _slicedToArray(_ref, 2),
                  nodeId = _ref2[0],
                  score = _ref2[1];
                if (score > maxScore) {
                  maxScore = score;
                  bestMatch = _this.knowledgeBase.find(function (node) {
                    return node.id === nodeId;
                  });
                }
              });

              // Calculate confidence score (0-1 range)
              // If we have a keyword match, confidence should be high enough to use it in hybrid mode
              // Confidence increases with number of matching keywords
              confidence = 0;
              if (maxScore > 0) {
                // Base confidence of 0.5 for any match, plus 0.1 per additional match (capped at 1.0)
                confidence = Math.min(0.5 + (maxScore - 1) * 0.1, 1.0);
              }

              // Debug logging for hybrid mode
              if (this.mode === "hybrid") {
                console.log("[SWC Hybrid Debug]", {
                  input: input,
                  bestMatch: bestMatch ? bestMatch.id : null,
                  maxScore: maxScore,
                  confidence: confidence,
                  threshold: this.hybridThreshold,
                  willUseAI: !bestMatch || confidence < this.hybridThreshold
                });
              }

              // Mode-based routing
              if (!(this.mode === "ai-only" && this.apiClient)) {
                _context.next = 19;
                break;
              }
              _context.next = 16;
              return this.handleAIResponse(input, callbacks);
            case 16:
              return _context.abrupt("return", _context.sent);
            case 19:
              if (!(this.mode === "hybrid" && this.apiClient)) {
                _context.next = 26;
                break;
              }
              if (!(!bestMatch || confidence < this.hybridThreshold)) {
                _context.next = 24;
                break;
              }
              _context.next = 23;
              return this.handleAIResponse(input, callbacks);
            case 23:
              return _context.abrupt("return", _context.sent);
            case 24:
              _context.next = 27;
              break;
            case 26:
              if (this.mode === "keyword-only" || !this.apiClient) {
                // Fall through to keyword response
              }
            case 27:
              if (!bestMatch) {
                _context.next = 34;
                break;
              }
              this.currentNode = bestMatch;
              // Add bot response to history
              this.addToHistory("bot", bestMatch.reply, bestMatch.id, bestMatch.options, "keyword");

              // Add to context if API is enabled
              if (this.contextManager) {
                this.contextManager.addMessage("assistant", bestMatch.reply);
              }
              return _context.abrupt("return", {
                reply: bestMatch.reply,
                options: bestMatch.options,
                source: "keyword",
                confidence: confidence
              });
            case 34:
              if (!(this.mode === "hybrid" && this.apiClient)) {
                _context.next = 38;
                break;
              }
              _context.next = 37;
              return this.handleAIResponse(input, callbacks);
            case 37:
              return _context.abrupt("return", _context.sent);
            case 38:
              // Fallback response
              fallbackReply = "I'm sorry, I didn't understand that. Can you please rephrase?";
              this.addToHistory("bot", fallbackReply, null, null, "fallback");
              return _context.abrupt("return", {
                reply: fallbackReply,
                options: null,
                source: "fallback"
              });
            case 41:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function handleInput(_x) {
        return _handleInput.apply(this, arguments);
      }
      return handleInput;
    }()
    /**
     * Handle AI-powered response using OpenRouter API
     * @param {string} input - User input
     * @param {Object} callbacks - Callbacks for streaming: onStart, onChunk, onComplete, onError
     * @returns {Promise<Object>} Response object
     */
  }, {
    key: "handleAIResponse",
    value: (function () {
      var _handleAIResponse = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(input) {
        var _this2 = this;
        var callbacks,
          messages,
          fullResponse,
          onStartCalled,
          result,
          errorMessage,
          _args2 = arguments;
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              callbacks = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : {};
              if (this.apiClient) {
                _context2.next = 4;
                break;
              }
              console.error("[SWC] API client not initialized");
              return _context2.abrupt("return", {
                reply: "AI features are not configured properly.",
                options: null,
                source: "error"
              });
            case 4:
              if (!this.aiResponseInProgress) {
                _context2.next = 7;
                break;
              }
              console.warn("[SWC] AI response already in progress");
              return _context2.abrupt("return", {
                reply: "Please wait for the current response to complete.",
                options: null,
                source: "error"
              });
            case 7:
              this.aiResponseInProgress = true;
              _context2.prev = 8;
              if (this.contextManager) {
                _context2.next = 11;
                break;
              }
              throw new Error("Context manager not initialized");
            case 11:
              messages = this.contextManager.getContext(true); // onStart callback will be triggered on first chunk, not here
              fullResponse = "";
              onStartCalled = false; // Send message with streaming
              _context2.next = 16;
              return this.apiClient.sendMessage(messages,
              // onChunk callback
              function (chunk) {
                // Trigger onStart on first chunk (when streaming actually begins)
                if (!onStartCalled && callbacks.onStart) {
                  callbacks.onStart();
                  onStartCalled = true;
                }
                fullResponse = chunk.fullContent;
                if (callbacks.onChunk) {
                  callbacks.onChunk(chunk);
                }
              },
              // onComplete callback
              function (response) {
                // Add AI response to history
                var modelInfo = _this2.apiClient.getModelInfo();
                _this2.addToHistory("bot", response.content, null, null, "api", modelInfo);

                // Add to context
                if (_this2.contextManager) {
                  _this2.contextManager.addMessage("assistant", response.content);
                }
                if (callbacks.onComplete) {
                  callbacks.onComplete(response);
                }
              },
              // onError callback
              function (error) {
                console.error("[SWC] AI response error:", error);
                if (callbacks.onError) {
                  callbacks.onError(error);
                }
              });
            case 16:
              result = _context2.sent;
              this.aiResponseInProgress = false;
              return _context2.abrupt("return", {
                reply: result.content,
                options: null,
                source: "api",
                model: result.model
              });
            case 21:
              _context2.prev = 21;
              _context2.t0 = _context2["catch"](8);
              this.aiResponseInProgress = false;
              console.error("[SWC] Error in handleAIResponse:", _context2.t0);

              // Add error to history
              errorMessage = this._getErrorMessage(_context2.t0);
              this.addToHistory("bot", errorMessage, null, null, "error");
              if (callbacks.onError) {
                callbacks.onError(_context2.t0);
              }
              return _context2.abrupt("return", {
                reply: errorMessage,
                options: null,
                source: "error"
              });
            case 29:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this, [[8, 21]]);
      }));
      function handleAIResponse(_x2) {
        return _handleAIResponse.apply(this, arguments);
      }
      return handleAIResponse;
    }()
    /**
     * Cancel ongoing AI response
     */
    )
  }, {
    key: "cancelAIResponse",
    value: function cancelAIResponse() {
      if (this.apiClient && this.aiResponseInProgress) {
        this.apiClient.cancel();
        this.aiResponseInProgress = false;
        return true;
      }
      return false;
    }

    /**
     * Get user-friendly error message
     * @private
     */
  }, {
    key: "_getErrorMessage",
    value: function _getErrorMessage(error) {
      if (error.message.includes("Invalid API key")) {
        return "⚠️ API authentication failed. Please check your API key configuration.";
      } else if (error.message.includes("Rate limit")) {
        return "⚠️ Too many requests. Please wait a moment and try again.";
      } else if (error.message.includes("cancelled")) {
        return "Response cancelled.";
      } else if (error.message.includes("service is temporarily unavailable")) {
        return "⚠️ The AI service is temporarily unavailable. Please try again later.";
      } else {
        return "\u26A0\uFE0F An error occurred: ".concat(error.message);
      }
    }

    /**
     * Enhance prompt with knowledge base (RAG approach)
     * @private
     */
  }, {
    key: "_enhancePromptWithKnowledge",
    value: function _enhancePromptWithKnowledge(input) {
      // Find relevant knowledge base entries
      var relevantNodes = [];
      var lowercaseInput = input.toLowerCase();
      this.knowledgeBase.forEach(function (node) {
        node.keyword.forEach(function (keyword) {
          if (lowercaseInput.includes(keyword.toLowerCase())) {
            relevantNodes.push(node);
          }
        });
      });
      if (relevantNodes.length > 0) {
        var knowledge = relevantNodes.map(function (node) {
          return "Topic: ".concat(node.id, "\nInformation: ").concat(node.reply);
        }).join("\n\n");
        this.contextManager.injectKnowledge(knowledge);
      }
    }

    /**
     * Get API configuration and status
     * @returns {Object} API status information
     */
  }, {
    key: "getAPIStatus",
    value: function getAPIStatus() {
      return {
        enabled: !!this.apiClient,
        mode: this.mode,
        streaming: this.streamingEnabled,
        model: this.apiClient ? this.apiClient.getModelInfo() : null,
        contextStats: this.contextManager ? this.contextManager.getStats() : null,
        responseInProgress: this.aiResponseInProgress
      };
    }
  }, {
    key: "handleOptionSelection",
    value: function handleOptionSelection(replyId) {
      var nextNode = this.knowledgeBase.find(function (node) {
        return node.id === replyId;
      });
      if (nextNode) {
        this.currentNode = nextNode;
        // Add bot response to history
        this.addToHistory("bot", nextNode.reply, nextNode.id, nextNode.options);
        return {
          reply: nextNode.reply,
          options: nextNode.options
        };
      } else {
        var fallbackReply = "I'm sorry, I couldn't find the appropriate response. How else can I assist you?";
        // Add fallback response to history
        this.addToHistory("bot", fallbackReply, null, null);
        return {
          reply: fallbackReply,
          options: null
        };
      }
    }

    // Phase 1.2: Export History
  }, {
    key: "exportHistory",
    value: function exportHistory() {
      var historyData = {
        version: "2.0",
        // Updated version for API support
        timestamp: new Date().toISOString(),
        botName: this.botMetadata.botName,
        themeColor: this.botMetadata.themeColor,
        messages: this.chatHistory,
        currentNodeId: this.currentNode ? this.currentNode.id : null,
        // API metadata
        mode: this.mode,
        apiEnabled: !!this.apiClient,
        apiConfig: this.apiClient ? {
          model: this.apiClient.model,
          lastUsed: new Date().toISOString()
        } : null
      };
      return JSON.stringify(historyData, null, 2);
    }
  }, {
    key: "getCurrentState",
    value: function getCurrentState() {
      return {
        currentNodeId: this.currentNode ? this.currentNode.id : null,
        messageCount: this.chatHistory.length,
        lastMessageTimestamp: this.chatHistory.length > 0 ? this.chatHistory[this.chatHistory.length - 1].timestamp : null
      };
    }

    // Phase 1.3: Load History
  }, {
    key: "loadHistory",
    value: function loadHistory(historyData) {
      var _this3 = this;
      try {
        // Parse if string, use directly if object
        var data = typeof historyData === "string" ? JSON.parse(historyData) : historyData;

        // Validate structure
        if (!data.version || !data.messages || !Array.isArray(data.messages)) {
          throw new Error("Invalid history format: missing required fields");
        }

        // Check version compatibility
        if (!data.version.startsWith("1.") && !data.version.startsWith("2.")) {
          console.warn("History version ".concat(data.version, " may not be fully compatible"));
        }

        // Update bot metadata if present
        if (data.botName) this.botMetadata.botName = data.botName;
        if (data.themeColor) this.botMetadata.themeColor = data.themeColor;

        // Restore chat history
        this.chatHistory = data.messages;

        // Restore current node state
        if (data.currentNodeId) {
          var node = this.knowledgeBase.find(function (n) {
            return n.id === data.currentNodeId;
          });
          if (node) {
            this.currentNode = node;
          }
        }

        // Restore API context if available
        if (this.contextManager && data.messages) {
          this.contextManager.clear();
          data.messages.forEach(function (msg) {
            if (msg.type === "user") {
              _this3.contextManager.addMessage("user", msg.content);
            } else if (msg.type === "bot") {
              _this3.contextManager.addMessage("assistant", msg.content);
            }
          });
        }
        return {
          success: true,
          messageCount: this.chatHistory.length,
          messages: this.chatHistory
        };
      } catch (error) {
        console.error("Error loading history:", error);
        return {
          success: false,
          error: error.message,
          messages: []
        };
      }
    }

    // Phase 1.4: Clear History
  }, {
    key: "clearHistory",
    value: function clearHistory() {
      this.chatHistory = [];
      this.currentNode = this.knowledgeBase.find(function (node) {
        return node.id === "welcome";
      }) || this.knowledgeBase[0];

      // Add welcome message to fresh history
      if (this.currentNode) {
        this.addToHistory("bot", this.currentNode.reply, this.currentNode.id, this.currentNode.options);
      }
      return {
        reply: this.currentNode ? this.currentNode.reply : "",
        options: this.currentNode ? this.currentNode.options : null
      };
    }

    // Phase 4.1: Get History (returns object not string)
  }, {
    key: "getHistory",
    value: function getHistory() {
      return {
        version: "2.0",
        timestamp: new Date().toISOString(),
        botName: this.botMetadata.botName,
        themeColor: this.botMetadata.themeColor,
        messages: this.chatHistory,
        currentNodeId: this.currentNode ? this.currentNode.id : null,
        mode: this.mode,
        apiEnabled: !!this.apiClient
      };
    }
  }]);
}(); // Default knowledge base
var defaultKnowledgeBase = [{
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
function createChatbotUI(containerElement, themeColor, botName, chatDisplayStyle) {
  var chatDisplay = document.createElement("div");
  chatDisplay.className = "swc-chat-display ".concat(chatDisplayStyle === "modern" ? "swc-modern" : "swc-classic");
  var inputContainer = document.createElement("div");
  inputContainer.className = "swc-input-container";
  var userInput = document.createElement("input");
  userInput.type = "text";
  userInput.className = "swc-user-input";
  userInput.placeholder = "Type your message...";
  var sendButton = document.createElement("button");
  sendButton.className = "swc-send-button";
  sendButton.textContent = "Send";
  var optionsContainer = document.createElement("div");
  optionsContainer.className = "swc-options-container";
  inputContainer.appendChild(userInput);
  inputContainer.appendChild(sendButton);
  var typingIndicator = document.createElement("div");
  typingIndicator.className = "swc-typing-indicator";
  typingIndicator.innerHTML = "<span></span><span></span><span></span>";
  containerElement.appendChild(chatDisplay);
  containerElement.appendChild(optionsContainer);
  containerElement.appendChild(inputContainer);

  // Apply theme color and bot name
  containerElement.style.setProperty("--swc-theme-color", themeColor);
  containerElement.style.setProperty("--swc-bot-name", "\"".concat(botName, "\""));
  return {
    chatDisplay: chatDisplay,
    userInput: userInput,
    sendButton: sendButton,
    optionsContainer: optionsContainer,
    typingIndicator: typingIndicator,
    inputContainer: inputContainer
  };
}
function initializeChatbot() {
  var customKnowledgeBase = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var chatbotElements = document.querySelectorAll("[data-swc]");
  chatbotElements.forEach(function (element) {
    // Prevent double initialization
    if (element.chatbotInstance) return;

    // Skip if manual initialization is requested and we are in auto-init mode (no custom KB)
    if (!customKnowledgeBase && element.hasAttribute("data-swc-manual-init")) {
      return;
    }
    var themeColor = element.getAttribute("data-swc-theme-color") || "#007bff";
    var botName = element.getAttribute("data-swc-bot-name") || "Bot";
    var chatDisplayStyle = element.getAttribute("data-swc-chat-display") || "classic";
    var replyDuration = parseInt(element.getAttribute("data-swc-reply-duration")) || 0;
    var loadHistory = element.getAttribute("data-swc-load");

    // Parse API configuration from data attributes
    var apiMode = element.getAttribute("data-swc-api-mode");
    var apiKey = element.getAttribute("data-swc-api-key");
    var apiModel = element.getAttribute("data-swc-api-model");
    var apiStreaming = element.getAttribute("data-swc-api-streaming");
    var apiMaxTokens = element.getAttribute("data-swc-api-max-tokens");
    var apiTemperature = element.getAttribute("data-swc-api-temperature");
    var systemPrompt = element.getAttribute("data-swc-system-prompt");
    var contextMaxMessages = element.getAttribute("data-swc-context-max-messages");
    var apiBaseURL = element.getAttribute("data-swc-api-base-url");
    var hybridThreshold = element.getAttribute("data-swc-hybrid-threshold");

    // Build API config object if API key OR custom base URL is provided
    // (proxy setups use custom base URL and don't need client-side API key)
    var apiConfig = null;
    if ((apiKey || apiBaseURL) && apiMode !== "keyword-only") {
      apiConfig = {
        apiKey: apiKey || "proxy-mode",
        // Use placeholder for proxy mode
        mode: apiMode || "hybrid",
        model: apiModel || "openai/gpt-3.5-turbo",
        streaming: apiStreaming !== "false",
        maxTokens: parseInt(apiMaxTokens) || 500,
        temperature: parseFloat(apiTemperature) || 0.7,
        systemPrompt: systemPrompt || "You are a helpful assistant.",
        contextMaxMessages: parseInt(contextMaxMessages) || 10,
        baseURL: apiBaseURL,
        hybridThreshold: parseFloat(hybridThreshold) || 0.3,
        siteName: botName,
        siteUrl: window.location.origin
      };

      // Show warning about client-side API key only if directly using OpenRouter
      if (apiKey && (!apiBaseURL || apiBaseURL.includes("openrouter.ai"))) {
        console.warn("[SWC] ⚠️ API key is exposed in client-side code. For production, use a server-side proxy.");
      }
    }

    // Phase 2.1: Create chatbot instance with metadata and API config
    var chatbot = new SenangWebsChatbot(customKnowledgeBase || defaultKnowledgeBase, {
      botName: botName,
      themeColor: themeColor
    }, apiConfig);

    // Phase 2.1: Store instance on element for external access
    element.chatbotInstance = chatbot;
    var _createChatbotUI = createChatbotUI(element, themeColor, botName, chatDisplayStyle),
      chatDisplay = _createChatbotUI.chatDisplay,
      userInput = _createChatbotUI.userInput,
      sendButton = _createChatbotUI.sendButton,
      optionsContainer = _createChatbotUI.optionsContainer,
      typingIndicator = _createChatbotUI.typingIndicator,
      inputContainer = _createChatbotUI.inputContainer;

    // HTML sanitization helper to prevent XSS attacks
    function escapeHTML(str) {
      var div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    // Check if content appears to be safe HTML (from bot responses)
    function isSafeHTML(content) {
      // Bot replies from knowledge base may contain safe HTML like <b>, <a>, etc.
      // We'll allow content that doesn't contain script tags or event handlers
      var dangerousPatterns = /<script|javascript:|on\w+\s*=/i;
      return !dangerousPatterns.test(content);
    }

    // Phase 2.3: Render message helper function
    function renderMessage(message) {
      var messageElement = document.createElement("div");
      messageElement.className = "swc-message swc-".concat(message.type, "-message");
      // Sanitize user messages, allow safe HTML in bot messages
      if (message.type === "user") {
        messageElement.textContent = message.content;
      } else if (isSafeHTML(message.content)) {
        messageElement.innerHTML = message.content;
      } else {
        messageElement.textContent = message.content;
      }
      chatDisplay.appendChild(messageElement);
    }

    // Phase 2.3: Clear display helper
    function clearDisplay() {
      chatDisplay.innerHTML = "";
      optionsContainer.innerHTML = "";
      optionsContainer.style.display = "none";
    }
    function displayBotMessage(message, options) {
      var isStreaming = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var source = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "keyword";
      removeTypingIndicator();
      var messageElement = document.createElement("div");
      messageElement.className = "swc-message swc-bot-message ".concat(isStreaming ? "swc-streaming" : "", " ").concat(source === "api" ? "swc-ai-message" : "");
      // Sanitize content: for API responses, escape HTML; for keyword responses, allow safe HTML
      if (source === "api" || !isSafeHTML(message)) {
        messageElement.textContent = message;
      } else {
        messageElement.innerHTML = message;
      }
      messageElement.setAttribute("data-message-id", "msg-".concat(Date.now()));
      chatDisplay.appendChild(messageElement);
      smoothScrollToBottom(chatDisplay);
      optionsContainer.innerHTML = "";
      if (options && options.length > 0) {
        optionsContainer.style.display = "flex";
        options.forEach(function (option) {
          var button = document.createElement("button");
          button.textContent = option.label;
          button.onclick = function () {
            return handleOptionClick(option.reply_id);
          };
          optionsContainer.appendChild(button);
        });
      } else {
        optionsContainer.style.display = "none";
      }
      return messageElement;
    }

    // Create stop button for AI streaming
    function createStopButton() {
      var stopBtn = document.createElement("button");
      stopBtn.className = "swc-stop-button";
      stopBtn.innerHTML = "Stop";
      stopBtn.onclick = function () {
        chatbot.cancelAIResponse();
        stopBtn.remove();
        enableUserInput();
      };
      return stopBtn;
    }
    function handleUserInput() {
      return _handleUserInput.apply(this, arguments);
    }
    function _handleUserInput() {
      _handleUserInput = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
        var message, userMessageElement, isAIEnabled, stopButton;
        return _regeneratorRuntime().wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              message = userInput.value.trim();
              if (message) {
                userMessageElement = document.createElement("div");
                userMessageElement.className = "swc-message swc-user-message";
                // Use textContent to prevent XSS from user input
                userMessageElement.textContent = message;
                chatDisplay.appendChild(userMessageElement);
                smoothScrollToBottom(chatDisplay);
                userInput.value = "";
                disableUserInput();
                showTypingIndicator();

                // Check if this will be an AI response
                isAIEnabled = chatbot.mode !== "keyword-only" && chatbot.apiClient;
                stopButton = null;
                if (isAIEnabled && replyDuration === 0) {
                  // For AI responses, add delay then proceed
                  setTimeout(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
                    var streamingMessage, streamStopButton, response;
                    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
                      while (1) switch (_context3.prev = _context3.next) {
                        case 0:
                          // Typing indicator stays visible until onStart is triggered
                          // Create streaming message element
                          streamingMessage = null;
                          streamStopButton = null;
                          _context3.next = 4;
                          return chatbot.handleInput(message, {
                            onStart: function onStart() {
                              // Remove typing indicator now that streaming is starting
                              removeTypingIndicator();
                              // Create message element for streaming
                              streamingMessage = displayBotMessage("", null, true, "api");

                              // Add stop button if streaming
                              if (chatbot.streamingEnabled) {
                                streamStopButton = createStopButton();
                                inputContainer.insertBefore(streamStopButton, inputContainer.firstChild);
                              }
                            },
                            onChunk: function onChunk(chunk) {
                              // Update streaming message with escaped content to prevent XSS
                              if (streamingMessage) {
                                requestAnimationFrame(function () {
                                  streamingMessage.textContent = chunk.fullContent;
                                  smoothScrollToBottom(chatDisplay);
                                });
                              }
                            },
                            onComplete: function onComplete(result) {
                              // Remove streaming class
                              if (streamingMessage) {
                                streamingMessage.classList.remove("swc-streaming");
                              }
                              // Remove stop button
                              if (streamStopButton) {
                                streamStopButton.remove();
                              }
                              enableUserInput();
                            },
                            onError: function onError(error) {
                              // Remove stop button
                              if (streamStopButton) {
                                streamStopButton.remove();
                              }
                              // Display error
                              if (streamingMessage) {
                                streamingMessage.classList.remove("swc-streaming");
                                streamingMessage.classList.add("swc-error-message");
                              }
                              enableUserInput();
                            }
                          });
                        case 4:
                          response = _context3.sent;
                          // If not streaming or error occurred, display normally
                          if (!streamingMessage) {
                            displayBotMessage(response.reply, response.options, false, response.source);
                            enableUserInput();
                          }
                        case 6:
                        case "end":
                          return _context3.stop();
                      }
                    }, _callee3);
                  })), 500);
                } else {
                  // Keyword-only mode or delay is set
                  setTimeout(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
                    var response;
                    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
                      while (1) switch (_context4.prev = _context4.next) {
                        case 0:
                          _context4.next = 2;
                          return chatbot.handleInput(message);
                        case 2:
                          response = _context4.sent;
                          displayBotMessage(response.reply, response.options, false, response.source);
                          enableUserInput();
                        case 5:
                        case "end":
                          return _context4.stop();
                      }
                    }, _callee4);
                  })), replyDuration);
                }
              }
            case 2:
            case "end":
              return _context5.stop();
          }
        }, _callee5);
      }));
      return _handleUserInput.apply(this, arguments);
    }
    function handleOptionClick(replyId) {
      disableUserInput();
      showTypingIndicator();
      // Use minimum 500ms delay for option clicks to show typing indicator
      var optionDelay = Math.max(replyDuration, 500);
      setTimeout(function () {
        var response = chatbot.handleOptionSelection(replyId);
        displayBotMessage(response.reply, response.options);
        enableUserInput();
      }, optionDelay);
    }
    function disableUserInput() {
      userInput.disabled = true;
      sendButton.disabled = true;
    }
    function enableUserInput() {
      userInput.disabled = false;
      sendButton.disabled = false;
    }
    function showTypingIndicator() {
      removeTypingIndicator(); // Remove any existing indicator first
      chatDisplay.appendChild(typingIndicator);
      smoothScrollToBottom(chatDisplay);
    }
    function removeTypingIndicator() {
      if (typingIndicator.parentNode === chatDisplay) {
        chatDisplay.removeChild(typingIndicator);
      }
    }
    function smoothScrollToBottom(element) {
      var targetScrollTop = element.scrollHeight - element.clientHeight;
      var startScrollTop = element.scrollTop;
      var distance = targetScrollTop - startScrollTop;
      var duration = 300; // ms
      var start = null;
      function step(timestamp) {
        if (!start) start = timestamp;
        var progress = timestamp - start;
        element.scrollTop = easeInOutCubic(progress, startScrollTop, distance, duration);
        if (progress < duration) {
          window.requestAnimationFrame(step);
        }
      }
      window.requestAnimationFrame(step);
    }
    function easeInOutCubic(t, b, c, d) {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t * t + b;
      t -= 2;
      return c / 2 * (t * t * t + 2) + b;
    }
    sendButton.addEventListener("click", handleUserInput);
    userInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        handleUserInput();
      }
    });

    // Phase 4.2: Enhanced clearHistory with UI update and event
    var originalClearHistory = chatbot.clearHistory.bind(chatbot);
    chatbot.clearHistory = function () {
      var result = originalClearHistory();
      clearDisplay();
      displayBotMessage(result.reply, result.options);

      // Dispatch custom event
      element.dispatchEvent(new CustomEvent("swc:history-cleared", {
        detail: {
          timestamp: new Date().toISOString()
        }
      }));
      return result;
    };

    // Phase 4.2: Enhanced exportHistory with event
    var originalExportHistory = chatbot.exportHistory.bind(chatbot);
    chatbot.exportHistory = function () {
      var historyJSON = originalExportHistory();

      // Dispatch custom event
      element.dispatchEvent(new CustomEvent("swc:history-exported", {
        detail: {
          messageCount: chatbot.chatHistory.length,
          historyJSON: historyJSON,
          timestamp: new Date().toISOString()
        }
      }));
      return historyJSON;
    };

    // Phase 4.2: Enhanced loadHistory with UI update and event
    var originalLoadHistory = chatbot.loadHistory.bind(chatbot);
    chatbot.loadHistory = function (historyData) {
      var result = originalLoadHistory(historyData);
      if (result.success) {
        clearDisplay();

        // Render all messages from history
        result.messages.forEach(function (msg) {
          renderMessage(msg);
        });

        // Render options from last message if present
        if (result.messages.length > 0) {
          var lastMessage = result.messages[result.messages.length - 1];
          if (lastMessage.options && lastMessage.options.length > 0) {
            optionsContainer.style.display = "flex";
            lastMessage.options.forEach(function (option) {
              var button = document.createElement("button");
              button.textContent = option.label;
              button.onclick = function () {
                return handleOptionClick(option.reply_id);
              };
              optionsContainer.appendChild(button);
            });
          }
        }
        smoothScrollToBottom(chatDisplay);

        // Dispatch custom event
        element.dispatchEvent(new CustomEvent("swc:history-loaded", {
          detail: {
            messageCount: result.messageCount,
            timestamp: new Date().toISOString()
          }
        }));
      } else {
        console.error("Failed to load history:", result.error);
      }
      return result;
    };

    // Phase 3: Declarative History Loading
    if (loadHistory) {
      // Check if it's a URL/file path or JSON string
      var isUrl = loadHistory.startsWith("http://") || loadHistory.startsWith("https://") || loadHistory.startsWith("./") || loadHistory.startsWith("../") || loadHistory.endsWith(".json");
      if (isUrl) {
        // Phase 3.2: Load from external file
        fetch(loadHistory).then(function (response) {
          if (!response.ok) {
            throw new Error("HTTP error! status: ".concat(response.status));
          }
          return response.json();
        }).then(function (data) {
          chatbot.loadHistory(data);
        })["catch"](function (error) {
          console.error("Error loading history from file:", error);
          // Fallback to default initialization
          var initialResponse = chatbot.init();
          displayBotMessage(initialResponse.reply, initialResponse.options);
        });
      } else {
        // Phase 3.3: Load from inline JSON string
        try {
          var data = JSON.parse(loadHistory);
          chatbot.loadHistory(data);
        } catch (error) {
          console.error("Error parsing inline history JSON:", error);
          // Fallback to default initialization
          var initialResponse = chatbot.init();
          displayBotMessage(initialResponse.reply, initialResponse.options);
        }
      }
    } else {
      // Initialize the chatbot normally
      var _initialResponse = chatbot.init();
      displayBotMessage(_initialResponse.reply, _initialResponse.options);
    }
  });
}

// Export the main class and functions


// Make initializeChatbot globally accessible
if (typeof window !== "undefined") {
  window.initializeChatbot = initializeChatbot;

  // Auto-initialize on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initializeChatbot();
    });
  } else {
    // DOM already loaded
    initializeChatbot();
  }
}
})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});