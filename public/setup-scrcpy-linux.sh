#!/bin/bash
# TP Honor Toolkit - Linux 1-Click Protocol Setup
echo "========================================================"
echo "  TP HONOR TOOLKIT - CAI DAT KET NOI SCRCPY 120HZ 1-CLICK"
echo "========================================================"
echo ""

# Check if scrcpy is installed
if ! command -v scrcpy &>/dev/null; then
    echo "[!] Chưa tìm thấy Scrcpy. Đang cài đặt..."
    if command -v apt &>/dev/null; then
        sudo apt update && sudo apt install -y scrcpy adb
    elif command -v pacman &>/dev/null; then
        sudo pacman -S --noconfirm scrcpy android-tools
    elif command -v dnf &>/dev/null; then
        sudo dnf install -y scrcpy android-tools
    fi
else
    echo "[OK] Đã có sẵn Scrcpy tại: $(which scrcpy)"
fi

mkdir -p ~/.local/bin ~/.local/share/applications

cat << 'EOF' > ~/.local/bin/honor-scrcpy-launcher
#!/bin/bash
adb start-server >/dev/null 2>&1 || true
for i in {1..20}; do
  if adb get-state >/dev/null 2>&1; then break; fi
  sleep 0.2
done
scrcpy --max-fps=120 --video-bit-rate=16M -S -w >/dev/null 2>&1 &
EOF
chmod +x ~/.local/bin/honor-scrcpy-launcher

cat << 'EOF' > ~/.local/share/applications/honor-scrcpy.desktop
[Desktop Entry]
Name=TP Honor Scrcpy 120Hz Launcher
Comment=Launch Scrcpy 120Hz from web
Exec=/home/$USER/.local/bin/honor-scrcpy-launcher %u
Type=Application
Terminal=false
NoDisplay=true
MimeType=x-scheme-handler/scrcpy;
EOF

xdg-mime default honor-scrcpy.desktop x-scheme-handler/scrcpy
update-desktop-database ~/.local/share/applications/ 2>/dev/null || true

echo ""
echo "========================================================"
echo "[THÀNH CÔNG!] Từ giờ trở đi, trên web tphntools.pages.dev"
echo "bạn chỉ cần bấm 1-click là Scrcpy 120Hz sẽ tự động bật lên!"
echo "========================================================"
