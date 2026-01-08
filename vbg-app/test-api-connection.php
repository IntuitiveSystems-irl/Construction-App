<?php
// Simple test to check if we can reach the VBG API
header('Content-Type: application/json');

$api_url = 'http://31.97.144.132:5002/api/contact';

// Test data
$test_data = [
    'name' => 'Test User',
    'email' => 'test@example.com',
    'phone' => '360-555-1234',
    'message' => 'This is a test message',
    'source' => 'API Connection Test'
];

echo "Testing connection to: $api_url\n\n";

// Try to connect
$ch = curl_init($api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($test_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $http_code\n";
echo "cURL Error: " . ($curl_error ?: 'None') . "\n";
echo "Response: $response\n";

if ($http_code >= 200 && $http_code < 300) {
    echo "\n✅ SUCCESS - API is reachable!";
} else {
    echo "\n❌ FAILED - Cannot reach API";
}
