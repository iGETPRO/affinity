[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ReleaseDirectory,

  [Parameter(Mandatory = $true)]
  [string]$CertificateThumbprint,

  [string]$TimestampServer = "http://timestamp.digicert.com",
  [string]$SignToolPath = "signtool.exe",
  [string]$OutputManifest = "signed-SHA256SUMS.txt"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ReleaseDirectory -PathType Container)) {
  throw "Release directory does not exist: $ReleaseDirectory"
}

$artifacts = @(
  "VectorForge-1.0.0-x64-setup.exe",
  "VectorForge-1.0.0-x64-portable.exe",
  "PhotoForge-1.0.0-x64-setup.exe",
  "PhotoForge-1.0.0-x64-portable.exe",
  "PublisherForge-1.0.0-x64-setup.exe",
  "PublisherForge-1.0.0-x64-portable.exe"
)

$certificate = Get-ChildItem -Path Cert:\CurrentUser\My, Cert:\LocalMachine\My |
  Where-Object { $_.Thumbprint -replace '\s', '' -eq ($CertificateThumbprint -replace '\s', '') } |
  Select-Object -First 1

if (-not $certificate) {
  throw "Certificate with thumbprint '$CertificateThumbprint' was not found in the current-user or local-machine certificate stores."
}

foreach ($name in $artifacts) {
  $path = Join-Path $ReleaseDirectory $name
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
    throw "Missing release artifact: $path"
  }
}

foreach ($name in $artifacts) {
  $path = Join-Path $ReleaseDirectory $name
  & $SignToolPath sign /sha1 ($certificate.Thumbprint) /fd SHA256 /tr $TimestampServer /td SHA256 /d "VectorForge 1.0.0 - $name" $path
  if ($LASTEXITCODE -ne 0) { throw "Signing failed for $name" }
}

foreach ($name in $artifacts) {
  $path = Join-Path $ReleaseDirectory $name
  & $SignToolPath verify /pa /all $path
  if ($LASTEXITCODE -ne 0) { throw "Signature verification failed for $name" }
}

$manifestPath = Join-Path $ReleaseDirectory $OutputManifest
Get-FileHash -Algorithm SHA256 ($artifacts | ForEach-Object { Join-Path $ReleaseDirectory $_ }) |
  ForEach-Object { "$($_.Hash.ToLowerInvariant())  $([IO.Path]::GetFileName($_.Path))" } |
  Set-Content -LiteralPath $manifestPath -Encoding utf8

Write-Host "Signed and verified $($artifacts.Count) artifacts."
Write-Host "Post-signing SHA-256 manifest: $manifestPath"
