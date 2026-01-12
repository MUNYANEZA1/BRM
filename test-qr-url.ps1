# Test QR Code URL generation and format
param()

$baseUrl = "http://localhost:5000/api"

Write-Host "=== Testing QR Code URL Format ===" -ForegroundColor Cyan

# Login
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$lr = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Headers @{"Content-Type" = "application/json"} -Body $loginData -UseBasicParsing
$token = ($lr.Content | ConvertFrom-Json).data.token

$headers = @{"Authorization" = "Bearer $token"}

# Get first table
$tr = Invoke-WebRequest -Uri "$baseUrl/tables" -Method Get -Headers $headers -UseBasicParsing
$tables = ($tr.Content | ConvertFrom-Json).data.tables
$firstTable = $tables[0]

Write-Host "Table Number: $($firstTable.number)" -ForegroundColor Green

# Get QR Code
$qr = Invoke-WebRequest -Uri "$baseUrl/tables/$($firstTable._id)/qr" -Method Get -Headers $headers -UseBasicParsing
$qrData = $qr.Content | ConvertFrom-Json

Write-Host "`n=== QR Code Information ===" -ForegroundColor Cyan
Write-Host "QR Code URL: $($qrData.data.table.qrCodeUrl)" -ForegroundColor Yellow
Write-Host "QR Code ID: $($qrData.data.table.qrCode)" -ForegroundColor Yellow
Write-Host "Has Image Data: $($qrData.data.qrCodeDataUrl -ne $null)" -ForegroundColor Green

# Extract the URL that's encoded in the QR code
$qrUrl = $qrData.data.table.qrCodeUrl
Write-Host "`nQR Code will direct to: $qrUrl" -ForegroundColor Cyan

# Test if the URL is accessible
Write-Host "`nTesting URL accessibility..." -ForegroundColor Cyan
try {
    $testResponse = Invoke-WebRequest -Uri $qrUrl -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "URL is accessible!" -ForegroundColor Green
} catch {
    Write-Host "Note: URL test skipped (expected if frontend not running)" -ForegroundColor Yellow
}

Write-Host "`n=== QR Code Test Complete ===" -ForegroundColor Green
