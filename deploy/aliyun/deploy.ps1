param(
  [Parameter(Mandatory = $false)][string]$HostIp = "47.120.27.110",
  [Parameter(Mandatory = $false)][string]$SshUser = "root",
  [Parameter(Mandatory = $false)][string]$RemoteDir = "/opt/evlease",
  [Parameter(Mandatory = $false)][string]$IdentityFile = "",
  [Parameter(Mandatory = $false)][switch]$BundleOnly
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\\..") | Select-Object -ExpandProperty Path

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing command: $name"
  }
}

Assert-Command ssh
Assert-Command scp
Assert-Command npm

$defaultKey = Join-Path $repoRoot "evlease_deploy_key"
if ([string]::IsNullOrWhiteSpace($IdentityFile) -and (Test-Path $defaultKey)) {
  $IdentityFile = $defaultKey
}

$sshArgs = @("-o", "StrictHostKeyChecking=no")
$scpArgs = @("-o", "StrictHostKeyChecking=no")
if (-not [string]::IsNullOrWhiteSpace($IdentityFile)) {
  $sshArgs += @("-i", $IdentityFile)
  $scpArgs += @("-i", $IdentityFile)
}

Write-Host "Building backend jar..." -ForegroundColor Cyan
Push-Location (Join-Path $repoRoot "services\\api")
$env:Path = (Join-Path $env:JAVA_HOME 'bin') + ';' + $env:Path
.\mvnw.cmd -DskipTests package
Pop-Location

Write-Host "Building H5/Admin static assets..." -ForegroundColor Cyan
Push-Location $repoRoot
npm run build:h5
npm run build:admin
Pop-Location

$bundleDir = Join-Path $PSScriptRoot ".bundle"
if (Test-Path $bundleDir) { Remove-Item $bundleDir -Recurse -Force }
New-Item -ItemType Directory -Path $bundleDir | Out-Null

New-Item -ItemType Directory -Path (Join-Path $bundleDir "artifacts") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $bundleDir "artifacts\\h5") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $bundleDir "artifacts\\admin") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $bundleDir "nginx") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $bundleDir "remote") | Out-Null

Copy-Item (Join-Path $PSScriptRoot "docker-compose.yml") (Join-Path $bundleDir "docker-compose.yml") -Force
Copy-Item (Join-Path $PSScriptRoot ".env.example") (Join-Path $bundleDir ".env.example") -Force
Copy-Item (Join-Path $PSScriptRoot "nginx\\h5.conf") (Join-Path $bundleDir "nginx\\h5.conf") -Force
Copy-Item (Join-Path $PSScriptRoot "nginx\\admin.conf") (Join-Path $bundleDir "nginx\\admin.conf") -Force
Copy-Item (Join-Path $PSScriptRoot "remote\\deploy.sh") (Join-Path $bundleDir "remote\\deploy.sh") -Force
Copy-Item (Join-Path $PSScriptRoot "remote\\bootstrap-ubuntu22-docker.sh") (Join-Path $bundleDir "remote\\bootstrap-ubuntu22-docker.sh") -Force

Copy-Item (Join-Path $repoRoot "services\\api\\target\\installment-api-0.0.1-SNAPSHOT.jar") (Join-Path $bundleDir "artifacts\\installment-api.jar") -Force
Copy-Item (Join-Path $repoRoot "apps\\h5\\dist\\*") (Join-Path $bundleDir "artifacts\\h5") -Recurse -Force
Copy-Item (Join-Path $repoRoot "apps\\admin\\dist\\*") (Join-Path $bundleDir "artifacts\\admin") -Recurse -Force

$tarPath = Join-Path $PSScriptRoot "bundle.tgz"
if (Test-Path $tarPath) { Remove-Item $tarPath -Force }

Write-Host "Creating bundle: $tarPath" -ForegroundColor Cyan
Push-Location $bundleDir
tar -czf $tarPath .
Pop-Location

if ($BundleOnly) {
  Write-Host "Bundle created: $tarPath" -ForegroundColor Green
  exit 0
}

$remote = "$SshUser@$HostIp"

Write-Host "Uploading bundle to $remote ..." -ForegroundColor Cyan
ssh @sshArgs $remote "mkdir -p $RemoteDir"
scp @scpArgs $tarPath "${remote}:$RemoteDir/bundle.tgz"

Write-Host "Unpacking on server (will not use port 5000)..." -ForegroundColor Cyan
ssh @sshArgs $remote "cd $RemoteDir && tar -xzf bundle.tgz && chmod +x remote/*.sh && if ! command -v docker >/dev/null 2>&1; then remote/bootstrap-ubuntu22-docker.sh; fi"

$hasEnv = (ssh @sshArgs $remote "[ -f $RemoteDir/.env ] && echo YES || echo NO").Trim()
if ($hasEnv -ne "YES") {
  Write-Host "Creating $RemoteDir/.env from .env.example (needs your edit)..." -ForegroundColor Yellow
  ssh @sshArgs $remote "cd $RemoteDir && cp .env.example .env"
  Write-Host "Edit $RemoteDir/.env on the server, set MYSQL_ROOT_PASSWORD, then run:" -ForegroundColor Yellow
  Write-Host "  bash $RemoteDir/remote/deploy.sh $RemoteDir" -ForegroundColor Yellow
  exit 0
}

Write-Host "Deploying containers..." -ForegroundColor Cyan
ssh @sshArgs $remote "bash $RemoteDir/remote/deploy.sh $RemoteDir"

Write-Host "Done." -ForegroundColor Green
Write-Host "H5:    http://$HostIp:8088" -ForegroundColor Green
Write-Host "Admin: http://$HostIp:8089" -ForegroundColor Green
