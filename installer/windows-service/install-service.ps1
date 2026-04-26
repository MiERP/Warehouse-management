param(
  [string]$ServiceName = "WarehouseManagement",
  [string]$DisplayName = "Warehouse Management",
  [string]$InstallDir = "$PSScriptRoot\..",
  [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
$exePath = Join-Path $InstallDir "backend\warehouse-api.exe"
$configDir = Join-Path $env:ProgramData "WarehouseManagement"
$configPath = Join-Path $configDir "app.env"

if (!(Test-Path $exePath)) { throw "Backend executable not found: $exePath" }
New-Item -ItemType Directory -Force -Path $configDir | Out-Null
if (!(Test-Path $configPath)) {
  @"
WAREHOUSE_HOST=127.0.0.1
WAREHOUSE_PORT=$Port
WAREHOUSE_DATABASE_URL=sqlite:///$($configDir.Replace('\\','/'))/warehouse.db
"@ | Set-Content -Path $configPath -Encoding UTF8
}

$binaryPath = "`"$exePath`" --host 127.0.0.1 --port $Port --env-file `"$configPath`""
if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
  Stop-Service -Name $ServiceName -ErrorAction SilentlyContinue
  sc.exe delete $ServiceName | Out-Null
  Start-Sleep -Seconds 2
}

New-Service -Name $ServiceName -DisplayName $DisplayName -BinaryPathName $binaryPath -StartupType Automatic | Out-Null
Start-Service -Name $ServiceName
Write-Host "Installed and started $ServiceName"
