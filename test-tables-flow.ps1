# Test script to verify tables functionality
param()

$baseUrl = "http://localhost:5000/api"

# Step 1: Try to login with test credentials
Write-Host "=== Step 1: Attempting to login ===" -ForegroundColor Cyan

$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $loginData `
        -UseBasicParsing
    
    $loginResult = $loginResponse.Content | ConvertFrom-Json
    $token = $loginResult.data.token
    
    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Yellow
    
    # Step 2: Fetch tables with the token
    Write-Host "`n=== Step 2: Fetching tables ===" -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $tablesResponse = Invoke-WebRequest -Uri "$baseUrl/tables" `
        -Method Get `
        -Headers $headers `
        -UseBasicParsing
    
    $tables = $tablesResponse.Content | ConvertFrom-Json
    
    Write-Host "Tables fetched successfully!" -ForegroundColor Green
    Write-Host "Total tables: $($tables.data.tables.Count)" -ForegroundColor Yellow
    
} catch {
    Write-Host "Login failed, attempting to register admin user..." -ForegroundColor Yellow
    
    $registerData = @{
        username = "admin"
        email = "admin@restaurant.com"
        password = "admin123"
        firstName = "Admin"
        lastName = "User"
        role = "admin"
    } | ConvertTo-Json
    
    try {
        $registerResponse = Invoke-WebRequest -Uri "$baseUrl/auth/register" `
            -Method Post `
            -Headers @{"Content-Type" = "application/json"} `
            -Body $registerData `
            -UseBasicParsing
        
        Write-Host "Admin user created!" -ForegroundColor Green
        
        # Try login again
        $retryLogin = Invoke-WebRequest -Uri "$baseUrl/auth/login" `
            -Method Post `
            -Headers @{"Content-Type" = "application/json"} `
            -Body $loginData `
            -UseBasicParsing
        
        $retryResult = $retryLogin.Content | ConvertFrom-Json
        $token = $retryResult.data.token
        
        Write-Host "Login successful!" -ForegroundColor Green
        
        # Fetch tables
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $tablesResponse = Invoke-WebRequest -Uri "$baseUrl/tables" `
            -Method Get `
            -Headers $headers `
            -UseBasicParsing
        
        $tables = $tablesResponse.Content | ConvertFrom-Json
        
        Write-Host "Tables fetched successfully!" -ForegroundColor Green
        Write-Host "Total tables: $($tables.data.tables.Count)" -ForegroundColor Yellow
        
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
