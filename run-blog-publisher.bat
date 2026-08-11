@echo off
echo ========================================
echo   Blog Auto-Publisher
echo   Running now...
echo ========================================
echo.

powershell.exe -ExecutionPolicy Bypass -File "D:\xampp\htdocs\portfolio\blog-publisher.ps1"

echo.
echo ========================================
echo   Press any key to exit...
echo ========================================
pause >nul