param(
  [string]$DestDir = "$env:USERPROFILE\.openclaw\extensions\superpowers"
)

$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "[install] source: $RootDir"
Write-Host "[install] dest:   $DestDir"

New-Item -ItemType Directory -Force (Split-Path $DestDir -Parent) | Out-Null

if (Test-Path $DestDir) {
  $BackupDir = "$DestDir.bak.$Timestamp"
  Write-Host "[install] backing up existing dest to: $BackupDir"
  Move-Item -Force $DestDir $BackupDir
}

New-Item -ItemType Directory -Force $DestDir | Out-Null

# Copy everything except .git
Get-ChildItem -Force $RootDir | ForEach-Object {
  if ($_.Name -eq ".git") { return }
  Copy-Item -Recurse -Force $_.FullName (Join-Path $DestDir $_.Name)
}

Write-Host "[install] enabling plugin"
openclaw plugins enable superpowers

Write-Host "[install] validating config"
openclaw config validate

Write-Host "[install] done"

