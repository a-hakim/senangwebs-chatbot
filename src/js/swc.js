// SenangWebs Chatbot Library

class SenangWebsChatbot {
  constructor(knowledgeBase, botMetadata = {}) {
    this.knowledgeBase = knowledgeBase;
    this.currentNode = null;
    this.chatHistory = [];
    this.botMetadata = {
      botName: botMetadata.botName || 'Bot',
      themeColor: botMetadata.themeColor || '#007bff',
      timestamp: new Date().toISOString()
    };
  }

  init() {
    this.currentNode = this.knowledgeBase.find(node => node.id === 'welcome') || this.knowledgeBase[0];
    const response = {
      reply: this.currentNode.reply,
      options: this.currentNode.options
    };
    
    // Add welcome message to history
    this.addToHistory('bot', this.currentNode.reply, this.currentNode.id, this.currentNode.options);
    
    return response;
  }
  
  addToHistory(type, content, nodeId = null, options = null) {
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: type,
      content: content
    };
    
    if (type === 'bot') {
      message.nodeId = nodeId;
      if (options && options.length > 0) {
        message.options = options;
      }
    }
    
    this.chatHistory.push(message);
  }

  handleInput(input) {
    const lowercaseInput = input.toLowerCase();
    const words = lowercaseInput.split(/\s+/);

    // Add user message to history
    this.addToHistory('user', input);

    const keywordScores = {};
    this.knowledgeBase.forEach(node => {
      keywordScores[node.id] = 0;
      node.keyword.forEach(keyword => {
        const lowercaseKeyword = keyword.toLowerCase();
        words.forEach(word => {
          if (word.includes(lowercaseKeyword) || lowercaseKeyword.includes(word)) {
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
        bestMatch = this.knowledgeBase.find(node => node.id === nodeId);
      }
    });

    if (bestMatch) {
      this.currentNode = bestMatch;
      // Add bot response to history
      this.addToHistory('bot', bestMatch.reply, bestMatch.id, bestMatch.options);
      return {
        reply: bestMatch.reply,
        options: bestMatch.options
      };
    } else {
      const fallbackReply = "I'm sorry, I didn't understand that. Can you please rephrase?";
      // Add fallback response to history
      this.addToHistory('bot', fallbackReply, null, null);
      return {
        reply: fallbackReply,
        options: null
      };
    }
  }

  handleOptionSelection(replyId) {
    const nextNode = this.knowledgeBase.find(node => node.id === replyId);
    if (nextNode) {
      this.currentNode = nextNode;
      // Add bot response to history
      this.addToHistory('bot', nextNode.reply, nextNode.id, nextNode.options);
      return {
        reply: nextNode.reply,
        options: nextNode.options
      };
    } else {
      const fallbackReply = "I'm sorry, I couldn't find the appropriate response. How else can I assist you?";
      // Add fallback response to history
      this.addToHistory('bot', fallbackReply, null, null);
      return {
        reply: fallbackReply,
        options: null
      };
    }
  }
  
  // Phase 1.2: Export History
  exportHistory() {
    const historyData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      botName: this.botMetadata.botName,
      themeColor: this.botMetadata.themeColor,
      messages: this.chatHistory,
      currentNodeId: this.currentNode ? this.currentNode.id : null
    };
    
    return JSON.stringify(historyData, null, 2);
  }
  
  getCurrentState() {
    return {
      currentNodeId: this.currentNode ? this.currentNode.id : null,
      messageCount: this.chatHistory.length,
      lastMessageTimestamp: this.chatHistory.length > 0 
        ? this.chatHistory[this.chatHistory.length - 1].timestamp 
        : null
    };
  }
  
  // Phase 1.3: Load History
  loadHistory(historyData) {
    try {
      // Parse if string, use directly if object
      const data = typeof historyData === 'string' 
        ? JSON.parse(historyData) 
        : historyData;
      
      // Validate structure
      if (!data.version || !data.messages || !Array.isArray(data.messages)) {
        throw new Error('Invalid history format: missing required fields');
      }
      
      // Check version compatibility
      if (data.version !== "1.0") {
        console.warn(`History version ${data.version} may not be fully compatible`);
      }
      
      // Update bot metadata if present
      if (data.botName) this.botMetadata.botName = data.botName;
      if (data.themeColor) this.botMetadata.themeColor = data.themeColor;
      
      // Restore chat history
      this.chatHistory = data.messages;
      
      // Restore current node state
      if (data.currentNodeId) {
        const node = this.knowledgeBase.find(n => n.id === data.currentNodeId);
        if (node) {
          this.currentNode = node;
        }
      }
      
      return {
        success: true,
        messageCount: this.chatHistory.length,
        messages: this.chatHistory
      };
      
    } catch (error) {
      console.error('Error loading history:', error);
      return {
        success: false,
        error: error.message,
        messages: []
      };
    }
  }
  
  // Phase 1.4: Clear History
  clearHistory() {
    this.chatHistory = [];
    this.currentNode = this.knowledgeBase.find(node => node.id === 'welcome') || this.knowledgeBase[0];
    
    // Add welcome message to fresh history
    if (this.currentNode) {
      this.addToHistory('bot', this.currentNode.reply, this.currentNode.id, this.currentNode.options);
    }
    
    return {
      reply: this.currentNode ? this.currentNode.reply : '',
      options: this.currentNode ? this.currentNode.options : null
    };
  }
  
  // Phase 4.1: Get History (returns object not string)
  getHistory() {
    return {
      version: "1.0",
      timestamp: new Date().toISOString(),
      botName: this.botMetadata.botName,
      themeColor: this.botMetadata.themeColor,
      messages: this.chatHistory,
      currentNodeId: this.currentNode ? this.currentNode.id : null
    };
  }
}
  
  // Default knowledge base
  const defaultKnowledgeBase = [
    {
      id: 'welcome',
      keyword: ['hello', 'hi', 'hey'],
      reply: 'Welcome! How can I assist you <b>today?</b> <a href="https://senangwebs.com">senangwebs.com</a>',
      options: [
        { label: 'Get Help', reply_id: 'help' },
        { label: 'End Chat', reply_id: 'goodbye' },
      ],
    },
    {
      id: 'help',
      keyword: ['help', 'support', 'assist'],
      reply: 'Sure, I can help! What do you need assistance with?',
      options: [
        { label: 'Product Information', reply_id: 'product' },
        { label: 'Billing', reply_id: 'billing' },
        { label: 'Technical Support', reply_id: 'tech_support' },
      ],
    },
    {
      id: 'product',
      keyword: ['product', 'information'],
      reply: 'Our product is designed to make your life easier. Would you like to know more about its features or pricing?',
      options: [
        { label: 'Features', reply_id: 'features' },
        { label: 'Pricing', reply_id: 'pricing' },
      ],
    },
    {
      id: 'billing',
      keyword: ['billing', 'payment', 'invoice'],
      reply: 'For billing inquiries, please visit our billing portal or contact our finance department at billing@example.com.',
      options: [
        { label: 'Back to Help', reply_id: 'help' },
        { label: 'End Chat', reply_id: 'goodbye' },
      ],
    },
    {
      id: 'tech_support',
      keyword: ['technical', 'support', 'issue'],
      reply: 'For technical support, please describe your issue in detail and well do our best to assist you.',
    },
    {
      id: 'features',
      keyword: ['features', 'functionality'],
      reply: 'Our product offers cutting-edge features including AI-powered analytics, real-time collaboration, and seamless integration with popular tools.',
      options: [
        { label: 'Back to Product Info', reply_id: 'product' },
        { label: 'End Chat', reply_id: 'goodbye' },
      ],
    },
    {
      id: 'pricing',
      keyword: ['pricing', 'cost', 'plans'],
      reply: 'We offer flexible pricing plans starting at $9.99/month. For detailed pricing information, please visit our website or contact our sales team.',
      options: [
        { label: 'Back to Product Info', reply_id: 'product' },
        { label: 'End Chat', reply_id: 'goodbye' },
      ],
    },
    {
      id: 'goodbye',
      keyword: ['bye', 'goodbye', 'end'],
      reply: 'Thank you for chatting with us. Have a great day!',
      options: [
        { label: 'Restart Chat', reply_id: 'welcome' },
      ],
    },
  ];
  
  function createChatbotUI(containerElement, themeColor, botName, chatDisplayStyle) {
    const chatDisplay = document.createElement('div');
    chatDisplay.className = `swc-chat-display ${chatDisplayStyle === 'modern' ? 'swc-modern' : 'swc-classic'}`;
    
    const inputContainer = document.createElement('div');
    inputContainer.className = 'swc-input-container';
    
    const userInput = document.createElement('input');
    userInput.type = 'text';
    userInput.className = 'swc-user-input';
    userInput.placeholder = 'Type your message...';
    
    const sendButton = document.createElement('button');
    sendButton.className = 'swc-send-button';
    sendButton.textContent = 'Send';
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'swc-options-container';
    
    inputContainer.appendChild(userInput);
    inputContainer.appendChild(sendButton);
  
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'swc-typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
  
    containerElement.appendChild(chatDisplay);
    containerElement.appendChild(optionsContainer);
    containerElement.appendChild(inputContainer);
  
    // Apply theme color and bot name
    containerElement.style.setProperty('--swc-theme-color', themeColor);
    containerElement.style.setProperty('--swc-bot-name', `"${botName}"`);
  
    return { chatDisplay, userInput, sendButton, optionsContainer, typingIndicator };
  }
  
  function initializeChatbot(customKnowledgeBase = null) {
    const chatbotElements = document.querySelectorAll('[data-swc]');
    chatbotElements.forEach((element) => {
      const themeColor = element.getAttribute('data-swc-theme-color') || '#007bff';
      const botName = element.getAttribute('data-swc-bot-name') || 'Bot';
      const chatDisplayStyle = element.getAttribute('data-swc-chat-display') || 'classic';
      const replyDuration = parseInt(element.getAttribute('data-swc-reply-duration')) || 0;
      const loadHistory = element.getAttribute('data-swc-load');
      
      // Phase 2.1: Create chatbot instance with metadata
      const chatbot = new SenangWebsChatbot(
        customKnowledgeBase || defaultKnowledgeBase,
        { botName, themeColor }
      );
      
      // Phase 2.1: Store instance on element for external access
      element.chatbotInstance = chatbot;
      
      const { chatDisplay, userInput, sendButton, optionsContainer, typingIndicator } = createChatbotUI(element, themeColor, botName, chatDisplayStyle);
  
      // Phase 2.3: Render message helper function
      function renderMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `swc-message swc-${message.type}-message`;
        messageElement.innerHTML = message.content;
        chatDisplay.appendChild(messageElement);
      }
      
      // Phase 2.3: Clear display helper
      function clearDisplay() {
        chatDisplay.innerHTML = '';
        optionsContainer.innerHTML = '';
        optionsContainer.style.display = 'none';
      }
      
      function displayBotMessage(message, options) {
        removeTypingIndicator();
        const messageElement = document.createElement('div');
        messageElement.className = 'swc-message swc-bot-message';
        messageElement.innerHTML = `${message}`;
        chatDisplay.appendChild(messageElement);
        smoothScrollToBottom(chatDisplay);
  
        optionsContainer.innerHTML = '';
        if (options && options.length > 0) {
          optionsContainer.style.display = 'flex';
          options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option.label;
            button.onclick = () => handleOptionClick(option.reply_id);
            optionsContainer.appendChild(button);
          });
        } else {
          optionsContainer.style.display = 'none';
        }
      }
  
      function handleUserInput() {
        const message = userInput.value.trim();
        if (message) {
          const userMessageElement = document.createElement('div');
          userMessageElement.className = 'swc-message swc-user-message';
          userMessageElement.innerHTML = `${message}`;
          chatDisplay.appendChild(userMessageElement);
          smoothScrollToBottom(chatDisplay);
          
          userInput.value = '';
          
          disableUserInput();
          showTypingIndicator();
          setTimeout(() => {
            const response = chatbot.handleInput(message);
            displayBotMessage(response.reply, response.options);
            enableUserInput();
          }, replyDuration);
        }
      }
  
      function handleOptionClick(replyId) {
        disableUserInput();
        showTypingIndicator();
        setTimeout(() => {
          const response = chatbot.handleOptionSelection(replyId);
          displayBotMessage(response.reply, response.options);
          enableUserInput();
        }, replyDuration);
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
          element.scrollTop = easeInOutCubic(progress, startScrollTop, distance, duration);
          if (progress < duration) {
            window.requestAnimationFrame(step);
          }
        }
  
        window.requestAnimationFrame(step);
      }
  
      function easeInOutCubic(t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t*t + b;
        t -= 2;
        return c/2*(t*t*t + 2) + b;
      }
  
      sendButton.addEventListener('click', handleUserInput);
      userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleUserInput();
        }
      });
  
      // Phase 4.2: Enhanced clearHistory with UI update and event
      const originalClearHistory = chatbot.clearHistory.bind(chatbot);
      chatbot.clearHistory = function() {
        const result = originalClearHistory();
        clearDisplay();
        displayBotMessage(result.reply, result.options);
        
        // Dispatch custom event
        element.dispatchEvent(new CustomEvent('swc:history-cleared', {
          detail: { timestamp: new Date().toISOString() }
        }));
        
        return result;
      };
      
      // Phase 4.2: Enhanced exportHistory with event
      const originalExportHistory = chatbot.exportHistory.bind(chatbot);
      chatbot.exportHistory = function() {
        const historyJSON = originalExportHistory();
        
        // Dispatch custom event
        element.dispatchEvent(new CustomEvent('swc:history-exported', {
          detail: {
            messageCount: chatbot.chatHistory.length,
            historyJSON: historyJSON,
            timestamp: new Date().toISOString()
          }
        }));
        
        return historyJSON;
      };
      
      // Phase 4.2: Enhanced loadHistory with UI update and event
      const originalLoadHistory = chatbot.loadHistory.bind(chatbot);
      chatbot.loadHistory = function(historyData) {
        const result = originalLoadHistory(historyData);
        
        if (result.success) {
          clearDisplay();
          
          // Render all messages from history
          result.messages.forEach(msg => {
            renderMessage(msg);
          });
          
          // Render options from last message if present
          if (result.messages.length > 0) {
            const lastMessage = result.messages[result.messages.length - 1];
            if (lastMessage.options && lastMessage.options.length > 0) {
              optionsContainer.style.display = 'flex';
              lastMessage.options.forEach(option => {
                const button = document.createElement('button');
                button.textContent = option.label;
                button.onclick = () => handleOptionClick(option.reply_id);
                optionsContainer.appendChild(button);
              });
            }
          }
          
          smoothScrollToBottom(chatDisplay);
          
          // Dispatch custom event
          element.dispatchEvent(new CustomEvent('swc:history-loaded', {
            detail: {
              messageCount: result.messageCount,
              timestamp: new Date().toISOString()
            }
          }));
        } else {
          console.error('Failed to load history:', result.error);
        }
        
        return result;
      };
  
      // Phase 3: Declarative History Loading
      if (loadHistory) {
        // Check if it's a URL/file path or JSON string
        const isUrl = loadHistory.startsWith('http://') || 
                      loadHistory.startsWith('https://') || 
                      loadHistory.startsWith('./') || 
                      loadHistory.startsWith('../') ||
                      loadHistory.endsWith('.json');
        
        if (isUrl) {
          // Phase 3.2: Load from external file
          fetch(loadHistory)
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
            })
            .then(data => {
              chatbot.loadHistory(data);
            })
            .catch(error => {
              console.error('Error loading history from file:', error);
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
            console.error('Error parsing inline history JSON:', error);
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
  if (typeof window !== 'undefined') {
    window.initializeChatbot = initializeChatbot;
    
    // Auto-initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initializeChatbot();
      });
    } else {
      // DOM already loaded
      initializeChatbot();
    }
  }