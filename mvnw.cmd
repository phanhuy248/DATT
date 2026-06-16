@echo off
setlocal

set "BASE_DIR=%~dp0"
if "%BASE_DIR:~-1%"=="\" set "BASE_DIR=%BASE_DIR:~0,-1%"

if not "%JAVA_HOME%"=="" goto useJavaHome
for /f "delims=" %%I in ('where java 2^>nul') do (
  set "MAVEN_JAVA_EXE=%%I"
  goto foundJava
)
echo Error: JAVA_HOME is not set and java.exe was not found in PATH. >&2
exit /b 1

:useJavaHome
set "MAVEN_JAVA_EXE=%JAVA_HOME%\bin\java.exe"

:foundJava
if exist "%MAVEN_JAVA_EXE%" goto runWrapper
echo Error: Java executable not found: "%MAVEN_JAVA_EXE%" >&2
exit /b 1

:runWrapper
set "MAVEN_PROJECTBASEDIR=%BASE_DIR%"
set "MAVEN_CMD_LINE_ARGS=%*"
set "WRAPPER_JAR=%BASE_DIR%\.mvn\wrapper\maven-wrapper.jar"

if exist "%WRAPPER_JAR%" goto launch
echo Error: Maven wrapper jar not found: "%WRAPPER_JAR%" >&2
exit /b 1

:launch
"%MAVEN_JAVA_EXE%" %MAVEN_OPTS% -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" org.apache.maven.wrapper.MavenWrapperMain %*
exit /b %ERRORLEVEL%
