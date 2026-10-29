@echo off
title HONOR-TOOLS FOR MAGICOS v2.0 PRO
cd /d "%~dp0"

echo ==========================================================
echo   HONOR-TOOLS FOR MAGICOS (v2.0 PRO) - 3uTools for Honor
echo   Kho Toi Uu Hoa ^& Quan Tri May Noi Dia Trung Quoc
echo ==========================================================

echo [+] He dieu hanh: Windows (x64)
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Loi: Chua tim thay Python. Vui long cai Python tu python.org hoac Microsoft Store.
    pause
    exit /b 1
)

where adb >nul 2>nul
if %errorlevel% neq 0 (
    if exist "platform-tools\adb.exe" (
        set "PATH=%~dp0platform-tools;%PATH%"
    ) else if exist "scrcpy\adb.exe" (
        set "PATH=%~dp0scrcpy;%PATH%"
    )
)

if exist "scrcpy\scrcpy.exe" (
    set "PATH=%~dp0scrcpy;%PATH%"
) else if exist "scrcpy-win64\scrcpy.exe" (
    set "PATH=%~dp0scrcpy-win64;%PATH%"
)

where scrcpy >nul 2>nul
if %errorlevel% neq 0 (
    if not exist "scrcpy\scrcpy.exe" if not exist "scrcpy-win64\scrcpy.exe" (
        echo ----------------------------------------------------------
        echo [?] Chua phat hien bo cong cu Scrcpy ^& ADB (Chieu Man Hinh 120Hz).
        echo [?] He thong co the tu dong tai goi Scrcpy chinh hang tu GitHub.
        set /p "INSTALL_SCRCPY=Ban co muon tu dong tai va cai dat Scrcpy ngay bay gio khong? (Y/N): "
        if /i "%INSTALL_SCRCPY%"=="Y" (
            echo [+] Dang tu dong tai Scrcpy Windows tu GitHub...
            powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $url = 'https://github.com/Genymobile/scrcpy/releases/download/v5.0.1/scrcpy-win64-v5.0.1.zip'; Invoke-WebRequest -Uri $url -OutFile 'scrcpy_win.zip'; Expand-Archive -Path 'scrcpy_win.zip' -DestinationPath 'scrcpy_temp'; if (Test-Path 'scrcpy_temp\scrcpy-win64*') { Move-Item -Path 'scrcpy_temp\scrcpy-win64*' -Destination 'scrcpy' } else { Move-Item -Path 'scrcpy_temp' -Destination 'scrcpy' }; Remove-Item 'scrcpy_win.zip' -Force; Remove-Item 'scrcpy_temp' -Recurse -Force -ErrorAction SilentlyContinue"
            if exist "scrcpy\scrcpy.exe" (
                echo [OK] Da cai dat Scrcpy ^& ADB thanh cong vao thu muc scrcpy!
                set "PATH=%~dp0scrcpy;%PATH%"
            ) else (
                echo [!] Khong the giai nen tu dong. Ban co the cai thu cong bang: winget install Genymobile.scrcpy
            )
        ) else (
            echo [i] Bo qua. Ban co the cai thu cong qua lenh: winget install Genymobile.scrcpy
        )
        echo ----------------------------------------------------------
    )
)

echo [+] Dang khoi chay Honor-Tools backend va mo trinh duyet...
python honor_app.py
pause
