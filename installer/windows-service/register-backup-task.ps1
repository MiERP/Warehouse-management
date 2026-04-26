param(
  [string]$TaskName = "WarehouseManagementBackup",
  [string]$InstallDir = "$PSScriptRoot\..",
  [string]$DatabasePath = "$env:ProgramData\WarehouseManagement\warehouse.db",
  [string]$BackupDir = "$env:ProgramData\WarehouseManagement\backups",
  [string]$At = "02:00"
)

$ErrorActionPreference = "Stop"
$scriptPath = Join-Path $InstallDir "scripts\backup-sqlite.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -DatabasePath `"$DatabasePath`" -BackupDir `"$BackupDir`""
$trigger = New-ScheduledTaskTrigger -Daily -At $At
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Description "Warehouse Management SQLite backup" -Force | Out-Null
Write-Host "Registered scheduled backup task $TaskName at $At"
