@echo off
set "PATH=%PATH%;C:\Program Files\Git\cmd"
cd /d "%~dp0"
echo ========================================================
echo   Publishing to https://github.com/Kunallubhana77/Resolve-VS-Code
echo ========================================================
echo.
git remote set-url origin https://github.com/Kunallubhana77/Resolve-VS-Code.git
git branch -M main
echo Pushing code to GitHub...
git push -u origin main
echo.
echo ========================================================
if %errorlevel% equ 0 (
    echo  SUCCESS: Code published to GitHub successfully!
    echo  View at: https://github.com/Kunallubhana77/Resolve-VS-Code
) else (
    echo  Notice: If a browser window opened, click 'Authorize'
    echo  to allow Git to push to your repository.
)
echo ========================================================
echo.
pause
