<?php
// Simplest possible form handler for testing
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Log everything to error log
$log_file = __DIR__ . '/form-test.log';
$log_data = [
    'timestamp' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
    'content_length' => $_SERVER['CONTENT_LENGTH'] ?? 'not set',
    'post_data' => $_POST,
    'post_count' => count($_POST),
    'server_vars' => [
        'HTTP_CONTENT_TYPE' => $_SERVER['HTTP_CONTENT_TYPE'] ?? 'not set',
        'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'not set',
    ]
];

file_put_contents($log_file, print_r($log_data, true) . "\n\n", FILE_APPEND);

// Return success with debug info
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Test successful',
    'received' => [
        'post_count' => count($_POST),
        'post_keys' => array_keys($_POST),
        'first_name' => $_POST['first_name'] ?? 'not received',
        'email' => $_POST['email'] ?? 'not received'
    ]
]);
