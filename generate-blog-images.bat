@echo off
echo ========================================
echo  Gemini AI Blog Image Generator
echo ========================================
echo.
echo Generating images for all blog posts...
echo This may take a few minutes.
echo.
node scripts/gemini-image-generator.js
echo.
echo Press any key to exit...
pause >nul
