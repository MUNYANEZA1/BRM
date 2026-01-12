# Script to create test tables
param()

$baseUrl = "http://localhost:5000/api"

# First, login to get token
Write-Host "Getting authentication token..." -ForegroundColor Cyan

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

Write-Host "Token obtained!" -ForegroundColor Green

# Create tables
$tables = @(
    @{number = "1"; capacity = 2; location = "indoor"; notes = "Corner table near window"},
    @{number = "2"; capacity = 2; location = "indoor"; notes = "Center indoor"},
    @{number = "3"; capacity = 4; location = "indoor"; notes = "Large indoor table"},
    @{number = "4"; capacity = 4; location = "indoor"; notes = "Family table"},
    @{number = "5"; capacity = 6; location = "vip"; notes = "VIP table"},
    @{number = "6"; capacity = 2; location = "bar"; notes = "Bar seating"},
    @{number = "7"; capacity = 4; location = "outdoor"; notes = "Outdoor patio"},
    @{number = "8"; capacity = 6; location = "outdoor"; notes = "Large outdoor"},
    @{number = "9"; capacity = 8; location = "private"; notes = "Private room"},
    @{number = "10"; capacity = 2; location = "bar"; notes = "Bar counter"}
)

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "`nCreating $($tables.Count) test tables..." -ForegroundColor Cyan

foreach ($table in $tables) {
    $tableData = $table | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/tables" `
            -Method Post `
            -Headers $headers `
            -Body $tableData `
            -UseBasicParsing
        
        Write-Host "Created table $($table.number)" -ForegroundColor Green
    } catch {
        Write-Host "Failed to create table $($table.number): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nVerifying tables were created..." -ForegroundColor Cyan

$tablesResponse = Invoke-WebRequest -Uri "$baseUrl/tables" `
    -Method Get `
    -Headers $headers `
    -UseBasicParsing

$result = $tablesResponse.Content | ConvertFrom-Json

Write-Host "Total tables in database: $($result.data.tables.Count)" -ForegroundColor Green

$result.data.tables | ForEach-Object {
    Write-Host "  Table $($_.number) - $($_.location) - Capacity: $($_.capacity)" -ForegroundColor Yellow
}

Write-Host "`nDone! You can now see the tables on the frontend." -ForegroundColor Cyan
