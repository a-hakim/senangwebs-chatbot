module.exports = [
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

