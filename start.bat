@echo off
echo ========================================
echo Video Summarizer - Quick Setup
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Edit .env file and add your API keys!
    echo Press any key after editing .env...
    pause
)

echo.
echo Starting Docker containers...
docker-compose up --build

pause
