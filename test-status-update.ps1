# Test table status update
param()

$baseUrl = "http://localhost:5000/api"

Write-Host "=== Testing Table Status Update ===" -ForegroundColor Cyan

# Step 1: Login
Write-Host "`nStep 1: Login" -ForegroundColor Yellow
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$lr = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Headers @{"Content-Type" = "application/json"} -Body $loginData -UseBasicParsing
$token = ($lr.Content | ConvertFrom-Json).data.token
Write-Host "✓ Logged in successfully" -ForegroundColor Green

$headers = @{"Authorization" = "Bearer $token"}

# Step 2: Get a table
Write-Host "`nStep 2: Get first table" -ForegroundColor Yellow
$tr = Invoke-WebRequest -Uri "$baseUrl/tables" -Method Get -Headers $headers -UseBasicParsing
$tables = ($tr.Content | ConvertFrom-Json).data.tables
$table = $tables[0]

Write-Host "Table: $($table.number) (ID: $($table._id))" -ForegroundColor Green
Write-Host "Current Status: $($table.status)" -ForegroundColor Yellow

# Step 3: Update status using PATCH /tables/:id/status
Write-Host "`nStep 3: Update status to 'occupied' using PATCH" -ForegroundColor Yellow
$statusData = @{ status = "occupied" } | ConvertTo-Json

$sr = Invoke-WebRequest -Uri "$baseUrl/tables/$($table._id)/status" `
    -Method Patch `
    -Headers $headers `
    -Body $statusData `
    -UseBasicParsing

$updatedTable = ($sr.Content | ConvertFrom-Json).data.table
Write-Host "✓ Status updated to: $($updatedTable.status)" -ForegroundColor Green

# Step 4: Verify the change
Write-Host "`nStep 4: Verify status change" -ForegroundColor Yellow
$vr = Invoke-WebRequest -Uri "$baseUrl/tables/$($table._id)" -Method Get -Headers $headers -UseBasicParsing
$verifyTable = ($vr.Content | ConvertFrom-Json).data.table
Write-Host "Verified Status: $($verifyTable.status)" -ForegroundColor Green

if ($verifyTable.status -eq "occupied") {
    Write-Host "`n✓ SUCCESS: Table status updated correctly!" -ForegroundColor Green
} else {
    Write-Host "`n✗ FAILED: Status did not update properly" -ForegroundColor Red
}

# Step 5: Change back to available
Write-Host "`nStep 5: Change status back to 'available'" -ForegroundColor Yellow
$statusData2 = @{ status = "available" } | ConvertTo-Json

$sr2 = Invoke-WebRequest -Uri "$baseUrl/tables/$($table._id)/status" `
    -Method Patch `
    -Headers $headers `
    -Body $statusData2 `
    -UseBasicParsing

$finalTable = ($sr2.Content | ConvertFrom-Json).data.table
Write-Host "✓ Status changed back to: $($finalTable.status)" -ForegroundColor Green

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
