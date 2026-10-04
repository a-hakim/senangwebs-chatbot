const DOMPurify = require("dompurify");

function mountChatbot(element, chatbot, { replyDuration = 0, chatDisplayStyle = "classic", loadHistory = null } = {}) {
  const doc = element.ownerDocument, win = doc.defaultView;
  const create = (tag, className, text) => {
    const node = doc.createElement(tag); node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const chatDisplay = create("div", `swc-chat-display ${chatDisplayStyle === "modern" ? "swc-modern" : "swc-classic"}`);
  chatDisplay.setAttribute("role", "log"); chatDisplay.setAttribute("aria-label", "Chat transcript");
  chatDisplay.setAttribute("aria-live", "off"); chatDisplay.tabIndex = 0;
  const options = create("div", "swc-options-container");
  const inputContainer = create("div", "swc-input-container");
  const input = create("input", "swc-user-input"); input.type = "text";
  input.placeholder = "Type your message..."; input.setAttribute("aria-label", "Message");
  const send = create("button", "swc-send-button", "Send"); send.type = "button";
  const status = create("div", "swc-status swc-visually-hidden");
  status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite"); status.setAttribute("aria-atomic", "true");
  const typing = create("div", "swc-typing-indicator"); typing.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 3; i++) typing.appendChild(doc.createElement("span"));
  inputContainer.append(input, send); element.append(chatDisplay, options, inputContainer, status);
  const owned = [chatDisplay, options, inputContainer, status];
  const previousTheme = element.style.getPropertyValue("--swc-theme-color"), previousName = element.style.getPropertyValue("--swc-bot-name");
  const previousThemePriority = element.style.getPropertyPriority("--swc-theme-color"), previousNamePriority = element.style.getPropertyPriority("--swc-bot-name");
  let busy = false, revision = 0, destroyed = false, frame = null, pendingUpdate = null, stop = null, historyController = null;
  const delays = new Map();
  const purifier = DOMPurify.sanitize ? DOMPurify : DOMPurify(win);

  function applyTheme() {
    element.style.setProperty("--swc-theme-color", chatbot.botMetadata.themeColor);
    // JSON string escaping prevents names containing quotes from corrupting CSS content values.
    element.style.setProperty("--swc-bot-name", JSON.stringify(chatbot.botMetadata.botName));
  }
  function announce(text) { status.textContent = text; }
  function setBusy(value) {
    busy = value; input.disabled = value; send.disabled = value;
    options.querySelectorAll("button").forEach(button => { button.disabled = value; });
    chatDisplay.setAttribute("aria-busy", String(value));
  }
  function scroll() {
    const reduced = win.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    chatDisplay.scrollTo({ top: chatDisplay.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }
  function flushUpdate() {
    if (frame !== null) { win.cancelAnimationFrame(frame); frame = null; }
    if (pendingUpdate) {
      const { node, content } = pendingUpdate; pendingUpdate = null;
      if (node.isConnected) node.textContent = content;
    }
    if (!destroyed) scroll();
  }
  function scheduleUpdate(node, content) {
    pendingUpdate = { node, content };
    if (frame === null) frame = win.requestAnimationFrame(() => { frame = null; flushUpdate(); });
  }
  function renderMessage(message) {
    const node = create("div", `swc-message swc-${message.type}-message${message.source === "api" ? " swc-ai-message" : ""}${message.source === "error" ? " swc-error-message" : ""}`);
    if (message.type === "user" || ["api", "error", "fallback"].includes(message.source)) node.textContent = message.content;
    else node.appendChild(purifier.sanitize(message.content, { USE_PROFILES: { html: true }, FORBID_TAGS: ["style"], RETURN_DOM_FRAGMENT: true }));
    chatDisplay.appendChild(node);
    return node;
  }
  function renderOptions(items) {
    options.replaceChildren(); options.style.display = items?.length ? "flex" : "none";
    for (const item of items || []) {
      const button = create("button", "swc-option-button", item.label); button.type = "button";
      button.dataset.replyId = item.reply_id; button.disabled = busy; options.appendChild(button);
    }
  }
  function renderHistory() {
    chatDisplay.replaceChildren(); applyTheme();
    for (const message of chatbot.chatHistory) renderMessage(message);
    renderOptions(chatbot.chatHistory[chatbot.chatHistory.length - 1]?.options);
    scroll();
  }
  function removeStop() { stop?.remove(); stop = null; }
  function reset() {
    revision++; historyController?.abort(); historyController = null;
    for (const [timer, resolve] of delays) { win.clearTimeout(timer); resolve(false); }
    delays.clear();
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = null; pendingUpdate = null; removeStop(); typing.remove(); setBusy(false); announce("");
  }
  function delay(ms) {
    if (!ms) return Promise.resolve(true);
    return new Promise(resolve => {
      const timer = win.setTimeout(() => { delays.delete(timer); resolve(true); }, ms);
      delays.set(timer, resolve);
    });
  }
  function addStop() {
    stop = create("button", "swc-stop-button", "Stop"); stop.type = "button";
    stop.setAttribute("aria-label", "Stop AI response");
    stop.addEventListener("click", () => { chatbot.cancelAIResponse(); stop.disabled = true; announce("Stopping response"); });
    inputContainer.prepend(stop);
  }
  async function submit(replyId = null) {
    if (destroyed || busy || chatbot.aiResponseInProgress) return;
    const message = input.value.trim();
    if (replyId === null && !message) return;
    const operation = ++revision;
    historyController?.abort(); historyController = null;
    setBusy(true); announce("Assistant is replying");
    if (replyId === null) { renderMessage({ type: "user", content: message }); input.value = ""; }
    chatDisplay.appendChild(typing); scroll();
    let streamingNode = null;
    const current = () => !destroyed && revision === operation;
    try {
      const wait = replyId === null ? replyDuration : Math.max(replyDuration, 500);
      if (!(await delay(wait)) || !current()) return;
      if (replyId === null && chatbot.apiClient) addStop();
      const response = replyId !== null ? chatbot.handleOptionSelection(replyId) : await chatbot.handleInput(message, {
        onStart: () => {
          if (!current()) return;
          typing.remove(); streamingNode = renderMessage({ type: "bot", content: "", source: "api" });
          streamingNode.classList.add("swc-streaming");
        },
        onChunk: chunk => { if (current() && streamingNode) scheduleUpdate(streamingNode, chunk.fullContent); },
      });
      if (!current() || response.stale || response.busy) return;
      flushUpdate(); typing.remove();
      let displayedText = response.reply;
      if (streamingNode && response.source === "api") {
        streamingNode.textContent = response.reply; streamingNode.classList.remove("swc-streaming");
        if (response.cancelled && !response.reply) streamingNode.remove();
      } else {
        streamingNode?.remove();
        if (response.reply) displayedText = renderMessage({ type: "bot", content: response.reply, source: response.source }).textContent;
      }
      renderOptions(response.options);
      announce(response.cancelled ? `Response stopped. ${displayedText}` : `${chatbot.botMetadata.botName}: ${displayedText}`);
      scroll();
    } catch (error) {
      if (current()) {
        typing.remove(); streamingNode?.classList.remove("swc-streaming");
        renderMessage({ type: "bot", content: "The message could not be processed. Please try again.", source: "error" });
        announce("The message could not be processed. Please try again.");
        if (chatbot.debug) console.warn("[SWC] UI operation failed", error);
      }
    } finally {
      if (current()) {
        removeStop(); typing.remove(); setBusy(false); input.focus({ preventScroll: true });
      }
    }
  }
  const sendClick = () => { void submit(); };
  const keydown = event => {
    if (event.key === "Enter" && !event.isComposing && event.keyCode !== 229) { event.preventDefault(); void submit(); }
  };
  const optionClick = event => {
    const button = event.target.closest("button[data-reply-id]");
    if (button && options.contains(button)) void submit(button.dataset.replyId);
  };
  send.addEventListener("click", sendClick); input.addEventListener("keydown", keydown); options.addEventListener("click", optionClick);
  chatbot._ui = {
    reset, renderHistory,
    emit: (name, detail) => { if (!destroyed) element.dispatchEvent(new win.CustomEvent(name, { detail: { ...detail, timestamp: new Date().toISOString() } })); },
    destroy: () => {
      destroyed = true; reset();
      send.removeEventListener("click", sendClick); input.removeEventListener("keydown", keydown); options.removeEventListener("click", optionClick);
      owned.forEach(node => node.remove());
      if (previousTheme) element.style.setProperty("--swc-theme-color", previousTheme, previousThemePriority); else element.style.removeProperty("--swc-theme-color");
      if (previousName) element.style.setProperty("--swc-bot-name", previousName, previousNamePriority); else element.style.removeProperty("--swc-bot-name");
      if (element.chatbotInstance === chatbot) delete element.chatbotInstance;
    },
  };
  applyTheme();
  const welcome = () => { chatbot.init(); renderHistory(); announce(chatDisplay.lastElementChild?.textContent ?? ""); };
  if (!loadHistory) { welcome(); return; }
  // Parse inline JSON first; all other strings are URLs, including root-relative paths.
  if (/^\s*[\[{]/.test(loadHistory)) {
    if (!chatbot.loadHistory(loadHistory).success) welcome();
    return;
  }
  setBusy(true); announce("Loading conversation");
  const operation = revision;
  historyController = new AbortController();
  const historySignal = historyController.signal;
  Promise.resolve().then(() => fetch(new URL(loadHistory, doc.baseURI).href, { signal: historySignal }))
    .then(response => { if (!response.ok) throw new Error("History could not be loaded"); return response.json(); })
    .then(data => { if (!destroyed && revision === operation) { if (!chatbot.loadHistory(data).success) { setBusy(false); welcome(); } } })
    .catch(() => { if (!destroyed && revision === operation) { setBusy(false); welcome(); } });
}

module.exports = { mountChatbot };
