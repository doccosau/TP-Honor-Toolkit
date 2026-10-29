#!/usr/bin/env python3
"""
TP Honor Toolkit - Ultra-Lightweight Scrcpy Desktop Bridge
100% Compatible with Windows (10/11), Linux (Ubuntu/Debian/Arch/Fedora), and macOS.

Features:
1. Keeps terminal / cmd window open with live status logs.
2. Clearly explains how to stop/kill the server when done ([Ctrl + C]).
3. Auto-detects ADB device & alerts if Chrome WebUSB is locking the port.
4. Auto-launches native Scrcpy 120 FPS window on Desktop.
5. Listens at http://127.0.0.1:5050 for web app communication.
Zero dependencies - Standard Python 3 library only.
"""
import http.server
import json
import os
import shutil
import subprocess
import sys
import threading
import time
import urllib.parse
import webbrowser

PORT = 5050
HOST = '127.0.0.1'
WEB_URL = 'https://tphntools.pages.dev/'

def find_scrcpy():
    found = shutil.which('scrcpy') or shutil.which('scrcpy.exe')
    if found:
        return found

    if sys.platform == 'win32':
        candidates = [
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scrcpy', 'scrcpy.exe'),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scrcpy.exe'),
            r"C:\scrcpy\scrcpy.exe",
            r"C:\ProgramData\chocolatey\bin\scrcpy.exe",
        ]
        localappdata = os.environ.get('LOCALAPPDATA', '')
        if localappdata:
            winget_pkg = os.path.join(localappdata, 'Microsoft', 'WinGet', 'Packages')
            if os.path.isdir(winget_pkg):
                try:
                    for root, dirs, files in os.walk(winget_pkg):
                        if 'scrcpy.exe' in files:
                            return os.path.join(root, 'scrcpy.exe')
                except Exception:
                    pass
        for c in candidates:
            if os.path.isfile(c):
                return c
    else:
        candidates = [
            '/usr/local/bin/scrcpy',
            '/usr/bin/scrcpy',
            '/snap/bin/scrcpy',
            '/opt/homebrew/bin/scrcpy',
            '/usr/local/Homebrew/bin/scrcpy',
        ]
        for c in candidates:
            if os.path.isfile(c):
                return c

    return 'scrcpy'

def check_adb_devices():
    adb_bin = shutil.which('adb') or 'adb'
    try:
        subprocess.run([adb_bin, 'start-server'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=4)
        res = subprocess.run([adb_bin, 'devices'], capture_output=True, text=True, timeout=3)
        lines = [line.strip() for line in res.stdout.strip().split('\n')[1:] if line.strip()]
        devices = [l.split()[0] for l in lines if '\tdevice' in l or ' device' in l]
        return devices
    except Exception:
        return []

def launch_scrcpy_process(turn_off_screen=True, stay_awake=True):
    scrcpy_bin = find_scrcpy()
    devices = check_adb_devices()

    if not devices:
        print("\n" + "=" * 66)
        print(" [!] CHƯA PHÁT HIỆN THIẾT BỊ TRÊN ADB!")
        print("=" * 66)
        print(" 💡 NGUYÊN NHÂN CHÍNH:")
        print(" 1. Nếu bạn đang mở web https://tphntools.pages.dev/ và đã bấm 'Kết nối WebUSB':")
        print("    -> Trình duyệt Chrome đang chiếm giữ độc quyền cổng USB của điện thoại.")
        print("    👉 HÃY BẤM NÚT [NGẮT KẾT NỐI] TRÊN THANH TIÊU ĐỀ WEB để nhả cổng USB cho Scrcpy!")
        print(" 2. Hoặc trên điện thoại chưa bật 'Gỡ lỗi USB' (USB Debugging).")
        print("=" * 66 + "\n")
        return False

    cmd = [scrcpy_bin, '--max-fps=120', '--video-bit-rate=16M']
    if turn_off_screen:
        cmd.append('-S')
    if stay_awake:
        cmd.append('-w')

    print(f"\n[Scrcpy] >> Đang mở cửa sổ 120 FPS cho thiết bị: {devices[0]}...")
    print(f"[Scrcpy] Lệnh: {' '.join(cmd)}")
    try:
        if sys.platform == 'win32':
            subprocess.Popen(
                cmd,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP | 0x00000008,
            )
        else:
            subprocess.Popen(
                cmd,
                start_new_session=True,
            )
        print("[Scrcpy] [OK] ĐÃ BẬT CỬA SỔ CHIẾU MÀN HÌNH 120 FPS LÊN DESKTOP THÀNH CÔNG!\n")
        return True
    except Exception as e:
        print(f"[Scrcpy] [!] Lỗi mở Scrcpy: {e}\n")
        return False

class BridgeHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, *')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path in ('/api/env', '/api/bridge/status'):
            scrcpy_bin = find_scrcpy()
            devices = check_adb_devices()
            data = {
                'success': True,
                'bridge': 'active',
                'os': sys.platform,
                'scrcpy_path': scrcpy_bin,
                'devices': devices,
                'has_device': len(devices) > 0,
            }
            self.send_json(data)
        else:
            self.send_json({'bridge': 'active', 'message': 'TP Honor Scrcpy Bridge running'}, status=200)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/action':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                payload = json.loads(body.decode('utf-8'))
                action = payload.get('action')
                if action == 'launch_scrcpy':
                    turn_off = payload.get('turn_off_screen', True)
                    stay_awake = payload.get('stay_awake', True)
                    ok = launch_scrcpy_process(turn_off, stay_awake)
                    if ok:
                        self.send_json({'success': True, 'message': 'Đã mở Scrcpy 120Hz trên Desktop!'})
                    else:
                        self.send_json({'success': False, 'message': 'Chưa nhận diện thiết bị qua ADB. Kiểm tra USB Debugging hoặc ngắt WebUSB.'})
                    return
            except Exception as e:
                self.send_json({'success': False, 'error': str(e)}, status=500)
                return
        self.send_json({'error': 'Not found'}, status=404)

    def send_json(self, data, status=200):
        try:
            body = json.dumps(data, ensure_ascii=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, *')
            self.send_header('Access-Control-Allow-Private-Network', 'true')
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def log_message(self, format, *args):
        # Clean formatted logging for API hits
        pass

if __name__ == '__main__':
    os_name = "Windows (cmd/powershell)" if sys.platform == "win32" else "macOS" if sys.platform == "darwin" else "Linux (terminal)"
    print("\n" + "=" * 66)
    print(f"  TP HONOR TOOLKIT - LOCAL SCRCPY BRIDGE ({os_name})")
    print("=" * 66)
    print(f"[+] Máy chủ cầu nối: http://{HOST}:{PORT}")
    print(f"[+] Tên miền web liên kết: {WEB_URL}")
    print("[+] Trạng thái: Cửa sổ Terminal này ĐANG CHẠY CẦU NỐI.")
    print("-" * 66)
    print("🛑 ĐỂ DỪNG MÁY CHỦ KHI DÙNG XONG:")
    print("   Bấm tổ hợp phím [Ctrl + C] trong cửa sổ này, hoặc tắt cửa sổ này!")
    print("=" * 66 + "\n")

    # 1. Thử mở Scrcpy ngay khi khởi động
    threading.Thread(target=lambda: (time.sleep(0.4), launch_scrcpy_process()), daemon=True).start()

    # 2. Khởi động server cầu nối HTTP tại 127.0.0.1:5050
    try:
        server = http.server.ThreadingHTTPServer((HOST, PORT), BridgeHandler)
        print(f"[OK] Cầu nối đang lắng nghe lệnh từ trang web tại cổng {PORT}...")
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n[!] Đã nhận tín hiệu dừng [Ctrl + C].")
        print("[!] Đã tắt máy chủ cầu nối thành công. Tạm biệt!\n")
    except OSError as e:
        if 'Address already in use' in str(e) or 'address is already in use' in str(e).lower():
            print(f"[i] Cổng {PORT} đã có tiến trình khác đang chạy.")
            launch_scrcpy_process()
        else:
            print(f"[!] Lỗi cổng {PORT}: {e}")
