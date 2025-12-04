/**
 * OpenRouter API Client
 * Handles communication with OpenRouter (OpenAI-compatible) API
 * Supports streaming responses and error handling
 */

class OpenRouterAPI {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || "https://openrouter.ai/api/v1";
    this.model = config.model || "openai/gpt-3.5-turbo";
    this.maxTokens = config.maxTokens || 500;
    this.temperature = config.temperature || 0.7;
    this.siteName = config.siteName || "SenangWebs Chatbot";
    this.siteUrl =
      config.siteUrl ||
      (typeof window !== "undefined" ? window.location.origin : "");
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
  validateConfig() {
    if (!this.apiKey || this.apiKey.trim() === "") {
      throw new Error("OpenRouter API key is required");
    }

    if (!this.baseURL || !this.baseURL.startsWith("http")) {
      throw new Error("Invalid base URL");
    }

    if (this.maxTokens < 1 || this.maxTokens > 32768) {
      console.warn(
        "maxTokens should be between 1 and 32768, using default 500"
      );
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
  async sendMessage(messages, onChunk, onComplete, onError) {
    let attempt = 0;
    let lastError = null;

    while (attempt <= this.retryAttempts) {
      try {
        if (this.debug) {
          console.log(
            `[OpenRouterAPI] Attempt ${attempt + 1}/${this.retryAttempts + 1}`
          );
          console.log("[OpenRouterAPI] Sending messages:", messages);
        }

        const response = await this._makeRequest(messages);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw this._handleAPIError(response.status, errorData);
        }

        // Handle streaming response
        const result = await this._handleStreamingResponse(response, onChunk);

        if (onComplete) {
          onComplete(result);
        }

        return result;
      } catch (error) {
        lastError = error;

        if (this.debug) {
          console.error(
            `[OpenRouterAPI] Attempt ${attempt + 1} failed:`,
            error
          );
        }

        // Don't retry on certain errors
        if (this._shouldNotRetry(error)) {
          if (onError) {
            onError(error);
          }
          throw error;
        }

        attempt++;

        // Wait before retry (exponential backoff)
        if (attempt <= this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          if (this.debug) {
            console.log(`[OpenRouterAPI] Retrying in ${delay}ms...`);
          }
          await this._sleep(delay);
        }
      }
    }

    // All retries failed
    if (onError) {
      onError(lastError);
    }
    throw lastError;
  }

  /**
   * Make HTTP request to OpenRouter API
   * @private
   */
  async _makeRequest(messages) {
    this.abortController = new AbortController();
    const timeoutId = setTimeout(
      () => this.abortController.abort(),
      this.timeout
    );

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": this.siteUrl,
          "X-Title": this.siteName,
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          stream: true,
        }),
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    } finally {
      // Clean up timeout in all cases
      clearTimeout(timeoutId);
    }
  }

  /**
   * Handle streaming response from API
   * @private
   */
  async _handleStreamingResponse(response, onChunk) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine === "") continue;
          if (trimmedLine === "data: [DONE]") continue;
          if (!trimmedLine.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(trimmedLine.substring(6));
            const content = data.choices?.[0]?.delta?.content;

            if (content) {
              fullContent += content;

              if (onChunk) {
                onChunk({
                  content: content,
                  fullContent: fullContent,
                  done: false,
                });
              }
            }

            // Check if streaming is finished
            if (data.choices?.[0]?.finish_reason) {
              if (this.debug) {
                console.log(
                  "[OpenRouterAPI] Stream finished:",
                  data.choices[0].finish_reason
                );
              }
            }
          } catch (parseError) {
            if (this.debug) {
              console.warn(
                "[OpenRouterAPI] Failed to parse SSE data:",
                trimmedLine,
                parseError
              );
            }
          }
        }
      }

      return {
        content: fullContent,
        model: this.model,
        done: true,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Request cancelled by user");
      }
      throw error;
    }
  }

  /**
   * Handle API errors and create meaningful error messages
   * @private
   */
  _handleAPIError(status, errorData) {
    const errorMessage = errorData.error?.message || "Unknown error occurred";

    switch (status) {
      case 401:
        return new Error(
          "Invalid API key. Please check your OpenRouter API key."
        );
      case 403:
        return new Error(
          "Access forbidden. Please check your API key permissions."
        );
      case 429:
        const error = new Error("Rate limit exceeded. Please try again later.");
        error.isRateLimit = true;
        return error;
      case 500:
      case 502:
      case 503:
        return new Error(
          "OpenRouter service is temporarily unavailable. Please try again."
        );
      case 400:
        return new Error(`Bad request: ${errorMessage}`);
      default:
        return new Error(`API error (${status}): ${errorMessage}`);
    }
  }

  /**
   * Check if error should not be retried
   * @private
   */
  _shouldNotRetry(error) {
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
  cancel() {
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
  getModelInfo() {
    return {
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
    };
  }

  /**
   * Sleep utility for retry delays
   * @private
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = OpenRouterAPI;
}
