param(
  [string]$DatabasePath = "$env:ProgramData\WarehouseManagement\warehouse.db",
  [string]$BackupDir = "$env:ProgramData\WarehouseManagement\backups"
)

$ErrorActionPreference = "Stop"
if (!(Test-Path $DatabasePath)) { throw "Database not found: $DatabasePath" }
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$target = Join-Path $BackupDir "warehouse-$timestamp.db"
Copy-Item -Path $DatabasePath -Destination $target -Force
Write-Host "Created backup $target"
