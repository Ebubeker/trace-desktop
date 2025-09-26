@echo off
echo Building your desktop app...
echo.

rem Kill any hanging processes
taskkill /f /im "electron.exe" /t >nul 2>&1
taskkill /f /im "node.exe" /t >nul 2>&1

rem Clean and build
echo Step 1: Cleaning...
if exist "dist-simple" rmdir /s /q "dist-simple"

echo Step 2: Building React app...
call npm run build

echo Step 3: Packaging with electron-packager...
call npx electron-packager . "Desktop Tracker" --platform=win32 --arch=x64 --out=dist-simple --overwrite

echo.
if exist "dist-simple" (
    echo SUCCESS! Your app is ready in the dist-simple folder
    echo You can run: dist-simple\Desktop Tracker-win32-x64\Desktop Tracker.exe
) else (
    echo Build failed. Check the output above for errors.
)

echo.
pause 