# Test QR code generation
param()

$baseUrl = "http://localhost:5000/api"

# Step 1: Login
Write-Host "=== Step 1: Login ===" -ForegroundColor Cyan

$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" `
    -Method Post `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $loginData `
    -UseBasicParsing

$token = ($loginResponse.Content | ConvertFrom-Json).data.token
Write-Host "✓ Login successful!" -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 2: Get a table
Write-Host "`n=== Step 2: Fetch Tables ===" -ForegroundColor Cyan

$tablesResponse = Invoke-WebRequest -Uri "$baseUrl/tables" `
    -Method Get `
    -Headers $headers `
    -UseBasicParsing

$tables = ($tablesResponse.Content | ConvertFrom-Json).data.tables
$firstTable = $tables[0]

Write-Host "✓ Tables fetched!" -ForegroundColor Green
Write-Host "  First table ID: $($firstTable._id)" -ForegroundColor Yellow
Write-Host "  First table number: $($firstTable.number)" -ForegroundColor Yellow

# Step 3: Get QR code for the table
Write-Host "`n=== Step 3: Generate QR Code ===" -ForegroundColor Cyan

try {
    $qrResponse = Invoke-WebRequest -Uri "$baseUrl/tables/$($firstTable._id)/qr" `
        -Method Get `
        -Headers $headers `
        -UseBasicParsing
    
    $qrData = $qrResponse.Content | ConvertFrom-Json
    
    Write-Host "✓ QR code generated!" -ForegroundColor Green
    Write-Host "  QR Code ID: $($qrData.data.table.qrCode)" -ForegroundColor Yellow
    Write-Host "  QR Code URL: $($qrData.data.table.qrCodeUrl)" -ForegroundColor Yellow
    Write-Host "  Has QR Data URL: $($qrData.data.qrCodeDataUrl -ne $null)" -ForegroundColor Yellow
    
    if ($qrData.data.qrCodeDataUrl) {
        Write-Host "`n✓ QR Code image was successfully generated!" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Error generating QR code: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== QR Code Test Complete ===" -ForegroundColor Cyan
