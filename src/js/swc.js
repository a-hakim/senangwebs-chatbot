// SenangWebs Chatbot Library

// Import API classes if they exist (for modular usage)
// These classes can also be included separately in HTML
let OpenRouterAPI, ContextManager;

// Try to import classes (for webpack bundling)
try {
  if (typeof require !== "undefined") {
    OpenRouterAPI = require("./openrouter-client.js");
    ContextManager = require("./context-manager.js");
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

class SenangWebsChatbot {
  constructor(knowledgeBase, botMetadata = {}, apiConfig = null) {
    this.knowledgeBase = knowledgeBase;
    this.currentNode = null;
    this.chatHistory = [];
    this.botMetadata = {
      botName: botMetadata.botName || "Bot",
      themeColor: botMetadata.themeColor || "#007bff",
      timestamp: new Date().toISOString(),
    };

    // API Configuration
    this.apiConfig = apiConfig;
    this.mode = apiConfig?.mode || "keyword-only"; // 'keyword-only', 'ai-only', 'hybrid'
    this.streamingEnabled = apiConfig?.streaming !== false;
    this.aiResponseInProgress = false;
    this.hybridThreshold = apiConfig?.hybridThreshold || 0.3; // Lower default for better keyword matching

    // Initialize API client and context manager if API is configured
    if (apiConfig && apiConfig.apiKey) {
      try {
        // Check if OpenRouterAPI class is available
        if (typeof OpenRouterAPI !== "undefined") {
          this.apiClient = new OpenRouterAPI(apiConfig);
        } else {
          console.error(
            "[SWC] OpenRouterAPI class not found. Please include openrouter-client.js"
          );
          this.apiClient = null;
        }

        // Check if ContextManager class is available
        if (typeof ContextManager !== "undefined") {
          this.contextManager = new ContextManager({
            systemPrompt:
              apiConfig.systemPrompt || "You are a helpful assistant.",
            maxMessages: apiConfig.contextMaxMessages || 10,
            maxTokens: apiConfig.contextMaxTokens || 2000,
            debug: apiConfig.debug || false,
          });
        } else {
          console.error(
            "[SWC] ContextManager class not found. Please include context-manager.js"
          );
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

  init() {
    this.currentNode =
      this.knowledgeBase.find((node) => node.id === "welcome") ||
      this.knowledgeBase[0];
    const response = {
      reply: this.currentNode.reply,
      options: this.currentNode.options,
    };

    // Add welcome message to history
    this.addToHistory(
      "bot",
      this.currentNode.reply,
      this.currentNode.id,
      this.currentNode.options
    );

    return response;
  }

  addToHistory(
    type,
    content,
    nodeId = null,
    options = null,
    source = "keyword",
    modelInfo = null
  ) {
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      type: type,
      content: content,
      source: source, // 'keyword', 'api', or 'fallback'
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

  async handleInput(input, callbacks = {}) {
    const lowercaseInput = input.toLowerCase();
    const words = lowercaseInput.split(/\s+/);

    // Add user message to history
    this.addToHistory("user", input);

    // Add user message to context if API is enabled
    if (this.contextManager) {
      this.contextManager.addMessage("user", input);
    }

    // Keyword matching
    const keywordScores = {};
    this.knowledgeBase.forEach((node) => {
      keywordScores[node.id] = 0;
      node.keyword.forEach((keyword) => {
        const lowercaseKeyword = keyword.toLowerCase();
        words.forEach((word) => {
          if (
            word.includes(lowercaseKeyword) ||
            lowercaseKeyword.includes(word)
          ) {
            keywordScores[node.id]++;
          }
        });
      });
    });

    let bestMatch = null;
    let maxScore = 0;

    Object.entries(keywordScores).forEach(([nodeId, score]) => {
      if (score > maxScore) {
        maxScore = score;
        bestMatch = this.knowledgeBase.find((node) => node.id === nodeId);
      }
    });

    // Calculate confidence score (0-1 range)
    // If we have a keyword match, confidence should be high enough to use it in hybrid mode
    // Confidence increases with number of matching keywords
    let confidence = 0;
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
        willUseAI: !bestMatch || confidence < this.hybridThreshold,
      });
    }

    // Mode-based routing
    if (this.mode === "ai-only" && this.apiClient) {
      // Always use AI
      return await this.handleAIResponse(input, callbacks);
    } else if (this.mode === "hybrid" && this.apiClient) {
      // Use AI if confidence is low or no match found
      if (!bestMatch || confidence < this.hybridThreshold) {
        return await this.handleAIResponse(input, callbacks);
      }
    } else if (this.mode === "keyword-only" || !this.apiClient) {
      // Fall through to keyword response
    }

    // Keyword-based response
    if (bestMatch) {
      this.currentNode = bestMatch;
      // Add bot response to history
      this.addToHistory(
        "bot",
        bestMatch.reply,
        bestMatch.id,
        bestMatch.options,
        "keyword"
      );

      // Add to context if API is enabled
      if (this.contextManager) {
        this.contextManager.addMessage("assistant", bestMatch.reply);
      }

      return {
        reply: bestMatch.reply,
        options: bestMatch.options,
        source: "keyword",
        confidence: confidence,
      };
    } else {
      // No keyword match - try AI if available in hybrid mode
      if (this.mode === "hybrid" && this.apiClient) {
        return await this.handleAIResponse(input, callbacks);
      }

      // Fallback response
      const fallbackReply =
        "I'm sorry, I didn't understand that. Can you please rephrase?";
      this.addToHistory("bot", fallbackReply, null, null, "fallback");
      return {
        reply: fallbackReply,
        options: null,
        source: "fallback",
      };
    }
  }

  /**
   * Handle AI-powered response using OpenRouter API
   * @param {string} input - User input
   * @param {Object} callbacks - Callbacks for streaming: onStart, onChunk, onComplete, onError
   * @returns {Promise<Object>} Response object
   */
  async handleAIResponse(input, callbacks = {}) {
    if (!this.apiClient) {
      console.error("[SWC] API client not initialized");
      return {
        reply: "AI features are not configured properly.",
        options: null,
        source: "error",
      };
    }

    if (this.aiResponseInProgress) {
      console.warn("[SWC] AI response already in progress");
      return {
        reply: "Please wait for the current response to complete.",
        options: null,
        source: "error",
      };
    }

    this.aiResponseInProgress = true;

    try {
      // Get conversation context
      if (!this.contextManager) {
        throw new Error("Context manager not initialized");
      }
      const messages = this.contextManager.getContext(true);

      // onStart callback will be triggered on first chunk, not here

      let fullResponse = "";
      let onStartCalled = false;

      // Send message with streaming
      const result = await this.apiClient.sendMessage(
        messages,
        // onChunk callback
        (chunk) => {
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
        (response) => {
          // Add AI response to history
          const modelInfo = this.apiClient.getModelInfo();
          this.addToHistory(
            "bot",
            response.content,
            null,
            null,
            "api",
            modelInfo
          );

          // Add to context
          if (this.contextManager) {
            this.contextManager.addMessage("assistant", response.content);
          }

          if (callbacks.onComplete) {
            callbacks.onComplete(response);
          }
        },
        // onError callback
        (error) => {
          console.error("[SWC] AI response error:", error);
          if (callbacks.onError) {
            callbacks.onError(error);
          }
        }
      );

      this.aiResponseInProgress = false;

      return {
        reply: result.content,
        options: null,
        source: "api",
        model: result.model,
      };
    } catch (error) {
      this.aiResponseInProgress = false;
      console.error("[SWC] Error in handleAIResponse:", error);

      // Add error to history
      const errorMessage = this._getErrorMessage(error);
      this.addToHistory("bot", errorMessage, null, null, "error");

      if (callbacks.onError) {
        callbacks.onError(error);
      }

      return {
        reply: errorMessage,
        options: null,
        source: "error",
      };
    }
  }

  /**
   * Cancel ongoing AI response
   */
  cancelAIResponse() {
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
  _getErrorMessage(error) {
    if (error.message.includes("Invalid API key")) {
      return "⚠️ API authentication failed. Please check your API key configuration.";
    } else if (error.message.includes("Rate limit")) {
      return "⚠️ Too many requests. Please wait a moment and try again.";
    } else if (error.message.includes("cancelled")) {
      return "Response cancelled.";
    } else if (error.message.includes("service is temporarily unavailable")) {
      return "⚠️ The AI service is temporarily unavailable. Please try again later.";
    } else {
      return `⚠️ An error occurred: ${error.message}`;
    }
  }

  /**
   * Enhance prompt with knowledge base (RAG approach)
   * @private
   */
  _enhancePromptWithKnowledge(input) {
    // Find relevant knowledge base entries
    const relevantNodes = [];
    const lowercaseInput = input.toLowerCase();

    this.knowledgeBase.forEach((node) => {
      node.keyword.forEach((keyword) => {
        if (lowercaseInput.includes(keyword.toLowerCase())) {
          relevantNodes.push(node);
        }
      });
    });

    if (relevantNodes.length > 0) {
      const knowledge = relevantNodes
        .map((node) => `Topic: ${node.id}\nInformation: ${node.reply}`)
        .join("\n\n");

      this.contextManager.injectKnowledge(knowledge);
    }
  }

  /**
   * Get API configuration and status
   * @returns {Object} API status information
   */
  getAPIStatus() {
    return {
      enabled: !!this.apiClient,
      mode: this.mode,
      streaming: this.streamingEnabled,
      model: this.apiClient ? this.apiClient.getModelInfo() : null,
      contextStats: this.contextManager ? this.contextManager.getStats() : null,
      responseInProgress: this.aiResponseInProgress,
    };
  }

  handleOptionSelection(replyId) {
    const nextNode = this.knowledgeBase.find((node) => node.id === replyId);
    if (nextNode) {
      this.currentNode = nextNode;
      // Add bot response to history
      this.addToHistory("bot", nextNode.reply, nextNode.id, nextNode.options);
      return {
        reply: nextNode.reply,
        options: nextNode.options,
      };
    } else {
      const fallbackReply =
        "I'm sorry, I couldn't find the appropriate response. How else can I assist you?";
      // Add fallback response to history
      this.addToHistory("bot", fallbackReply, null, null);
      return {
        reply: fallbackReply,
        options: null,
      };
    }
  }

  // Phase 1.2: Export History
  exportHistory() {
    const historyData = {
      version: "2.0", // Updated version for API support
      timestamp: new Date().toISOString(),
      botName: this.botMetadata.botName,
      themeColor: this.botMetadata.themeColor,
      messages: this.chatHistory,
      currentNodeId: this.currentNode ? this.currentNode.id : null,
      // API metadata
      mode: this.mode,
      apiEnabled: !!this.apiClient,
      apiConfig: this.apiClient
        ? {
            model: this.apiClient.model,
            lastUsed: new Date().toISOString(),
          }
        : null,
    };

    return JSON.stringify(historyData, null, 2);
  }

  getCurrentState() {
    return {
      currentNodeId: this.currentNode ? this.currentNode.id : null,
      messageCount: this.chatHistory.length,
      lastMessageTimestamp:
        this.chatHistory.length > 0
          ? this.chatHistory[this.chatHistory.length - 1].timestamp
          : null,
    };
  }

  // Phase 1.3: Load History
  loadHistory(historyData) {
    try {
      // Parse if string, use directly if object
      const data =
        typeof historyData === "string" ? JSON.parse(historyData) : historyData;

      // Validate structure
      if (!data.version || !data.messages || !Array.isArray(data.messages)) {
        throw new Error("Invalid history format: missing required fields");
      }

      // Check version compatibility
      if (!data.version.startsWith("1.") && !data.version.startsWith("2.")) {
        console.warn(
          `History version ${data.version} may not be fully compatible`
        );
      }

      // Update bot metadata if present
      if (data.botName) this.botMetadata.botName = data.botName;
      if (data.themeColor) this.botMetadata.themeColor = data.themeColor;

      // Restore chat history
      this.chatHistory = data.messages;

      // Restore current node state
      if (data.currentNodeId) {
        const node = this.knowledgeBase.find(
          (n) => n.id === data.currentNodeId
        );
        if (node) {
          this.currentNode = node;
        }
      }

      // Restore API context if available
      if (this.contextManager && data.messages) {
        this.contextManager.clear();
        data.messages.forEach((msg) => {
          if (msg.type === "user") {
            this.contextManager.addMessage("user", msg.content);
          } else if (msg.type === "bot") {
            this.contextManager.addMessage("assistant", msg.content);
          }
        });
      }

      return {
        success: true,
        messageCount: this.chatHistory.length,
        messages: this.chatHistory,
      };
    } catch (error) {
      console.error("Error loading history:", error);
      return {
        success: false,
        error: error.message,
        messages: [],
      };
    }
  }

  // Phase 1.4: Clear History
  clearHistory() {
    this.chatHistory = [];
    this.currentNode =
      this.knowledgeBase.find((node) => node.id === "welcome") ||
      this.knowledgeBase[0];

    // Add welcome message to fresh history
    if (this.currentNode) {
      this.addToHistory(
        "bot",
        this.currentNode.reply,
        this.currentNode.id,
        this.currentNode.options
      );
    }

    return {
      reply: this.currentNode ? this.currentNode.reply : "",
      options: this.currentNode ? this.currentNode.options : null,
    };
  }

  // Phase 4.1: Get History (returns object not string)
  getHistory() {
    return {
      version: "2.0",
      timestamp: new Date().toISOString(),
      botName: this.botMetadata.botName,
      themeColor: this.botMetadata.themeColor,
      messages: this.chatHistory,
      currentNodeId: this.currentNode ? this.currentNode.id : null,
      mode: this.mode,
      apiEnabled: !!this.apiClient,
    };
  }
}

// Default knowledge base
const defaultKnowledgeBase = [
  {
    id: "welcome",
    keyword: ["hello", "hi", "hey"],
    reply:
      'Welcome! How can I assist you <b>today?</b> <a href="https://senangwebs.com">senangwebs.com</a>',
    options: [
      { label: "Get Help", reply_id: "help" },
      { label: "End Chat", reply_id: "goodbye" },
    ],
  },
  {
    id: "help",
    keyword: ["help", "support", "assist"],
    reply: "Sure, I can help! What do you need assistance with?",
    options: [
      { label: "Product Information", reply_id: "product" },
      { label: "Billing", reply_id: "billing" },
      { label: "Technical Support", reply_id: "tech_support" },
    ],
  },
  {
    id: "product",
    keyword: ["product", "information"],
    reply:
      "Our product is designed to make your life easier. Would you like to know more about its features or pricing?",
    options: [
      { label: "Features", reply_id: "features" },
      { label: "Pricing", reply_id: "pricing" },
    ],
  },
  {
    id: "billing",
    keyword: ["billing", "payment", "invoice"],
    reply:
      "For billing inquiries, please visit our billing portal or contact our finance department at billing@example.com.",
    options: [
      { label: "Back to Help", reply_id: "help" },
      { label: "End Chat", reply_id: "goodbye" },
    ],
  },
  {
    id: "tech_support",
    keyword: ["technical", "support", "issue"],
    reply:
      "For technical support, please describe your issue in detail and well do our best to assist you.",
  },
  {
    id: "features",
    keyword: ["features", "functionality"],
    reply:
      "Our product offers cutting-edge features including AI-powered analytics, real-time collaboration, and seamless integration with popular tools.",
    options: [
      { label: "Back to Product Info", reply_id: "product" },
      { label: "End Chat", reply_id: "goodbye" },
    ],
  },
  {
    id: "pricing",
    keyword: ["pricing", "cost", "plans"],
    reply:
      "We offer flexible pricing plans starting at $9.99/month. For detailed pricing information, please visit our website or contact our sales team.",
    options: [
      { label: "Back to Product Info", reply_id: "product" },
      { label: "End Chat", reply_id: "goodbye" },
    ],
  },
  {
    id: "goodbye",
    keyword: ["bye", "goodbye", "end"],
    reply: "Thank you for chatting with us. Have a great day!",
    options: [{ label: "Restart Chat", reply_id: "welcome" }],
  },
];

function createChatbotUI(
  containerElement,
  themeColor,
  botName,
  chatDisplayStyle
) {
  const chatDisplay = document.createElement("div");
  chatDisplay.className = `swc-chat-display ${
    chatDisplayStyle === "modern" ? "swc-modern" : "swc-classic"
  }`;

  const inputContainer = document.createElement("div");
  inputContainer.className = "swc-input-container";

  const userInput = document.createElement("input");
  userInput.type = "text";
  userInput.className = "swc-user-input";
  userInput.placeholder = "Type your message...";

  const sendButton = document.createElement("button");
  sendButton.className = "swc-send-button";
  sendButton.textContent = "Send";

  const optionsContainer = document.createElement("div");
  optionsContainer.className = "swc-options-container";

  inputContainer.appendChild(userInput);
  inputContainer.appendChild(sendButton);

  const typingIndicator = document.createElement("div");
  typingIndicator.className = "swc-typing-indicator";
  typingIndicator.innerHTML = "<span></span><span></span><span></span>";

  containerElement.appendChild(chatDisplay);
  containerElement.appendChild(optionsContainer);
  containerElement.appendChild(inputContainer);

  // Apply theme color and bot name
  containerElement.style.setProperty("--swc-theme-color", themeColor);
  containerElement.style.setProperty("--swc-bot-name", `"${botName}"`);

  return {
    chatDisplay,
    userInput,
    sendButton,
    optionsContainer,
    typingIndicator,
    inputContainer,
  };
}

function initializeChatbot(customKnowledgeBase = null) {
  const chatbotElements = document.querySelectorAll("[data-swc]");
  chatbotElements.forEach((element) => {
    // Prevent double initialization
    if (element.chatbotInstance) return;

    // Skip if manual initialization is requested and we are in auto-init mode (no custom KB)
    if (!customKnowledgeBase && element.hasAttribute("data-swc-manual-init")) {
      return;
    }

    const themeColor =
      element.getAttribute("data-swc-theme-color") || "#007bff";
    const botName = element.getAttribute("data-swc-bot-name") || "Bot";
    const chatDisplayStyle =
      element.getAttribute("data-swc-chat-display") || "classic";
    const replyDuration =
      parseInt(element.getAttribute("data-swc-reply-duration")) || 0;
    const loadHistory = element.getAttribute("data-swc-load");

    // Parse API configuration from data attributes
    const apiMode = element.getAttribute("data-swc-api-mode");
    const apiKey = element.getAttribute("data-swc-api-key");
    const apiModel = element.getAttribute("data-swc-api-model");
    const apiStreaming = element.getAttribute("data-swc-api-streaming");
    const apiMaxTokens = element.getAttribute("data-swc-api-max-tokens");
    const apiTemperature = element.getAttribute("data-swc-api-temperature");
    const systemPrompt = element.getAttribute("data-swc-system-prompt");
    const contextMaxMessages = element.getAttribute(
      "data-swc-context-max-messages"
    );
    const apiBaseURL = element.getAttribute("data-swc-api-base-url");
    const hybridThreshold = element.getAttribute("data-swc-hybrid-threshold");

    // Build API config object if API key OR custom base URL is provided
    // (proxy setups use custom base URL and don't need client-side API key)
    let apiConfig = null;
    if ((apiKey || apiBaseURL) && apiMode !== "keyword-only") {
      apiConfig = {
        apiKey: apiKey || "proxy-mode", // Use placeholder for proxy mode
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
        siteUrl: window.location.origin,
      };

      // Show warning about client-side API key only if directly using OpenRouter
      if (apiKey && (!apiBaseURL || apiBaseURL.includes("openrouter.ai"))) {
        console.warn(
          "[SWC] ⚠️ API key is exposed in client-side code. For production, use a server-side proxy."
        );
      }
    }

    // Phase 2.1: Create chatbot instance with metadata and API config
    const chatbot = new SenangWebsChatbot(
      customKnowledgeBase || defaultKnowledgeBase,
      { botName, themeColor },
      apiConfig
    );

    // Phase 2.1: Store instance on element for external access
    element.chatbotInstance = chatbot;

    const {
      chatDisplay,
      userInput,
      sendButton,
      optionsContainer,
      typingIndicator,
      inputContainer,
    } = createChatbotUI(element, themeColor, botName, chatDisplayStyle);

    // HTML sanitization helper to prevent XSS attacks
    function escapeHTML(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    // Check if content appears to be safe HTML (from bot responses)
    function isSafeHTML(content) {
      // Bot replies from knowledge base may contain safe HTML like <b>, <a>, etc.
      // We'll allow content that doesn't contain script tags or event handlers
      const dangerousPatterns = /<script|javascript:|on\w+\s*=/i;
      return !dangerousPatterns.test(content);
    }

    // Phase 2.3: Render message helper function
    function renderMessage(message) {
      const messageElement = document.createElement("div");
      messageElement.className = `swc-message swc-${message.type}-message`;
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

    function displayBotMessage(
      message,
      options,
      isStreaming = false,
      source = "keyword"
    ) {
      removeTypingIndicator();
      const messageElement = document.createElement("div");
      messageElement.className = `swc-message swc-bot-message ${
        isStreaming ? "swc-streaming" : ""
      } ${source === "api" ? "swc-ai-message" : ""}`;
      // Sanitize content: for API responses, escape HTML; for keyword responses, allow safe HTML
      if (source === "api" || !isSafeHTML(message)) {
        messageElement.textContent = message;
      } else {
        messageElement.innerHTML = message;
      }
      messageElement.setAttribute("data-message-id", `msg-${Date.now()}`);
      chatDisplay.appendChild(messageElement);
      smoothScrollToBottom(chatDisplay);

      optionsContainer.innerHTML = "";
      if (options && options.length > 0) {
        optionsContainer.style.display = "flex";
        options.forEach((option) => {
          const button = document.createElement("button");
          button.textContent = option.label;
          button.onclick = () => handleOptionClick(option.reply_id);
          optionsContainer.appendChild(button);
        });
      } else {
        optionsContainer.style.display = "none";
      }

      return messageElement;
    }

    // Create stop button for AI streaming
    function createStopButton() {
      const stopBtn = document.createElement("button");
      stopBtn.className = "swc-stop-button";
      stopBtn.innerHTML = "Stop";
      stopBtn.onclick = () => {
        chatbot.cancelAIResponse();
        stopBtn.remove();
        enableUserInput();
      };
      return stopBtn;
    }

    async function handleUserInput() {
      const message = userInput.value.trim();
      if (message) {
        const userMessageElement = document.createElement("div");
        userMessageElement.className = "swc-message swc-user-message";
        // Use textContent to prevent XSS from user input
        userMessageElement.textContent = message;
        chatDisplay.appendChild(userMessageElement);
        smoothScrollToBottom(chatDisplay);

        userInput.value = "";

        disableUserInput();
        showTypingIndicator();

        // Check if this will be an AI response
        const isAIEnabled =
          chatbot.mode !== "keyword-only" && chatbot.apiClient;
        let stopButton = null;

        if (isAIEnabled && replyDuration === 0) {
          // For AI responses, add delay then proceed
          setTimeout(async () => {
            // Typing indicator stays visible until onStart is triggered

            // Create streaming message element
            let streamingMessage = null;
            let streamStopButton = null;

            const response = await chatbot.handleInput(message, {
              onStart: () => {
                // Remove typing indicator now that streaming is starting
                removeTypingIndicator();
                // Create message element for streaming
                streamingMessage = displayBotMessage("", null, true, "api");

                // Add stop button if streaming
                if (chatbot.streamingEnabled) {
                  streamStopButton = createStopButton();
                  inputContainer.insertBefore(
                    streamStopButton,
                    inputContainer.firstChild
                  );
                }
              },
              onChunk: (chunk) => {
                // Update streaming message with escaped content to prevent XSS
                if (streamingMessage) {
                  requestAnimationFrame(() => {
                    streamingMessage.textContent = chunk.fullContent;
                    smoothScrollToBottom(chatDisplay);
                  });
                }
              },
              onComplete: (result) => {
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
              onError: (error) => {
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
              },
            });

            // If not streaming or error occurred, display normally
            if (!streamingMessage) {
              displayBotMessage(
                response.reply,
                response.options,
                false,
                response.source
              );
              enableUserInput();
            }
          }, 500);
        } else {
          // Keyword-only mode or delay is set
          setTimeout(async () => {
            const response = await chatbot.handleInput(message);
            displayBotMessage(
              response.reply,
              response.options,
              false,
              response.source
            );
            enableUserInput();
          }, replyDuration);
        }
      }
    }

    function handleOptionClick(replyId) {
      disableUserInput();
      showTypingIndicator();
      // Use minimum 500ms delay for option clicks to show typing indicator
      const optionDelay = Math.max(replyDuration, 500);
      setTimeout(() => {
        const response = chatbot.handleOptionSelection(replyId);
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
      const targetScrollTop = element.scrollHeight - element.clientHeight;
      const startScrollTop = element.scrollTop;
      const distance = targetScrollTop - startScrollTop;
      const duration = 300; // ms
      let start = null;

      function step(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        element.scrollTop = easeInOutCubic(
          progress,
          startScrollTop,
          distance,
          duration
        );
        if (progress < duration) {
          window.requestAnimationFrame(step);
        }
      }

      window.requestAnimationFrame(step);
    }

    function easeInOutCubic(t, b, c, d) {
      t /= d / 2;
      if (t < 1) return (c / 2) * t * t * t + b;
      t -= 2;
      return (c / 2) * (t * t * t + 2) + b;
    }

    sendButton.addEventListener("click", handleUserInput);
    userInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleUserInput();
      }
    });

    // Phase 4.2: Enhanced clearHistory with UI update and event
    const originalClearHistory = chatbot.clearHistory.bind(chatbot);
    chatbot.clearHistory = function () {
      const result = originalClearHistory();
      clearDisplay();
      displayBotMessage(result.reply, result.options);

      // Dispatch custom event
      element.dispatchEvent(
        new CustomEvent("swc:history-cleared", {
          detail: { timestamp: new Date().toISOString() },
        })
      );

      return result;
    };

    // Phase 4.2: Enhanced exportHistory with event
    const originalExportHistory = chatbot.exportHistory.bind(chatbot);
    chatbot.exportHistory = function () {
      const historyJSON = originalExportHistory();

      // Dispatch custom event
      element.dispatchEvent(
        new CustomEvent("swc:history-exported", {
          detail: {
            messageCount: chatbot.chatHistory.length,
            historyJSON: historyJSON,
            timestamp: new Date().toISOString(),
          },
        })
      );

      return historyJSON;
    };

    // Phase 4.2: Enhanced loadHistory with UI update and event
    const originalLoadHistory = chatbot.loadHistory.bind(chatbot);
    chatbot.loadHistory = function (historyData) {
      const result = originalLoadHistory(historyData);

      if (result.success) {
        clearDisplay();

        // Render all messages from history
        result.messages.forEach((msg) => {
          renderMessage(msg);
        });

        // Render options from last message if present
        if (result.messages.length > 0) {
          const lastMessage = result.messages[result.messages.length - 1];
          if (lastMessage.options && lastMessage.options.length > 0) {
            optionsContainer.style.display = "flex";
            lastMessage.options.forEach((option) => {
              const button = document.createElement("button");
              button.textContent = option.label;
              button.onclick = () => handleOptionClick(option.reply_id);
              optionsContainer.appendChild(button);
            });
          }
        }

        smoothScrollToBottom(chatDisplay);

        // Dispatch custom event
        element.dispatchEvent(
          new CustomEvent("swc:history-loaded", {
            detail: {
              messageCount: result.messageCount,
              timestamp: new Date().toISOString(),
            },
          })
        );
      } else {
        console.error("Failed to load history:", result.error);
      }

      return result;
    };

    // Phase 3: Declarative History Loading
    if (loadHistory) {
      // Check if it's a URL/file path or JSON string
      const isUrl =
        loadHistory.startsWith("http://") ||
        loadHistory.startsWith("https://") ||
        loadHistory.startsWith("./") ||
        loadHistory.startsWith("../") ||
        loadHistory.endsWith(".json");

      if (isUrl) {
        // Phase 3.2: Load from external file
        fetch(loadHistory)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            chatbot.loadHistory(data);
          })
          .catch((error) => {
            console.error("Error loading history from file:", error);
            // Fallback to default initialization
            const initialResponse = chatbot.init();
            displayBotMessage(initialResponse.reply, initialResponse.options);
          });
      } else {
        // Phase 3.3: Load from inline JSON string
        try {
          const data = JSON.parse(loadHistory);
          chatbot.loadHistory(data);
        } catch (error) {
          console.error("Error parsing inline history JSON:", error);
          // Fallback to default initialization
          const initialResponse = chatbot.init();
          displayBotMessage(initialResponse.reply, initialResponse.options);
        }
      }
    } else {
      // Initialize the chatbot normally
      const initialResponse = chatbot.init();
      displayBotMessage(initialResponse.reply, initialResponse.options);
    }
  });
}

// Export the main class and functions
export { SenangWebsChatbot, initializeChatbot, defaultKnowledgeBase };

// Make initializeChatbot globally accessible
if (typeof window !== "undefined") {
  window.initializeChatbot = initializeChatbot;

  // Auto-initialize on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initializeChatbot();
    });
  } else {
    // DOM already loaded
    initializeChatbot();
  }
}
