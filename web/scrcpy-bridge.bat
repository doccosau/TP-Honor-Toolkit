@echo off
title TP Honor - Scrcpy Desktop Bridge
cd /d "%~dp0"
python scrcpy_bridge.py
if %errorlevel% neq 0 (
    py scrcpy_bridge.py
)
if %errorlevel% neq 0 (
    echo [!] Chua tim thay Python. Vui long cai Python tu python.org hoac Microsoft Store.
    pause
)
