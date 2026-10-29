#!/usr/bin/env python3
"""
TP Honor Toolkit - Ultra-Lightweight Scrcpy Desktop Bridge
100% Compatible with Windows (10/11), Linux (Ubuntu/Debian/Arch/Fedora), and macOS.

Features:
1. Automatically launches native Scrcpy 120 FPS window on Desktop immediately!
2. Automatically starts local HTTP bridge at http://127.0.0.1:5050
3. Automatically opens browser to https://tphntools.pages.dev/
4. Stays running in background so the web app can re-trigger or control Scrcpy anytime.
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
    # 1. Check in PATH
    found = shutil.which('scrcpy') or shutil.which('scrcpy.exe')
    if found:
        return found

    # 2. Check Windows specific candidate paths
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

    # 3. Check Linux / macOS specific candidate paths
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

def launch_scrcpy_process(turn_off_screen=True, stay_awake=True):
    scrcpy_bin = find_scrcpy()
    cmd = [scrcpy_bin, '--max-fps=120', '--video-bit-rate=16M']
    if turn_off_screen:
        cmd.append('-S')
    if stay_awake:
        cmd.append('-w')

    print(f"[Bridge] >> Đang mở cửa sổ Scrcpy 120Hz trên Desktop: {' '.join(cmd)}")
    try:
        if sys.platform == 'win32':
            # Create detached process on Windows so it doesn't block the bridge
            subprocess.Popen(
                cmd,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP | 0x00000008,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        else:
            subprocess.Popen(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True,
            )
        print("[Bridge] [OK] Đã mở cửa sổ Scrcpy 120 FPS lên Desktop thành công!")
        return True
    except Exception as e:
        print(f"[Bridge] [!] Lỗi khởi chạy Scrcpy: {e}")
        if sys.platform == 'win32':
            print("[Bridge] Gợi ý: Chạy lệnh cài đặt Scrcpy trên Windows: winget install Genymobile.scrcpy")
        else:
            print("[Bridge] Gợi ý: Chạy lệnh cài đặt Scrcpy trên Linux: sudo apt install -y scrcpy adb")
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
            data = {
                'success': True,
                'bridge': 'active',
                'os': sys.platform,
                'scrcpy_path': scrcpy_bin,
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
                        self.send_json({'success': False, 'message': 'Không tìm thấy Scrcpy trên máy.'})
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
        pass  # Quiet logging

if __name__ == '__main__':
    os_name = "Windows" if sys.platform == "win32" else "macOS" if sys.platform == "darwin" else "Linux"
    print("=" * 66)
    print(f"  TP HONOR TOOLKIT - LOCAL SCRCPY BRIDGE ({os_name})")
    print("  Tự động bật Scrcpy Desktop 120Hz & Kết nối với tphntools.pages.dev")
    print("=" * 66)

    # 1. Tự động bật luôn App chiếu màn hình Scrcpy trên Desktop ngay khi chạy!
    threading.Thread(target=lambda: (time.sleep(0.4), launch_scrcpy_process()), daemon=True).start()

    # 2. Tự động mở trình duyệt web lên tên miền tphntools.pages.dev
    def open_web():
        time.sleep(1.0)
        print(f"[+] Đang mở trang web tại: {WEB_URL}")
        try:
            webbrowser.open(WEB_URL)
        except Exception:
            pass

    threading.Thread(target=open_web, daemon=True).start()

    # 3. Khởi động server cầu nối HTTP tại 127.0.0.1:5050
    try:
        server = http.server.ThreadingHTTPServer((HOST, PORT), BridgeHandler)
        print(f"[OK] Cầu nối đang chạy tại: http://{HOST}:{PORT}")
        print("[*] Sẵn sàng kết nối 2 chiều với trang web https://tphntools.pages.dev/ !")
        print("[*] Để đóng cầu nối, bấm Ctrl + C trong cửa sổ này.")
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[!] Đã dừng cầu nối.")
    except OSError as e:
        if 'Address already in use' in str(e) or 'address is already in use' in str(e).lower():
            print(f"[i] Cổng {PORT} đã có tiến trình hoạt động sẵn.")
            # Still launch scrcpy anyway
            launch_scrcpy_process()
        else:
            print(f"[!] Lỗi cổng {PORT}: {e}")
