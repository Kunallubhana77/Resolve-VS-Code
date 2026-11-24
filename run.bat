@echo off
title Resolve All-in-One Runner
echo ========================================================
echo         Resolve - Ticket Management System
echo                 All-in-One Launcher
echo ========================================================
echo.

cd /d "%~dp0"
if exist "Resolve-VS-Code" (
    cd "Resolve-VS-Code"
)

echo [1/3] Checking / Starting Web Server (Port 3000)...
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% neq 0 (
    start "Resolve Web Server" /min python -m http.server 3000
    echo   -^> Web server started at http://localhost:3000
) else (
    echo   -^> Web server is already running on port 3000
)

echo [2/3] Opening Web Interface in your Browser...
start "" "http://localhost:3000"

echo [3/3] Launching DSA Console Program...
where g++ >nul 2>&1
if %errorlevel% equ 0 (
    echo   -^> Found g++ compiler. Compiling C++ code...
    g++ -std=c++17 -Wall -Wextra -pedantic cpp\complaint_system.cpp -o complaint-system.exe
    start "Resolve DSA System (C++)" complaint-system.exe
) else (
    echo   -^> g++ not found. Starting DSA console via Python...
    start "Resolve DSA System (Console)" python cpp\complaint_system.py
)

echo.
echo ========================================================
echo  All systems launched successfully!
echo  - Web App: http://localhost:3000
echo  - Console: Running in separate interactive window
echo ========================================================
echo.
pause
