@echo off
cd /d "%~dp0"

set "CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "CHROME=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined CHROME if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "CHROME=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if not defined CHROME (
  echo [ERROR] Chrome/Edge not found.
  pause
  exit /b 1
)

set "PROFILE=%TEMP%\cocos-web-mobile-file"
set "PAGE=%~dp0index.html"
set "PAGE=%PAGE:\=/%"

start "" "%CHROME%" --allow-file-access-from-files --user-data-dir="%PROFILE%" "file:///%PAGE%"
