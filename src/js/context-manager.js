/**
 * Context Manager
 * Manages conversation context for AI interactions
 * Implements sliding window for context management
 */

class ContextManager {
  constructor(config = {}) {
    this.maxMessages = config.maxMessages || 10;
    this.systemPrompt = config.systemPrompt || 'You are a helpful assistant.';
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
  addMessage(role, content) {
    if (!role || !content) {
      console.warn('[ContextManager] Invalid message: role and content are required');
      return;
    }

    const message = {
      role: role,
      content: content,
      timestamp: new Date().toISOString(),
      tokens: this._estimateTokens(content)
    };

    this.contextWindow.push(message);
    this.totalTokensEstimate += message.tokens;

    if (this.debug) {
      console.log(`[ContextManager] Added ${role} message (${message.tokens} tokens)`);
      console.log(`[ContextManager] Total messages: ${this.contextWindow.length}, estimated tokens: ${this.totalTokensEstimate}`);
    }

    // Trim context if needed
    this._trimContext();
  }

  /**
   * Get formatted context for API
   * @param {boolean} includeSystem - Include system prompt
   * @returns {Array} Array of message objects for API
   */
  getContext(includeSystem = true) {
    const messages = [];

    // Add system prompt if requested
    if (includeSystem && this.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.systemPrompt
      });
    }

    // Add context window messages (without metadata)
    this.contextWindow.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    if (this.debug) {
      console.log(`[ContextManager] Returning ${messages.length} messages for API`);
    }

    return messages;
  }

  /**
   * Get last N messages from context
   * @param {number} count - Number of messages to retrieve
   * @returns {Array} Last N messages
   */
  getLastMessages(count = 5) {
    return this.contextWindow.slice(-count);
  }

  /**
   * Clear all context except system prompt
   */
  clear() {
    this.contextWindow = [];
    this.totalTokensEstimate = 0;

    if (this.debug) {
      console.log('[ContextManager] Context cleared');
    }
  }

  /**
   * Update system prompt
   * @param {string} prompt - New system prompt
   */
  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
    
    if (this.debug) {
      console.log('[ContextManager] System prompt updated');
    }
  }

  /**
   * Get context statistics
   * @returns {Object} Context statistics
   */
  getStats() {
    return {
      messageCount: this.contextWindow.length,
      estimatedTokens: this.totalTokensEstimate,
      maxMessages: this.maxMessages,
      maxTokens: this.maxTokens,
      systemPrompt: this.systemPrompt ? this.systemPrompt.substring(0, 50) + '...' : null
    };
  }

  /**
   * Trim context to stay within limits
   * Uses sliding window approach - removes oldest messages first
   * Always keeps at least one exchange (user + assistant)
   * @private
   */
  _trimContext() {
    // Trim by message count
    while (this.contextWindow.length > this.maxMessages) {
      const removed = this.contextWindow.shift();
      this.totalTokensEstimate -= removed.tokens;

      if (this.debug) {
        console.log(`[ContextManager] Removed oldest message (${removed.role}), ${this.contextWindow.length} remaining`);
      }
    }

    // Trim by token count (more aggressive if needed)
    while (this.totalTokensEstimate > this.maxTokens && this.contextWindow.length > 2) {
      const removed = this.contextWindow.shift();
      this.totalTokensEstimate -= removed.tokens;

      if (this.debug) {
        console.log(`[ContextManager] Removed message to reduce tokens (${removed.role}), ${this.totalTokensEstimate} tokens remaining`);
      }
    }
  }

  /**
   * Estimate token count for a message
   * Simple approximation: ~4 characters per token
   * @private
   */
  _estimateTokens(text) {
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
  summarize() {
    if (this.contextWindow.length < 3) {
      return '';
    }

    // Get first half of messages
    const messagesToSummarize = this.contextWindow.slice(0, Math.floor(this.contextWindow.length / 2));
    
    // Create summary
    const summary = messagesToSummarize.map(msg => {
      const preview = msg.content.substring(0, 100);
      return `${msg.role}: ${preview}${msg.content.length > 100 ? '...' : ''}`;
    }).join('\n');

    return `Previous conversation summary:\n${summary}`;
  }

  /**
   * Export context for persistence
   * @returns {Object} Serializable context data
   */
  export() {
    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      systemPrompt: this.systemPrompt,
      maxMessages: this.maxMessages,
      maxTokens: this.maxTokens,
      contextWindow: this.contextWindow.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      })),
      stats: this.getStats()
    };
  }

  /**
   * Import context from exported data
   * @param {Object} data - Exported context data
   * @returns {boolean} Success status
   */
  import(data) {
    try {
      if (!data || !data.contextWindow || !Array.isArray(data.contextWindow)) {
        throw new Error('Invalid context data format');
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
      data.contextWindow.forEach(msg => {
        this.addMessage(msg.role, msg.content);
      });

      if (this.debug) {
        console.log(`[ContextManager] Imported ${this.contextWindow.length} messages`);
      }

      return true;

    } catch (error) {
      console.error('[ContextManager] Import failed:', error);
      return false;
    }
  }

  /**
   * Inject knowledge base context into system prompt
   * @param {string} knowledge - Knowledge base information
   */
  injectKnowledge(knowledge) {
    if (!knowledge) return;

    const enhancedPrompt = `${this.systemPrompt}\n\nRelevant knowledge base information:\n${knowledge}`;
    this.setSystemPrompt(enhancedPrompt);

    if (this.debug) {
      console.log('[ContextManager] Knowledge injected into system prompt');
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContextManager;
}
