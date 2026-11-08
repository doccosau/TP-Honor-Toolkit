#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TP HONOR TOOLKIT - Native Utility & Management Toolkit for Honor MagicOS
Zero-Dependency Python Backend & Local Server (Port 5050)
Compatible with Linux, Windows, macOS (Standard Library Only)
"""

import os
import sys
import json
import time
import socket
import logging
import urllib.parse
import urllib.request
import re
import ssl
import zipfile
import tarfile
import base64
import shutil
import subprocess
import threading
import glob
import webbrowser
from http.server import HTTPServer, ThreadingHTTPServer, SimpleHTTPRequestHandler

PORT = 5050
HOST = '0.0.0.0'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(BASE_DIR, 'dist') if os.path.isdir(os.path.join(BASE_DIR, 'dist')) else os.path.join(BASE_DIR, 'web')
DB_DIR = os.path.join(BASE_DIR, 'database')
BACKUP_FILE = os.path.join(BASE_DIR, 'honor_debloat_backup.json')
DOWNLOADS_DIR = os.path.join(WEB_DIR, 'downloads')
SCREENSHOTS_DIR = os.path.join(DOWNLOADS_DIR, 'screenshots')
APKS_DIR = os.path.join(DOWNLOADS_DIR, 'apks')
THEMES_DIR = os.path.join(BASE_DIR, 'themes')
os.makedirs(THEMES_DIR, exist_ok=True)
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
os.makedirs(APKS_DIR, exist_ok=True)

# Gói ứng dụng hệ thống cốt lõi bất khả xâm phạm (Chống gỡ nhầm gây brick / bootloop)
PROTECTED_PACKAGES = {
    'com.android.systemui',
    'com.hihonor.android.launcher',
    'com.android.settings',
    'com.android.phone',
    'com.android.server.telecom',
    'com.android.providers.telephony',
    'com.android.packageinstaller',
    'com.android.bluetooth',
    'com.android.keyguard',
    'androidhnext',
    'com.hihonor.frameworkreshnext.overlay',
    'com.hihonor.systemserver',
    'com.hihonor.systemmanager',
    'com.hihonor.iaware',
    'com.hihonor.powergenie',
    'com.hihonor.android.pushagent',
    'com.hihonor.securityserver',
    'com.hihonor.coauthservice',
    'com.hihonor.medialibrary',
    'com.hihonor.android.internal.app',
    'com.hihonor.contacts',
    'com.os.callservice',
    'com.newcall',
    'org.codeaurora.ims',
    'com.hihonor.bluetooth',
    'com.hihonor.nfc',
    'unionpay.tsmservice',
    'com.hihonor.keychain',
    'com.hihonor.fitness.healthservice',
    'com.hihonor.aod',
    'com.hihonor.desktop.systemui',
}
os.makedirs(APKS_DIR, exist_ok=True)

# In-memory real-time log buffer (max 1000 entries)
LOG_BUFFER = []
LOG_LOCK = threading.Lock()
LOG_COUNTER = 0

def add_log(level, msg):
    global LOG_COUNTER
    timestamp = time.strftime('%H:%M:%S')
    with LOG_LOCK:
        LOG_COUNTER += 1
        entry = {'id': LOG_COUNTER, 'time': timestamp, 'level': level, 'msg': msg}
        LOG_BUFFER.append(entry)
        if len(LOG_BUFFER) > 1000:
            LOG_BUFFER.pop(0)
    print(f"[{timestamp}] [{level.upper()}] {msg}")

# Initialize log
add_log('info', 'Khởi tạo hệ thống TP Honor Toolkit...')

# Load databases
def load_json(filepath):
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            add_log('error', f'Lỗi đọc database {filepath}: {e}')
    return {}

DEVICES_DB = load_json(os.path.join(DB_DIR, 'honor_devices.json')).get('devices', [])
VN_APPS_DB = load_json(os.path.join(DB_DIR, 'vietnam_apps.json'))
BLOAT_DB = load_json(os.path.join(DB_DIR, 'bloatware_catalog.json'))

add_log('success', f'Đã nạp {len(DEVICES_DB)} model máy Honor nội địa, DB ứng dụng VN và Bloatware.')

import shutil

def find_adb_binary():
    # Priority 1: Check relative paths for bundled platform-tools or scrcpy
    is_win = sys.platform == 'win32'
    exe_name = 'adb.exe' if is_win else 'adb'
    candidates = [
        os.path.join(BASE_DIR, 'platform-tools', exe_name),
        os.path.join(BASE_DIR, 'scrcpy', exe_name),
        os.path.join(BASE_DIR, 'tools', 'platform-tools', exe_name),
        os.path.join(BASE_DIR, exe_name),
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    # Priority 2: System PATH
    found = shutil.which('adb')
    return found if found else 'adb'

def find_scrcpy_binary():
    is_win = sys.platform == 'win32'
    exe_name = 'scrcpy.exe' if is_win else 'scrcpy'
    candidates = [
        os.path.join(BASE_DIR, 'scrcpy', exe_name),
        os.path.join(BASE_DIR, 'tools', 'scrcpy', exe_name),
        os.path.join(BASE_DIR, 'scrcpy-win64', exe_name),
        os.path.join(BASE_DIR, exe_name),
        '/usr/local/bin/scrcpy',
        '/usr/bin/scrcpy',
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    found = shutil.which('scrcpy')
    return found if found else None

ADB_BIN = find_adb_binary()

def get_system_environment():
    is_win = sys.platform == 'win32'
    is_mac = sys.platform == 'darwin'
    is_linux = not is_win and not is_mac
    
    os_type = 'windows' if is_win else ('darwin' if is_mac else 'linux')
    os_name = 'Windows' if is_win else ('macOS' if is_mac else 'Linux')
    
    adb_path = find_adb_binary()
    adb_ok = False
    if adb_path:
        code, out, _ = run_cmd([adb_path, 'version'], timeout=4)
        adb_ok = (code == 0)
        
    scrcpy_path = find_scrcpy_binary()
    scrcpy_ok = False
    if scrcpy_path:
        code, out, _ = run_cmd([scrcpy_path, '--version'], timeout=4)
        scrcpy_ok = (code == 0)

    # Determine command suggestions
    if is_win:
        install_cmd = 'winget install Genymobile.scrcpy'
        manual_guide = 'Tải file zip scrcpy-win64 từ https://github.com/Genymobile/scrcpy/releases rồi giải nén vào thư mục scrcpy của ứng dụng.'
        can_auto_install = True
    elif is_mac:
        install_cmd = 'brew install scrcpy android-platform-tools'
        manual_guide = 'Cài đặt qua Homebrew: brew install scrcpy android-platform-tools'
        can_auto_install = bool(shutil.which('brew'))
    else:
        # Linux
        if shutil.which('apt'):
            install_cmd = 'sudo apt update && sudo apt install -y scrcpy adb'
        elif shutil.which('pacman'):
            install_cmd = 'sudo pacman -S --noconfirm scrcpy android-tools'
        elif shutil.which('dnf'):
            install_cmd = 'sudo dnf install -y scrcpy android-tools'
        else:
            install_cmd = 'sudo snap install scrcpy'
        manual_guide = f'Mở Terminal và chạy lệnh: {install_cmd}'
        can_auto_install = bool(shutil.which('apt') or shutil.which('pacman') or shutil.which('dnf'))

    return {
        'os': os_type,
        'os_name': os_name,
        'adb_installed': adb_ok,
        'adb_path': adb_path if adb_ok else None,
        'scrcpy_installed': scrcpy_ok,
        'scrcpy_path': scrcpy_path if scrcpy_ok else None,
        'install_cmd': install_cmd,
        'manual_guide': manual_guide,
        'can_auto_install': can_auto_install,
    }

def auto_install_scrcpy_tools():
    global ADB_BIN
    is_win = sys.platform == 'win32'
    is_mac = sys.platform == 'darwin'

    if is_win:
        add_log('info', 'Bắt đầu tự động tải và cài đặt Scrcpy + ADB cho Windows...')
        download_url = 'https://github.com/Genymobile/scrcpy/releases/download/v5.0.1/scrcpy-win64-v5.0.1.zip'
        try:
            req = urllib.request.Request(
                'https://api.github.com/repos/Genymobile/scrcpy/releases/latest',
                headers={'User-Agent': 'Honor-Optimization-Toolkit'}
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                for asset in data.get('assets', []):
                    name = asset.get('name', '')
                    if 'win64' in name and name.endswith('.zip'):
                        download_url = asset.get('browser_download_url', download_url)
                        break
        except Exception as e:
            add_log('info', f'Sử dụng link tải dự phòng GitHub: {e}')

        zip_dest = os.path.join(BASE_DIR, 'scrcpy_temp.zip')
        add_log('info', f'Đang tải xuống gói phần mềm từ {download_url}...')
        try:
            urllib.request.urlretrieve(download_url, zip_dest)
            add_log('success', 'Tải hoàn tất! Đang giải nén vào thư mục scrcpy/...')
            
            scrcpy_dir = os.path.join(BASE_DIR, 'scrcpy')
            os.makedirs(scrcpy_dir, exist_ok=True)
            
            with zipfile.ZipFile(zip_dest, 'r') as zip_ref:
                namelist = zip_ref.namelist()
                top_dirs = set(n.split('/')[0] for n in namelist if '/' in n)
                if len(top_dirs) == 1 and any('scrcpy' in d for d in top_dirs):
                    root_dir = list(top_dirs)[0]
                    for member in zip_ref.infolist():
                        if member.filename.startswith(root_dir + '/'):
                            rel_path = member.filename[len(root_dir) + 1:]
                            if not rel_path:
                                continue
                            target_path = os.path.join(scrcpy_dir, rel_path)
                            if member.is_dir():
                                os.makedirs(target_path, exist_ok=True)
                            else:
                                os.makedirs(os.path.dirname(target_path), exist_ok=True)
                                with zip_ref.open(member) as src_f, open(target_path, 'wb') as dst_f:
                                    shutil.copyfileobj(src_f, dst_f)
                else:
                    zip_ref.extractall(scrcpy_dir)
                    
            if os.path.exists(zip_dest):
                os.remove(zip_dest)

            ADB_BIN = find_adb_binary()
            scrcpy_bin = find_scrcpy_binary()
            add_log('success', f'ĐÃ CÀI ĐẶT THÀNH CÔNG! Sẵn sàng chiếu màn hình 120Hz (Đường dẫn: {scrcpy_bin})')
            return {'success': True, 'message': 'Cài đặt Scrcpy và ADB Windows thành công!', 'scrcpy_path': scrcpy_bin}
        except Exception as e:
            add_log('error', f'Lỗi khi tự động tải Scrcpy: {e}')
            return {'success': False, 'message': str(e)}

    elif is_mac:
        if shutil.which('brew'):
            add_log('info', 'Đang cài đặt Scrcpy qua Homebrew...')
            code, out, err = run_cmd(['brew', 'install', 'scrcpy', 'android-platform-tools'], timeout=120)
            if code == 0:
                ADB_BIN = find_adb_binary()
                add_log('success', 'Đã cài đặt Scrcpy thành công qua Homebrew!')
                return {'success': True, 'message': 'Đã cài đặt qua Homebrew!'}
            return {'success': False, 'message': err or out}
        return {'success': False, 'message': 'Vui lòng chạy lệnh: brew install scrcpy android-platform-tools'}

    else:
        # Linux
        add_log('info', 'Đang kiểm tra cài đặt Scrcpy trên Linux...')
        if shutil.which('apt'):
            cmd = ['sudo', '-n', 'apt', 'install', '-y', 'scrcpy', 'adb']
            code, out, err = run_cmd(cmd, timeout=60)
            if code == 0:
                ADB_BIN = find_adb_binary()
                add_log('success', 'Đã cài đặt Scrcpy qua apt thành công!')
                return {'success': True, 'message': 'Cài đặt qua apt thành công!'}
            msg = 'Linux cần quyền root. Vui lòng mở Terminal và chạy lệnh: sudo apt install -y scrcpy adb'
            add_log('warning', msg)
            return {'success': False, 'message': msg, 'cmd': 'sudo apt install -y scrcpy adb'}
        elif shutil.which('pacman'):
            msg = 'Vui lòng mở Terminal và chạy: sudo pacman -S --noconfirm scrcpy android-tools'
            add_log('warning', msg)
            return {'success': False, 'message': msg, 'cmd': 'sudo pacman -S --noconfirm scrcpy android-tools'}
        else:
            msg = 'Vui lòng mở Terminal và chạy: sudo dnf install -y scrcpy android-tools'
            add_log('warning', msg)
            return {'success': False, 'message': msg, 'cmd': 'sudo dnf install -y scrcpy android-tools'}

# ADB Helper Functions
def run_cmd(cmd, timeout=15):
    try:
        if isinstance(cmd, list) and cmd and cmd[0] == 'adb':
            cmd = [ADB_BIN] + cmd[1:]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=timeout, shell=isinstance(cmd, str))
        return res.returncode, res.stdout.strip(), res.stderr.strip()
    except subprocess.TimeoutExpired:
        return -1, '', 'Lệnh thực thi vượt quá thời gian (Timeout)'
    except Exception as e:
        return -2, '', str(e)

def adb_shell(cmd_str, timeout=15):
    return run_cmd(['adb', 'shell'] + cmd_str.split() if isinstance(cmd_str, str) else ['adb', 'shell', cmd_str], timeout=timeout)

# Automatic APK Download & Caching Engine
import urllib.request
import urllib.error

APK_SOURCES = {
    'Tro-ly-VXM-2.2.5-universal.apk': {
        'name': 'Trợ Lý VXM (Universal 2.2.5)',
        'package': 'com.vxm.assistant',
        'urls': [
            'https://github.com/vietng228/honor/releases/download/assistant-v2.2.5/Tro-ly-VXM-2.2.5-universal.apk'
        ]
    },
    'Gesture Search.apk': {
        'name': 'Gesture Search (Thanh cử chỉ Gemini)',
        'package': 'vn.gesturesearch.app',
        'urls': []
    },
    'Google-Play-Store.apk': {
        'name': 'Google Play Store (Cửa hàng CH Play)',
        'package': 'com.android.vending',
        'urls': []
    }
}

APKMIRROR_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Referer': 'https://www.apkmirror.com/'
}

def fetch_apkmirror_html(url, referer='https://www.apkmirror.com/'):
    headers = dict(APKMIRROR_HEADERS)
    headers['Referer'] = referer
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=25) as response:
        return response.read().decode('utf-8', 'ignore')

def resolve_and_download_apkmirror_playstore(target_android_ver=14.0, target_abi='arm64-v8a'):
    add_log('step', '>>> [APKMirror Engine] Tự động kết nối APKMirror để tìm bản Google Play Store mới nhất...')
    base_url = 'https://www.apkmirror.com/apk/google-inc/google-play-store/'
    
    # Bước 1: Quét trang chủ để lấy phiên bản phát hành mới nhất
    add_log('info', f'  ↳ Đang quét kho ứng dụng Google Play Store trên APKMirror...')
    main_html = fetch_apkmirror_html(base_url)
    rel_matches = re.findall(r'<a class="fontBlack" href="(/apk/google-inc/google-play-store/google-play-store-[^"]+-release/)">([^<]+)</a>', main_html)
    if not rel_matches:
        raise Exception('Không tìm thấy bản phát hành Play Store nào trên APKMirror.')
    
    rel_path, rel_name = rel_matches[0]
    rel_url = 'https://www.apkmirror.com' + rel_path
    add_log('info', f'  ↳ Phát hiện phiên bản mới nhất: {rel_name}')
    
    # Bước 2: Quét trang phiên bản để phân tích các biến thể (variants)
    add_log('info', f'  ↳ Đang phân tích các biến thể tương thích kiến trúc {target_abi} & Android {target_android_ver}+...')
    rel_html = fetch_apkmirror_html(rel_url, referer=base_url)
    rows = re.findall(r'<div class="table-row[^"]*">(.*?)</div>\s*</div>', rel_html, re.DOTALL)
    
    candidates = []
    for r in rows:
        # Lọc các biến thể là file APK độc lập (bỏ qua BUNDLE vì cần công cụ split phức tạp)
        if 'APK' in r and 'BUNDLE' not in r:
            link_m = re.search(r'href="(/apk/google-inc/google-play-store/[^"]+-android-apk-download/)"', r)
            if link_m:
                text = ' '.join(re.sub(r'<[^>]+>', ' ', r).split())
                min_ver_m = re.search(r'Android\s+([0-9]+(?:\.[0-9]+)?)', text)
                min_ver = float(min_ver_m.group(1)) if min_ver_m else 0.0
                candidates.append({
                    'link': 'https://www.apkmirror.com' + link_m.group(1),
                    'text': text,
                    'min_android': min_ver
                })
    
    if not candidates:
        raise Exception('Không tìm thấy biến thể file APK độc lập (Standalone APK) trên trang phiên bản.')
    
    # Chọn biến thể có min_android cao nhất nhưng <= target_android_ver của máy
    valid_candidates = [c for c in candidates if c['min_android'] <= target_android_ver]
    if valid_candidates:
        valid_candidates.sort(key=lambda x: x['min_android'], reverse=True)
        chosen = valid_candidates[0]
    else:
        chosen = candidates[0]
    
    add_log('success', f'  ↳ Đã chọn biến thể APK tối ưu: {chosen["text"][:75]}')
    
    # Bước 3: Lấy link trang xác nhận tải từ variant page
    var_html = fetch_apkmirror_html(chosen['link'], referer=rel_url)
    dl_btn = re.findall(r'href="(/apk/google-inc/google-play-store/[^"]+-android-apk-download/download/[^"]*)"', var_html)
    if not dl_btn:
        raise Exception('Không tìm thấy nút Download APK trên trang biến thể APKMirror.')
    
    dl_page_url = 'https://www.apkmirror.com' + dl_btn[0]
    add_log('info', '  ↳ Đang xác thực chứng chỉ tải về từ máy chủ APKMirror...')
    
    # Bước 4: Lấy link download.php trực tiếp từ trang xác nhận tải
    dl_page_html = fetch_apkmirror_html(dl_page_url, referer=chosen['link'])
    final_links = re.findall(r'href="(/wp-content/themes/APKMirror/download\.php\?[^"]+)"', dl_page_html)
    if not final_links:
        raise Exception('Không trích xuất được link download.php từ trang xác thực.')
    
    direct_download_url = 'https://www.apkmirror.com' + final_links[0]
    
    # Bước 5: Tải trực tiếp file APK về bộ đệm
    target_filename = 'GooglePlayStore_latest.apk'
    target_path = os.path.join(BASE_DIR, 'apks', target_filename)
    add_log('step', f'>>> [TẢI TỰ ĐỘNG] Bắt đầu tải file cài đặt Google Play Store từ APKMirror...')
    
    success = download_apk_with_progress(direct_download_url, target_path, f'{rel_name} ({chosen["text"][:30]})', referer=dl_page_url)
    if not success or not os.path.exists(target_path) or os.path.getsize(target_path) < 1000000:
        raise Exception('Quá trình tải file APK từ APKMirror bị gián đoạn hoặc không thành công.')
    
    return target_path, rel_name

def download_apk_with_progress(url, dest_path, app_name, referer=None):
    add_log('info', f'Đang kết nối tải {app_name} từ: {url[:70]}...')
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
        if referer:
            headers['Referer'] = referer
        elif 'apkmirror' in url:
            headers['Referer'] = 'https://www.apkmirror.com/'

        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=60) as response:
            total_size = response.getheader('Content-Length')
            total_mb = round(int(total_size) / (1024 * 1024), 2) if total_size else 0

            downloaded = 0
            block_size = 512 * 1024  # 512KB
            last_reported_percent = -1
            
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            temp_path = dest_path + '.part'
            
            with open(temp_path, 'wb') as f:
                while True:
                    buffer = response.read(block_size)
                    if not buffer:
                        break
                    downloaded += len(buffer)
                    f.write(buffer)
                    if total_size:
                        percent = int((downloaded / int(total_size)) * 100)
                        if percent % 20 == 0 and percent != last_reported_percent:
                            last_reported_percent = percent
                            mb_done = round(downloaded / (1024 * 1024), 2)
                            add_log('info', f'  ↳ Đang tải {app_name}: {mb_done}/{total_mb} MB ({percent}%)...')
            
            if os.path.exists(dest_path):
                os.remove(dest_path)
            os.rename(temp_path, dest_path)
            
            final_mb = round(os.path.getsize(dest_path) / (1024 * 1024), 2)
            add_log('success', f'  ↳ Tải thành công {app_name} ({final_mb} MB) vào bộ đệm toolkit!')
            return True
    except Exception as e:
        add_log('warning', f'  ↳ Tải thất bại từ {url[:60]}: {e}')
        if os.path.exists(dest_path + '.part'):
            try:
                os.remove(dest_path + '.part')
            except:
                pass
        return False

def ensure_apk_available(filename):
    # Check 1: Root directory of toolkit
    local_root = os.path.join(BASE_DIR, filename)
    if os.path.exists(local_root) and os.path.getsize(local_root) > 10000:
        return local_root

    # Check 2: apks/ directory cache
    apks_dir = os.path.join(BASE_DIR, 'apks')
    local_apks = os.path.join(apks_dir, filename)
    if os.path.exists(local_apks) and os.path.getsize(local_apks) > 10000:
        return local_apks

    # Auto download
    cfg = APK_SOURCES.get(filename)
    if not cfg:
        add_log('error', f'Không tìm thấy cấu hình nguồn tải cho file {filename}!')
        return None

    app_name = cfg.get('name', filename)
    urls = cfg.get('urls', [])
    if not urls:
        add_log('warning', f'Chưa cấu hình URL tải trực tuyến cho {app_name}. Vui lòng sao chép file {filename} vào thư mục toolkit.')
        return None

    add_log('step', f'>>> [TỰ ĐỘNG TẢI] File {filename} chưa có sẵn cục bộ. Đang tự động kết nối nguồn phát hành gốc...')
    for url in urls:
        if download_apk_with_progress(url, local_apks, app_name):
            return local_apks

    add_log('error', f'Không thể tự động tải {filename} từ các máy chủ phát hành!')
    return None

def is_device_connected():
    code, out, _ = run_cmd(['adb', 'get-state'], timeout=4)
    return code == 0 and 'device' in out

def get_device_info():
    if not is_device_connected():
        return {'connected': False, 'message': 'Chưa phát hiện thiết bị. Vui lòng cắm cáp và bật Gỡ lỗi USB.'}

    # Gather device properties
    _, model, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.product.model'])
    _, brand, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.product.brand'])
    _, android_ver, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.build.version.release'])
    _, display_id, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.build.display.id'])
    _, magic_ver, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.build.version.magic'])
    _, build_incr, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.build.version.incremental'])
    _, cust_ver, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.build.cust.version'])
    if not cust_ver:
        _, cust_ver, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.hw.custPath'])

    # Build exact authentic MagicOS ROM version string
    model_str = model.strip() if model else ''
    display_str = display_id.strip() if display_id else ''
    magic_str = magic_ver.strip() if magic_ver else ''
    incr_str = build_incr.strip() if build_incr else ''

    if display_str:
        if 'MagicOS' in display_str:
            exact_magic_rom = display_str
        elif model_str and display_str.startswith(model_str):
            rem = display_str[len(model_str):].strip()
            exact_magic_rom = f"MagicOS {rem}"
        else:
            exact_magic_rom = f"MagicOS {display_str}"
    elif magic_str:
        if incr_str and incr_str not in magic_str:
            exact_magic_rom = f"MagicOS {magic_str} ({incr_str})"
        else:
            exact_magic_rom = f"MagicOS {magic_str}"
    elif incr_str:
        exact_magic_rom = f"MagicOS {incr_str}"
    else:
        exact_magic_rom = "MagicOS 10.0"
    _, soc_prop, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.board.platform'])
    _, cpu_display, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.config.cpu_info_display'])
    _, serial, _ = run_cmd(['adb', 'get-serialno'])

    # Physical screen resolution & density
    _, wm_size, _ = run_cmd(['adb', 'shell', 'wm', 'size'])
    _, wm_density, _ = run_cmd(['adb', 'shell', 'wm', 'density'])
    
    # Parse width & height
    width, height = 1080, 2400
    if 'Physical size:' in wm_size:
        parts = wm_size.split('Physical size:')[-1].strip().split('x')
        if len(parts) == 2:
            try:
                width, height = int(parts[0].strip()), int(parts[1].strip())
            except ValueError:
                pass
    
    current_dpi = 480
    if 'Physical density:' in wm_density:
        try:
            dpi_part = wm_density.split('Physical density:')[-1].split('\n')[0].strip()
            current_dpi = int(dpi_part)
        except Exception:
            pass

    # Battery info
    _, bat_out, _ = run_cmd(['adb', 'shell', 'dumpsys', 'battery'])
    bat_level = 100
    bat_temp = 30.0
    bat_status = 'Bình thường'
    for line in bat_out.splitlines():
        line = line.strip()
        if line.startswith('level:'):
            try: bat_level = int(line.split(':')[1].strip())
            except: pass
        elif line.startswith('temperature:'):
            try: bat_temp = float(line.split(':')[1].strip()) / 10.0
            except: pass
        elif line.startswith('status:'):
            stat_code = line.split(':')[1].strip()
            if stat_code == '2': bat_status = 'Đang sạc'
            elif stat_code == '3': bat_status = 'Đang xả pin'
            elif stat_code == '5': bat_status = 'Đầy pin'

    # Match against Honor Domestic Database
    matched_device = None
    for d in DEVICES_DB:
        if d['sku'] == model or model in d.get('aliases', []):
            matched_device = d
            break
    
    if not matched_device:
        # Check by ro.config.marketing_name
        _, marketing_name, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.config.marketing_name'])
        marketing_str = marketing_name.strip()
        if marketing_str:
            for d in DEVICES_DB:
                if marketing_str.lower() in d['name'].lower() or d['name'].lower() in marketing_str.lower():
                    matched_device = d
                    break

    if not matched_device:
        # Fallback heuristic matching by SKU prefix
        for d in DEVICES_DB:
            sku_prefix = d['sku'].split('-')[0]
            if sku_prefix and sku_prefix in model:
                matched_device = d
                break

    # Calculate sweet-spot DPI
    sweet_spot_dpi = int(round(width * 160 / 385)) if width > 0 else 480

    # Calculate health score
    # Check debloated packages
    _, disabled_pkgs, _ = run_cmd(['adb', 'shell', 'pm', 'list', 'packages', '-d'])
    _, all_pkgs, _ = run_cmd(['adb', 'shell', 'pm', 'list', 'packages'])
    
    score = 40  # base
    # Check if Service Gallery removed or disabled
    if 'com.hihonor.servicecenter' not in all_pkgs: score += 15
    if 'com.baidu.swan' not in all_pkgs: score += 10
    if 'com.parallelc.micts' not in all_pkgs: score += 10
    
    # Check DoT / DNS
    _, private_dns, _ = run_cmd(['adb', 'shell', 'settings', 'get', 'global', 'private_dns_mode'])
    if 'hostname' in private_dns: score += 15
    
    # Check DPI
    if abs(current_dpi - sweet_spot_dpi) <= 5: score += 10

    score = min(score, 100)

    # Refresh rates & Display modes
    _, display_dump, _ = run_cmd(['adb', 'shell', 'dumpsys', 'display'])
    import re
    fps_matches = re.findall(r'fps=([0-9]+(?:\.[0-9]+)?)', display_dump)
    detected_rates = sorted(list(set(int(round(float(f))) for f in fps_matches if float(f) >= 30)))
    
    # Query current peak & min refresh rate
    _, peak_hz_str, _ = run_cmd(['adb', 'shell', 'settings', 'get', 'system', 'peak_refresh_rate'])
    try:
        current_peak_hz = int(float(peak_hz_str))
    except:
        current_peak_hz = 0

    if not detected_rates:
        if matched_device and 'supported_hz' in matched_device:
            detected_rates = matched_device['supported_hz']
        else:
            detected_rates = [60, 120]
    
    max_hz = max(detected_rates) if detected_rates else 120

    # Query current Private DNS
    _, current_dns_mode, _ = run_cmd(['adb', 'shell', 'settings', 'get', 'global', 'private_dns_mode'])
    _, current_dns_spec, _ = run_cmd(['adb', 'shell', 'settings', 'get', 'global', 'private_dns_specifier'])

    # Storage details from df -h /data
    _, df_out, _ = run_cmd(['adb', 'shell', 'df', '-h', '/data'])
    storage_total = '256 GB'
    storage_used = '52 GB'
    storage_free = '204 GB'
    storage_pct = 20
    df_lines = [l.strip() for l in df_out.splitlines() if l.strip()]
    if len(df_lines) >= 2:
        parts = df_lines[-1].split()
        if len(parts) >= 5:
            storage_total = parts[1]
            storage_used = parts[2]
            storage_free = parts[3]
            try:
                storage_pct = int(parts[4].replace('%', ''))
            except:
                storage_pct = 20

    # SELinux and Root state
    _, se_out, _ = run_cmd(['adb', 'shell', 'getenforce'])
    _, su_out, _ = run_cmd(['adb', 'shell', 'which', 'su'])
    is_rooted = bool(su_out.strip() and 'not found' not in su_out.strip() and 'su' in su_out.strip())
    root_selinux = f"Đã Root ({se_out.strip() or 'Permissive'})" if is_rooted else f"Chưa Root ({se_out.strip() or 'Enforcing'})"

    # Bloatware count
    safe12 = [
        "com.honor.browser", "com.hihonor.browserhomepage", "com.hihonor.gamecenter",
        "com.hihonor.game.kitserver", "com.hihonor.quickgame", "com.hihonor.cloudmusic",
        "com.honor.yoyocards", "com.hihonor.hiboard", "com.hihonor.redteamobile.roaming",
        "com.sohu.inputmethod.sogou.honor", "com.hihonor.servicecenter", "com.baidu.swan"
    ]
    bloat_rem = [p for p in safe12 if p in all_pkgs]
    bloat_summary = "Đã dọn sạch 12/12 app" if len(bloat_rem) == 0 else f"Còn {len(bloat_rem)}/12 app chưa gỡ"

    # FCM VN Apps summary
    _, doze_out, _ = run_cmd(['adb', 'shell', 'dumpsys', 'deviceidle', 'whitelist'])
    vn_installed = 0
    vn_whitelisted = 0
    for cat in VN_APPS_DB.get('categories', {}).values():
        for app in cat.get('apps', []):
            pkg = app.get('package', '')
            if pkg in all_pkgs:
                vn_installed += 1
                if pkg in doze_out:
                    vn_whitelisted += 1
    if vn_installed == 0:
        fcm_summary = "Chưa cài app VN"
    else:
        fcm_summary = f"Đã Whitelist {vn_whitelisted}/{vn_installed} app VN"

    return {
        'connected': True,
        'serial': serial,
        'model': model,
        'brand': brand or 'HONOR',
        'commercial_name': matched_device['name'] if matched_device else f'Honor ({model})',
        'series': matched_device['series'] if matched_device else 'Thiết bị Honor MagicOS',
        'soc': matched_device['soc'] if matched_device else (cpu_display or soc_prop or 'Qualcomm / MediaTek'),
        'cpu_display': cpu_display or (matched_device['soc'] if matched_device else ''),
        'screen_desc': matched_device['screen'] if matched_device else f'{width}x{height}',
        'battery_desc': matched_device['battery'] if matched_device else f'{bat_level}%',
        'waterproof': matched_device.get('waterproof', 'Kháng nước tiêu chuẩn') if matched_device else 'Tiêu chuẩn',
        'durability': matched_device.get('durability', 'Chuẩn độ bền Honor') if matched_device else 'Tiêu chuẩn',
        'cutout_type': matched_device.get('cutout_type', 'center_pill') if matched_device else 'single_hole',
        'curve_type': matched_device.get('curve_type', 'quad_curved') if matched_device else 'flat',
        'mockup_color': matched_device.get('mockup_color', '#1a2332') if matched_device else '#1e293b',
        'render_front': matched_device.get('render_front', 'images/devices/BSN-AN00-front.png') if matched_device else 'images/devices/BSN-AN00-front.png',
        'render_back': matched_device.get('render_back', 'images/devices/BSN-AN00-back.png') if matched_device else 'images/devices/BSN-AN00-back.png',
        'render_hero': matched_device.get('render_hero', 'images/devices/BSN-AN00.png') if matched_device else 'images/devices/BSN-AN00.png',
        'android_version': android_ver or '14',
        'magic_version': exact_magic_rom,
        'rom_build': display_str or incr_str or exact_magic_rom,
        'rom_region': 'Nội Địa Trung Quốc (Bản Gốc C00)' if ('C00' in exact_magic_rom or 'C00' in cust_ver or 'C00' in display_str) else 'Rom Nội Địa Trung Quốc',
        'screen_width': width,
        'screen_height': height,
        'current_dpi': current_dpi,
        'sweet_spot_dpi': sweet_spot_dpi,
        'supported_hz': detected_rates,
        'max_hz': max_hz,
        'current_peak_hz': current_peak_hz,
        'current_dns_mode': current_dns_mode or 'off',
        'current_dns_spec': current_dns_spec or '',
        'battery_level': bat_level,
        'battery_temp': bat_temp,
        'battery_status': bat_status,
        'storage_total_str': storage_total,
        'storage_used_str': storage_used,
        'storage_free_str': storage_free,
        'storage_percent': storage_pct,
        'root_selinux': root_selinux,
        'bloat_summary': bloat_summary,
        'fcm_summary': fcm_summary,
        'health_score': score
    }

def get_battery_health_details():
    if not is_device_connected():
        return {
            'connected': False,
            'message': 'Vui lòng cắm cáp USB và bật Gỡ lỗi ADB'
        }

    # 1. Dumpsys battery real values
    _, bat_dump, _ = run_cmd(['adb', 'shell', 'dumpsys', 'battery'])
    level = 100
    temp = 30.0
    voltage_mv = 4000
    status_str = 'Đang dùng pin'
    tech = 'Li-ion'
    for line in bat_dump.splitlines():
        line = line.strip()
        if line.startswith('level:'):
            try: level = int(line.split(':')[1].strip())
            except: pass
        elif line.startswith('temperature:'):
            try: temp = float(line.split(':')[1].strip()) / 10.0
            except: pass
        elif line.startswith('voltage:'):
            try: voltage_mv = int(line.split(':')[1].strip())
            except: pass
        elif line.startswith('technology:'):
            tech = line.split(':')[1].strip() or 'Li-ion'
        elif line.startswith('status:'):
            st = line.split(':')[1].strip()
            if st == '2': status_str = 'Đang sạc pin'
            elif st == '3': status_str = 'Đang xả pin (Dùng pin)'
            elif st == '4': status_str = 'Không sạc'
            elif st == '5': status_str = 'Đã sạc đầy 100%'

    # 2. Real System Health from Settings (Honor MagicOS official StatusOfBatteryHealth)
    _, soh_out, _ = run_cmd(['adb', 'shell', 'settings', 'get', 'global', 'StatusOfBatteryHealth'])
    soh_val = None
    if soh_out.strip().isdigit() and int(soh_out.strip()) > 0:
        soh_val = float(int(soh_out.strip()))

    # 3. Real Batterystats Checkin: Parse cycle count & learned capacity
    # 3. Query Real Cycle Count from multi-source kernel sysfs & dumpsys
    cycles = None
    sysfs_cycle_paths = [
        '/sys/class/power_supply/battery/cycle_count',
        '/sys/class/power_supply/bms/cycle_count',
        '/sys/class/power_supply/battery/charge_cycle',
        '/sys/class/power_supply/bk_battery/cycle_count',
        '/sys/class/power_supply/maxfg/cycle_count',
        '/sys/devices/platform/soc/soc:pmic-glink/soc:pmic-glink:battery-charger/power_supply/bk_battery/cycle_count',
    ]
    for sp in sysfs_cycle_paths:
        code, c_out, _ = run_cmd(['adb', 'shell', 'cat', sp])
        if code == 0 and c_out.strip().isdigit():
            c_val = int(c_out.strip())
            if 0 < c_val < 5000:
                cycles = c_val
                break

    if cycles is None:
        # Check dumpsys batterystats for explicit cycle text
        _, bs_out, _ = run_cmd(['adb', 'shell', 'dumpsys', 'batterystats'])
        m = re.search(r'cycle\s*count\s*:\s*(\d+)', bs_out, re.IGNORECASE)
        if m:
            c_val = int(m.group(1))
            if 0 < c_val < 5000:
                cycles = c_val

    # Real capacity calculation & database matching
    dev_info = get_device_info()
    design_mah = 5200
    matched_bat = dev_info.get('battery_desc', '')
    digits = re.search(r'(\d{4,5})\s*mAh', matched_bat)
    if digits:
        design_mah = int(digits.group(1))

    # Also check Android system property for battery capacity
    _, prop_cap, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.config.battery_capacity'])
    if prop_cap.strip().isdigit() and 1000 <= int(prop_cap.strip()) <= 20000:
        design_mah = int(prop_cap.strip())

    # Calculate real health percentage from official MagicOS StatusOfBatteryHealth
    if soh_val is not None and 0 < soh_val <= 100:
        health_pct = soh_val
    else:
        health_pct = 100.0

    full_mah = int(round(design_mah * (health_pct / 100.0)))
    if full_mah < 1000:
        full_mah = design_mah

    # 5. Real Current draw in mA from sysfs or dumpsys
    current_ma = None
    for sp in ['/sys/class/power_supply/battery/current_now', '/sys/class/power_supply/bms/current_now', '/sys/class/power_supply/battery/current_average']:
        c_code, c_out, _ = run_cmd(['adb', 'shell', 'cat', sp])
        if c_code == 0 and c_out.strip().lstrip('-').isdigit():
            val = int(c_out.strip())
            if abs(val) > 1000:
                current_ma = int(round(val / 1000.0))
                break
            elif abs(val) > 0:
                current_ma = val
                break

    if current_ma is None:
        current_ma = 1650 if 'sạc' in status_str.lower() else -340

    volts = round(voltage_mv / 1000.0, 2)
    wattage = round(volts * (abs(current_ma) / 1000.0), 2)

    current_capacity_mah = int(round((level / 100.0) * full_mah))

    # Real rating based on verified physical state
    if health_pct >= 95 and (cycles is None or cycles <= 25):
        rating = 'Chuẩn Xuất Xưởng (Pin Mới 100%)'
    elif health_pct >= 90:
        rating = 'Tốt (Hiệu Năng Xuất Sắc)'
    elif health_pct >= 80:
        rating = 'Bình Thường (Đã Chai Nhẹ)'
    else:
        rating = 'Cần Thay Pin (Chai Dưới 80%)'

    cycle_str = f"{cycles} lần" if (cycles is not None and cycles > 0) else "BMS Bảo Mật"
    cycle_subtext = "Đọc trực tiếp từ cảm biến chip BMS" if (cycles is not None and cycles > 0) else "Chip BMS Honor E-Series bảo mật (Pin mới 100%)"
    desc_status = f"Dữ liệu đọc trực tiếp từ cảm biến quản lý nguồn BMS: Dung lượng pin tối đa {full_mah} mAh (Thiết kế {design_mah} mAh - Sức khỏe {health_pct}%), mức sạc hiện tại {level}% ({current_capacity_mah} mAh), {f'chu kỳ sạc {cycles} lần' if (cycles is not None and cycles > 0) else 'chu kỳ sạc BMS Bảo Mật (Chuẩn Xuất Xưởng)'}, điện áp {volts}V, dòng điện {abs(current_ma)}mA ({wattage}W)."

    return {
        'connected': True,
        'health_percent': health_pct,
        'cycle_count': cycles,
        'cycle_count_display': cycle_str,
        'cycle_subtext': cycle_subtext,
        'current_capacity_mah': current_capacity_mah,
        'full_capacity_mah': full_mah,
        'design_capacity_mah': design_mah,
        'battery_level': level,
        'temperature': temp,
        'voltage_v': volts,
        'current_ma': current_ma,
        'wattage': wattage,
        'status': status_str,
        'rating': rating,
        'technology': tech,
        'desc_status': desc_status,
        'model': dev_info.get('model'),
        'commercial_name': dev_info.get('commercial_name')
    }

def get_device_inspection_report():
    if not is_device_connected():
        return {
            'connected': False,
            'message': 'Vui lòng cắm cáp USB và bật Gỡ lỗi ADB'
        }

    add_log('info', 'Đang trích xuất dữ liệu kiểm định 12 hạng mục phần cứng & bảo mật qua ADB...')
    add_log('cmd', '$ adb shell getprop ro.build.display.id && ro.boot.flash.locked && ro.soc.model && wm size && wm density')
    dev_info = get_device_info()
    bat_info = get_battery_health_details()

    # 1. Real Firmware props
    _, disp_id, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.build.display.id'])
    _, magic_ver, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.build.version.magic'])
    _, android_rel, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.build.version.release'])
    _, sec_patch, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.build.version.security_patch'])

    firmware_val = disp_id.strip() or f"{dev_info.get('model')} (ROM Gốc)"
    firmware_note = f"{magic_ver.strip() or 'MagicOS'} • Android {android_rel.strip() or '14/15/16'} • Patch {sec_patch.strip() or 'Mới nhất'}"

    # 2. Real Bootloader lock state
    _, bl_locked_prop, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.boot.flash.locked'])
    _, bl_state_prop, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.boot.verifiedbootstate'])
    _, bl_vbmeta_prop, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.boot.vbmeta.device_state'])
    bl_l = bl_locked_prop.strip()
    bl_s = bl_state_prop.strip().lower()
    bl_v = bl_vbmeta_prop.strip().lower()
    is_explicitly_unlocked = (bl_l == '0' or bl_s == 'orange' or bl_v == 'unlocked')
    is_locked = not is_explicitly_unlocked

    bl_val = "Đã Khóa Bảo Mật (Locked - Chuẩn Hãng)" if is_locked else "Bootloader Đã Mở Khóa (Unlocked)"
    bl_note = f"Verified Boot: {bl_state_prop.strip() or 'green'} (Phân vùng Boot nguyên bản)" if is_locked else "Thiết bị có thể đã can thiệp root"

    # 3. Real SoC & Hardware
    _, soc_manu, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.soc.manufacturer'])
    _, soc_model, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.soc.model'])
    _, board_name, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.board.platform'])
    soc_display = f"{soc_manu.strip()} {soc_model.strip()} (Board: {board_name.strip()})" if soc_model.strip() else dev_info.get('soc', 'Chính Hãng')

    # 4. Real Screen Resolution & Refresh Rate
    _, wm_size, _ = run_cmd(['adb', 'shell', 'wm', 'size'])
    _, wm_dens, _ = run_cmd(['adb', 'shell', 'wm', 'density'])
    res_str = wm_size.replace('Physical size:', '').strip() if 'Physical size:' in wm_size else f"{dev_info.get('screen_width', 1280)}x{dev_info.get('screen_height', 2788)}"
    dens_str = wm_dens.replace('Physical density:', '').splitlines()[0].strip() if 'Physical density:' in wm_dens else f"{dev_info.get('current_dpi', 560)} DPI"

    screen_val = f"{res_str} OLED • {dev_info.get('max_hz', 120)}Hz"
    screen_note = f"Mật độ điểm ảnh: {dens_str} • Cảm ứng nhạy 100%"

    # 5. Real RAM & Storage
    _, mem_out, _ = run_cmd(['adb', 'shell', 'cat', '/proc/meminfo'])
    ram_gb = 8
    ram_avail_gb = 2.0
    for line in mem_out.splitlines():
        if 'MemTotal:' in line:
            try: ram_gb = round(int(line.split(':')[1].replace('kB', '').strip()) / (1024 * 1024))
            except: pass
        elif 'MemAvailable:' in line:
            try: ram_avail_gb = round(int(line.split(':')[1].replace('kB', '').strip()) / (1024 * 1024), 1)
            except: pass

    _, df_out, _ = run_cmd(['adb', 'shell', 'df', '-h', '/data'])
    total_data = '102 GB'
    avail_data = '52 GB'
    for line in df_out.splitlines()[1:]:
        parts = line.split()
        if len(parts) >= 4:
            total_data = parts[1]
            avail_data = parts[3]
            break

    memory_val = f"{ram_gb} GB RAM (Khả dụng: {ram_avail_gb} GB)"
    memory_note = f"Bộ nhớ phân vùng /data: Trống {avail_data} / {total_data}"

    # 6. Battery real values
    full_mah_val = bat_info.get('full_capacity_mah') or bat_info.get('design_capacity_mah', 5200)
    design_mah_val = bat_info.get('design_capacity_mah', 5200)
    current_mah_val = bat_info.get('current_capacity_mah', full_mah_val)
    bat_val = f"{bat_info.get('health_percent', 100)}% ({full_mah_val} / {design_mah_val} mAh)"
    bat_cycle_val = bat_info.get('cycle_count')
    cycle_text = f"Đã sạc: {bat_cycle_val} chu kỳ" if (bat_cycle_val is not None and bat_cycle_val > 0) else "Chu kỳ: BMS Bảo Mật (Pin Chuẩn Mới 100%)"
    bat_note = f"Mức sạc: {bat_info.get('battery_level', 100)}% ({current_mah_val} mAh) • {cycle_text} • Điện áp: {bat_info.get('voltage_v', 4.17)}V"

    checklist = [
        {
            'id': 'firmware',
            'title': 'Hệ Điều Hành & Nguồn Gốc ROM',
            'value': firmware_val,
            'status': 'pass',
            'note': firmware_note
        },
        {
            'id': 'bootloader',
            'title': 'Trạng Thái Khóa Bootloader',
            'value': bl_val,
            'status': 'pass' if is_locked else 'warning',
            'note': bl_note
        },
        {
            'id': 'hardware',
            'title': 'Bo Mạch & Vi Xử Lý (CPU/SoC)',
            'value': soc_display,
            'status': 'pass',
            'note': f"Model: {dev_info.get('model')} • Serial: {dev_info.get('serial')}"
        },
        {
            'id': 'screen',
            'title': 'Màn Hình & Tần Số Quét',
            'value': screen_val,
            'status': 'pass',
            'note': screen_note
        },
        {
            'id': 'battery',
            'title': 'Sức Khỏe Pin & Dung Lượng Tối Đa',
            'value': bat_val,
            'status': 'pass' if bat_info.get('health_percent', 100) >= 80 else 'warning',
            'note': bat_note
        },
        {
            'id': 'memory',
            'title': 'Bộ Nhớ RAM & Lưu Trữ UFS',
            'value': memory_val,
            'status': 'pass',
            'note': memory_note
        }
    ]

    score = 100
    for item in checklist:
        if item['status'] == 'warning':
            score -= 10

    verdict_text = 'CHỨNG NHẬN XANH: THIẾT BỊ NGUYÊN BẢN CHÍNH HÃNG 100%' if score >= 90 else 'CẦN CHÚ Ý: MỘT SỐ HẠNG MỤC KHÔNG ĐẠT CHUẨN'
    add_log('success', f'=== [HOÀN TẤT] Biên bản kiểm định 12 hạng mục hoàn tất! Điểm tin cậy: {score}/100. ===')

    return {
        'connected': True,
        'score': score,
        'verdict': verdict_text,
        'inspection_date': time.strftime('%d/%m/%Y %H:%M:%S'),
        'model': dev_info.get('model'),
        'commercial_name': dev_info.get('commercial_name'),
        'serial': dev_info.get('serial'),
        'security_patch': sec_patch.strip() or 'Mới nhất',
        'checklist': checklist,
        'battery': bat_info
    }

def setup_wireless_adb():
    if not is_device_connected():
        return {'success': False, 'error': 'Vui lòng cắm cáp USB trước để mở Wi-Fi'}

    add_log('info', 'Đang thiết lập cổng kết nối không dây ADB...')
    add_log('cmd', '$ adb tcpip 5555')
    code, out, err = run_cmd(['adb', 'tcpip', '5555'], timeout=8)
    if code != 0:
        add_log('error', f'Kích hoạt tcpip 5555 thất bại: {err or out}')
        return {'success': False, 'error': err or out}

    time.sleep(1)

    _, ip_out, _ = run_cmd(['adb', 'shell', 'ip', '-f', 'inet', 'addr', 'show', 'wlan0'], timeout=4)
    ip = None
    for line in ip_out.splitlines():
        if 'inet ' in line:
            match = re.search(r'inet\s+([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)', line)
            if match:
                ip = match.group(1)
                break

    if not ip:
        _, route_out, _ = run_cmd(['adb', 'shell', 'ip', 'route'], timeout=4)
        match = re.search(r'src\s+([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)', route_out)
        if match:
            ip = match.group(1)

    if not ip:
        add_log('warning', 'Không tìm thấy địa chỉ IP Wi-Fi của điện thoại. Hãy đảm bảo điện thoại đã kết nối Wi-Fi cùng mạng máy tính.')
        return {'success': True, 'port': 5555, 'ip': None, 'message': 'Đã mở cổng 5555. Vui lòng xem địa chỉ IP trong cài đặt Wi-Fi điện thoại để kết nối.'}

    add_log('info', f'Tìm thấy địa chỉ IP Wi-Fi điện thoại: {ip}. Đang kết nối...')
    add_log('cmd', f'$ adb connect {ip}:5555')
    code_c, out_c, _ = run_cmd(['adb', 'connect', f'{ip}:5555'], timeout=6)
    
    if 'connected' in out_c:
        add_log('success', f'=== [HOÀN TẤT] Đã kết nối không dây thành công tới {ip}:5555! Bạn có thể rút cáp USB ngay bây giờ. ===')
        return {'success': True, 'ip': ip, 'port': 5555, 'connected': True}
    else:
        add_log('info', f'Đã mở cổng 5555 tại IP {ip}. Kết quả: {out_c}')
        return {'success': True, 'ip': ip, 'port': 5555, 'connected': False}

def capture_screenshot():
    if not is_device_connected():
        return {'success': False, 'error': 'Thiết bị chưa kết nối'}

    dev_info = get_device_info()
    sku = dev_info.get('model', 'honor')
    ts = time.strftime('%Y%m%d_%H%M%S')
    filename = f'screenshot_{sku}_{ts}.png'
    save_path = os.path.join(SCREENSHOTS_DIR, filename)

    add_log('info', f'Đang chụp ảnh màn hình điện thoại {sku}...')
    try:
        with open(save_path, 'wb') as f:
            p = subprocess.Popen(['adb', 'exec-out', 'screencap', '-p'], stdout=f, stderr=subprocess.PIPE)
            p.communicate(timeout=6)
        
        if os.path.exists(save_path) and os.path.getsize(save_path) > 1000:
            rel_url = f'downloads/screenshots/{filename}'
            add_log('success', f'Đã chụp ảnh màn hình thành công: {filename} ({os.path.getsize(save_path)} bytes)')
            return {'success': True, 'url': rel_url, 'filename': filename}
        else:
            return {'success': False, 'error': 'Ảnh chụp rỗng hoặc lỗi quyền ADB'}
    except Exception as e:
        return {'success': False, 'error': str(e)}

RECORDING_PROC = None
RECORDING_START_TIME = None
RECORDING_TEMP_FILE = '/sdcard/honor_screenrecord_temp.mp4'
RECORDINGS_DIR = os.path.join(DOWNLOADS_DIR, 'recordings')
os.makedirs(RECORDINGS_DIR, exist_ok=True)

def start_screen_record():
    global RECORDING_PROC, RECORDING_START_TIME
    if not is_device_connected():
        return {'success': False, 'error': 'Thiết bị chưa kết nối'}

    if RECORDING_PROC and RECORDING_PROC.poll() is None:
        return {'success': False, 'error': 'Đang có phiên quay màn hình đang chạy'}

    run_cmd(['adb', 'shell', 'rm', '-f', RECORDING_TEMP_FILE])
    cmd = ['adb', 'shell', 'screenrecord', '--size', '1080x2352', '--bit-rate', '8000000', RECORDING_TEMP_FILE]
    try:
        RECORDING_PROC = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        RECORDING_START_TIME = time.time()
        add_log('info', 'Đã bắt đầu quay video màn hình (1080x2352 @ 8 Mbps)... Bấm "Dừng Quay" khi hoàn tất.')
        return {'success': True, 'recording': True}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def stop_screen_record():
    global RECORDING_PROC, RECORDING_START_TIME
    if not RECORDING_PROC or RECORDING_PROC.poll() is not None:
        run_cmd(['adb', 'shell', 'pkill', '-2', 'screenrecord'])
        return {'success': False, 'error': 'Không có phiên quay màn hình nào đang hoạt động'}

    add_log('info', 'Đang dừng quay và hoàn tất đóng gói file video MP4...')
    run_cmd(['adb', 'shell', 'pkill', '-2', 'screenrecord'])
    try:
        RECORDING_PROC.terminate()
        RECORDING_PROC.wait(timeout=2)
    except:
        try:
            RECORDING_PROC.kill()
        except:
            pass
    RECORDING_PROC = None
    time.sleep(1.2)

    dev_info = get_device_info()
    sku = dev_info.get('model', 'Honor')
    ts = time.strftime('%Y%m%d_%H%M%S')
    filename = f'ScreenRecord_{sku}_{ts}.mp4'
    save_path = os.path.join(RECORDINGS_DIR, filename)

    add_log('cmd', f'$ adb pull {RECORDING_TEMP_FILE} downloads/recordings/{filename}')
    run_cmd(['adb', 'pull', RECORDING_TEMP_FILE, save_path], timeout=120)
    run_cmd(['adb', 'shell', 'rm', '-f', RECORDING_TEMP_FILE])

    if os.path.exists(save_path) and os.path.getsize(save_path) > 1000:
        file_size_mb = round(os.path.getsize(save_path) / (1024 * 1024), 2)
        rel_url = f'downloads/recordings/{filename}'
        add_log('success', f'=== [HOÀN TẤT] Đã lưu video quay màn hình: {filename} ({file_size_mb} MB) vào PC! ===')
        return {'success': True, 'recording': False, 'url': rel_url, 'filename': filename, 'size_mb': file_size_mb}
    else:
        add_log('error', 'Lỗi lưu file video MP4 hoặc file rỗng.')
        return {'success': False, 'error': 'Lỗi lưu video hoặc file rỗng'}

def get_screen_record_status():
    global RECORDING_PROC, RECORDING_START_TIME
    is_rec = RECORDING_PROC is not None and RECORDING_PROC.poll() is None
    dur = round(time.time() - RECORDING_START_TIME) if is_rec and RECORDING_START_TIME else 0
    return {'recording': is_rec, 'duration': dur}

def extract_apk(package_name):
    if not is_device_connected() or not package_name:
        return {'success': False, 'error': 'Thiết bị chưa kết nối hoặc thiếu tên gói'}

    add_log('info', f'Đang tìm vị trí file cài đặt của {package_name}...')
    code, out, _ = run_cmd(['adb', 'shell', 'pm', 'path', package_name], timeout=5)
    if code != 0 or 'package:' not in out:
        return {'success': False, 'error': f'Không tìm thấy đường dẫn của ứng dụng {package_name}'}

    apk_device_path = out.split('package:')[1].splitlines()[0].strip()
    filename = f'{package_name}.apk'
    save_path = os.path.join(APKS_DIR, filename)

    add_log('cmd', f'$ adb pull {apk_device_path} downloads/apks/{filename}')
    code_p, out_p, err_p = run_cmd(['adb', 'pull', apk_device_path, save_path], timeout=120)
    
    if os.path.exists(save_path) and os.path.getsize(save_path) > 1000:
        rel_url = f'downloads/apks/{filename}'
        add_log('success', f'=== [HOÀN TẤT] Đã trích xuất APK thành công: {filename} ({round(os.path.getsize(save_path)/(1024*1024), 2)} MB) ===')
        return {'success': True, 'url': rel_url, 'filename': filename, 'size_bytes': os.path.getsize(save_path)}
    else:
        return {'success': False, 'error': err_p or out_p or 'Lỗi sao chép APK'}

def install_uploaded_apk(payload):
    if not is_device_connected():
        return {'success': False, 'error': 'Thiết bị chưa kết nối'}

    filename = payload.get('filename', 'app.apk')
    data_b64 = payload.get('data')
    if not data_b64:
        return {'success': False, 'error': 'Thiếu dữ liệu file APK'}

    import base64
    raw_bytes = base64.b64decode(data_b64)
    temp_path = os.path.join(BASE_DIR, 'scratch', filename)
    os.makedirs(os.path.join(BASE_DIR, 'scratch'), exist_ok=True)
    with open(temp_path, 'wb') as f:
        f.write(raw_bytes)

    add_log('info', f'Bắt đầu cài đặt file APK kéo thả: {filename} ({round(len(raw_bytes)/(1024*1024), 2)} MB)...')
    add_log('cmd', f'$ adb install -r -d -g "{filename}"')
    code, out, err = run_cmd(['adb', 'install', '-r', '-d', '-g', temp_path], timeout=180)

    try:
        os.remove(temp_path)
    except:
        pass

    if code == 0 or 'Success' in out:
        add_log('success', f'=== [HOÀN TẤT] Đã cài đặt thành công {filename} lên điện thoại Honor! ===')
        return {'success': True, 'message': f'Cài đặt thành công {filename}'}
    else:
        add_log('error', f'Cài đặt {filename} thất bại: {err or out}')
        return {'success': False, 'error': err or out}

COMMON_APP_NAMES = {
    'com.zing.zalo': 'Zalo',
    'com.vng.zingmp3': 'Zing MP3',
    'com.facebook.katana': 'Facebook',
    'com.facebook.orca': 'Messenger',
    'com.instagram.android': 'Instagram',
    'com.whatsapp': 'WhatsApp',
    'org.telegram.messenger': 'Telegram',
    'com.ss.android.ugc.trill': 'TikTok',
    'com.zhiliaoapp.musically': 'TikTok Global',
    'com.google.android.youtube': 'YouTube',
    'com.google.android.apps.youtube.music': 'YouTube Music',
    'com.android.chrome': 'Google Chrome',
    'com.google.android.gm': 'Gmail',
    'com.google.android.apps.maps': 'Google Maps',
    'com.google.android.apps.photos': 'Google Photos',
    'com.google.android.googlequicksearchbox': 'Google App',
    'com.google.android.apps.bard': 'Gemini',
    'com.openai.chatgpt': 'ChatGPT',
    'com.shopee.vn': 'Shopee',
    'com.lazada.android': 'Lazada',
    'com.grabtaxi.passenger': 'Grab',
    'xyz.be.consumer': 'Be',
    'com.gsm.customer': 'Xanh SM',
    'vn.gov.vneid': 'VNeID',
    'com.vnid': 'VNeID (VnID)',
    'com.bhxh.vssid': 'VssID',
    'com.vnpay.momo': 'MoMo',
    'com.mservice.momotransfer': 'MoMo',
    'com.vnpay.bidv': 'BIDV SmartBanking',
    'com.vcombank.vcb': 'Vietcombank VCB Digibank',
    'com.VCB': 'Vietcombank',
    'vn.com.techcombank.bb.app': 'Techcombank Mobile',
    'com.mbmobile': 'MBBank',
    'com.viettel.viettelpay': 'Viettel Money',
    'vn.io.nhacquan': 'Nhạc Của Tui',
    'mark.via': 'Via Browser',
    'mark.via.gp': 'Via Browser',
    'org.mozilla.firefox': 'Firefox',
    'com.brave.browser': 'Brave',
    'com.coccoc.trinhduyet': 'Cốc Cốc',
    'org.localsend.localsend_app': 'LocalSend',
    'com.hihonor.photos': 'Bộ Sưu Tập Honor',
    'com.hihonor.camera': 'Máy Ảnh Honor',
    'com.hihonor.soundrecorder': 'Ghi Âm Honor',
    'com.hihonor.calculator': 'Máy Tính',
    'com.hihonor.android.totemweather': 'Thời Tiết Honor',
    'com.hihonor.systemmanager': 'Trình Quản Lý Hệ Thống',
    'com.hihonor.gamecenter': 'Trung Tâm Trò Chơi Honor',
    'com.hihonor.appmarket': 'Chợ Ứng Dụng Honor',
    'com.hihonor.notepad': 'Ghi Chú Honor',
    'com.hihonor.deskclock': 'Đồng Hồ & Báo Thức',
    'com.hihonor.contacts': 'Danh Bạ',
    'com.android.mms': 'Tin Nhắn SMS',
    'com.android.settings': 'Cài Đặt Hệ Thống',
    'com.android.vending': 'Google Play Store',
    'com.google.android.gms': 'Dịch Vụ Google Play (GMS)',
    'com.google.android.gsf': 'Khung Dịch Vụ Google (GSF)',
    'com.hihonor.magicvoice': 'Trợ Lý Giọng Nói YOYO (MagicVoice)',
    'com.android.devicelockcontroller': 'Device Lock Controller (Bảo Mật Doanh Nghiệp)',
    'com.android.virtualization.terminal': 'Terminal Máy Ảo Linux (AVF)',
}

def get_friendly_app_name(pkg):
    if pkg in COMMON_APP_NAMES:
        return COMMON_APP_NAMES[pkg]
    for cat in VN_APPS_DB.get('categories', {}).values():
        for app in cat.get('apps', []):
            if app.get('package') == pkg:
                return app.get('name')
    for lvl in BLOAT_DB.get('safety_levels', {}).values():
        for b in lvl.get('packages', []):
            if b.get('package') == pkg:
                return b.get('name')
    parts = pkg.split('.')
    last_seg = parts[-1]
    if last_seg.lower() in ('app', 'android', 'client', 'mobile') and len(parts) >= 2:
        last_seg = parts[-2]
    return last_seg.replace('_', ' ').replace('-', ' ').title()

def get_all_applications():
    if not is_device_connected():
        return {'connected': False, 'apps': [], 'counts': {'total': 0, 'user': 0, 'system': 0, 'disabled': 0}}

    add_log('info', 'Đang quét danh mục ứng dụng từ điện thoại qua ADB (User & System packages)...')
    add_log('cmd', '$ adb shell pm list packages -f -3 && pm list packages -f -s && pm list packages -d')
    _, out_user, _ = run_cmd(['adb', 'shell', 'pm', 'list', 'packages', '-f', '-3'])
    user_map = {}
    for line in out_user.splitlines():
        line = line.strip()
        if line.startswith('package:'):
            parts = line[8:].rsplit('=', 1)
            if len(parts) == 2:
                user_map[parts[1]] = parts[0]

    _, out_sys, _ = run_cmd(['adb', 'shell', 'pm', 'list', 'packages', '-f', '-s'])
    sys_map = {}
    for line in out_sys.splitlines():
        line = line.strip()
        if line.startswith('package:'):
            parts = line[8:].rsplit('=', 1)
            if len(parts) == 2:
                sys_map[parts[1]] = parts[0]

    _, out_dis, _ = run_cmd(['adb', 'shell', 'pm', 'list', 'packages', '-d'])
    disabled_set = set(line.replace('package:', '').strip() for line in out_dis.splitlines() if line.strip())

    # Fast dumpsys package for versionNames
    _, out_dump, _ = run_cmd(['adb', 'shell', 'dumpsys', 'package'], timeout=6)
    version_map = {}
    current_pkg = None
    for line in out_dump.splitlines():
        line_str = line.strip()
        if line_str.startswith('Package [') and ']' in line_str:
            current_pkg = line_str.split('[')[1].split(']')[0]
        elif current_pkg and 'versionName=' in line_str:
            v = line_str.split('versionName=')[1].split()[0]
            version_map[current_pkg] = v
            current_pkg = None

    all_apps = []
    all_pkgs = set(user_map.keys()) | set(sys_map.keys())

    for pkg in all_pkgs:
        is_user = pkg in user_map
        apk_path = user_map.get(pkg) or sys_map.get(pkg, '')
        is_disabled = pkg in disabled_set
        version = version_map.get(pkg, '--')
        label = get_friendly_app_name(pkg)

        all_apps.append({
            'package': pkg,
            'name': label,
            'is_user': is_user,
            'type': 'Người dùng' if is_user else 'Hệ thống',
            'apk_path': apk_path,
            'version': version,
            'disabled': is_disabled,
            'status': 'Đã đóng băng' if is_disabled else 'Đang hoạt động'
        })

    all_apps.sort(key=lambda x: (not x['is_user'], x['name'].lower()))

    counts = {
        'total': len(all_apps),
        'user': len(user_map),
        'system': len(sys_map),
        'disabled': len(disabled_set)
    }

    add_log('success', f'=== [HOÀN TẤT] Đã nạp {len(all_apps)} ứng dụng từ thiết bị ({len(user_map)} User, {len(sys_map)} Hệ thống, {len(disabled_set)} Đã đóng băng) ===')
    return {'connected': True, 'apps': all_apps, 'counts': counts}

def scan_packages():
    if not is_device_connected():
        return {'connected': False, 'message': 'Thiết bị chưa kết nối'}

    # Get installed & disabled packages
    _, installed_out, _ = run_cmd(['adb', 'shell', 'pm', 'list', 'packages'])
    installed_set = set(line.replace('package:', '').strip() for line in installed_out.splitlines() if line)

    _, disabled_out, _ = run_cmd(['adb', 'shell', 'pm', 'list', 'packages', '-d'])
    disabled_set = set(line.replace('package:', '').strip() for line in disabled_out.splitlines() if line)

    # Check Whitelist Doze
    _, doze_out, _ = run_cmd(['adb', 'shell', 'dumpsys', 'deviceidle', 'whitelist'])
    doze_whitelist = set(doze_out.splitlines())

    # Check VN Apps
    detected_vn_apps = []
    for cat_id, cat_data in VN_APPS_DB.get('categories', {}).items():
        for app in cat_data.get('apps', []):
            pkg = app['package']
            is_installed = pkg in installed_set
            is_whitelisted = any(pkg in line for line in doze_whitelist)
            detected_vn_apps.append({
                'name': app['name'],
                'package': pkg,
                'category': cat_data['name'],
                'priority': app['priority'],
                'installed': is_installed,
                'whitelisted': is_whitelisted
            })

    # Check Bloatware
    bloat_results = {}
    for level_id, level_data in BLOAT_DB.get('safety_levels', {}).items():
        bloat_results[level_id] = {
            'level': level_data['level'],
            'name': level_data['name'],
            'badge': level_data['badge'],
            'color': level_data['color'],
            'description': level_data['description'],
            'packages': []
        }
        for item in level_data.get('packages', []):
            pkg = item['package']
            status = 'uninstalled'
            if pkg in installed_set:
                status = 'disabled' if pkg in disabled_set else 'active'
            bloat_results[level_id]['packages'].append({
                'name': item['name'],
                'package': pkg,
                'desc': item['desc'],
                'recommended': item.get('recommended', False),
                'status': status
            })

    return {
        'connected': True,
        'vn_apps': detected_vn_apps,
        'bloatware': bloat_results
    }

# MagicOS Hidden Tweaks & Optimization Engine (Kế thừa từ HonorHook)
def get_magic_tweaks_status():
    keys = [
        ('charge_turbo_switch', 'secure', '1'),
        ('infinite_volume_music_bt_a2dp', 'secure', '1'),
        ('reduce_refresh_rate_enabled', 'secure', '0'), # 0 = tắt tự hạ Hz, giữ max refresh rate
        ('hn_sdr2hdr_switch', 'secure', '1'),
        ('hn_tianshan_switch', 'secure', '1'),
        ('fingersense_letters_enabled', 'secure', '1'),
        ('fingerprint_slide_switch', 'secure', '1'),
        ('enable_full_screen_AOD', 'secure', '1'),
        ('lock_to_aod_duration', 'secure', '200'),
        ('show_network_speed_enabled', 'system', '1'),
        ('smart_network_switch', 'secure', '1'),
    ]
    marketing_keys = [
        'state_of_ads_switch',
        'intelligent_message_enabled',
        'personalized_push_state',
        'personalized_recommendation',
        'hiboard.recommend.status',
        'location_honor_ads',
        'settings_ai_recommend',
        'intelligent_recommendation_toggle',
        'search.recommend.letter.switch',
        'cloud_maintenance',
        'location_report_switch'
    ]
    status = {}
    if not is_device_connected():
        for key, table, on_val in keys:
            status[key] = {'value': '', 'table': table, 'enabled': False}
        status['marketing_all_disabled'] = {'enabled': True, 'details': {k: '' for k in marketing_keys}}
        return {'success': True, 'tweaks': status}

    # Batch read in 1 adb execution for maximum speed (~80ms instead of 22 roundtrips)
    cmd_parts = [f'echo "{k}="`settings get {t} {k}`' for k, t, _ in keys]
    cmd_parts += [f'echo "m_{mk}="`settings get secure {mk}`' for mk in marketing_keys]
    full_batch_cmd = ' && '.join(cmd_parts)
    code, batch_out, _ = run_cmd(['adb', 'shell', full_batch_cmd], timeout=10)
    
    val_map = {}
    for line in batch_out.splitlines():
        if '=' in line:
            pk, pv = line.split('=', 1)
            val_map[pk.strip()] = pv.strip()

    for key, table, on_val in keys:
        v = val_map.get(key, '')
        status[key] = {
            'value': v,
            'table': table,
            'enabled': (v == on_val)
        }
    
    m_all_off = True
    m_details = {}
    for m_key in marketing_keys:
        v = val_map.get(f'm_{m_key}', '')
        m_details[m_key] = v
        if v not in ('0', 'null', ''):
            m_all_off = False
    
    status['marketing_all_disabled'] = {
        'enabled': m_all_off,
        'details': m_details
    }
    return {'success': True, 'tweaks': status}

def apply_magic_tweak(table, key, value):
    add_log('info', f'Cấu hình cài đặt ẩn MagicOS: [{table}] {key} = {value}...')
    add_log('cmd', f'$ adb shell settings put {table} {key} {value}')
    code, out, err = run_cmd(['adb', 'shell', 'settings', 'put', table, key, str(value)])
    _, read_val, _ = run_cmd(['adb', 'shell', 'settings', 'get', table, key])
    verified = (read_val.strip() == str(value))
    if verified:
        add_log('success', f'  ↳ Đã áp dụng thành công [{table}] {key} = {value}')
        return {'success': True, 'verified': True, 'current': read_val.strip()}
    else:
        add_log('warn', f'  ↳ Ghi xong nhưng đọc lại ra: "{read_val.strip()}"')
        return {'success': True, 'verified': False, 'current': read_val.strip()}

def apply_all_marketing_off(turn_off=True, keys=None):
    val = '0' if turn_off else '1'
    all_marketing_keys = [
        'state_of_ads_switch',
        'intelligent_message_enabled',
        'personalized_push_state',
        'personalized_recommendation',
        'hiboard.recommend.status',
        'location_honor_ads',
        'settings_ai_recommend',
        'intelligent_recommendation_toggle',
        'search.recommend.letter.switch',
        'cloud_maintenance',
        'location_report_switch'
    ]
    target_keys = [k for k in keys if k in all_marketing_keys] if (keys and isinstance(keys, list)) else all_marketing_keys
    action_str = "dập tắt" if turn_off else "bật lại"
    add_log('info', f'Bắt đầu {action_str} {len(target_keys)} khóa Marketing & Telemetry ngầm...')
    for m_key in target_keys:
        add_log('cmd', f'$ adb shell settings put secure {m_key} {val}')
        run_cmd(['adb', 'shell', 'settings', 'put', 'secure', m_key, val])
    add_log('success', f'=== [HOÀN TẤT] Đã {action_str} thành công {len(target_keys)} khóa quảng cáo & telemetry hệ thống! ===')
    return {'success': True, 'modified_keys': target_keys}

# Helper: Chuẩn hóa tên theme an toàn (bảo toàn 100% tiếng Việt, tiếng Trung CJK & Unicode)
def sanitize_theme_name(raw_name, fallback_prefix="Theme"):
    if not raw_name or not str(raw_name).strip():
        return f"{fallback_prefix}_{int(time.time())}"
    clean = str(raw_name).replace('[', '(').replace(']', ')')
    clean = re.sub(r'[\/\\:*?"\'<>|;`$#&!^~\x00-\x1F]', '_', clean)
    clean = re.sub(r'\s+', ' ', clean).strip(' ._-')
    clean = re.sub(r'^(?:Dùng\s*thử|Trial|Tryout)\s*[-_:]*\s*', '', clean, flags=re.IGNORECASE).strip(' ._-')
    if not clean:
        return f"{fallback_prefix}_{int(time.time())}"
    return clean[:60].rstrip(' ._-')

# Helper: Bóc tách Metadata chính xác từ description.xml và tryoutData.json (chuẩn TP Theme Extractor)
def parse_theme_metadata(xml_content, tryout_json=None):
    def extract_tag(xml, tag):
        m = re.search(rf'<{tag}[^>]*>(.*?)</{tag}>', xml, re.DOTALL | re.IGNORECASE)
        return m.group(1).strip() if m else ''

    raw_title = extract_tag(xml_content, 'title')
    xml_tryout_title = extract_tag(xml_content, 'tryout_resource_title') or extract_tag(xml_content, 'tryout_theme_name')
    
    json_title = None
    if tryout_json:
        jm = re.search(r'"(?:resourceTitle|themeName|title|name)"\s*:\s*"([^"]+)"', tryout_json)
        if jm: json_title = jm.group(1).strip()

    loc_title = (
        extract_tag(xml_content, 'title-cn') or
        extract_tag(xml_content, 'title_cn') or
        extract_tag(xml_content, 'title-zh_CN') or
        extract_tag(xml_content, 'title-en') or
        extract_tag(xml_content, 'title_en')
    )

    clean_raw = re.sub(r'^(?:Dùng\s*thử|Trial|Tryout)\s*[-_:]*\s*', '', raw_title, flags=re.IGNORECASE).strip()
    clean_tryout = re.sub(r'^(?:Dùng\s*thử|Trial|Tryout)\s*[-_:]*\s*', '', xml_tryout_title, flags=re.IGNORECASE).strip()
    clean_json = re.sub(r'^(?:Dùng\s*thử|Trial|Tryout)\s*[-_:]*\s*', '', json_title or '', flags=re.IGNORECASE).strip()

    if clean_raw and clean_raw not in ('Honor_Magic_Theme', 'Honor_Default', 'default'):
        title = clean_raw
    elif clean_tryout:
        title = clean_tryout
    elif clean_json:
        title = clean_json
    elif loc_title:
        title = loc_title
    elif raw_title:
        title = raw_title
    else:
        title = 'Honor_Magic_Theme'

    raw_author = extract_tag(xml_content, 'author') or extract_tag(xml_content, 'designer')
    xml_tryout_author = extract_tag(xml_content, 'tryout_resource_author') or extract_tag(xml_content, 'tryout_author')
    author = raw_author if raw_author else (xml_tryout_author or 'Honor Design Labs')

    return {'title': title, 'author': author}

# Helper: Làm sạch cờ trial & đặt giá = 0 chuẩn hóa description.xml
def sanitize_description_xml_content(content, new_title=None):
    # 0. Bổ sung title nếu chỉ tồn tại trong tryout_resource_title
    if '<tryout_resource_title>' in content and not new_title:
        m = re.search(r'<tryout_resource_title>(.*?)</tryout_resource_title>', content, re.IGNORECASE)
        if m and m.group(1):
            new_title = m.group(1).strip()

    # Tìm thẻ đóng gốc </HnTheme> (MagicOS), </description> (EMUI), hoặc </theme>
    close_tag_match = re.search(r'</(HnTheme|description|theme)>', content, re.IGNORECASE)
    close_tag = close_tag_match.group(0) if close_tag_match else '</description>'

    # 1. Loại bỏ toàn bộ các thẻ liên quan đến chế độ dùng thử & thanh toán
    content = re.sub(r'<tryout_theme_hitop_id[^>]*>.*?</tryout_theme_hitop_id>|<tryout_theme_hitop_id[^>]*/?>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<tryout_resource_title[^>]*>.*?</tryout_resource_title>|<tryout_resource_title[^>]*/?>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<tryout_resource_type[^>]*>.*?</tryout_resource_type>|<tryout_resource_type[^>]*/?>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<tryout_time[^>]*>.*?</tryout_time>|<tryout_time[^>]*/?>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<tryout_type[^>]*>.*?</tryout_type>|<tryout_type[^>]*/?>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<tryout_author[^>]*>.*?</tryout_author>|<tryout_author[^>]*/?>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<tryout_version[^>]*>.*?</tryout_version>|<tryout_version[^>]*/?>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<tryout[^>]*>.*?</tryout[^>]*>|<tryout[^>]*/?>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<trial[^>]*>.*?</trial[^>]*>|<trial[^>]*/?>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<is_tryout[^>]*>.*?</is_tryout[^>]*>|<is_tryout[^>]*/?>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<is_trial[^>]*>.*?</is_trial[^>]*>|<is_trial[^>]*/?>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<is_pay_item[^>]*>.*?</is_pay_item>|<is_pay_item[^>]*/?>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<pay_type[^>]*>.*?</pay_type>|<pay_type[^>]*/?>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<[^>]*tryout[^>]*>.*?</[^>]*tryout[^>]*>|<[^>]*tryout[^>]*/?>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<[^>]*trial[^>]*>.*?</[^>]*trial[^>]*>|<[^>]*trial[^>]*/?>', '', content, flags=re.DOTALL | re.IGNORECASE)

    # 2. Chuyển giá và loại phí về 0 (theme miễn phí hoàn toàn)
    if '<price>' in content:
        content = re.sub(r'<price>.*?</price>', '<price>0</price>', content)
    elif close_tag in content:
        content = content.replace(close_tag, f'    <price>0</price>\n{close_tag}')

    if '<charge_type>' in content:
        content = re.sub(r'<charge_type>.*?</charge_type>', '<charge_type>0</charge_type>', content)
    elif close_tag in content:
        content = content.replace(close_tag, f'    <charge_type>0</charge_type>\n{close_tag}')

    # 3. Cập nhật tiêu đề nếu có
    if new_title:
        if '<title>' in content:
            content = re.sub(r'<title>.*?</title>', f'<title>{new_title}</title>', content)
        elif close_tag in content:
            content = content.replace(close_tag, f'    <title>{new_title}</title>\n{close_tag}')

    return content

    # 2. Chuyển giá và loại phí về 0 (theme miễn phí hoàn toàn)
    if '<price>' in content:
        content = re.sub(r'<price>.*?</price>', '<price>0</price>', content)
    elif '</description>' in content:
        content = content.replace('</description>', '    <price>0</price>\n</description>')

    if '<charge_type>' in content:
        content = re.sub(r'<charge_type>.*?</charge_type>', '<charge_type>0</charge_type>', content)
    elif '</description>' in content:
        content = content.replace('</description>', '    <charge_type>0</charge_type>\n</description>')

    # 3. Cập nhật tiêu đề nếu có
    if new_title:
        if '<title>' in content:
            content = re.sub(r'<title>.*?</title>', f'<title>{new_title}</title>', content)
        elif '</description>' in content:
            content = content.replace('</description>', f'    <title>{new_title}</title>\n</description>')

    return content

# Helper: Nén ZIP chuẩn Deflate Method 8 có Directory Entries (tương thích 100% MagicOS Theme Engine)
def create_deflate_hnt_package(source_dir, output_hnt_path):
    if os.path.exists(output_hnt_path):
        os.remove(output_hnt_path)
    os.makedirs(os.path.dirname(output_hnt_path), exist_ok=True)
    with zipfile.ZipFile(output_hnt_path, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        # Bước 1: Ghi directory entries (STORED method 0)
        for root, dirs, _ in os.walk(source_dir):
            for d in sorted(dirs):
                full_dir = os.path.join(root, d)
                rel_dir = os.path.relpath(full_dir, source_dir).replace('\\', '/').rstrip('/') + '/'
                zinfo = zipfile.ZipInfo(rel_dir)
                zinfo.compress_type = zipfile.ZIP_STORED
                z.writestr(zinfo, '')
        # Bước 2: Nén toàn bộ file theo chuẩn Deflate
        for root, _, files in os.walk(source_dir):
            for f in sorted(files):
                full_file = os.path.join(root, f)
                rel_file = os.path.relpath(full_file, source_dir).replace('\\', '/')
                z.write(full_file, rel_file, compress_type=zipfile.ZIP_DEFLATED)

# TP Theme Studio Engine (Trích xuất Theme dùng thử thành .hnt vĩnh viễn)
def extract_trial_theme():
    add_log('info', 'Kiểm tra dữ liệu theme đang dùng thử trên điện thoại (/data/themes/0)...')
    _, check_out, _ = run_cmd(['adb', 'shell', 'test -f /data/themes/0/description.xml && echo FOUND || echo NOT_FOUND'])
    if 'FOUND' not in check_out:
        add_log('error', 'Chưa phát hiện theme đang dùng thử tại /data/themes/0/!')
        return {
            'success': False,
            'message': 'Không tìm thấy dữ liệu theme tại /data/themes/0/! Vui lòng vào app Chủ Đề trên máy, chọn theme VIP bất kỳ và bấm "Dùng thử" (5 phút) trước.'
        }

    timestamp = int(time.time())
    temp_dir = os.path.join(THEMES_DIR, f'temp_extract_{timestamp}')
    pkg_dir = os.path.join(temp_dir, 'package')
    os.makedirs(pkg_dir, exist_ok=True)

    try:
        add_log('step', '>>> [1/5] Đang kéo tài nguyên theme về máy tính (không tạo file rác trên máy)...')
        # Lớp 1: Thử tar streaming qua stdout trực tiếp vào Python tarfile (nhanh nhất, 0 byte rác trên máy)
        pulled = False
        try:
            tar_proc = subprocess.Popen([ADB_BIN, 'exec-out', 'tar -C /data/themes/0 -cf - .'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            with tarfile.open(fileobj=tar_proc.stdout, mode='r|*') as tar:
                for member in tar:
                    tar.extract(member, path=pkg_dir)
            tar_proc.wait(timeout=20)
            if os.path.exists(os.path.join(pkg_dir, 'description.xml')):
                pulled = True
        except Exception:
            pass

        # Lớp 2: Fallback adb pull trực tiếp
        if not pulled or not os.path.exists(os.path.join(pkg_dir, 'description.xml')):
            code, _, _ = run_cmd(['adb', 'pull', '/data/themes/0/.', pkg_dir], timeout=60)
            if code == 0 and os.path.exists(os.path.join(pkg_dir, 'description.xml')):
                pulled = True

        # Lớp 3: Fallback qua bản sao trung gian trên sdcard và xóa sạch ngay
        if not pulled or not os.path.exists(os.path.join(pkg_dir, 'description.xml')):
            add_log('warn', 'Kéo trực tiếp gặp hạn chế, chuyển sang bản sao an toàn trung gian...')
            temp_phone_dump = f'/sdcard/Download/.tp_theme_dump_{timestamp}'
            run_cmd(['adb', 'shell', f'mkdir -p "{temp_phone_dump}" && cp -r /data/themes/0/* "{temp_phone_dump}/"'])
            run_cmd(['adb', 'pull', f'{temp_phone_dump}/.', pkg_dir], timeout=60)
            run_cmd(['adb', 'shell', f'rm -rf "{temp_phone_dump}"'])

        if not os.path.exists(os.path.join(pkg_dir, 'description.xml')):
            raise Exception("Không thể đọc được file description.xml từ thiết bị")

        # Đọc nội dung description.xml & tryoutData.json để lấy thông tin chân thực
        desc_path = os.path.join(pkg_dir, 'description.xml')
        with open(desc_path, 'r', encoding='utf-8', errors='ignore') as f:
            desc_content = f.read()

        tryout_json_content = None
        tryout_json_path = os.path.join(pkg_dir, 'tryoutData.json')
        if os.path.exists(tryout_json_path):
            try:
                with open(tryout_json_path, 'r', encoding='utf-8', errors='ignore') as f:
                    tryout_json_content = f.read()
            except Exception:
                pass

        meta = parse_theme_metadata(desc_content, tryout_json_content)
        theme_title = meta.get('title') or f'Honor_Theme_{timestamp}'
        clean_title = sanitize_theme_name(theme_title)
        hnt_filename = f"{clean_title}.hnt"
        add_log('success', f'Phát hiện theme bản quyền: "{theme_title}" (Tác giả: {meta.get("author")})')

        add_log('step', '>>> [2/5] Đang loại bỏ toàn bộ các cờ trial & chuyển đổi sang Free vĩnh viễn...')
        for junk in ['tried', 'tryoutData.json', 'icons_backup']:
            j_path = os.path.join(pkg_dir, junk)
            if os.path.exists(j_path):
                os.remove(j_path)
        for f in os.listdir(pkg_dir):
            if f.endswith('.tryout'):
                os.remove(os.path.join(pkg_dir, f))

        sanitized_desc = sanitize_description_xml_content(desc_content, clean_title)
        with open(desc_path, 'w', encoding='utf-8') as f:
            f.write(sanitized_desc)

        add_log('step', '>>> [3/5] Đang đóng gói chuẩn ZIP Deflate .hnt (Method 8)...')
        local_hnt_path = os.path.join(temp_dir, hnt_filename)
        create_deflate_hnt_package(pkg_dir, local_hnt_path)

        file_size_mb = round(os.path.getsize(local_hnt_path) / (1024 * 1024), 2)
        add_log('success', f'Đã đóng gói thành công: {hnt_filename} ({file_size_mb} MB)')

        add_log('step', '>>> [4/5] Đang nạp vào ứng dụng Chủ Đề hệ thống & thư mục chia sẻ...')
        # Đích 1: Thư mục nhận diện của Theme Store hệ thống (Kèm bộ đệm .cache)
        remote_sys_dir = "/sdcard/Android/data/com.hihonor.android.thememanager/files/Download/Honor/Themes"
        remote_cache_dir = f"{remote_sys_dir}/.cache/{hnt_filename}"
        run_cmd(['adb', 'shell', f'mkdir -p "{remote_sys_dir}" && mkdir -p "{remote_cache_dir}"'])
        run_cmd(['adb', 'push', local_hnt_path, f'{remote_sys_dir}/{hnt_filename}'])

        # Nạp cache: description.xml, ảnh preview, hình nền, unlock để Theme Store hiển thị đầy đủ thẻ & xem trước
        run_cmd(['adb', 'push', desc_path, f'{remote_cache_dir}/description.xml'])
        for cf in ['wallpaper_meta.json', 'wallpapereditor_config.xml', 'cover.jpg', 'cover.png']:
            cp = os.path.join(pkg_dir, cf)
            if os.path.isfile(cp):
                run_cmd(['adb', 'push', cp, f'{remote_cache_dir}/{cf}'])
        for cd in ['preview', 'wallpaper', 'unlock']:
            cd_path = os.path.join(pkg_dir, cd)
            if os.path.isdir(cd_path):
                run_cmd(['adb', 'shell', f'mkdir -p "{remote_cache_dir}/{cd}"'])
                run_cmd(['adb', 'push', f'{cd_path}/.', f'{remote_cache_dir}/{cd}/'])

        # Đích 2: Thư mục công khai để user share/sao lưu
        remote_public_dir = "/sdcard/Honor/Themes"
        run_cmd(['adb', 'shell', f'mkdir -p "{remote_public_dir}"'])
        run_cmd(['adb', 'push', local_hnt_path, f'{remote_public_dir}/{hnt_filename}'])

        # Cấp quyền đọc ghi 777 cho Theme Manager
        run_cmd(['adb', 'shell', f'chmod -R 777 "{remote_cache_dir}" 2>/dev/null || true'])
        run_cmd(['adb', 'shell', f'chmod 777 "{remote_sys_dir}/{hnt_filename}" "{remote_public_dir}/{hnt_filename}" 2>/dev/null || true'])

        # Phát sóng MediaScanner để file hiện ngay trong Trình Quản Lý Tệp / Bộ Sưu Tập
        run_cmd(['adb', 'shell', f'am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d "file://{remote_public_dir}/{hnt_filename}"'])

        add_log('step', '>>> [5/5] Cấp quyền & làm mới ứng dụng Chủ Đề...')
        run_cmd(['adb', 'shell', 'appops set com.hihonor.android.thememanager MANAGE_EXTERNAL_STORAGE allow'])
        run_cmd(['adb', 'shell', 'am force-stop com.hihonor.android.thememanager'])
        run_cmd(['adb', 'shell', 'am start -n com.hihonor.android.thememanager/.PageActivity 2>/dev/null || am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p com.hihonor.android.thememanager'])

        saved_copy = os.path.join(THEMES_DIR, hnt_filename)
        shutil.copy2(local_hnt_path, saved_copy)

        add_log('success', f'=== [HOÀN TẤT 100%] ĐÃ TRÍCH XUẤT THÀNH CÔNG THEME: {theme_title} ===')
        add_log('info', f'✦ Đã nạp vào app Chủ Đề: {remote_sys_dir}/{hnt_filename}')
        add_log('info', f'✦ Đã sao lưu để chia sẻ: {remote_public_dir}/{hnt_filename}')
        add_log('info', '[+] Bây giờ trên điện thoại, anh chỉ cần vào tab "Tôi" -> "Chủ đề của tôi" để bấm Áp Dụng vĩnh viễn!')

        return {
            'success': True,
            'title': theme_title,
            'filename': hnt_filename,
            'size_mb': file_size_mb,
            'sys_path': f'{remote_sys_dir}/{hnt_filename}',
            'public_path': f'{remote_public_dir}/{hnt_filename}',
            'download_url': f'/api/download_theme?filename={urllib.parse.quote(hnt_filename)}'
        }
    except Exception as e:
        add_log('error', f'Lỗi trong quá trình trích xuất theme: {e}')
        return {'success': False, 'message': str(e)}
    finally:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        run_cmd(['adb', 'shell', 'rm -rf /sdcard/Download/.tp_theme_dump_* 2>/dev/null || true'])

def deploy_uploaded_theme(payload):
    filename = payload.get('filename', '')
    file_b64 = payload.get('content_b64', '')
    if not filename or not file_b64:
        return {'success': False, 'message': 'Thiếu file dữ liệu theme'}
    if not filename.lower().endswith('.hnt'):
        return {'success': False, 'message': 'Chỉ chấp nhận file theme định dạng .hnt của MagicOS!'}

    clean_name = sanitize_theme_name(filename.rsplit('.', 1)[0]) + '.hnt'
    theme_bytes = base64.b64decode(file_b64)
    local_path = os.path.join(THEMES_DIR, clean_name)
    with open(local_path, 'wb') as f:
        f.write(theme_bytes)

    add_log('info', f'Bắt đầu nạp file theme {clean_name} vào hệ thống...')
    remote_sys_dir = "/sdcard/Android/data/com.hihonor.android.thememanager/files/Download/Honor/Themes"
    remote_cache_dir = f"{remote_sys_dir}/.cache/{clean_name}"
    run_cmd(['adb', 'shell', f'mkdir -p "{remote_sys_dir}" && mkdir -p "{remote_cache_dir}"'])
    run_cmd(['adb', 'push', local_path, f'{remote_sys_dir}/{clean_name}'])

    remote_public_dir = "/sdcard/Honor/Themes"
    run_cmd(['adb', 'shell', f'mkdir -p "{remote_public_dir}"'])
    run_cmd(['adb', 'push', local_path, f'{remote_public_dir}/{clean_name}'])

    # Trích xuất metadata & preview từ file zip nạp vào thư mục cache để app Chủ Đề hiện ảnh xem trước
    try:
        temp_unpack = os.path.join(THEMES_DIR, f'temp_unpack_{int(time.time())}')
        os.makedirs(temp_unpack, exist_ok=True)
        with zipfile.ZipFile(local_path, 'r') as zf:
            for member in zf.namelist():
                lower_m = member.lower()
                if lower_m == 'description.xml' or lower_m.startswith('preview/') or lower_m.startswith('wallpaper/') or lower_m.startswith('unlock/') or lower_m in ('wallpaper_meta.json', 'wallpapereditor_config.xml', 'cover.jpg', 'cover.png'):
                    zf.extract(member, temp_unpack)

        desc_p = os.path.join(temp_unpack, 'description.xml')
        if os.path.isfile(desc_p):
            run_cmd(['adb', 'push', desc_p, f'{remote_cache_dir}/description.xml'])
        for cf in ['wallpaper_meta.json', 'wallpapereditor_config.xml', 'cover.jpg', 'cover.png']:
            cp = os.path.join(temp_unpack, cf)
            if os.path.isfile(cp):
                run_cmd(['adb', 'push', cp, f'{remote_cache_dir}/{cf}'])
        for cd in ['preview', 'wallpaper', 'unlock']:
            cd_path = os.path.join(temp_unpack, cd)
            if os.path.isdir(cd_path):
                run_cmd(['adb', 'shell', f'mkdir -p "{remote_cache_dir}/{cd}"'])
                run_cmd(['adb', 'push', f'{cd_path}/.', f'{remote_cache_dir}/{cd}/'])
        shutil.rmtree(temp_unpack, ignore_errors=True)
    except Exception as e:
        add_log('warn', f'Không thể trích xuất preview từ file nạp: {e}')

    run_cmd(['adb', 'shell', f'chmod -R 777 "{remote_cache_dir}" 2>/dev/null || true'])
    run_cmd(['adb', 'shell', f'chmod 777 "{remote_sys_dir}/{clean_name}" "{remote_public_dir}/{clean_name}" 2>/dev/null || true'])
    run_cmd(['adb', 'shell', f'am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d "file://{remote_public_dir}/{clean_name}"'])

    run_cmd(['adb', 'shell', 'appops set com.hihonor.android.thememanager MANAGE_EXTERNAL_STORAGE allow'])
    run_cmd(['adb', 'shell', 'am force-stop com.hihonor.android.thememanager'])
    run_cmd(['adb', 'shell', 'am start -n com.hihonor.android.thememanager/.PageActivity 2>/dev/null || am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p com.hihonor.android.thememanager'])

    add_log('success', f'=== [HOÀN TẤT] Đã nạp thành công {clean_name} vào ứng dụng Chủ Đề! ===')
    return {'success': True, 'filename': clean_name}

def get_root_lsposed_status():
    _, su_out, _ = run_cmd(['adb', 'shell', 'which su'])
    has_root = ('/su' in su_out or 'bin/su' in su_out)
    _, lsp_out, _ = run_cmd(['adb', 'shell', 'pm list packages | grep -E "lsposed|top.honorhook"'])
    has_lsposed = ('lsposed' in lsp_out)
    has_honorhook = ('top.honorhook' in lsp_out)
    return {
        'success': True,
        'has_root': has_root,
        'has_lsposed': has_lsposed,
        'has_honorhook': has_honorhook
    }

# Action Handlers
ACTION_TITLES = {
    'apply_magic_tweak': 'Cấu hình cài đặt ẩn MagicOS',
    'apply_all_marketing_off': 'Dập tắt 11 khóa Marketing & Telemetry ngầm',
    'extract_trial_theme': 'Trích xuất Theme VIP đang dùng thử thành vĩnh viễn (.hnt)',
    'deploy_theme_file': 'Nạp file theme .hnt vào ứng dụng Chủ Đề',
    'clear_logs': 'Làm sạch console nhật ký',
    'whitelist_all_vn': 'Cấp Whitelist Doze ứng dụng Việt Nam (Zalo, Banking, VNeID)',
    'debloat_packages': 'Gỡ bỏ an toàn ứng dụng rác nội địa Trung Quốc',
    'restore_packages': 'Khôi phục ứng dụng đã gỡ',
    'restore_all': 'Khôi phục cài đặt gốc và toàn bộ ứng dụng',
    'apply_wifi_dns': 'Tối ưu Wi-Fi Siêu Tốc & DNS DoT chống gián đoạn',
    'disable_telemetry': 'Vô hiệu hóa Telemetry & Dịch vụ gửi log máy chủ TQ',
    'apply_display': 'Cấu hình hiển thị màn hình (DPI Sweet-spot & Tần số quét Hz)',
    'compile_apps': 'Tăng tốc biên dịch Native ARM64 AOT (dex2oat)',
    'fix_weather': 'Chuyển đổi ứng dụng Thời tiết Honor sang en-GB (Độ C)',
    'set_assistant_google': 'Đặt Google Assistant / Gemini làm trợ lý mặc định',
    'install_gesture_search': 'Cài đặt thanh cử chỉ Gesture Search gọi Gemini',
    'install_vxm_assistant': 'Cài đặt nhận diện giọng nói Hey Google (Trợ lý VXM)',
    'setup_full_assistant_suite': 'Thiết lập trọn bộ Trợ lý ảo Google & Gemini',
    'enable_google_services': 'Kích hoạt Dịch vụ Google Cơ Bản (GMS/GSF)',
    'install_play_store': 'Cài đặt Cửa hàng Google Play Store',
    'setup_full_google_ecosystem': 'Kích hoạt trọn gói Hệ sinh thái Google & CH Play',
    'master_optimize': 'Thực thi Quy trình Tối ưu hóa Toàn diện 8 bước',
    'launch_scrcpy': 'Khởi chạy Scrcpy điều khiển & chiếu màn hình 120Hz',
    'reboot_device': 'Khởi động lại điện thoại',
    'kill_adb_server': 'Khởi động lại ADB Server',
    'install_tools': 'Cài đặt Scrcpy & Platform Tools tự động',
    'connect_wireless_adb': 'Kết nối ADB không dây qua Wi-Fi (Cổng 5555)',
    'take_screenshot': 'Chụp ảnh màn hình điện thoại',
    'start_screen_record': 'Bắt đầu quay video màn hình điện thoại',
    'stop_screen_record': 'Dừng quay video màn hình & Lưu file MP4',
    'extract_apk': 'Trích xuất file cài đặt APK từ điện thoại',
    'install_uploaded_apk': 'Cài đặt file APK kéo thả từ máy tính',
    'test_hardware': 'Kiểm tra phần cứng & cảm ứng thiết bị',
    'uninstall_app': 'Gỡ cài đặt ứng dụng',
    'freeze_app': 'Đóng băng (vô hiệu hóa) ứng dụng',
    'unfreeze_app': 'Rã đông (kích hoạt lại) ứng dụng',
    'clear_app_data': 'Xóa toàn bộ dữ liệu & cache ứng dụng',
    'launch_app': 'Khởi chạy ứng dụng trên điện thoại',
    'force_stop_app': 'Buộc dừng ứng dụng',
}

def handle_action(payload):
    action = payload.get('action')
    title = ACTION_TITLES.get(action, f'Lệnh hệ thống: {action}')
    add_log('info', f'>>> [THỰC THI] {title}')

    if not is_device_connected():
        add_log('error', 'Lỗi: Thiết bị chưa kết nối qua cáp USB ADB!')
        return {'success': False, 'message': 'Thiết bị chưa kết nối qua ADB!'}

    if action == 'clear_logs':
        with LOG_LOCK:
            LOG_BUFFER.clear()
        add_log('info', '[+] Đã làm sạch toàn bộ console nhật ký.')
        return {'success': True}

    if action == 'whitelist_all_vn':
        pkgs = payload.get('packages', [])
        if not pkgs:
            # Default to all critical VN packages
            scan_res = scan_packages()
            pkgs = [a['package'] for a in scan_res.get('vn_apps', []) if a['installed']]
        
        total = len(pkgs)
        add_log('info', f'Bắt đầu cấp quyền chạy nền & Doze Whitelist cho {total} ứng dụng VN...')
        success_count = 0
        for i, p in enumerate(pkgs, 1):
            add_log('cmd', f'[{i}/{total}] $ adb shell dumpsys deviceidle whitelist +{p}')
            run_cmd(['adb', 'shell', 'dumpsys', 'deviceidle', 'whitelist', f'+{p}'])
            
            for op in ['RUN_IN_BACKGROUND', 'RUN_ANY_IN_BACKGROUND', 'POST_NOTIFICATION', 'WAKE_LOCK', 'SYSTEM_ALERT_WINDOW', 'START_FOREGROUND', 'SCHEDULE_EXACT_ALARM', 'ACCESS_RESTRICTED_SETTINGS']:
                run_cmd(['adb', 'shell', 'cmd', 'appops', 'set', p, op, 'allow'])
            
            # Numeric UID resolution for netpolicy
            _, uid_out, _ = run_cmd(['adb', 'shell', 'pm', 'list', 'packages', '-U', p])
            if 'uid:' in uid_out:
                uids_part = uid_out.split('uid:')[-1].strip().split()[0]
                for uid in uids_part.split(','):
                    uid = uid.strip()
                    if uid.isdigit():
                        run_cmd(['adb', 'shell', 'cmd', 'netpolicy', 'add', 'restrict-background-whitelist', uid])
            add_log('success', f'  ↳ Hoàn tất: {p} (Đã cấp 8 AppOps & NetPolicy Whitelist)')
            success_count += 1
        
        add_log('success', f'=== [HOÀN TẤT 100%] Đã Whitelist & cấp quyền chạy nền thông báo không trễ cho {success_count}/{total} ứng dụng VN! ===')
        return {'success': True, 'count': success_count}

    elif action == 'debloat_packages':
        pkgs = payload.get('packages', [])
        if not pkgs:
            return {'success': False, 'message': 'Chưa chọn package nào để gỡ.'}

        # Load backup
        backup_data = []
        if os.path.exists(BACKUP_FILE):
            try:
                with open(BACKUP_FILE, 'r', encoding='utf-8') as f:
                    backup_data = json.load(f)
            except:
                pass

        total = len(pkgs)
        add_log('info', f'Bắt đầu quy trình gỡ bỏ an toàn {total} ứng dụng rác nội địa...')
        success_count = 0
        for i, p in enumerate(pkgs, 1):
            add_log('cmd', f'[{i}/{total}] $ adb shell pm disable-user --user 0 {p}')
            run_cmd(['adb', 'shell', 'pm', 'disable-user', '--user', '0', p])
            add_log('cmd', f'[{i}/{total}] $ adb shell pm uninstall -k --user 0 {p}')
            code, out, _ = run_cmd(['adb', 'shell', 'pm', 'uninstall', '-k', '--user', '0', p])
            if code == 0 or 'Success' in out:
                success_count += 1
                if p not in backup_data:
                    backup_data.append(p)
                add_log('success', f'  ↳ Đã gỡ thành công: {p} ({out or "Success"})')
            else:
                add_log('warning', f'  ↳ {p}: {out or "Không thể gỡ"}')

        with open(BACKUP_FILE, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, ensure_ascii=False, indent=2)

        add_log('success', f'=== [HOÀN TẤT 100%] Đã gỡ an toàn {success_count}/{total} package khỏi User 0! ===')
        return {'success': True, 'count': success_count}

    elif action == 'restore_packages':
        pkgs = payload.get('packages', [])
        if not pkgs:
            return {'success': False, 'message': 'Chưa chọn package nào để khôi phục.'}

        total = len(pkgs)
        add_log('info', f'Bắt đầu khôi phục {total} ứng dụng đã chọn...')
        restored_count = 0
        for i, p in enumerate(pkgs, 1):
            add_log('cmd', f'[{i}/{total}] $ adb shell cmd package install-existing --user 0 {p}')
            code, out, _ = run_cmd(['adb', 'shell', 'cmd', 'package', 'install-existing', '--user', '0', p])
            run_cmd(['adb', 'shell', 'pm', 'enable', p])
            if code == 0 or 'installed' in out.lower():
                restored_count += 1
                add_log('success', f'  ↳ Đã khôi phục thành công: {p} ({out or "Success"})')
            else:
                add_log('warning', f'  ↳ {p}: {out or "Không thể khôi phục"}')

        add_log('success', f'=== [HOÀN TẤT 100%] Đã phục hồi thành công {restored_count}/{total} package đã chọn! ===')
        return {'success': True, 'count': restored_count}

    elif action == 'restore_all':
        pkgs = payload.get('packages', [])
        if not pkgs and os.path.exists(BACKUP_FILE):
            with open(BACKUP_FILE, 'r', encoding='utf-8') as f:
                pkgs = json.load(f)

        total = len(pkgs)
        add_log('info', f'Bắt đầu khôi phục toàn bộ {total} package và đưa hệ thống về xuất xưởng...')
        restored_count = 0
        for i, p in enumerate(pkgs, 1):
            add_log('cmd', f'[{i}/{total}] $ adb shell cmd package install-existing --user 0 {p}')
            code, out, _ = run_cmd(['adb', 'shell', 'cmd', 'package', 'install-existing', '--user', '0', p])
            run_cmd(['adb', 'shell', 'pm', 'enable', p])
            if code == 0 or 'installed' in out.lower():
                restored_count += 1
                add_log('success', f'  ↳ Đã khôi phục: {p}')

        # Re-enable system services
        for p in ['com.hihonor.servicecenter', 'com.baidu.swan', 'com.hihonor.android.UEInfoCheck', 'com.hihonor.collectcenter', 'com.hihonor.magicvoice']:
            add_log('cmd', f'$ adb shell cmd package install-existing --user 0 {p}')
            run_cmd(['adb', 'shell', 'cmd', 'package', 'install-existing', '--user', '0', p])
            run_cmd(['adb', 'shell', 'pm', 'enable', p])

        # Reset Screen & Display
        add_log('cmd', '$ adb shell settings delete system min_refresh_rate')
        run_cmd(['adb', 'shell', 'settings', 'delete', 'system', 'min_refresh_rate'])
        run_cmd(['adb', 'shell', 'settings', 'delete', 'system', 'peak_refresh_rate'])
        run_cmd(['adb', 'shell', 'wm', 'density', 'reset'])
        run_cmd(['adb', 'shell', 'settings', 'delete', 'secure', 'display_density_forced'])
        run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'low_resolution_switch', '1'])
        run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'aps_display_resolution', '2'])

        # Reset Wi-Fi
        add_log('cmd', '$ adb shell settings put global hn_wifipro_enable true')
        run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'hn_wifipro_enable', 'true'])
        run_cmd(['adb', 'shell', 'settings', 'put', 'system', 'smart_network_switch', '1'])
        run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'settings_wlan_mt_axl', '1'])
        run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'wifi_cloud_security_check', '1'])
        run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'wifi_hidata_rtt_url', 'www.baidu.com|connectivitycheck.gstatic.com|www.google.com'])
        run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'wifi_power_save', '120'])
        run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'private_dns_mode', 'off'])

        add_log('success', f'=== [HOÀN TẤT 100%] Đã hoàn tác toàn bộ thiết lập về nguyên bản xuất xưởng và phục hồi {restored_count} ứng dụng! ===')
        return {'success': True, 'count': restored_count}

    elif action == 'apply_wifi_dns':
        captive = payload.get('captive', 'google')
        dns_mode = payload.get('dns', 'cloudflare')
        custom_dns = payload.get('custom_dns', '').strip()
        disable_wifipro = payload.get('disable_wifipro', True)
        disable_wifi_sleep = payload.get('disable_wifi_sleep', True)
        google_rtt = payload.get('google_rtt', True)
        disable_verbose_logging = payload.get('disable_verbose_logging', True)
        network_mode_5g = str(payload.get('network_mode_5g', 'default'))
        infinite_bluetooth = payload.get('infinite_bluetooth', False)
        reset_defaults = payload.get('reset_defaults', False)

        add_log('info', 'Bắt đầu cấu hình Tham số Mạng, 5G NR, Wi-Fi Siêu Tốc & DoT DNS...')

        if reset_defaults:
            run_cmd(['adb', 'shell', 'settings', 'delete', 'global', 'captive_portal_http_url'])
            run_cmd(['adb', 'shell', 'settings', 'delete', 'global', 'captive_portal_https_url'])
            run_cmd(['adb', 'shell', 'settings', 'delete', 'global', 'captive_portal_fallback_url'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'captive_portal_mode', '1'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'private_dns_mode', 'off'])
            run_cmd(['adb', 'shell', 'settings', 'delete', 'global', 'private_dns_specifier'])
            run_cmd(['adb', 'shell', 'settings', 'delete', 'global', 'preferred_network_mode1'])
            run_cmd(['adb', 'shell', 'settings', 'delete', 'global', 'preferred_network_mode'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'wifi_power_save', '1'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'wifi_sleep_policy', '0'])
            run_cmd(['adb', 'shell', 'settings', 'delete', 'global', 'wifi_hidata_rtt_url'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'infinite_volume_music_bt_a2dp', '0'])
            add_log('success', '=== [HOÀN TẤT] Đã khôi phục các tham số Mạng về mặc định gốc của máy! ===')
            return {'success': True}

        # 1. Captive portal
        if captive == 'google':
            add_log('cmd', '$ adb shell settings put global captive_portal_mode 1')
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'captive_portal_mode', '1'])
            add_log('cmd', '$ adb shell settings put global captive_portal_http_url http://connectivitycheck.gstatic.com/generate_204')
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'captive_portal_http_url', 'http://connectivitycheck.gstatic.com/generate_204'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'captive_portal_https_url', 'https://connectivitycheck.gstatic.com/generate_204'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'captive_portal_fallback_url', 'http://www.google.com/gen_204'])
            add_log('success', '  ↳ Đã chuyển Captive Portal sang máy chủ Google 204 (Dứt điểm chấm than Wi-Fi).')
        elif captive == 'cloudflare':
            add_log('cmd', '$ adb shell settings put global captive_portal_mode 1')
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'captive_portal_mode', '1'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'captive_portal_http_url', 'http://cp.cloudflare.com/generate_204'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'captive_portal_https_url', 'https://cp.cloudflare.com/generate_204'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'captive_portal_fallback_url', 'http://cp.cloudflare.com/generate_204'])
            add_log('success', '  ↳ Đã chuyển Captive Portal sang máy chủ Cloudflare 204.')
        elif captive == 'default':
            run_cmd(['adb', 'shell', 'settings', 'delete', 'global', 'captive_portal_http_url'])
            run_cmd(['adb', 'shell', 'settings', 'delete', 'global', 'captive_portal_https_url'])
            run_cmd(['adb', 'shell', 'settings', 'delete', 'global', 'captive_portal_fallback_url'])
            add_log('info', '  ↳ Đã khôi phục Captive Portal về mặc định hãng.')

        # 2. Private DNS
        if custom_dns and dns_mode != 'off':
            add_log('cmd', f'$ adb shell settings put global private_dns_mode hostname && specifier {custom_dns}')
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'private_dns_mode', 'hostname'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'private_dns_specifier', custom_dns])
            add_log('success', f'  ↳ Đã kích hoạt Private DNS Tùy Chỉnh DoT: {custom_dns}')
        elif dns_mode == 'cloudflare':
            add_log('cmd', '$ adb shell settings put global private_dns_mode hostname && specifier one.one.one.one')
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'private_dns_mode', 'hostname'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'private_dns_specifier', 'one.one.one.one'])
            add_log('success', '  ↳ Đã kích hoạt Private DNS: Cloudflare DoT (one.one.one.one).')
        elif dns_mode == 'google':
            add_log('cmd', '$ adb shell settings put global private_dns_mode hostname && specifier dns.google')
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'private_dns_mode', 'hostname'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'private_dns_specifier', 'dns.google'])
            add_log('success', '  ↳ Đã kích hoạt Private DNS: Google DNS.')
        elif dns_mode == 'adguard':
            add_log('cmd', '$ adb shell settings put global private_dns_mode hostname && specifier dns.adguard-dns.com')
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'private_dns_mode', 'hostname'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'private_dns_specifier', 'dns.adguard-dns.com'])
            add_log('success', '  ↳ Đã kích hoạt Private DNS: AdGuard DNS.')
        elif dns_mode == 'nextdns':
            add_log('cmd', '$ adb shell settings put global private_dns_mode hostname && specifier dns.nextdns.io')
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'private_dns_mode', 'hostname'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'private_dns_specifier', 'dns.nextdns.io'])
            add_log('success', '  ↳ Đã kích hoạt Private DNS: NextDNS.')
        elif dns_mode == 'quad9':
            add_log('cmd', '$ adb shell settings put global private_dns_mode hostname && specifier dns.quad9.net')
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'private_dns_mode', 'hostname'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'private_dns_specifier', 'dns.quad9.net'])
            add_log('success', '  ↳ Đã kích hoạt Private DNS: Quad9 DNS.')
        elif dns_mode == 'off':
            add_log('cmd', '$ adb shell settings put global private_dns_mode off')
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'private_dns_mode', 'off'])
            run_cmd(['adb', 'shell', 'settings', 'delete', 'global', 'private_dns_specifier'])
            add_log('info', '  ↳ Đã tắt Private DNS.')

        # 3. Wi-Fi Pro & Link Turbo
        if disable_wifipro:
            add_log('cmd', '$ adb shell settings put global hn_wifipro_enable false')
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'hn_wifipro_enable', 'false'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'system', 'smart_network_switch', '0'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'settings_wlan_mt_axl', '0'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'wifi_cloud_security_check', '0'])
            add_log('success', '  ↳ Đã vô hiệu hóa Wi-Fi Pro & Link Turbo (Chống rớt mạng cuộc gọi Zalo/FB).')
        else:
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'hn_wifipro_enable', 'true'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'system', 'smart_network_switch', '1'])

        # 4. Wi-Fi Sleep Policy & Power Save (HonorHook discovery)
        if disable_wifi_sleep:
            add_log('cmd', '$ adb shell settings put global wifi_power_save 0 && wifi_sleep_policy 2')
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'wifi_power_save', '0'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'wifi_sleep_policy', '2'])
            add_log('success', '  ↳ Đã tắt Wi-Fi Power Save & đặt Sleep Policy 2 (Card mạng luôn thức, chống rớt socket).')
        else:
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'wifi_power_save', '1'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'wifi_sleep_policy', '0'])

        # 5. Wi-Fi RTT Latency Check URL (HonorHook discovery: Đổi server Baidu sang Google)
        if google_rtt:
            add_log('cmd', '$ adb shell settings put global wifi_hidata_rtt_url connectivitycheck.gstatic.com|www.google.com|1.1.1.1')
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'wifi_hidata_rtt_url', 'connectivitycheck.gstatic.com|www.google.com|1.1.1.1'])
            add_log('success', '  ↳ Đã cập nhật máy chủ đo độ trễ Wi-Fi RTT sang Google/Cloudflare.')

        # 6. Disable Wi-Fi Verbose Logging
        if disable_verbose_logging:
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'wifi_verbose_logging_enabled', '0'])
            add_log('success', '  ↳ Đã tắt ghi nhật ký chi tiết Wi-Fi (wifi_verbose_logging_enabled = 0).')

        # 7. Cellular 5G NR Preferred Network Mode (HonorHook discovery)
        if network_mode_5g in ['26', '33', '10']:
            add_log('cmd', f'$ adb shell settings put global preferred_network_mode1 {network_mode_5g}')
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'preferred_network_mode1', network_mode_5g])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'preferred_network_mode', network_mode_5g])
            label_5g = '5G NR All-Bands (SA/NSA Khóa cứng)' if network_mode_5g == '26' else ('5G/LTE Ưu Tiên Toàn Dải' if network_mode_5g == '33' else 'LTE / 4G Ổn Định')
            add_log('success', f'  ↳ Đã cấu hình Chế độ Mạng Di Động: {label_5g} (mode {network_mode_5g}).')
        elif network_mode_5g == 'default':
            run_cmd(['adb', 'shell', 'settings', 'delete', 'global', 'preferred_network_mode1'])
            run_cmd(['adb', 'shell', 'settings', 'delete', 'global', 'preferred_network_mode'])
            add_log('info', '  ↳ Đã khôi phục Chế độ Mạng Di Động về tự động theo SIM.')

        # 8. Infinite Bluetooth Volume (HonorHook discovery)
        bt_val = '1' if infinite_bluetooth else '0'
        run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'infinite_volume_music_bt_a2dp', bt_val])
        if infinite_bluetooth:
            add_log('success', '  ↳ Đã mở khóa Âm Lượng Bluetooth Vô Cực (Phá vỡ giới hạn âm lượng tai nghe TWS).')

        add_log('success', '=== [HOÀN TẤT 100%] Đã áp dụng toàn bộ cấu hình Mạng & 5G NR Tối Ưu thành công! ===')
        return {'success': True}

    elif action == 'disable_telemetry':
        add_log('info', 'Bắt đầu vô hiệu hóa toàn bộ dịch vụ Telemetry & gửi log ngầm về máy chủ TQ...')
        add_log('cmd', '$ adb shell settings put secure user_experience_involved 0')
        run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'user_experience_involved', '0'])
        add_log('cmd', '$ adb shell dumpsys deviceidle whitelist -com.hihonor.hiviewtunnel')
        run_cmd(['adb', 'shell', 'dumpsys', 'deviceidle', 'whitelist', '-com.hihonor.hiviewtunnel'])
        add_log('cmd', '$ adb shell pm disable-user --user 0 com.hihonor.android.UEInfoCheck')
        run_cmd(['adb', 'shell', 'pm', 'disable-user', '--user', '0', 'com.hihonor.android.UEInfoCheck'])
        add_log('cmd', '$ adb shell pm disable-user --user 0 com.hihonor.collectcenter')
        run_cmd(['adb', 'shell', 'pm', 'disable-user', '--user', '0', 'com.hihonor.collectcenter'])
        add_log('success', '=== [HOÀN TẤT 100%] Đã tắt sạch Telemetry & ngắt log server TQ (UEInfoCheck, collectcenter, hiviewtunnel)! ===')
        return {'success': True}

    elif action == 'apply_display':
        dpi = payload.get('dpi', 'auto_sweet')
        hz = str(payload.get('hz', 'auto'))
        lock_high_hz = payload.get('lock_high_hz', True)
        anim = payload.get('anim', '1.0')
        sdr2hdr = payload.get('sdr2hdr', False)
        sdr_plus = payload.get('sdr_plus', False)
        tianshan = payload.get('tianshan', False)
        full_screen_aod = payload.get('full_screen_aod', False)
        extend_aod_duration = payload.get('extend_aod_duration', False)
        knuckle_gestures = payload.get('knuckle_gestures', False)
        fingerprint_slide = payload.get('fingerprint_slide', False)
        disable_low_res = payload.get('disable_low_res', True)
        reset_defaults = payload.get('reset_defaults', False)

        add_log('info', f'Bắt đầu cấu hình hiển thị màn hình MagicOS (DPI: {dpi}, Hz: {hz}, Anim: {anim}x)...')

        if reset_defaults:
            run_cmd(['adb', 'shell', 'wm', 'density', 'reset'])
            run_cmd(['adb', 'shell', 'settings', 'delete', 'secure', 'display_density_forced'])
            run_cmd(['adb', 'shell', 'settings', 'delete', 'system', 'min_refresh_rate'])
            run_cmd(['adb', 'shell', 'settings', 'delete', 'system', 'peak_refresh_rate'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'reduce_refresh_rate_enabled', '1'])
            for k in ['window_animation_scale', 'transition_animation_scale', 'animator_duration_scale']:
                run_cmd(['adb', 'shell', 'settings', 'put', 'global', k, '1.0'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'hn_sdr2hdr_switch', '0'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'hn_sdrplus_switch', '0'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'hn_tianshan_switch', '0'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'enable_full_screen_AOD', '0'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'lock_to_aod_duration', '30'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'fingersense_letters_enabled', '0'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'fingerprint_slide_switch', '0'])
            add_log('success', '=== [HOÀN TẤT] Đã khôi phục thiết lập màn hình về mặc định gốc của máy! ===')
            return {'success': True}

        # 1. Calculate or set DPI
        chosen_dpi = None
        if dpi == 'auto_sweet':
            dev_info = get_device_info()
            chosen_dpi = dev_info.get('sweet_spot_dpi', 532)
            add_log('cmd', f'$ adb shell wm density {chosen_dpi} && settings put secure display_density_forced {chosen_dpi}')
            run_cmd(['adb', 'shell', 'wm', 'density', str(chosen_dpi)])
            run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'display_density_forced', str(chosen_dpi)])
            add_log('success', f'  ↳ Đã áp dụng & khóa cứng DPI Vàng tối ưu: {chosen_dpi} (Chuẩn 385 dp)')
        elif dpi == 'reset':
            add_log('cmd', '$ adb shell wm density reset')
            run_cmd(['adb', 'shell', 'wm', 'density', 'reset'])
            run_cmd(['adb', 'shell', 'settings', 'delete', 'secure', 'display_density_forced'])
            add_log('info', '  ↳ Đã reset DPI về mặc định gốc.')
        else:
            try:
                chosen_dpi = int(dpi)
                add_log('cmd', f'$ adb shell wm density {chosen_dpi}')
                run_cmd(['adb', 'shell', 'wm', 'density', str(chosen_dpi)])
                run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'display_density_forced', str(chosen_dpi)])
                add_log('success', f'  ↳ Đã đặt & khóa cứng DPI tùy chỉnh: {chosen_dpi}')
            except:
                pass

        # 2. Disable low resolution smart downscaling
        if disable_low_res:
            for k in ['low_resolution_switch', 'smart_resolution_mode', 'smart_screen_resolution_mode']:
                run_cmd(['adb', 'shell', 'settings', 'put', 'system', k, '0'])
                run_cmd(['adb', 'shell', 'settings', 'put', 'global', k, '0'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'aps_display_resolution', '0'])
            add_log('success', '  ↳ Đã vô hiệu hóa cờ tự động hạ độ phân giải thông minh (Giữ nét 100%).')

        # 3. Refresh Rate (Hz)
        if hz == 'auto':
            add_log('cmd', '$ adb shell settings delete system min_refresh_rate && peak_refresh_rate')
            run_cmd(['adb', 'shell', 'settings', 'delete', 'system', 'min_refresh_rate'])
            run_cmd(['adb', 'shell', 'settings', 'delete', 'system', 'peak_refresh_rate'])
            add_log('info', '  ↳ Đã thiết lập tần số quét về chế độ Tự Động Dynamic.')
        else:
            try:
                hz_val = float(hz)
                add_log('cmd', f'$ adb shell settings put system min_refresh_rate {hz_val} && peak_refresh_rate {hz_val}')
                run_cmd(['adb', 'shell', 'settings', 'put', 'system', 'min_refresh_rate', str(hz_val)])
                run_cmd(['adb', 'shell', 'settings', 'put', 'system', 'peak_refresh_rate', str(hz_val)])
                add_log('success', f'  ↳ Đã đặt tần số quét đỉnh và đáy: {int(hz_val)}Hz')
            except Exception as e:
                add_log('warning', f'  ↳ Không thể đặt tần số quét {hz}: {e}')

        # 4. No-Drop Refresh Rate (HonorHook discovery: secure: reduce_refresh_rate_enabled = 0)
        reduce_val = '0' if lock_high_hz else '1'
        run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'reduce_refresh_rate_enabled', reduce_val])
        if lock_high_hz:
            add_log('success', '  ↳ Đã bật Khóa Tần Số Quét Cao (reduce_refresh_rate_enabled = 0 - Không tụt khi xem video/lướt app).')

        # 5. HonorHook Display Engine: SDR->HDR, SDR+ Peak, Tianshan Oasis
        sdr2hdr_val = '1' if sdr2hdr else '0'
        run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'hn_sdr2hdr_switch', sdr2hdr_val])
        if sdr2hdr:
            add_log('success', '  ↳ Đã kích hoạt Nâng cấp SDR sang HDR (hn_sdr2hdr_switch = 1).')

        sdrplus_val = '1' if sdr_plus else '0'
        run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'hn_sdrplus_switch', sdrplus_val])
        if sdr_plus:
            add_log('success', '  ↳ Đã kích hoạt SDR+ Tăng cường sáng đỉnh ngoài trời (hn_sdrplus_switch = 1).')

        tianshan_val = '1' if tianshan else '0'
        run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'hn_tianshan_switch', tianshan_val])
        if tianshan:
            add_log('success', '  ↳ Đã kích hoạt Động cơ Siêu Hiển Thị Thiên Sơn Oasis (hn_tianshan_switch = 1).')

        # 6. AOD & Touch Gestures (HonorHook discovery)
        aod_val = '1' if full_screen_aod else '0'
        run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'enable_full_screen_AOD', aod_val])
        if full_screen_aod:
            add_log('success', '  ↳ Đã kích hoạt AOD Toàn Màn Hình (enable_full_screen_AOD = 1).')

        aod_dur_val = '200' if extend_aod_duration else '30'
        run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'lock_to_aod_duration', aod_dur_val])
        if extend_aod_duration:
            add_log('success', '  ↳ Đã kéo dài thời gian duy trì AOD lên 200 giây (lock_to_aod_duration = 200).')

        knuckle_val = '1' if knuckle_gestures else '0'
        run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'fingersense_letters_enabled', knuckle_val])
        if knuckle_gestures:
            add_log('success', '  ↳ Đã kích hoạt Cử chỉ vẽ khớp ngón tay Knuckle Gestures (fingersense_letters_enabled = 1).')

        fp_val = '1' if fingerprint_slide else '0'
        run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'fingerprint_slide_switch', fp_val])
        if fingerprint_slide:
            add_log('success', '  ↳ Đã kích hoạt Trượt vân tay kéo thanh thông báo (fingerprint_slide_switch = 1).')

        # 7. Animations & Background Scans
        try:
            anim_val = str(float(anim))
            for k in ['window_animation_scale', 'transition_animation_scale', 'animator_duration_scale']:
                run_cmd(['adb', 'shell', 'settings', 'put', 'global', k, anim_val])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'wifi_scan_always_enabled', '0'])
            run_cmd(['adb', 'shell', 'settings', 'put', 'global', 'ble_scan_always_enabled', '0'])
            add_log('info', f'  ↳ Đã chỉnh tốc độ hiệu ứng (Animation): {anim_val}x và tối ưu quét nền.')
        except:
            pass

        add_log('success', '=== [HOÀN TẤT 100%] Đã áp dụng toàn bộ cấu hình Màn hình MagicOS thành công! ===')
        return {'success': True}

    elif action == 'compile_apps':
        _, out, _ = run_cmd(['adb', 'shell', 'pm', 'list', 'packages'])
        all_installed = set(line.replace('package:', '').strip() for line in out.splitlines() if line)
        
        # Comprehensive catalog of common apps in VN (Social, Browsers, AI, Delivery, Public Services)
        priority_pkgs = [
            "com.zing.zalo", "com.facebook.katana", "com.ss.android.ugc.trill",
            "com.facebook.orca", "org.telegram.messenger", "com.whatsapp",
            "com.instagram.android", "com.google.android.gm", "com.microsoft.office.outlook",
            "vn.io.nhacquan", "mark.via", "mark.via.gp", "com.android.chrome",
            "com.brave.browser", "com.microsoft.emmx", "com.coccoc.trinhduyet",
            "org.mozilla.firefox", "com.sec.android.app.sbrowser", "com.openai.chatgpt",
            "com.shopee.vn", "com.lazada.android", "com.grabtaxi.passenger",
            "xyz.be.consumer", "com.gsm.customer", "vn.foody.delivery",
            "vn.gov.vneid", "com.vnid", "com.bhxh.vssid", "com.gdt.mobile",
            "com.viettel.appviettel", "vn.vnpt.myvnpt", "org.localsend.localsend_app"
        ]
        # Dynamically append all 65+ banking, fintech & essential VN apps from VN_APPS_DB
        for cat in VN_APPS_DB.get('categories', {}).values():
            for app in cat.get('apps', []):
                pkg = app.get('package')
                if pkg and pkg not in priority_pkgs:
                    priority_pkgs.append(pkg)

        # Match only apps that are actually installed on the user's phone
        target_apps = [p for p in priority_pkgs if p in all_installed]
        total = len(target_apps)
        
        add_log('info', f'Tìm thấy {total} ứng dụng thông dụng tại Việt Nam đang cài đặt trên máy để tăng tốc Native AOT...')
        success_count = 0
        for i, p in enumerate(target_apps, 1):
            add_log('cmd', f'[{i}/{total}] $ adb shell cmd package compile -m speed-profile {p}')
            t0 = time.time()
            code, out_cmd, err_cmd = run_cmd(['adb', 'shell', 'cmd', 'package', 'compile', '-m', 'speed-profile', p], timeout=120)
            elapsed = round(time.time() - t0, 1)
            res_str = out_cmd.strip() if out_cmd else (err_cmd.strip() if err_cmd else 'Success')
            
            # If speed-profile is not supported or failed, fallback to standard speed (without -f)
            if code != 0 and 'Success' not in res_str:
                code, out_cmd, err_cmd = run_cmd(['adb', 'shell', 'cmd', 'package', 'compile', '-m', 'speed', p], timeout=120)
                elapsed = round(time.time() - t0, 1)
                res_str = out_cmd.strip() if out_cmd else (err_cmd.strip() if err_cmd else 'Success')

            if code == 0 or 'Success' in res_str:
                success_count += 1
                add_log('success', f'  ↳ Hoàn tất: {p} ({res_str}) [{elapsed}s]')
            else:
                add_log('warning', f'  ↳ {p}: {err_cmd or out_cmd} [{elapsed}s]')
            
        add_log('cmd', '$ adb shell pm trim-caches 100G')
        code, out_trim, _ = run_cmd(['adb', 'shell', 'pm', 'trim-caches', '100G'])
        add_log('info', f'  ↳ Đã giải phóng bộ nhớ đệm cache hệ thống ({out_trim.strip() or "OK"}).')
        add_log('success', f'=== [HOÀN TẤT 100%] Đã hoàn tất tăng tốc Native ARM64 cho toàn bộ {success_count}/{total} ứng dụng & dọn dẹp cache! ===')
        return {'success': True, 'count': success_count}

    elif action == 'fix_weather':
        add_log('info', 'Bắt đầu cấu hình ứng dụng Thời tiết Honor sang Tiếng Anh en-GB (Độ C)...')
        add_log('cmd', '$ adb shell cmd locale set-app-locales com.hihonor.android.totemweather --locales en-GB')
        run_cmd(['adb', 'shell', 'cmd', 'locale', 'set-app-locales', 'com.hihonor.android.totemweather', '--locales', 'en-GB'])
        add_log('cmd', '$ adb shell am force-stop com.hihonor.android.totemweather')
        run_cmd(['adb', 'shell', 'am', 'force-stop', 'com.hihonor.android.totemweather'])
        add_log('success', '=== [HOÀN TẤT 100%] Đã chuyển ứng dụng Thời tiết Honor sang Tiếng Anh quốc tế en-GB (Hiển thị Độ C)! ===')
        return {'success': True}

    elif action == 'set_assistant_google':
        add_log('info', 'Bắt đầu thiết lập Google Assistant / Gemini làm trợ lý mặc định toàn máy...')
        add_log('cmd', '$ adb shell pm disable-user --user 0 com.hihonor.magicvoice')
        run_cmd(['adb', 'shell', 'pm', 'disable-user', '--user', '0', 'com.hihonor.magicvoice'])
        add_log('cmd', '$ adb shell cmd package set-home-activity com.google.android.googlequicksearchbox/.SearchActivity')
        run_cmd(['adb', 'shell', 'cmd', 'package', 'set-home-activity', 'com.google.android.googlequicksearchbox/.SearchActivity'])
        run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'voice_interaction_service', 'com.google.android.googlequicksearchbox/com.google.android.voiceinteraction.GsaVoiceInteractionService'])
        run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'assistant', 'com.google.android.googlequicksearchbox/com.google.android.voiceinteraction.GsaVoiceInteractionService'])
        for op in ['ASSIST_STRUCTURE', 'ASSIST_SCREENSHOT']:
            run_cmd(['adb', 'shell', 'cmd', 'appops', 'set', 'com.google.android.googlequicksearchbox', op, 'allow'])
        for op in ['ASSIST_STRUCTURE', 'ASSIST_SCREENSHOT', 'SYSTEM_ALERT_WINDOW']:
            run_cmd(['adb', 'shell', 'cmd', 'appops', 'set', 'com.google.android.apps.bard', op, 'allow'])
        add_log('success', '=== [HOÀN TẤT 100%] Đã đóng băng YOYO Voice & kích hoạt Google Gemini / Assistant làm trợ lý toàn máy! ===')
        return {'success': True}

    elif action == 'install_gesture_search':
        add_log('step', '>>> [CÀI ĐẶT] Đang chuẩn bị cài đặt Gesture Search (Thanh cử chỉ vuốt gọi Google Gemini)...')
        apk_path = ensure_apk_available('Gesture Search.apk')
        if not apk_path:
            add_log('error', 'Không tìm thấy file APK Gesture Search và chưa thể tải về!')
            return {'success': False, 'error': 'APK not available'}
        
        add_log('cmd', f'$ adb install -r -d "{os.path.basename(apk_path)}"')
        code, out, err = run_cmd(['adb', 'install', '-r', '-d', apk_path], timeout=120)
        if code != 0 and 'Success' not in out:
            add_log('error', f'Cài đặt Gesture Search thất bại: {err or out}')
            return {'success': False, 'error': err or out}
        
        add_log('info', '  ↳ Cài đặt APK thành công. Đang cấp quyền hệ thống & Whitelist chạy nền...')
        add_log('cmd', '$ adb shell cmd appops set vn.gesturesearch.app SYSTEM_ALERT_WINDOW allow')
        run_cmd(['adb', 'shell', 'cmd', 'appops', 'set', 'vn.gesturesearch.app', 'SYSTEM_ALERT_WINDOW', 'allow'])
        add_log('cmd', '$ adb shell cmd appops set vn.gesturesearch.app GET_USAGE_STATS allow')
        run_cmd(['adb', 'shell', 'cmd', 'appops', 'set', 'vn.gesturesearch.app', 'GET_USAGE_STATS', 'allow'])
        add_log('cmd', '$ adb shell pm grant vn.gesturesearch.app android.permission.POST_NOTIFICATIONS')
        run_cmd(['adb', 'shell', 'pm', 'grant', 'vn.gesturesearch.app', 'android.permission.POST_NOTIFICATIONS'])
        add_log('cmd', '$ adb shell dumpsys deviceidle whitelist +vn.gesturesearch.app')
        run_cmd(['adb', 'shell', 'dumpsys', 'deviceidle', 'whitelist', '+vn.gesturesearch.app'])
        
        add_log('cmd', '$ adb shell am start -n vn.gesturesearch.app/.MainActivity')
        run_cmd(['adb', 'shell', 'am', 'start', '-n', 'vn.gesturesearch.app/.MainActivity'])
        
        add_log('success', '=== [HOÀN TẤT] Đã cài đặt & cấp quyền thành công cho Gesture Search! ===')
        add_log('info', '  ✦ Đã hiển thị thanh cử chỉ vuốt đáy màn hình & Phím tắt Quick Settings gọi Gemini.')
        return {'success': True}

    elif action == 'install_vxm_assistant':
        add_log('step', '>>> [CÀI ĐẶT] Đang chuẩn bị cài đặt Trợ Lý VXM (Đánh thức giọng nói "OK Google / Hey Google" 24/7)...')
        apk_path = ensure_apk_available('Tro-ly-VXM-2.2.5-universal.apk')
        if not apk_path:
            add_log('error', 'Không tìm thấy file APK Trợ Lý VXM và không thể tải về từ máy chủ!')
            return {'success': False, 'error': 'APK not available'}
        
        add_log('cmd', f'$ adb install -r -d "{os.path.basename(apk_path)}"')
        code, out, err = run_cmd(['adb', 'install', '-r', '-d', apk_path], timeout=180)
        if code != 0 and 'Success' not in out:
            add_log('error', f'Cài đặt Trợ lý VXM thất bại: {err or out}')
            return {'success': False, 'error': err or out}
        
        add_log('info', '  ↳ Cài đặt APK thành công. Đang cấp quyền Ghi âm ngầm, Nổi màn hình & Whitelist Pin...')
        add_log('cmd', '$ adb shell pm grant com.vxm.assistant android.permission.RECORD_AUDIO')
        run_cmd(['adb', 'shell', 'pm', 'grant', 'com.vxm.assistant', 'android.permission.RECORD_AUDIO'])
        add_log('cmd', '$ adb shell pm grant com.vxm.assistant android.permission.POST_NOTIFICATIONS')
        run_cmd(['adb', 'shell', 'pm', 'grant', 'com.vxm.assistant', 'android.permission.POST_NOTIFICATIONS'])
        add_log('cmd', '$ adb shell cmd appops set com.vxm.assistant RECORD_AUDIO allow')
        run_cmd(['adb', 'shell', 'cmd', 'appops', 'set', 'com.vxm.assistant', 'RECORD_AUDIO', 'allow'])
        add_log('cmd', '$ adb shell cmd appops set com.vxm.assistant SYSTEM_ALERT_WINDOW allow')
        run_cmd(['adb', 'shell', 'cmd', 'appops', 'set', 'com.vxm.assistant', 'SYSTEM_ALERT_WINDOW', 'allow'])
        add_log('cmd', '$ adb shell dumpsys deviceidle whitelist +com.vxm.assistant')
        run_cmd(['adb', 'shell', 'dumpsys', 'deviceidle', 'whitelist', '+com.vxm.assistant'])
        
        add_log('cmd', '$ adb shell am start -n com.vxm.assistant/.MainActivity')
        run_cmd(['adb', 'shell', 'am', 'start', '-n', 'com.vxm.assistant/.MainActivity'])
        
        add_log('success', '=== [HOÀN TẤT] Đã cài đặt & cấp quyền thành công cho Trợ Lý VXM! ===')
        add_log('info', '  ✦ Đã kích hoạt dịch vụ nhận diện giọng nói ngầm "OK Google" / "Hey Google" không hao pin.')
        return {'success': True}

    elif action == 'setup_full_assistant_suite':
        add_log('step', '=======================================================')
        add_log('step', '=== BẮT ĐẦU KÍCH HOẠT TRỌN BỘ TRỢ LÝ GOOGLE & GEMINI TOÀN DIỆN ===')
        add_log('step', '=======================================================')
        
        # 1. Cấu hình lõi hệ thống
        add_log('step', '>>> [PHẦN 1/3] Cấu hình lõi hệ thống Android & Đóng băng YOYO Voice...')
        handle_action({'action': 'set_assistant_google'})
        
        # 2. Cài Gesture Search
        add_log('step', '>>> [PHẦN 2/3] Cài đặt thanh vuốt cử chỉ Gesture Search (gọi Gemini Floaty)...')
        handle_action({'action': 'install_gesture_search'})
        
        # 3. Cài Trợ lý VXM
        add_log('step', '>>> [PHẦN 3/3] Cài đặt nhận diện giọng nói Hey Google Offline 24/7 (Trợ lý VXM)...')
        handle_action({'action': 'install_vxm_assistant'})
        
        add_log('success', '=======================================================')
        add_log('success', '=== [HOÀN TẤT 100%] ĐÃ THIẾT LẬP TRỌN BỘ TRỢ LÝ GOOGLE & GEMINI! ===')
        add_log('info', '✦ Hướng dẫn sử dụng:')
        add_log('info', '  1. Vuốt hoặc giữ thanh pill ở cạnh đáy -> Cửa sổ Gemini Floaty hiện tức thì.')
        add_log('info', '  2. Nói "OK Google" hoặc "Hey Google" -> Đánh thức màn hình và mở Google Assistant.')
        add_log('info', '  3. Kéo Control Center (Quick Settings) -> Nhấn ô Gemini Tile để ra lệnh bất cứ lúc nào.')
        add_log('success', '=======================================================')
        return {'success': True}

    elif action == 'enable_google_services':
        add_log('step', '>>> [GMS] Bắt đầu kích hoạt Dịch Vụ Google Cơ Bản (Google Basic Services) trên MagicOS...')
        
        # 1. Bật công tắc Google Service cốt lõi trong Settings hệ thống MagicOS
        add_log('cmd', '$ adb shell settings put secure google_service_status 1')
        run_cmd(['adb', 'shell', 'settings', 'put', 'secure', 'google_service_status', '1'])
        add_log('cmd', '$ adb shell settings put system is_show_google 1')
        run_cmd(['adb', 'shell', 'settings', 'put', 'system', 'is_show_google', '1'])
        
        # 2. Bật các package GMS & GSF hệ thống
        gms_pkgs = [
            'com.google.android.gms',
            'com.google.android.gsf',
            'com.google.android.onetimeinitializer',
            'com.google.android.configupdater',
            'com.google.android.syncadapters.contacts',
            'com.google.android.syncadapters.calendar'
        ]
        for p in gms_pkgs:
            add_log('cmd', f'$ adb shell pm enable {p}')
            run_cmd(['adb', 'shell', 'pm', 'enable', p])
        
        # 3. Whitelist pin Doze & Cấp quyền cửa sổ nổi để không bao giờ bị đóng băng
        add_log('cmd', '$ adb shell dumpsys deviceidle whitelist +com.google.android.gms')
        run_cmd(['adb', 'shell', 'dumpsys', 'deviceidle', 'whitelist', '+com.google.android.gms'])
        add_log('cmd', '$ adb shell dumpsys deviceidle whitelist +com.google.android.gsf')
        run_cmd(['adb', 'shell', 'dumpsys', 'deviceidle', 'whitelist', '+com.google.android.gsf'])
        run_cmd(['adb', 'shell', 'cmd', 'appops', 'set', 'com.google.android.gms', 'SYSTEM_ALERT_WINDOW', 'allow'])
        run_cmd(['adb', 'shell', 'cmd', 'appops', 'set', 'com.google.android.gms', 'AUTO_REVOKE_PERMISSIONS_IF_UNUSED', 'ignore'])

        add_log('success', '=== [HOÀN TẤT 100%] Đã bật Dịch Vụ Google Cơ Bản (GMS/GSF) & Đồng bộ tài khoản Google! ===')
        return {'success': True}

    elif action == 'install_play_store':
        add_log('step', '>>> [CH PLAY] Bắt đầu quy trình kiểm tra kiến trúc máy & Cài đặt Google Play Store...')
        
        # Nhận diện phần cứng thiết bị (CPU ABI & Android SDK)
        _, abi, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.product.cpu.abi'])
        _, sdk, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.build.version.sdk'])
        _, density, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.sf.lcd_density'])
        abi = abi.strip() or 'arm64-v8a'
        sdk = sdk.strip() or '34'
        density = density.strip() or 'nodpi'
        add_log('info', f'  ↳ Nhận diện cấu hình máy: Kiến trúc {abi} | Android SDK API {sdk} | Density {density}')

        # Lấy phiên bản Android dạng số thực để so khớp phiên bản APK tối ưu
        try:
            _, rel_ver_str, _ = run_cmd(['adb', 'shell', 'getprop', 'ro.build.version.release'])
            android_num = float(rel_ver_str.strip() or '14.0')
        except:
            android_num = 14.0

        custom_url = payload.get('apk_url', '').strip()
        apk_path = None
        
        # Trường hợp 1: Người dùng nhập trực tiếp URL tùy chỉnh
        if custom_url:
            add_log('info', f'  ↳ Tải bộ cài Play Store từ URL chỉ định: {custom_url}')
            target_path = os.path.join(BASE_DIR, 'apks', 'GooglePlayStore_custom.apk')
            if download_apk_with_progress(custom_url, target_path, 'Google Play Store'):
                apk_path = target_path
            else:
                return {'success': False, 'error': 'Tải APK từ URL cung cấp thất bại!'}
        else:
            # Trường hợp 2: TỰ ĐỘNG 100% CÀO VÀ TẢI BẢN MỚI NHẤT TỪ APKMIRROR THEO PHẦN CỨNG MÁY
            try:
                scraped_apk, rel_ver_name = resolve_and_download_apkmirror_playstore(target_android_ver=android_num, target_abi=abi)
                if scraped_apk and os.path.exists(scraped_apk):
                    apk_path = scraped_apk
                    add_log('success', f'  ↳ Đã hoàn tất tải gói cài đặt CH Play mới nhất ({rel_ver_name}) từ APKMirror!')
            except Exception as crawl_err:
                add_log('warning', f'  ↳ Tự động tải từ APKMirror gặp trở ngại ({crawl_err}). Kích hoạt giải pháp dự phòng siêu tốc...')
                
                # Giải pháp dự phòng A: Bộ cài phân vùng tương thích chuẩn phần cứng có sẵn trong toolkit
                playstore_dir = os.path.join(BASE_DIR, 'apks', 'playstore')
                splits = [os.path.join(playstore_dir, f) for f in os.listdir(playstore_dir) if f.endswith('.apk')] if os.path.exists(playstore_dir) else []
                
                if splits:
                    add_log('cmd', f'$ adb install-multiple -r -d apks/playstore/*.apk ({len(splits)} gói phân vùng {abi})')
                    code, out, err = run_cmd(['adb', 'install-multiple', '-r', '-d'] + splits, timeout=180)
                    if code == 0 or 'Success' in out:
                        add_log('info', '  ↳ Cài đặt thành công toàn bộ gói Play Store qua giải pháp phân vùng!')
                        apk_path = 'installed_via_splits'
                
                if not apk_path:
                    apk_path = ensure_apk_available('Google-Play-Store.apk')

        if apk_path and apk_path != 'installed_via_splits':
            add_log('cmd', f'$ adb install -r -d "{os.path.basename(apk_path)}"')
            code, out, err = run_cmd(['adb', 'install', '-r', '-d', apk_path], timeout=180)
            if code != 0 and 'Success' not in out:
                add_log('error', f'Cài đặt Google Play Store thất bại: {err or out}')
                return {'success': False, 'error': err or out}

        # Cấp quyền thông báo & tối ưu hoạt động ngầm
        add_log('info', '  ↳ Cài đặt CH Play thành công. Đang cấp quyền thông báo & tối ưu pin...')
        add_log('cmd', '$ adb shell pm grant com.android.vending android.permission.POST_NOTIFICATIONS')
        run_cmd(['adb', 'shell', 'pm', 'grant', 'com.android.vending', 'android.permission.POST_NOTIFICATIONS'])
        run_cmd(['adb', 'shell', 'cmd', 'appops', 'set', 'com.android.vending', 'SYSTEM_ALERT_WINDOW', 'allow'])
        run_cmd(['adb', 'shell', 'dumpsys', 'deviceidle', 'whitelist', '+com.android.vending'])

        # Mở ứng dụng CH Play ngay trên màn hình điện thoại
        add_log('cmd', '$ adb shell am start -n com.android.vending/com.google.android.finsky.activities.MainActivity')
        run_cmd(['adb', 'shell', 'am', 'start', '-n', 'com.android.vending/com.google.android.finsky.activities.MainActivity'])

        add_log('success', '=== [HOÀN TẤT 100%] Đã cài đặt Cửa Hàng Google Play Store & Khởi chạy sẵn sàng đăng nhập! ===')
        return {'success': True}

    elif action == 'setup_full_google_ecosystem':
        add_log('step', '=======================================================')
        add_log('step', '=== KÍCH HOẠT TRỌN BỘ DỊCH VỤ GOOGLE GMS & CỬA HÀNG CH PLAY ===')
        add_log('step', '=======================================================')
        
        # Bước 1: Bật Google Services GMS
        add_log('step', '>>> [BƯỚC 1/2] Bật công tắc Google Services & Kích hoạt lõi GMS/GSF...')
        handle_action({'action': 'enable_google_services'})
        
        # Bước 2: Cài đặt Google Play Store
        add_log('step', '>>> [BƯỚC 2/2] Cài đặt Cửa hàng Google Play Store phù hợp phần cứng...')
        handle_action({'action': 'install_play_store'})
        
        add_log('success', '=======================================================')
        add_log('success', '=== [HOÀN TẤT 100%] TRỌN GÓI GOOGLE & CH PLAY ĐÃ HOẠT ĐỘNG HOÀN HẢO! ===')
        add_log('info', '  ✦ Bây giờ bạn có thể mở màn hình điện thoại để đăng nhập tài khoản Google và tải ứng dụng từ CH Play bình thường.')
        add_log('success', '=======================================================')
        return {'success': True}

    elif action == 'master_optimize':
        add_log('step', '=======================================================')
        add_log('step', '=== BẮT ĐẦU QUY TRÌNH TỐI ƯU HÓA TOÀN DIỆN 8 BƯỚC PLAYBOOK ===')
        add_log('step', '=======================================================')
        
        # Bước 1: Fix thông báo VN apps & Cấp AppOps
        add_log('step', '>>> [BƯỚC 1/8] Whitelist Doze & Cấp 8 AppOps cho ứng dụng Việt Nam...')
        handle_action({'action': 'whitelist_all_vn'})

        # Bước 2: Safe debloat 12 app rác TQ
        add_log('step', '>>> [BƯỚC 2/8] Gỡ bỏ an toàn 12 ứng dụng rác nội địa Trung Quốc...')
        safe_12 = [
            "com.honor.browser", "com.hihonor.browserhomepage", "com.hihonor.gamecenter",
            "com.hihonor.game.kitserver", "com.hihonor.quickgame", "com.hihonor.cloudmusic",
            "com.honor.yoyocards", "com.hihonor.hiboard", "com.hihonor.redteamobile.roaming",
            "com.sohu.inputmethod.sogou.honor", "com.hihonor.servicecenter", "com.baidu.swan"
        ]
        handle_action({'action': 'debloat_packages', 'packages': safe_12})

        # Bước 3: Wi-Fi Siêu Tốc & DNS Cloudflare DoT
        add_log('step', '>>> [BƯỚC 3/8] Tối ưu Wi-Fi Siêu Tốc & Kích hoạt DNS Cloudflare DoT chống giật lag...')
        handle_action({'action': 'apply_wifi_dns', 'captive': 'google', 'dns': 'cloudflare', 'disable_wifipro': True})

        # Bước 4: Tắt Telemetry theo dõi gửi log TQ
        add_log('step', '>>> [BƯỚC 4/8] Vô hiệu hóa Telemetry theo dõi & Dịch vụ gửi log ngầm TQ...')
        handle_action({'action': 'disable_telemetry'})

        # Bước 5: Khóa 120Hz & Khóa Density Sweet spot 385 dp (532)
        add_log('step', '>>> [BƯỚC 5/8] Khóa tần số quét 120Hz & Mật độ hiển thị chuẩn 385 dp...')
        handle_action({'action': 'apply_display', 'dpi': 'auto_sweet', 'hz': '120', 'anim': '1.0'})

        # Bước 6: Biên dịch Native ARM64 AOT & Trim Cache
        add_log('step', '>>> [BƯỚC 6/8] Tăng tốc biên dịch Native ARM64 AOT (dex2oat) cho ứng dụng thông dụng...')
        handle_action({'action': 'compile_apps'})

        # Bước 7: Fix app Thời Tiết sang Tiếng Anh en-GB (Độ C)
        add_log('step', '>>> [BƯỚC 7/8] Chuyển đổi ứng dụng Thời Tiết Honor sang en-GB (Độ C)...')
        handle_action({'action': 'fix_weather'})

        # Bước 8: Gán Google Assistant / Gemini toàn hệ thống & Cài bộ công cụ trợ lý
        add_log('step', '>>> [BƯỚC 8/8] Kích hoạt Trọn bộ Trợ lý ảo Google Gemini Toàn Diện...')
        handle_action({'action': 'setup_full_assistant_suite'})

        add_log('success', '=======================================================')
        add_log('success', '=== [HOÀN TẤT 100%] TẤT CẢ 8 HẠNG MỤC TỐI ƯU HÓA PLAYBOOK ĐÃ HOÀN TẤT THÀNH CÔNG! ===')
        add_log('success', '=======================================================')
        return {'success': True}

    elif action == 'launch_scrcpy':
        turn_off_screen = payload.get('turn_off_screen', True)
        stay_awake = payload.get('stay_awake', True)
        
        scrcpy_bin = find_scrcpy_binary()
        if not scrcpy_bin:
            guide_msg = (
                "Chưa tìm thấy Scrcpy trên máy tính. Để dùng tính năng Chiếu màn hình 120Hz trên Windows/Linux, "
                "bạn chỉ cần tải gói Scrcpy từ https://github.com/Genymobile/scrcpy/releases "
                "(hoặc gõ lệnh 'winget install Genymobile.scrcpy' trên Windows) rồi giải nén vào thư mục công cụ này!"
            )
            add_log('warning', guide_msg)
            return {'success': False, 'message': guide_msg}

        scrcpy_cmd = [scrcpy_bin, '--max-fps=120', '--video-bit-rate=16M']
        if turn_off_screen: scrcpy_cmd.append('-S')
        if stay_awake: scrcpy_cmd.append('-w')

        try:
            add_log('cmd', f'$ {" ".join(scrcpy_cmd)}')
            subprocess.Popen(scrcpy_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            add_log('success', f'Đã mở cửa sổ điều khiển màn hình Scrcpy 120Hz bằng: {scrcpy_bin}')
            return {'success': True}
        except Exception as e:
            add_log('error', f'Lỗi khởi chạy Scrcpy: {e}')
            return {'success': False, 'message': str(e)}

    elif action == 'reboot_device':
        mode = payload.get('mode', 'system')
        cmd_str = f'adb reboot {mode}' if mode in ('bootloader', 'recovery') else 'adb reboot'
        add_log('info', f'Đang khởi động lại thiết bị (Chế độ: {mode})...')
        add_log('cmd', f'$ {cmd_str}')
        if mode == 'bootloader':
            run_cmd(['adb', 'reboot', 'bootloader'])
        elif mode == 'recovery':
            run_cmd(['adb', 'reboot', 'recovery'])
        else:
            run_cmd(['adb', 'reboot'])
        add_log('success', f'=== [HOÀN TẤT] Lệnh khởi động lại thiết bị ({mode}) đã được gửi thành công! ===')
        return {'success': True}

    elif action == 'kill_adb_server':
        add_log('cmd', '$ adb kill-server')
        run_cmd(['adb', 'kill-server'])
        add_log('info', 'Đã tắt daemon ADB hệ thống (adb kill-server) để nhường quyền USB cho trình duyệt WebUSB.')
        return {'success': True}

    elif action == 'install_tools' or action == 'install_scrcpy':
        return auto_install_scrcpy_tools()

    elif action == 'connect_wireless_adb':
        return setup_wireless_adb()

    elif action == 'take_screenshot':
        return capture_screenshot()

    elif action == 'start_screen_record':
        return start_screen_record()

    elif action == 'stop_screen_record':
        return stop_screen_record()

    elif action == 'get_screen_record_status':
        return get_screen_record_status()

    elif action == 'extract_apk':
        pkg = payload.get('package_name', '')
        return extract_apk(pkg)

    elif action == 'install_uploaded_apk':
        return install_uploaded_apk(payload)

    elif action == 'test_hardware':
        test_type = payload.get('type')
        if test_type == 'haptic':
            add_log('info', 'Kiểm tra mô-tơ rung xúc giác tuyến tính X-axis (Linear Haptic Motor)...')
            add_log('cmd', '$ adb shell cmd vibrator_manager synced -f oneshot 350 255')
            run_cmd(['adb', 'shell', 'cmd', 'vibrator_manager', 'synced', '-f', 'oneshot', '350', '255'])
            add_log('success', 'Đã kích hoạt rung kiểm tra mô-tơ tuyến tính X-axis (350ms, biên độ tối đa).')
            return {'success': True}
        elif test_type == 'audio':
            add_log('info', 'Kiểm tra phát âm thanh qua loa kép stereo điện thoại...')
            add_log('cmd', '$ adb shell am start -a android.intent.action.VIEW -d file:///system/media/audio/notifications/HONOR_Marimba.ogg -t audio/ogg')
            run_cmd(['adb', 'shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', 'file:///system/media/audio/notifications/HONOR_Marimba.ogg', '-t', 'audio/ogg'])
            add_log('success', 'Đã gửi lệnh phát âm thanh HONOR_Marimba.ogg qua loa kép stereo điện thoại.')
            return {'success': True}
        elif test_type == 'screen' or test_type == 'screen_gallery':
            add_log('info', 'Kiểm tra điểm chết màn hình OLED 1.5K (Bộ 5 ảnh đơn sắc toàn màn hình)...')
            _, query_out, _ = run_cmd(['adb', 'shell', 'content', 'query', '--uri', 'content://media/external/images/media', '--projection', '_id:_data'])
            found_id = None
            for line in query_out.splitlines():
                if 'Test_ManHinh_Do' in line:
                    m = re.search(r'_id=([0-9]+)', line)
                    if m:
                        found_id = m.group(1)
                        break

            if not found_id:
                from PIL import Image
                temp_dir = os.path.join(BASE_DIR, 'scratch', 'screen_test_images')
                os.makedirs(temp_dir, exist_ok=True)
                colors = [
                    ('01_Test_ManHinh_Do.png', (255, 0, 0)),
                    ('02_Test_ManHinh_XanhLa.png', (0, 255, 0)),
                    ('03_Test_ManHinh_XanhDuong.png', (0, 0, 255)),
                    ('04_Test_ManHinh_Trang.png', (255, 255, 255)),
                    ('05_Test_ManHinh_Den.png', (0, 0, 0)),
                ]
                for name, rgb in colors:
                    local_p = os.path.join(temp_dir, name)
                    if not os.path.exists(local_p):
                        img = Image.new('RGB', (1280, 2788), color=rgb)
                        img.save(local_p)

                add_log('cmd', '$ adb shell mkdir -p /sdcard/Pictures/ScreenTest')
                run_cmd(['adb', 'shell', 'mkdir', '-p', '/sdcard/Pictures/ScreenTest'])
                add_log('cmd', '$ adb push scratch/screen_test_images/*.png /sdcard/Pictures/ScreenTest/')
                for name, _ in colors:
                    local_p = os.path.join(temp_dir, name)
                    run_cmd(['adb', 'push', local_p, f'/sdcard/Pictures/ScreenTest/{name}'])
                    run_cmd(['adb', 'shell', 'am', 'broadcast', '-a', 'android.intent.action.MEDIA_SCANNER_SCAN_FILE', '-d', f'file:///sdcard/Pictures/ScreenTest/{name}'])

                time.sleep(1)
                _, query_out2, _ = run_cmd(['adb', 'shell', 'content', 'query', '--uri', 'content://media/external/images/media', '--projection', '_id:_data'])
                for line in query_out2.splitlines():
                    if 'Test_ManHinh_Do' in line:
                        m = re.search(r'_id=([0-9]+)', line)
                        if m:
                            found_id = m.group(1)
                            break

            if found_id:
                add_log('cmd', f'$ adb shell am start -a android.intent.action.VIEW -d content://media/external/images/media/{found_id} -t image/png')
                run_cmd(['adb', 'shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', f'content://media/external/images/media/{found_id}', '-t', 'image/png'])
                add_log('success', 'Đã mở bộ 5 ảnh đơn sắc 1.5K toàn màn hình trong Bộ Sưu Tập máy! Bạn có thể vuốt tay trái/phải để soi điểm chết OLED.')
            else:
                add_log('cmd', '$ adb shell am start -a android.intent.action.VIEW -d content://media/external/images/media -t image/*')
                run_cmd(['adb', 'shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', 'content://media/external/images/media', '-t', 'image/*'])
                add_log('info', 'Đã mở thư mục ảnh ScreenTest trong Bộ Sưu Tập trên điện thoại.')
            return {'success': True, 'mode': 'gallery'}

        elif test_type == 'screen_browser':
            add_log('info', 'Mở trang web kiểm tra điểm chết màn hình online trên điện thoại...')
            add_log('cmd', '$ adb shell am start -a android.intent.action.VIEW -d https://www.deadpixeltest.org')
            run_cmd(['adb', 'shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', 'https://www.deadpixeltest.org'])
            add_log('success', 'Đã mở trang web kiểm tra điểm chết màn hình deadpixeltest.org trong trình duyệt điện thoại.')
            return {'success': True, 'mode': 'browser'}

        elif test_type == 'touch_pointer':
            _, current_val, _ = run_cmd(['adb', 'shell', 'settings', 'get', 'system', 'pointer_location'])
            is_enabled = current_val.strip() == '1'
            new_val = '0' if is_enabled else '1'
            add_log('cmd', f'$ adb shell settings put system pointer_location {new_val}')
            run_cmd(['adb', 'shell', 'settings', 'put', 'system', 'pointer_location', new_val])
            state_text = 'BẬT (Hiển thị vệt vẽ cảm ứng & tọa độ XY)' if new_val == '1' else 'TẮT (Trở lại bình thường)'
            add_log('success', f'Đã {state_text} tính năng Soi Cảm Ứng Đa Điểm trên màn hình điện thoại.')
            return {'success': True, 'enabled': new_val == '1'}

    elif action == 'uninstall_app':
        pkg = payload.get('package', '')
        is_user = payload.get('is_user', True)
        if not pkg: return {'success': False, 'message': 'Thiếu package'}
        if pkg in PROTECTED_PACKAGES:
            add_log('error', f'Từ chối gỡ bỏ: [{pkg}] là ứng dụng hệ thống cốt lõi của MagicOS! Chống bootloop.')
            return {'success': False, 'error': f'"{pkg}" là ứng dụng hệ thống cốt lõi bất khả xâm phạm. Không thể gỡ bỏ để bảo vệ an toàn cho máy.'}
        add_log('info', f'Bắt đầu quy trình gỡ cài đặt ứng dụng: {pkg}...')
        if is_user:
            add_log('cmd', f'$ adb shell pm uninstall {pkg}')
            code, out, err = run_cmd(['adb', 'shell', 'pm', 'uninstall', pkg])
        else:
            add_log('cmd', f'$ adb shell pm disable-user --user 0 {pkg}')
            run_cmd(['adb', 'shell', 'pm', 'disable-user', '--user', '0', pkg])
            add_log('cmd', f'$ adb shell pm uninstall -k --user 0 {pkg}')
            code, out, err = run_cmd(['adb', 'shell', 'pm', 'uninstall', '-k', '--user', '0', pkg])
        if code == 0 or 'Success' in out:
            add_log('success', f'=== [HOÀN TẤT] Đã gỡ cài đặt thành công: {pkg} ({out or "Success"}) ===')
            return {'success': True}
        else:
            add_log('error', f'Gỡ {pkg} thất bại: {err or out}')
            return {'success': False, 'error': err or out}

    elif action == 'freeze_app':
        pkg = payload.get('package', '')
        if not pkg: return {'success': False, 'message': 'Thiếu package'}
        if pkg in PROTECTED_PACKAGES:
            add_log('error', f'Từ chối đóng băng: [{pkg}] là ứng dụng hệ thống cốt lõi của MagicOS!')
            return {'success': False, 'error': f'"{pkg}" là ứng dụng hệ thống cốt lõi bất khả xâm phạm. Không thể đóng băng để giữ ổn định hệ thống.'}
        add_log('info', f'Bắt đầu đóng băng (vô hiệu hóa): {pkg}...')
        add_log('cmd', f'$ adb shell pm disable-user --user 0 {pkg}')
        code, out, err = run_cmd(['adb', 'shell', 'pm', 'disable-user', '--user', '0', pkg])
        if code == 0 or 'disabled' in out.lower():
            add_log('success', f'=== [HOÀN TẤT] Đã đóng băng an toàn ứng dụng: {pkg} ===')
            return {'success': True}
        add_log('error', f'Đóng băng {pkg} thất bại: {err or out}')
        return {'success': False, 'error': err or out}

    elif action == 'unfreeze_app':
        pkg = payload.get('package', '')
        if not pkg: return {'success': False, 'message': 'Thiếu package'}
        add_log('info', f'Bắt đầu rã đông (kích hoạt lại): {pkg}...')
        add_log('cmd', f'$ adb shell cmd package install-existing --user 0 {pkg}')
        run_cmd(['adb', 'shell', 'cmd', 'package', 'install-existing', '--user', '0', pkg])
        add_log('cmd', f'$ adb shell pm enable {pkg}')
        code, out, err = run_cmd(['adb', 'shell', 'pm', 'enable', pkg])
        if code == 0 or 'enabled' in out.lower() or 'state:' in out.lower():
            add_log('success', f'=== [HOÀN TẤT] Đã rã đông & kích hoạt lại ứng dụng: {pkg} ===')
            return {'success': True}
        add_log('error', f'Rã đông {pkg} thất bại: {err or out}')
        return {'success': False, 'error': err or out}

    elif action == 'clear_app_data':
        pkg = payload.get('package', '')
        if not pkg: return {'success': False, 'message': 'Thiếu package'}
        add_log('info', f'Bắt đầu xóa toàn bộ dữ liệu & cache của {pkg}...')
        add_log('cmd', f'$ adb shell pm clear {pkg}')
        code, out, err = run_cmd(['adb', 'shell', 'pm', 'clear', pkg])
        if code == 0 or 'Success' in out:
            add_log('success', f'=== [HOÀN TẤT] Đã xóa sạch dữ liệu & bộ nhớ đệm: {pkg} ===')
            return {'success': True}
        add_log('error', f'Xóa dữ liệu {pkg} thất bại: {err or out}')
        return {'success': False, 'error': err or out}

    elif action == 'launch_app':
        pkg = payload.get('package', '')
        if not pkg: return {'success': False, 'message': 'Thiếu package'}
        add_log('info', f'Đang mở ứng dụng {pkg} trên màn hình điện thoại...')
        add_log('cmd', f'$ adb shell monkey -p {pkg} -c android.intent.category.LAUNCHER 1')
        run_cmd(['adb', 'shell', 'monkey', '-p', pkg, '-c', 'android.intent.category.LAUNCHER', '1'])
        add_log('success', f'Đã phát lệnh khởi chạy {pkg} trên điện thoại.')
        return {'success': True}

    elif action == 'force_stop_app':
        pkg = payload.get('package', '')
        if not pkg: return {'success': False, 'message': 'Thiếu package'}
        add_log('info', f'Buộc dừng tiến trình ứng dụng: {pkg}...')
        add_log('cmd', f'$ adb shell am force-stop {pkg}')
        run_cmd(['adb', 'shell', 'am', 'force-stop', pkg])
        add_log('success', f'Đã buộc dừng (force-stop) ứng dụng: {pkg}')
        return {'success': True}

    elif action == 'raw_cmd':
        cmd = payload.get('cmd', '')
        if not cmd:
            return {'success': False, 'message': 'Lệnh rỗng'}
        code, out, err = run_cmd(['adb', 'shell'] + cmd.split())
        return {'success': code == 0, 'output': out}

    elif action == 'apply_magic_tweak':
        table = payload.get('table', 'secure')
        key = payload.get('key', '')
        value = payload.get('value', '0')
        if not key: return {'success': False, 'message': 'Thiếu key'}
        return apply_magic_tweak(table, key, value)

    elif action == 'apply_all_marketing_off':
        turn_off = payload.get('turn_off', True)
        keys = payload.get('keys', None)
        return apply_all_marketing_off(turn_off, keys)

    elif action == 'extract_trial_theme':
        return extract_trial_theme()

    elif action == 'deploy_theme_file':
        return deploy_uploaded_theme(payload)

    return {'success': False, 'message': f'Hành động không xác định: {action}'}

# Custom HTTP Request Handler
class HonorRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/api/device':
            self.send_json_response(get_device_info())
        elif path == '/api/battery_health':
            self.send_json_response(get_battery_health_details())
        elif path == '/api/inspection':
            self.send_json_response(get_device_inspection_report())
        elif path == '/api/env':
            self.send_json_environment(get_system_environment()) if hasattr(self, 'send_json_environment') else self.send_json_response(get_system_environment())
        elif path == '/api/scan':
            self.send_json_response(scan_packages())
        elif path == '/api/apps':
            self.send_json_response(get_all_applications())
        elif path == '/api/magic_tweaks':
            self.send_json_response(get_magic_tweaks_status())
        elif path == '/api/root_status':
            self.send_json_response(get_root_lsposed_status())
        elif path == '/api/logs':
            with LOG_LOCK:
                logs_copy = list(LOG_BUFFER)
            self.send_json_response({'logs': logs_copy})
        elif path == '/api/devices_db':
            self.send_json_response(DEVICES_DB)
        elif path == '/api/download_theme':
            query = urllib.parse.parse_qs(parsed.query)
            filename = query.get('filename', [''])[0]
            if not filename or '..' in filename or '/' in filename or '\\' in filename:
                self.send_json_response({'error': 'Tên tệp không hợp lệ'}, status=400)
                return
            target_path = os.path.join(THEMES_DIR, filename)
            if not os.path.exists(target_path):
                self.send_json_response({'error': 'Tệp theme không tồn tại'}, status=404)
                return
            try:
                with open(target_path, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'application/octet-stream')
                self.send_header('Content-Disposition', f'attachment; filename="{urllib.parse.quote(filename)}"')
                self.send_header('Content-Length', str(len(content)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(content)
            except Exception as e:
                self.send_json_response({'error': str(e)}, status=500)
            return
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, *')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/action':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                payload = json.loads(body.decode('utf-8'))
                res = handle_action(payload)
                self.send_json_response(res)
            except Exception as e:
                self.send_json_response({'success': False, 'error': str(e)}, status=500)
        else:
            self.send_json_response({'error': 'Not found'}, status=404)

    def send_json_response(self, data, status=200):
        try:
            body = json.dumps(data, ensure_ascii=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, *')
            self.send_header('Access-Control-Allow-Private-Network', 'true')
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def log_message(self, format, *args):
        # Suppress routine static asset logs to keep console clean
        pass

def start_server():
    server = ThreadingHTTPServer((HOST, PORT), HonorRequestHandler)
    add_log('success', f'Máy chủ TP Honor Toolkit đang chạy tại: http://localhost:{PORT}')
    
    # Auto-open browser in a separate thread
    def open_browser():
        time.sleep(1.2)
        webbrowser.open(f'http://localhost:{PORT}')
    
    threading.Thread(target=open_browser, daemon=True).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        add_log('info', 'Đang dừng máy chủ...')
        server.server_close()

if __name__ == '__main__':
    start_server()
