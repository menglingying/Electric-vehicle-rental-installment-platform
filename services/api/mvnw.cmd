@ECHO OFF
SETLOCAL

set MAVEN_PROJECTBASEDIR=%~dp0
if "%MAVEN_PROJECTBASEDIR%"=="" set MAVEN_PROJECTBASEDIR=.
set MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%

set WRAPPER_DIR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper
set WRAPPER_JAR=%WRAPPER_DIR%\maven-wrapper.jar
set WRAPPER_PROPERTIES=%WRAPPER_DIR%\maven-wrapper.properties

if exist "%WRAPPER_JAR%" goto runmaven

for /F "usebackq tokens=1,* delims==" %%A in ("%WRAPPER_PROPERTIES%") do (
  if "%%A"=="wrapperUrl" set WRAPPER_URL=%%B
)

if "%WRAPPER_URL%"=="" (
  echo ERROR: wrapperUrl not set in %WRAPPER_PROPERTIES%
  exit /b 1
)

echo Downloading Maven Wrapper... %WRAPPER_URL%
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "& { $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile '%WRAPPER_JAR%' }"

if not exist "%WRAPPER_JAR%" (
  echo ERROR: Failed to download Maven Wrapper JAR.
  exit /b 1
)

:runmaven
set MAVEN_OPTS=%MAVEN_OPTS%

java -classpath "%WRAPPER_JAR%" ^
  "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" ^
  org.apache.maven.wrapper.MavenWrapperMain %*
exit /b %ERRORLEVEL%
