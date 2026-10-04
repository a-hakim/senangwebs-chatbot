// Shared validation for programmatic configuration and declarative attributes.
function numberSetting(value, fallback, name, min, max = Infinity, integer = false) {
  if (value === undefined || value === null) return fallback;
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof number !== "number" || !Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
    throw new TypeError(`${name} must be ${integer ? "an integer" : "a number"} between ${min} and ${max}`);
  }
  return number;
}

function validateOptions(options, ids = null) {
  if (options == null) return;
  if (!Array.isArray(options)) throw new TypeError("options must be an array");
  for (const option of options) {
    if (!option || typeof option.label !== "string" || typeof option.reply_id !== "string" || !option.reply_id || (ids && !ids.has(option.reply_id))) {
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

module.exports = { numberSetting, validateKnowledgeBase, validateHistory };
