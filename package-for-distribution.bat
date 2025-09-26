@echo off
echo Packaging Desktop Tracker for distribution...
echo.

echo Creating Windows distribution package...
powershell -Command "Compress-Archive -Path 'dist-packager\Desktop Tracker-win32-x64' -DestinationPath 'Desktop-Tracker-Windows.zip' -Force"
if exist "Desktop-Tracker-Windows.zip" echo ✅ Windows package created: Desktop-Tracker-Windows.zip

echo.
echo Creating macOS Intel distribution package...
powershell -Command "Compress-Archive -Path 'dist-mac\Desktop Tracker-darwin-x64' -DestinationPath 'Desktop-Tracker-macOS-Intel.zip' -Force"
if exist "Desktop-Tracker-macOS-Intel.zip" echo ✅ macOS Intel package created: Desktop-Tracker-macOS-Intel.zip

echo.
echo Creating macOS Apple Silicon distribution package...
powershell -Command "Compress-Archive -Path 'dist-mac\Desktop Tracker-darwin-arm64' -DestinationPath 'Desktop-Tracker-macOS-Silicon.zip' -Force"
if exist "Desktop-Tracker-macOS-Silicon.zip" echo ✅ macOS Silicon package created: Desktop-Tracker-macOS-Silicon.zip

echo.
echo ================================================
echo Your distribution packages are ready!
echo ================================================
echo.
echo Windows: Desktop-Tracker-Windows.zip
echo macOS Intel: Desktop-Tracker-macOS-Intel.zip  
echo macOS Apple Silicon: Desktop-Tracker-macOS-Silicon.zip
echo.
echo File sizes:
for %%f in (*.zip) do echo %%f: %%~zf bytes
echo.
echo Ready to upload to cloud storage or send via email!
echo.
pause 