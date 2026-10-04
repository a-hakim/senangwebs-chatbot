import "../css/swc.css";
import SenangWebsChatbot from "./chatbot.js";
import OpenRouterAPI from "./openrouter-client.js";
import ContextManager from "./context-manager.js";
import defaultKnowledgeBase from "./default-knowledge-base.js";
import { mountChatbot } from "./chatbot-ui.js";
import { numberSetting } from "./validation.js";

function initializeChatbot(customKnowledgeBase = null) {
  if (typeof document === "undefined") return;
  document.querySelectorAll("[data-swc]").forEach(element => {
    if (element.chatbotInstance || (!customKnowledgeBase && element.hasAttribute("data-swc-manual-init"))) return;
    const attr = name => element.getAttribute(`data-swc-${name}`);
    const apiKey = attr("api-key"), baseURL = attr("api-base-url"), endpointURL = attr("api-endpoint");
    const mode = attr("api-mode") || (apiKey || baseURL || endpointURL ? "hybrid" : "keyword-only");
    try {
      const apiConfig = mode === "keyword-only" ? null : {
        mode, apiKey: apiKey || "", baseURL: baseURL || undefined, endpointURL: endpointURL || undefined,
        model: attr("api-model") || undefined, streaming: attr("api-streaming") !== "false",
        maxTokens: attr("api-max-tokens"), temperature: attr("api-temperature"), systemPrompt: attr("system-prompt") ?? undefined,
        contextMaxMessages: attr("context-max-messages"), contextMaxTokens: attr("context-max-tokens"),
        hybridThreshold: attr("hybrid-threshold"), timeout: attr("api-timeout"), retryAttempts: attr("api-retry-attempts"), retryDelay: attr("api-retry-delay"),
        debug: attr("debug") === "true", siteName: attr("bot-name") || "Bot", siteUrl: window.location.origin,
      };
      const replyDuration = numberSetting(attr("reply-duration"), 0, "replyDuration", 0, 2147483647, true);
      const chatbot = new SenangWebsChatbot(customKnowledgeBase ?? defaultKnowledgeBase, { botName: attr("bot-name") || "Bot", themeColor: attr("theme-color") || "#007bff" }, apiConfig);
      element.chatbotInstance = chatbot;
      try { mountChatbot(element, chatbot, { replyDuration, chatDisplayStyle: attr("chat-display") || "classic", loadHistory: attr("load") }); }
      catch (error) { chatbot.destroy(); delete element.chatbotInstance; throw error; }
      if (apiKey && chatbot.apiClient?.url.hostname === "openrouter.ai") console.warn("[SWC] Client-side API keys are visible to visitors. Use a server-side proxy in production.");
    } catch (error) {
      // One malformed widget must not prevent other widgets from initializing.
      console.error("[SWC] Initialization failed:", error.message);
      element.dispatchEvent(new CustomEvent("swc:error", { detail: { code: "configuration", message: error.message } }));
    }
  });
}

export { SenangWebsChatbot, initializeChatbot, defaultKnowledgeBase, OpenRouterAPI, ContextManager };

if (typeof window !== "undefined" && typeof document !== "undefined") {
  window.initializeChatbot = initializeChatbot;
  window.OpenRouterAPI = window.OpenRouterAPI || OpenRouterAPI;
  window.ContextManager = window.ContextManager || ContextManager;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => initializeChatbot(), { once: true });
  else initializeChatbot();
}
