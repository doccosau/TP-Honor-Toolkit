#!/usr/bin/env bash
# Honor-Tools v2.0 - 1-Click Launch Script (Linux / macOS)
cd "$(dirname "$0")"

echo "=========================================================="
echo "  HONOR-TOOLS FOR MAGICOS (v2.0 PRO) - 3uTools for Honor"
echo "  Kho Tối Ưu Hóa & Quản Trị Máy Nội Địa Trung Quốc"
echo "=========================================================="

# Detect OS
OS_NAME="$(uname -s)"
echo "[+] Hệ điều hành phát hiện: $OS_NAME"

# Check Python 3
if ! command -v python3 &> /dev/null; then
    echo "[!] Lỗi: Máy tính chưa cài đặt Python 3. Vui lòng cài Python 3 trước."
    exit 1
fi

# Check ADB
if ! command -v adb &> /dev/null; then
    echo "[*] Đang kiểm tra ADB..."
    if [ -f "./platform-tools/adb" ]; then
        export PATH="./platform-tools:$PATH"
    fi
fi

# Check Scrcpy for screen mirroring
if ! command -v scrcpy &> /dev/null; then
    echo "----------------------------------------------------------"
    echo "[?] Chưa phát hiện công cụ 'scrcpy' (Chiếu Màn Hình 120Hz)."
    if [ "$OS_NAME" = "Linux" ]; then
        read -p "Bạn có muốn tự động chạy lệnh cài đặt scrcpy và adb không? (y/n): " ans
        if [ "$ans" = "y" ] || [ "$ans" = "Y" ]; then
            if command -v apt &> /dev/null; then
                echo "[+] Đang chạy: sudo apt update && sudo apt install -y scrcpy adb"
                sudo apt update && sudo apt install -y scrcpy adb
            elif command -v pacman &> /dev/null; then
                echo "[+] Đang chạy: sudo pacman -S --noconfirm scrcpy android-tools"
                sudo pacman -S --noconfirm scrcpy android-tools
            elif command -v dnf &> /dev/null; then
                echo "[+] Đang chạy: sudo dnf install -y scrcpy android-tools"
                sudo dnf install -y scrcpy android-tools
            elif command -v snap &> /dev/null; then
                echo "[+] Đang chạy: sudo snap install scrcpy"
                sudo snap install scrcpy
            fi
        else
            echo "[i] Bỏ qua. Bạn có thể tự cài đặt qua: sudo apt install -y scrcpy adb"
        fi
    elif [ "$OS_NAME" = "Darwin" ]; then
        echo "[i] Trên macOS, bạn có thể cài đặt bằng lệnh: brew install scrcpy android-platform-tools"
    fi
    echo "----------------------------------------------------------"
fi

echo "[+] Đang khởi động hệ thống và mở giao diện ứng dụng..."
python3 honor_app.py
