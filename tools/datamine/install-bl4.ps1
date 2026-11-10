# Build pinned bl4-cli into tools/bin/. Never auto-updates the pin.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $Root) { $Root = Resolve-Path (Join-Path $PSScriptRoot "../..") }
$PinTag = "v0.8.5"
$PinCommit = "ae17c6dc5432364b05933f3a6ceeb739b2b52b07"
$Vendor = Join-Path $Root "tools/vendor/bl4"
$BinDir = Join-Path $Root "tools/bin"
New-Item -ItemType Directory -Force -Path $BinDir, (Join-Path $Root "tools/vendor") | Out-Null

if (-not (Test-Path (Join-Path $Vendor ".git"))) {
  git clone --depth 1 --branch $PinTag https://github.com/monokrome/bl4.git $Vendor
}
Push-Location $Vendor
try {
  $head = (git rev-parse HEAD).Trim()
  if ($head -ne $PinCommit) {
    Write-Warning "HEAD $head != pinned $PinCommit (tag $PinTag)"
  }
  cargo build --release -p bl4-cli
  $exe = Join-Path $Vendor "target/release/bl4.exe"
  $unix = Join-Path $Vendor "target/release/bl4"
  if (Test-Path $exe) {
    Copy-Item $exe (Join-Path $BinDir "bl4.exe") -Force
    Write-Host "Installed $(Join-Path $BinDir 'bl4.exe')"
  } elseif (Test-Path $unix) {
    Copy-Item $unix (Join-Path $BinDir "bl4") -Force
    Write-Host "Installed $(Join-Path $BinDir 'bl4')"
  } else {
    throw "bl4 binary not found under target/release/"
  }
} finally {
  Pop-Location
}
