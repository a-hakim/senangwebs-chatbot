// SenangWebs Chatbot Library

class SenangWebsChatbot {
  constructor(knowledgeBase) {
    this.knowledgeBase = knowledgeBase;
    this.currentNode = null;
  }

  init() {
    this.currentNode = this.knowledgeBase.find(node => node.id === 'welcome') || this.knowledgeBase[0];
    return {
      reply: this.currentNode.reply,
      options: this.currentNode.options
    };
  }

  handleInput(input) {
    const lowercaseInput = input.toLowerCase();
    const words = lowercaseInput.split(/\s+/);

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
      return {
        reply: bestMatch.reply,
        options: bestMatch.options
      };
    } else {
      return {
        reply: "I'm sorry, I didn't understand that. Can you please rephrase?",
        options: null
      };
    }
  }

  handleOptionSelection(replyId) {
    const nextNode = this.knowledgeBase.find(node => node.id === replyId);
    if (nextNode) {
      this.currentNode = nextNode;
      return {
        reply: nextNode.reply,
        options: nextNode.options
      };
    } else {
      return {
        reply: "I'm sorry, I couldn't find the appropriate response. How else can I assist you?",
        options: null
      };
    }
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
      
      const chatbot = new SenangWebsChatbot(customKnowledgeBase || defaultKnowledgeBase);
      const { chatDisplay, userInput, sendButton, optionsContainer, typingIndicator } = createChatbotUI(element, themeColor, botName, chatDisplayStyle);
  
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
  
      // Initialize the chatbot
      const initialResponse = chatbot.init();
      displayBotMessage(initialResponse.reply, initialResponse.options);
    });
  }
  
  // Export the main class and functions
  export { SenangWebsChatbot, initializeChatbot, defaultKnowledgeBase };

  // Make initializeChatbot globally accessible
  if (typeof window !== 'undefined') {
    window.initializeChatbot = initializeChatbot;
  }