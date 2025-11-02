<?php
/**
 * PHP Proxy Server for OpenRouter API
 * 
 * This proxy keeps your API key secure on the server-side.
 * 
 * Setup:
 * 1. Set OPENROUTER_API_KEY in your .env file or server config
 * 2. Upload this file to your server (e.g., /api/chat.php)
 * 3. Configure chatbot: data-swc-api-base-url="https://yourdomain.com/api/chat.php"
 * 
 * Requirements: PHP 7.4+ with cURL enabled
 */

// Configuration
define('OPENROUTER_API_KEY', getenv('OPENROUTER_API_KEY') ?: 'your-api-key-here');
define('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1');

// CORS Headers - adjust for production
header('Access-Control-Allow-Origin: *'); // Change to your domain in production
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Validate API key
if (OPENROUTER_API_KEY === 'your-api-key-here') {
    http_response_code(500);
    echo json_encode(['error' => 'API key not configured']);
    exit;
}

// Get request body
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

// Validate request
if (!isset($input['messages']) || !is_array($input['messages'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid messages format']);
    exit;
}

if (!isset($input['model'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Model is required']);
    exit;
}

// Optional: Add rate limiting here
// Optional: Add request logging here
// Optional: Add user authentication here

// Prepare request body
$requestBody = [
    'model' => $input['model'],
    'messages' => $input['messages'],
    'stream' => $input['stream'] ?? false,
    'max_tokens' => $input['max_tokens'] ?? 1000,
    'temperature' => $input['temperature'] ?? 0.7
];

// Initialize cURL
$ch = curl_init(OPENROUTER_BASE_URL . '/chat/completions');

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($requestBody),
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . OPENROUTER_API_KEY,
        'Content-Type: application/json',
        'HTTP-Referer: ' . ($_SERVER['HTTP_REFERER'] ?? $_SERVER['HTTP_HOST']),
        'X-Title: SenangWebs Chatbot'
    ],
    CURLOPT_WRITEFUNCTION => function($ch, $data) use ($requestBody) {
        // Handle streaming response
        if ($requestBody['stream']) {
            echo $data;
            if (ob_get_level() > 0) {
                ob_flush();
            }
            flush();
        }
        return strlen($data);
    }
]);

// Set streaming headers if needed
if ($requestBody['stream']) {
    header('Content-Type: text/event-stream');
    header('Cache-Control: no-cache');
    header('X-Accel-Buffering: no'); // Disable nginx buffering
    
    // Disable output buffering
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    // Execute streaming request
    $result = curl_exec($ch);
    
    if ($result === false) {
        $error = curl_error($ch);
        echo "data: " . json_encode(['error' => 'cURL error: ' . $error]) . "\n\n";
    }
} else {
    // Execute non-streaming request
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, null);
    $response = curl_exec($ch);
    
    if ($response === false) {
        http_response_code(500);
        echo json_encode(['error' => 'cURL error: ' . curl_error($ch)]);
    } else {
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        http_response_code($httpCode);
        
        header('Content-Type: application/json');
        echo $response;
    }
}

curl_close($ch);
?>
