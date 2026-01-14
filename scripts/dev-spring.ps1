$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Ensure-Java {
  $java = Get-Command java -ErrorAction SilentlyContinue
  if ($java) { return }

  if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME 'bin\\java.exe'))) {
    $env:Path = (Join-Path $env:JAVA_HOME 'bin') + ';' + $env:Path
    $java = Get-Command java -ErrorAction SilentlyContinue
    if ($java) { return }
  }

  throw "未找到 java，请先配置 JAVA_HOME 并把 %JAVA_HOME%\\bin 加入 PATH（例如 D:\\jdk-17.0.2\\bin）。"
}

Ensure-Java

Set-Location (Join-Path $repoRoot 'services\\api')

Write-Host "Building Spring Boot (skip tests)..." -ForegroundColor Cyan
.\mvnw.cmd -DskipTests package

Write-Host "Starting Spring Boot on http://localhost:8080 (dev profile)..." -ForegroundColor Cyan
java -jar .\target\installment-api-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev
