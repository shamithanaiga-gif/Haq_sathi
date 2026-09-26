@echo off
setlocal
cd /d "%~dp0"

echo ======================================================================
echo   Deploying Haq Saathi Backend to Fly.io (Mumbai - BOM)
echo ======================================================================

set FLY_BIN=%USERPROFILE%\.fly\bin\flyctl.exe
if not exist "%FLY_BIN%" (
    set FLY_BIN=flyctl
)

echo.
echo [Step 1/3] Checking Fly.io Authentication...
"%FLY_BIN%" auth whoami >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Opening browser for Fly.io login...
    "%FLY_BIN%" auth login
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Authentication failed.
        pause
        exit /b 1
    )
)
echo [OK] Authenticated with Fly.io!

echo.
echo [Step 2/3] Checking/Creating Persistent Volume (haq_saathi_data)...
"%FLY_BIN%" volumes list -a haq-saathi-backend 2>nul | findstr /I "haq_saathi_data" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Creating 1GB persistent volume in Mumbai (bom)...
    "%FLY_BIN%" volumes create haq_saathi_data --size 1 --region bom -a haq-saathi-backend --yes
) else (
    echo [OK] Volume 'haq_saathi_data' already exists.
)

echo.
echo [Step 3/3] Deploying FastAPI Backend Container...
"%FLY_BIN%" deploy --ha=false

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo   Deployment Succeeded!
    echo   Live Backend URL: https://haq-saathi-backend.fly.dev
    echo   Health Endpoint:  https://haq-saathi-backend.fly.dev/api/schemes
    echo ======================================================================
) else (
    echo.
    echo [ERROR] Deployment encountered an error above.
)

pause
