@echo off
chcp 65001 >nul
echo ========================================================
echo   TP HONOR TOOLKIT - CAI DAT KET NOI SCRCPY 120HZ 1-CLICK
echo ========================================================
echo.

where scrcpy >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] May tinh chua co Scrcpy. Dang tu dong cai dat qua winget...
    winget install Genymobile.scrcpy --accept-package-agreements --accept-source-agreements
) else (
    echo [OK] May tinh da co san Scrcpy!
)

echo.
echo Dang dang ky giao thuc scrcpy:// de web tphntools.pages.dev tu dong mo Scrcpy...
reg add "HKCU\Software\Classes\scrcpy" /ve /d "URL:Scrcpy 120Hz Protocol" /f >nul
reg add "HKCU\Software\Classes\scrcpy" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\Software\Classes\scrcpy\shell\open\command" /ve /d "cmd /c start \"\" scrcpy.exe --max-fps=120 --video-bit-rate=16M -S -w" /f >nul

echo.
echo ========================================================
echo [THANH CONG!] Tu gio tro di, tren web tphntools.pages.dev
echo ban chi can bam 1-click la Scrcpy 120Hz se tu dong bat len!
echo ========================================================
echo.
pause
