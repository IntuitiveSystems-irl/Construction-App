<?php
/**
 * Veritas Building Group Contact Form Handler
 * Integrates with VBG CRM via backend API
 */

// Enable error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-errors.log');

// Set JSON response header
header('Content-Type: application/json');

// CORS headers for cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Please use POST.'
    ]);
    exit;
}

// Sanitize and validate input
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function validate_phone($phone) {
    // Remove all non-numeric characters
    $cleaned = preg_replace('/[^0-9]/', '', $phone);
    // Check if it's a valid length (10 digits for US)
    return strlen($cleaned) >= 10;
}

// Log PHP configuration for debugging
error_log("Contact Form - PHP Config: post_max_size=" . ini_get('post_max_size') . ", upload_max_filesize=" . ini_get('upload_max_filesize'));
error_log("Contact Form - Content-Length: " . (isset($_SERVER['CONTENT_LENGTH']) ? $_SERVER['CONTENT_LENGTH'] : 'not set'));

// Handle both multipart/form-data and application/json
$input_data = [];

// Check content type
$content_type = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';

if (strpos($content_type, 'application/json') !== false) {
    // Handle JSON data
    $raw_input = file_get_contents('php://input');
    error_log("Contact Form JSON input: " . substr($raw_input, 0, 500));
    $input_data = json_decode($raw_input, true);
    if (!$input_data) {
        $input_data = [];
    }
} else {
    // Handle form data (multipart/form-data or application/x-www-form-urlencoded)
    $input_data = $_POST;
    
    // For multipart/form-data, we can't read php://input, so just use $_POST
    if (empty($input_data) && strpos($content_type, 'multipart/form-data') === false) {
        // Only try to read raw input if it's NOT multipart
        $raw_input = file_get_contents('php://input');
        if (!empty($raw_input)) {
            error_log("Contact Form - Trying to parse raw input: " . substr($raw_input, 0, 200));
            parse_str($raw_input, $input_data);
        }
    }
}

// Log received data for debugging
error_log("Contact Form - Content-Type: " . $content_type);
error_log("Contact Form - Request Method: " . $_SERVER['REQUEST_METHOD']);
error_log("Contact Form data: " . print_r($input_data, true));
error_log("Contact Form \$_POST count: " . count($_POST));

// Check if we received any data at all
if (empty($input_data)) {
    error_log("Contact Form ERROR: No data received. POST: " . print_r($_POST, true) . " | FILES: " . print_r($_FILES, true));
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'No form data received. Please try again.',
        'debug' => [
            'content_type' => $content_type,
            'post_empty' => empty($_POST),
            'method' => $_SERVER['REQUEST_METHOD']
        ]
    ]);
    exit;
}

// Get form data
$first_name = isset($input_data['first_name']) ? sanitize_input($input_data['first_name']) : '';
$last_name = isset($input_data['last_name']) ? sanitize_input($input_data['last_name']) : '';
$email = isset($input_data['email']) ? sanitize_input($input_data['email']) : '';
$phone = isset($input_data['phone']) ? sanitize_input($input_data['phone']) : '';
$project_type = isset($input_data['project_type']) ? sanitize_input($input_data['project_type']) : '';
$message = isset($input_data['message']) ? sanitize_input($input_data['message']) : '';

// Validation - email and message are required, others are optional
$errors = [];

if (empty($email)) {
    $errors[] = 'Email is required';
} elseif (!validate_email($email)) {
    $errors[] = 'Invalid email address';
}

if (empty($message)) {
    $errors[] = 'Message is required';
}

// Optional phone validation - only validate if phone is provided and has content
if (!empty($phone) && strlen(trim($phone)) > 0 && !validate_phone($phone)) {
    $errors[] = 'Phone number must be at least 10 digits';
}

// Log validation errors
if (!empty($errors)) {
    error_log("Contact Form validation errors: " . implode(', ', $errors));
}

// If validation fails, return errors
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Please correct the following errors:',
        'errors' => $errors
    ]);
    exit;
}

// Combine first and last name, or use email if names are empty
$full_name = trim($first_name . ' ' . $last_name);
if (empty($full_name)) {
    $full_name = explode('@', $email)[0]; // Use email username as fallback
}

// Format message with project type
$formatted_message = "Project Type: " . ucfirst(str_replace('-', ' ', $project_type)) . "\n\n" . $message;

// Prepare data for CRM API
$crm_data = [
    'name' => $full_name,
    'email' => $email,
    'phone' => $phone,
    'message' => $formatted_message,
    'source' => 'Website Contact Form - veribuilds.com',
    'company' => '' // Optional, can be added to form later
];

// API endpoint - website is on different server, so use production IP
$api_url = 'http://31.97.144.132:5002/api/contact';

// Log the API URL for debugging
error_log("Contact Form: Using API URL: $api_url");

// Initialize cURL
$ch = curl_init($api_url);

// Set cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($crm_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

// Execute request
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
$curl_info = curl_getinfo($ch);
curl_close($ch);

// Log the request for debugging
error_log("Contact Form Submission - Name: $full_name, Email: $email");
error_log("API Response - HTTP Code: $http_code");
error_log("API Response Body: " . substr($response, 0, 500));
if ($curl_error) {
    error_log("cURL Error: $curl_error");
}

// Handle response
if ($curl_error) {
    error_log("cURL Error: $curl_error");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'We received your message but encountered a technical issue. Our team has been notified and will contact you shortly at ' . $email
    ]);
    exit;
}

if ($http_code >= 200 && $http_code < 300) {
    // Success
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for contacting Veritas Building Group! We\'ll get back to you within 24 hours.'
    ]);
} else {
    // API returned an error
    error_log("API Error - HTTP Code: $http_code, Response: $response");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'We received your message but encountered a technical issue. Please try again or contact us directly at info@veribuilds.com or (360) 229-5524.'
    ]);
}
