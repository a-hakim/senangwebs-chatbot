# SenangWebs Chatbot - Examples

This directory contains demonstration pages for the SenangWebs Chatbot library.

## Demo Pages

### 1. **index.html** - Basic Showcase
The main showcase demonstrating basic chatbot functionality with two display styles:
- **Modern Style**: Chat bubble interface
- **Classic Style**: Terminal-like interface

**Features shown:**
- Basic chatbot initialization
- Theme customization
- Reply duration settings
- Different display modes

---

### 2. **history-demo.html** - History Management Demo
Interactive demonstration of the chat history management features (v1.2.0+).

**Features shown:**
- Export chat history as JSON file
- Import chat history from JSON file
- Clear chat history
- Save/Load history to/from LocalStorage
- Real-time event logging
- Current state monitoring

**Controls:**
- 📥 Export History - Download conversation as JSON
- 📤 Import History - Upload and restore from JSON file
- 🗑️ Clear History - Reset conversation
- 💾 Save to LocalStorage - Quick save for current session
- 📂 Load from LocalStorage - Quick restore from saved session

**Use Cases:**
- Save customer support conversations
- Resume conversations across sessions
- Export for analytics or compliance
- Backup/restore functionality

---

### 3. **declarative-loading-demo.html** - Declarative Loading Examples
Demonstrates the different ways to load chat history declaratively using HTML data attributes.

**Examples:**
1. **External File Loading** - Load history from JSON file
   ```html
   <div data-swc data-swc-load="./sample-history.json"></div>
   ```

2. **Inline JSON Loading** - Embed history directly in HTML
   ```html
   <div data-swc data-swc-load='{"version":"1.0","messages":[...]}'></div>
   ```

3. **Normal Initialization** - Default behavior without history loading

**Use Cases:**
- Pre-load conversations for demos
- Restore user sessions on page load
- Server-side rendering with chat history
- A/B testing different conversation flows

---

## Sample Files

### **sample-history.json**
Example chat history file showing the proper JSON structure for history loading.

**Structure:**
```json
{
  "version": "1.0",
  "timestamp": "ISO-8601",
  "botName": "Bot Name",
  "themeColor": "#hexcolor",
  "messages": [...],
  "currentNodeId": "node_id"
}
```

---

## Running the Examples

### Option 1: Local Server (Recommended)
Use a local web server to avoid CORS issues:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000

# Using Live Server (VS Code Extension)
# Right-click on file → Open with Live Server
```

Then navigate to:
- http://localhost:8000/examples/index.html
- http://localhost:8000/examples/history-demo.html
- http://localhost:8000/examples/declarative-loading-demo.html

### Option 2: Direct File Open
Open the HTML files directly in your browser. Note that some features (like external JSON loading) may not work due to CORS restrictions.

---

## Browser Compatibility

All examples work on modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

**Note:** Internet Explorer is not supported.

---

## Dependencies

All examples use:
- **Tailwind CSS** (via CDN) - For styling
- **SenangWebs Chatbot** (local dist files) - The chatbot library

---

## Troubleshooting

### Chatbot doesn't appear
- Check browser console for errors
- Ensure `../dist/swc.css` and `../dist/swc.js` paths are correct
- Run `npm run build` in the root directory

### External JSON loading fails
- Use a local web server instead of opening files directly
- Check CORS headers if loading from different domain
- Verify JSON file path is correct

### History not loading
- Check JSON structure matches the required format
- Look for console errors
- Verify the `data-swc-load` attribute value is correct

### Buttons not working
- Check if chatbot instance is accessible: `console.log(document.querySelector('[data-swc]').chatbotInstance)`
- Ensure page is fully loaded before interacting
- Check browser console for JavaScript errors

---

## More Information

- [Main README](../README.md)
- [Development Plan](../DEVELOPMENT_PLAN_CHAT_HISTORY.md)
- [Changelog](../CHANGELOG.md)
- [Implementation Summary](../IMPLEMENTATION_SUMMARY.md)

---

## Questions or Issues?

If you encounter any problems or have questions:
1. Check the browser console for errors
2. Review the [Copilot Instructions](../.github/copilot-instructions.md)
3. File an issue on the GitHub repository
