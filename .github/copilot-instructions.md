# SenangWebs Chatbot (SWC) - AI Agent Instructions

## Project Architecture

This is a lightweight, ES6 class-based JavaScript chatbot library built for web integration. The core architecture follows:

- **Entry Point**: Single-file UMD library (`src/js/swc.js`) with CSS bundle (`src/css/swc.css`)
- **Build System**: Webpack with Babel transpilation, outputs to `dist/` as distributable assets
- **Deployment**: CDN-ready via unpkg, supports both npm and direct HTML inclusion

## Core Components

### 1. SenangWebsChatbot Class (`src/js/swc.js:1-215`)
- **State Management**: Uses `currentNode` to track conversation flow
- **History Tracking**: `chatHistory` array stores all messages with timestamps and metadata
- **Keyword Matching**: Implements fuzzy matching with partial keyword support and scoring algorithm
- **API**: Core methods: `init()`, `handleInput(input)`, `handleOptionSelection(replyId)`
- **History API**: `exportHistory()`, `loadHistory(data)`, `clearHistory()`, `getHistory()`

### 2. Knowledge Base Structure
```javascript
{
  id: 'unique_identifier',
  keyword: ['trigger', 'words'],  // Case-insensitive partial matching
  reply: 'Response text with HTML support',
  options: [{ label: 'Button Text', reply_id: 'next_node_id' }]  // Optional
}
```

### 3. UI System (`createChatbotUI` function)
- **Initialization**: Auto-detects `[data-swc]` elements on DOM ready
- **Theming**: CSS custom properties via `data-swc-theme-color` and `data-swc-bot-name`
- **Styles**: Two display modes - `modern` (chat bubbles) and `classic` (terminal-style)

## Development Workflows

### Build Commands
```bash
npm run build      # Production build (minified)
npm run dev        # Development build with watch mode
```

### File Structure Patterns
- `src/js/swc.js` - Single monolithic file containing all JavaScript logic
- `src/css/swc.css` - Complete styling with CSS custom properties for theming
- `examples/index.html` - Live demonstration with Tailwind CSS integration

## Key Implementation Patterns

### 1. Data Attribute Configuration
```html
<div data-swc 
     data-swc-theme-color="#ff6600" 
     data-swc-bot-name="Assistant"
     data-swc-chat-display="modern"
     data-swc-reply-duration="500">
</div>
```

### 2. Global Function Export Pattern
- ES6 exports for module usage: `export { SenangWebsChatbot, initializeChatbot }`
- Window global for CDN usage: `window.initializeChatbot = initializeChatbot`

### 3. External Knowledge Base Loading
```javascript
fetch('knowledge-base.json')
  .then(response => response.json())
  .then(data => initializeChatbot(data.knowledgeBase))
  .catch(() => initializeChatbot()); // Fallback to default
```

### 4. Animation & UX Patterns
- Typing indicators with CSS animations (`pulse` keyframes)
- Smooth scrolling with `requestAnimationFrame` and easing functions
- Input disabling during bot responses to prevent race conditions

### 5. Chat History Persistence (v1.2.0+)
- History stored in `chatHistory` array with timestamps and metadata
- Export as JSON string with version/metadata via `exportHistory()`
- Load from file path via `data-swc-load` attribute or inline JSON string
- Programmatic API: `exportHistory()`, `loadHistory()`, `clearHistory()`, `getHistory()`
- Custom events: `swc:history-exported`, `swc:history-loaded`, `swc:history-cleared`
- Instance access via `element.chatbotInstance` for external control
- No built-in UI - developers implement custom controls as needed

### 6. History Data Structure
```javascript
{
  version: "1.0",
  timestamp: "ISO-8601",
  botName: "Bot Name",
  themeColor: "#hexcolor",
  messages: [
    {
      id: "msg-{timestamp}-{random}",
      timestamp: "ISO-8601",
      type: "bot|user",
      content: "HTML string",
      nodeId: "knowledge_base_id",  // bot only
      options: [{label, reply_id}]  // bot only, optional
    }
  ],
  currentNodeId: "active_node_id"
}
```

## Critical Dependencies

- **Build**: Webpack 5 + Babel for ES6→ES5 transpilation and CSS extraction
- **Runtime**: Pure vanilla JS, no external dependencies
- **Browser Support**: Modern browsers only (uses ES6 classes, arrow functions)

## Integration Points

### 1. Initialization Patterns
```javascript
// Auto-initialization (preferred)
document.addEventListener('DOMContentLoaded', () => initializeChatbot());

// Custom knowledge base
initializeChatbot(customKnowledgeBase);

// External JSON knowledge base (async pattern)
fetch('kb.json').then(r => r.json()).then(d => initializeChatbot(d.knowledgeBase));
```

### 2. CSS Theming System
- Uses CSS custom properties: `--swc-theme-color`, `--swc-bot-name`
- Theme inheritance from data attributes on container element
- Override via CSS: `[data-swc] { --swc-theme-color: #custom; }`

## Testing & Debugging

- **Demo Environment**: `examples/index.html` shows both modern and classic styles
- **No Test Suite**: Currently relies on manual testing via example page
- **Console Debugging**: Knowledge base structure logged during initialization failures

## Common Modification Patterns

1. **Adding New Conversation Nodes**: Extend `defaultKnowledgeBase` array with proper `id` and `keyword` arrays
2. **UI Customization**: Modify CSS classes in `swc.css`, particularly `.swc-modern` and `.swc-classic` variants  
3. **API Integration**: Replace static responses with fetch calls in `handleInput` method
4. **New Themes**: Add CSS custom property overrides in container or parent elements

## Version & Distribution

- **Current**: v1.1.7 (check `package.json`)
- **Distribution**: Built files in `dist/` ready for CDN deployment
- **Entry Point**: `swc.js` (UMD) + `swc.css` bundle pattern