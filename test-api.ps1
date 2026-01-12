#!/usr/bin/env powershell
# Test API endpoint to verify backend is working

Write-Host "Testing Bar/Restaurant Management System API" -ForegroundColor Green
Write-Host "============================================`n"

$API_URL = "http://localhost:5000/api"
$TOKEN = "your_jwt_token_here"  # Replace with actual token after login

# Test 1: Check if API is running
Write-Host "1. Testing API connection..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$API_URL/" -Method Get -ErrorAction Stop
    Write-Host "✓ API is running" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "✗ API is not responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Login to get token..." -ForegroundColor Cyan
$loginBody = @{
    email = "admin@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$API_URL/auth/login" `
        -Method Post `
        -Headers @{"Content-Type"="application/json"} `
        -Body $loginBody `
        -ErrorAction Stop
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $TOKEN = $loginData.data.token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "Token: $($TOKEN.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Note: Ensure user exists in database" -ForegroundColor Yellow
    # Continue anyway to test other endpoints
}

Write-Host "`n3. Testing inventory endpoint..." -ForegroundColor Cyan
if ($TOKEN) {
    try {
        $inventoryResponse = Invoke-WebRequest -Uri "$API_URL/inventory" `
            -Method Get `
            -Headers @{
                "Authorization" = "Bearer $TOKEN"
                "Content-Type" = "application/json"
            } `
            -ErrorAction Stop
        
        $inventoryData = $inventoryResponse.Content | ConvertFrom-Json
        $itemCount = $inventoryData.data.inventoryItems.Count
        Write-Host "✓ Inventory endpoint working" -ForegroundColor Green
        Write-Host "Items found: $itemCount" -ForegroundColor Gray
        Write-Host "Response preview:" -ForegroundColor Gray
        Write-Host ($inventoryData | ConvertTo-Json -Depth 2) -ForegroundColor Gray
    } catch {
        Write-Host "✗ Inventory endpoint failed" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ Skipped (no valid token)" -ForegroundColor Yellow
}

Write-Host "`n4. Testing without authentication..." -ForegroundColor Cyan
try {
    $publicResponse = Invoke-WebRequest -Uri "$API_URL/inventory" `
        -Method Get `
        -ErrorAction Stop
    Write-Host "⚠ Endpoint is accessible without authentication (security issue)" -ForegroundColor Yellow
} catch {
    Write-Host "✓ Endpoint requires authentication (correct)" -ForegroundColor Green
}

Write-Host "`nTests completed!`n" -ForegroundColor Green
