<?php
// Debug handler to see what's being received
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Log everything
error_log("=== DEBUG FORM HANDLER ===");
error_log("REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);
error_log("CONTENT_TYPE: " . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
error_log("POST data: " . print_r($_POST, true));
error_log("GET data: " . print_r($_GET, true));
error_log("FILES: " . print_r($_FILES, true));

// Try to read raw input
$raw_input = file_get_contents('php://input');
error_log("Raw input length: " . strlen($raw_input));
error_log("Raw input (first 1000 chars): " . substr($raw_input, 0, 1000));

// Return what we received
echo json_encode([
    'success' => true,
    'debug' => [
        'method' => $_SERVER['REQUEST_METHOD'],
        'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
        'post_count' => count($_POST),
        'post_keys' => array_keys($_POST),
        'raw_input_length' => strlen($raw_input),
        'raw_input_preview' => substr($raw_input, 0, 200)
    ]
]);
