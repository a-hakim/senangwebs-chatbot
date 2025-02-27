# SenangWebs Chatbot (SWC)

SenangWebs Chatbot is a lightweight JavaScript library that enables easy integration of a customizable chatbot into your website. With minimal setup, you can add an interactive customer support feature to your web pages, enhancing user engagement and support capabilities.

## Features

- Easy to integrate with existing projects
- Customizable chatbot interface
- Keyword-based response system with partial matching
- Supports conversation flow with options
- Themeable with custom colors
- Modern and classic chat display styles
- Typing indicator with customizable delay
- Smooth scrolling and fade-in animations
- Support for external knowledge base via JSON
- Efficient performance
- Responsive and works on all modern browsers

## Installation

### Using npm

```bash
npm install senangwebs-chatbot
```

### Using a CDN

You can include SenangWebs Chatbot directly in your HTML file using unpkg:

```html
<link rel="stylesheet" href="https://unpkg.com/senangwebs-chatbot@latest/dist/swc.css">
<script src="https://unpkg.com/senangwebs-chatbot@latest/dist/swc.js"></script>
```

## Basic Usage

1. Include the SenangWebs Chatbot CSS and JavaScript files in your HTML:

```html
<link rel="stylesheet" href="path/to/swc.css">
<script src="path/to/swc.js"></script>
```

2. Add the chatbot container to your HTML:

```html
<div data-swc 
     data-swc-theme-color="#ff6600" 
     data-swc-bot-name="SenangWebs" 
     data-swc-chat-display="modern" 
     data-swc-reply-duration="500">
</div>
```

3. Initialize the chatbot:

The chatbot will initialize automatically when the DOM is fully loaded. If you need to initialize it manually or with a custom knowledge base, you can do so in your JavaScript code:

```javascript
document.addEventListener('DOMContentLoaded', function() {
  // Use default knowledge base
  initializeChatbot();

  // Or use a custom knowledge base
  const customKnowledgeBase = [
    // Your custom knowledge base here
  ];
  initializeChatbot(customKnowledgeBase);
});
```

## Advanced Usage: External JSON Knowledge Base

You can use an external JSON file to define your chatbot's knowledge base. This allows for easier management and updating of the chatbot's responses without modifying the main code.

1. Create a JSON file for your knowledge base (e.g., `knowledge-base.json`):

```json
{
  "knowledgeBase": [
    {
      "id": "welcome",
      "keyword": ["hello", "hi", "hey", "start"],
      "reply": "Welcome to SenangWebs Chatbot! How can I assist you today?",
      "options": [
        { "label": "Product Information", "reply_id": "product_info" },
        { "label": "Pricing", "reply_id": "pricing" },
        { "label": "Support", "reply_id": "support" }
      ]
    },
    // Add more nodes as needed
  ]
}
```

2. Use the following HTML and JavaScript to load and use the external knowledge base:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SenangWebs Chatbot Example</title>
    <link rel="stylesheet" href="https://unpkg.com/senangwebs-chatbot@latest/dist/swc.css">
    <script src="https://unpkg.com/senangwebs-chatbot@latest/dist/swc.js"></script>
</head>
<body>
    <div id="chatbot-container" data-swc data-swc-theme-color="#4CAF50" data-swc-bot-name="SenangBot" data-swc-chat-display="modern" data-swc-reply-duration="800"></div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            fetch('knowledge-base.json')
                .then(response => response.json())
                .then(data => {
                    initializeChatbot(data.knowledgeBase);
                })
                .catch(error => {
                    console.error('Error loading knowledge base:', error);
                    // Initialize with default knowledge base if there's an error
                    initializeChatbot();
                });
        });
    </script>
</body>
</html>
```

This example demonstrates how to load an external JSON file and use it to initialize the chatbot. If the JSON file fails to load, it falls back to the default knowledge base.

## Configuration Options

### Chatbot Container Attributes

You can configure the chatbot appearance and behavior using the following attributes on the container element:

- `data-swc`: Indicates that this element should be initialized as a chatbot
- `data-swc-theme-color`: Sets the primary color for the chatbot interface (e.g., "#ff6600")
- `data-swc-bot-name`: Sets the name of the chatbot (e.g., "SenangWebs")
- `data-swc-chat-display`: Sets the chat display style ("modern" or "classic")
- `data-swc-reply-duration`: Sets the delay (in milliseconds) before the bot replies

### Knowledge Base Structure

The knowledge base is an array of objects with the following structure:

```javascript
{
  id: 'unique_id',
  keyword: ['keyword1', 'keyword2'],
  reply: 'Chatbot response',
  options: [
    { label: 'Option 1', reply_id: 'next_response_id' },
    { label: 'Option 2', reply_id: 'another_response_id' }
  ]
}
```

- `id`: A unique identifier for the conversation node
- `keyword`: An array of keywords that trigger this response. The chatbot will match full or partial keywords in the user's input.
- `reply`: The chatbot's response text
- `options`: (Optional) An array of follow-up options for the user to choose from

Note: The chatbot uses a flexible keyword matching system. It will match full keywords, partial keywords, and even consider multiple keyword matches in a single user input. This allows for more natural conversation flow and better handling of variations in user input.

## Customization

You can customize the chatbot's appearance by modifying the CSS file or overriding styles in your own stylesheet. The chatbot's primary color and other visual aspects can be set using the data attributes on the container element.

To create a custom knowledge base, follow the structure outlined in the Configuration Options section.

## Browser Support

SenangWebs Chatbot works on all modern browsers, including:

- Chrome
- Firefox
- Safari
- Edge
- Opera

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Inspired by various chatbot implementations in the web development community
- Thanks to all contributors who have helped to improve this library

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.
