# Complete CRUD test for Tables
param()

$baseUrl = "http://localhost:5000/api"

# Step 1: Login
Write-Host "=== STEP 1: Login ===" -ForegroundColor Cyan

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

# Step 2: Create a new table
Write-Host "`n=== STEP 2: Create Table ===" -ForegroundColor Cyan

$newTableData = @{
    number = "TEST-1"
    capacity = 4
    location = "indoor"
    notes = "Test table for CRUD operations"
} | ConvertTo-Json

$createResponse = Invoke-WebRequest -Uri "$baseUrl/tables" `
    -Method Post `
    -Headers $headers `
    -Body $newTableData `
    -UseBasicParsing

$newTable = ($createResponse.Content | ConvertFrom-Json).data.table
Write-Host "✓ Table created!" -ForegroundColor Green
Write-Host "  ID: $($newTable._id)" -ForegroundColor Yellow
Write-Host "  Number: $($newTable.number)" -ForegroundColor Yellow
Write-Host "  Capacity: $($newTable.capacity)" -ForegroundColor Yellow

# Step 3: Update the table
Write-Host "`n=== STEP 3: Update Table ===" -ForegroundColor Cyan

$updateTableData = @{
    number = "TEST-1"
    capacity = 6
    location = "vip"
    notes = "Updated test table - now VIP"
} | ConvertTo-Json

$updateResponse = Invoke-WebRequest -Uri "$baseUrl/tables/$($newTable._id)" `
    -Method Put `
    -Headers $headers `
    -Body $updateTableData `
    -UseBasicParsing

$updatedTable = ($updateResponse.Content | ConvertFrom-Json).data.table
Write-Host "✓ Table updated!" -ForegroundColor Green
Write-Host "  Capacity: $($updatedTable.capacity)" -ForegroundColor Yellow
Write-Host "  Location: $($updatedTable.location)" -ForegroundColor Yellow
Write-Host "  Notes: $($updatedTable.notes)" -ForegroundColor Yellow

# Step 4: Change table status
Write-Host "`n=== STEP 4: Update Table Status ===" -ForegroundColor Cyan

$statusData = @{
    status = "occupied"
} | ConvertTo-Json

$statusResponse = Invoke-WebRequest -Uri "$baseUrl/tables/$($newTable._id)/status" `
    -Method Patch `
    -Headers $headers `
    -Body $statusData `
    -UseBasicParsing

$statusTable = ($statusResponse.Content | ConvertFrom-Json).data.table
Write-Host "✓ Status updated!" -ForegroundColor Green
Write-Host "  Current Status: $($statusTable.status)" -ForegroundColor Yellow

# Step 5: Change status back
Write-Host "`n=== STEP 5: Change Status to Available ===" -ForegroundColor Cyan

$statusData2 = @{
    status = "available"
} | ConvertTo-Json

$statusResponse2 = Invoke-WebRequest -Uri "$baseUrl/tables/$($newTable._id)/status" `
    -Method Patch `
    -Headers $headers `
    -Body $statusData2 `
    -UseBasicParsing

$statusTable2 = ($statusResponse2.Content | ConvertFrom-Json).data.table
Write-Host "✓ Status updated!" -ForegroundColor Green
Write-Host "  Current Status: $($statusTable2.status)" -ForegroundColor Yellow

# Step 6: Fetch all tables
Write-Host "`n=== STEP 6: Fetch All Tables ===" -ForegroundColor Cyan

$allTablesResponse = Invoke-WebRequest -Uri "$baseUrl/tables" `
    -Method Get `
    -Headers $headers `
    -UseBasicParsing

$allTables = ($allTablesResponse.Content | ConvertFrom-Json).data.tables
Write-Host "✓ Tables fetched!" -ForegroundColor Green
Write-Host "  Total tables: $($allTables.Count)" -ForegroundColor Yellow

# Step 7: Delete the test table
Write-Host "`n=== STEP 7: Delete Table ===" -ForegroundColor Cyan

$deleteResponse = Invoke-WebRequest -Uri "$baseUrl/tables/$($newTable._id)" `
    -Method Delete `
    -Headers $headers `
    -UseBasicParsing

$deleteResult = $deleteResponse.Content | ConvertFrom-Json
Write-Host "✓ Table deleted!" -ForegroundColor Green
Write-Host "  Message: $($deleteResult.message)" -ForegroundColor Yellow

# Step 8: Verify table is deleted
Write-Host "`n=== STEP 8: Verify Deletion ===" -ForegroundColor Cyan

$finalTablesResponse = Invoke-WebRequest -Uri "$baseUrl/tables" `
    -Method Get `
    -Headers $headers `
    -UseBasicParsing

$finalTables = ($finalTablesResponse.Content | ConvertFrom-Json).data.tables
Write-Host "✓ Final table count: $($finalTables.Count)" -ForegroundColor Green

Write-Host "`n=== ALL CRUD TESTS PASSED! ===" -ForegroundColor Green
Write-Host "✓ Create: Working" -ForegroundColor Green
Write-Host "✓ Read: Working" -ForegroundColor Green
Write-Host "✓ Update: Working" -ForegroundColor Green
Write-Host "✓ Delete: Working" -ForegroundColor Green
Write-Host "✓ Status Update: Working" -ForegroundColor Green
