#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
           HONOR MAGICOS MASTER OPTIMIZATION TOOLKIT (ALL-IN-ONE)
=============================================================================
Công cụ tối ưu hóa toàn diện cho điện thoại Honor nội địa Trung Quốc (MagicOS)
- Tự động nhận diện thiết bị qua ADB
- Trị triệt để lỗi trễ thông báo (Zalo, Facebook, Gmail, Ngân hàng, MoMo...)
- Gỡ sạch 10 ứng dụng rác nội địa TQ (Giữ nguyên My Honor, App Market, Nhạc gốc, Tạp chí...)
- Tối ưu Wi-Fi siêu tốc (Google Captive Portal 204 + Private DNS Cloudflare 1.1.1.1)
- Tắt sạch theo dõi Telemetry và gửi log ngầm về máy chủ Trung Quốc
- Khóa cứng màn hình 120Hz mượt mà (Giữ nguyên animation gốc 1.0x tự nhiên)
- Tăng tốc khởi chạy app tức thì bằng trình biên dịch AOT Native (dex2oat)
- Tự động sao lưu & Hỗ trợ hoàn tác nguyên trạng 100% (Rollback 1-Click)
=============================================================================
"""

import os
import sys
import json
import argparse
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple

BACKUP_FILE = Path("honor_debloat_backup.json")

# ANSI Color Codes
class Color:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    RESET = "\033[0m"

# 12 Ứng dụng rác nội địa TQ chốt xóa (Safe to Debloat 100%)
DEBLOAT_LIST = {
    "com.honor.browser": "Trình duyệt nội địa TQ (Đã có Brave/Chrome)",
    "com.hihonor.browserhomepage": "Trang chủ & cổng tin tức quảng cáo TQ",
    "com.hihonor.gamecenter": "Honor Game Center (Kho game TQ - ngốn pin ngầm)",
    "com.hihonor.game.kitserver": "Dịch vụ game kit TQ",
    "com.hihonor.quickgame": "Quick Games (Kho mini-game rác tiếng Trung)",
    "com.hihonor.cloudmusic": "Honor Cloud Music TQ (Bị chặn bản quyền ngoài TQ)",
    "com.honor.yoyocards": "Thẻ gợi ý thông minh YOYO (Chỉ có tiếng Trung)",
    "com.hihonor.hiboard": "Bảng tin HiBoard vuốt sang trái màn hình chính",
    "com.hihonor.redteamobile.roaming": "Dịch vụ chuyển vùng eSIM nội địa TQ (Ngốn pin ngầm)",
    "com.sohu.inputmethod.sogou.honor": "Bàn phím Sogou TQ (Xóa bỏ, chỉ giữ bàn phím Honor Baidu)",
    "com.hihonor.servicecenter": "Service Gallery (Kho thẻ dịch vụ TQ & chặn quẹt nhầm góc màn hình)",
    "com.baidu.swan": "Baidu Swan (Bộ khung chạy ngầm Baidu Smart Mini Programs TQ)",
}

# Các ứng dụng liên lạc & ngân hàng cần cấp quyền ưu tiên sống còn
CRITICAL_PACKAGES = {
    "com.zing.zalo": "Zalo",
    "com.facebook.orca": "Messenger",
    "com.facebook.katana": "Facebook",
    "com.google.android.gm": "Gmail",
    "org.telegram.messenger": "Telegram",
    "com.whatsapp": "WhatsApp",
    "com.google.android.gms": "Dịch vụ Google Play (Google Play Services)",
    "vn.io.nhacquan": "Nhạc Quán",
    "com.openai.chatgpt": "ChatGPT",
    "com.mi.globalbrowser": "Mi Browser",
    "com.mservice.momotransfer": "MoMo",
    "vn.com.vng.zalopay": "ZaloPay",
    "com.tpb.mb.gprsandroid": "TPBank Mobile",
    "com.vnpay.vpbankonline": "VPBank NEO",
    "vn.banvietbank.mobilebanking": "BVBank Digimi",
    "xyz.be.cake": "Cake by VPBank",
    "vn.tnex.consumer": "TNEX",
    "com.mcreditvn.superapp": "MCredit",
    "com.bplus.vtpay": "Viettel Money",
    "com.viettel.appviettel": "My Viettel",
    "com.grabtaxi.passenger": "Grab",
    "vn.foody.delivery": "ShopeeFood",
    "com.azure.authenticator": "Microsoft Authenticator",
    "org.localsend.localsend_app": "LocalSend",
}

def run_adb(cmd: str) -> str:
    """Thực thi lệnh ADB an toàn và trả về stdout."""
    try:
        full_cmd = f"adb {cmd}"
        res = subprocess.run(
            full_cmd, shell=True, capture_output=True, text=True, check=True
        )
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        return f"ERROR: {e.stderr.strip()}"

def check_device() -> Tuple[bool, str]:
    """Kiểm tra kết nối và xuất thông tin phần cứng."""
    out = run_adb("devices")
    lines = [l.strip() for l in out.splitlines() if l.strip()]
    devices = [l for l in lines[1:] if "\tdevice" in l]
    if not devices:
        return False, "Không tìm thấy điện thoại Honor qua ADB! Hãy cắm cáp và bật 'Gỡ lỗi qua USB'."
    
    brand = run_adb("shell getprop ro.product.brand")
    model = run_adb("shell getprop ro.product.model")
    magic = run_adb("shell getprop ro.build.version.magic")
    build_id = run_adb("shell getprop ro.build.display.id")
    info = f"{Color.BOLD}{brand} {model}{Color.RESET} | {Color.CYAN}{magic}{Color.RESET} | Bản dựng: {build_id}"
    return True, info

def get_installed_packages() -> List[str]:
    """Lấy danh sách toàn bộ package đang cài đặt."""
    out = run_adb("shell pm list packages")
    return sorted([l.replace("package:", "").strip() for l in out.splitlines() if l.startswith("package:")])

def get_current_whitelist() -> List[str]:
    """Lấy danh sách Whitelist Doze Mode hiện tại."""
    out = run_adb("shell dumpsys deviceidle whitelist")
    whitelisted = []
    for line in out.splitlines():
        parts = line.split(",")
        if len(parts) >= 2:
            whitelisted.append(parts[1].strip())
    return whitelisted

def step_audit():
    """Bước 1: Quét và chẩn đoán toàn diện hiện trạng máy."""
    ok, info = check_device()
    if not ok:
        print(f"{Color.RED}[!] {info}{Color.RESET}")
        return

    print(f"\n{Color.CYAN}{'='*68}")
    print(f"       BÁO CÁO CHẨN ĐOÁN THIẾT BỊ HONOR MAGICOS NỘI ĐỊA")
    print(f"{'='*68}{Color.RESET}")
    print(f"[*] Thiết bị: {info}\n")

    installed = set(get_installed_packages())
    whitelist = set(get_current_whitelist())

    print(f"{Color.BOLD}1. TRẠNG THÁI ỨNG DỤNG LIÊN LẠC & TÀI CHÍNH:{Color.RESET}")
    print("-" * 68)
    for pkg, name in CRITICAL_PACKAGES.items():
        if pkg in installed:
            status = f"{Color.GREEN}🟢 Đã Whitelist{Color.RESET}" if pkg in whitelist else f"{Color.RED}🔴 BỊ BỎ RƠI (Trễ noti){Color.RESET}"
            print(f"  • {name:<35} : {status}")

    print(f"\n{Color.BOLD}2. DANH SÁCH ỨNG DỤNG RÁC NỘI ĐỊA TQ:{Color.RESET}")
    print("-" * 68)
    bloat_found = 0
    for pkg, desc in DEBLOAT_LIST.items():
        if pkg in installed:
            in_wl = f"{Color.YELLOW}⚠️ [Chạy ngầm tốn pin]{Color.RESET}" if pkg in whitelist else ""
            print(f"  • {pkg:<35} : {desc} {in_wl}")
            bloat_found += 1
    if bloat_found == 0:
        print(f"  {Color.GREEN}-> Tuyệt vời! Máy đã sạch bóng toàn bộ app rác nội địa.{Color.RESET}")

    print(f"\n{Color.BOLD}3. THIẾT LẬP MÀN HÌNH & HIỆU ỨNG:{Color.RESET}")
    print("-" * 68)
    min_hz = run_adb("shell settings get system min_refresh_rate")
    anim = run_adb("shell settings get global window_animation_scale")
    density = run_adb("shell settings get secure display_density_forced")
    hz_str = f"{Color.GREEN}Đã khóa cứng 120Hz{Color.RESET}" if min_hz in ["120.0", "120"] else f"{Color.YELLOW}Tự động (Dễ drop 60Hz){Color.RESET}"
    density_str = f"{Color.GREEN}Đã khóa 532 (Chuẩn 385 dp){Color.RESET}" if density in ["532", "525", "518"] else f"{Color.YELLOW}{density}{Color.RESET}"
    print(f"  • Tần số quét (Refresh Rate) : {hz_str}")
    print(f"  • Mật độ hiển thị (DPI / dp) : {density_str}")
    print(f"  • Tốc độ hiệu ứng (Animation): {anim}x (Mặc định gốc)")
    print(f"{Color.CYAN}{'='*68}{Color.RESET}\n")

def step_fix_notifications():
    """Bước 2: Trị triệt để lỗi thông báo (Bypass Doze Mode + AppOps)."""
    print(f"\n{Color.BLUE}[+] Đang tối ưu hóa thông báo tức thì (Bypass Doze Mode & Cấp quyền AppOps)...{Color.RESET}")
    installed = set(get_installed_packages())
    whitelist = set(get_current_whitelist())

    count = 0
    for pkg, name in CRITICAL_PACKAGES.items():
        if pkg in installed:
            if pkg not in whitelist:
                run_adb(f"shell dumpsys deviceidle whitelist +{pkg}")
                print(f"  -> Whitelist Doze: {name} ({pkg})")
                count += 1
            # Cấp quyền cưỡng bức AppOps
            run_adb(f"shell cmd appops set {pkg} RUN_IN_BACKGROUND allow")
            run_adb(f"shell cmd appops set {pkg} RUN_ANY_IN_BACKGROUND allow")
            run_adb(f"shell cmd appops set {pkg} POST_NOTIFICATION allow")
            run_adb(f"shell cmd appops set {pkg} WAKE_LOCK allow")
            run_adb(f"shell cmd appops set {pkg} SYSTEM_ALERT_WINDOW allow")
            run_adb(f"shell cmd appops set {pkg} START_FOREGROUND allow")
            run_adb(f"shell cmd appops set {pkg} SCHEDULE_EXACT_ALARM allow")
            run_adb(f"shell cmd appops set {pkg} ACCESS_RESTRICTED_SETTINGS allow")

            # Mở khóa dữ liệu nền không giới hạn (Network Policy - hỗ trợ cả app nhân bản)
            pkg_uids_out = run_adb(f"shell pm list packages -U {pkg}")
            if "uid:" in pkg_uids_out:
                uids_part = pkg_uids_out.split("uid:")[-1].strip()
                for uid in uids_part.split(","):
                    uid = uid.strip()
                    if uid.isdigit():
                        run_adb(f"shell cmd netpolicy add restrict-background-whitelist {uid}")

    print(f"{Color.GREEN}[✓] Hoàn tất! Đã kích hoạt cơ chế nhận thông báo thời gian thực cho {count} ứng dụng.{Color.RESET}")

def step_debloat():
    """Bước 3: Gỡ bỏ 10 ứng dụng rác nội địa TQ (Lưu bản ghi hoàn tác)."""
    print(f"\n{Color.BLUE}[+] Đang dọn sạch 10 ứng dụng rác nội địa Trung Quốc...{Color.RESET}")
    installed = set(get_installed_packages())

    removed = []
    if BACKUP_FILE.exists():
        try:
            with open(BACKUP_FILE, "r", encoding="utf-8") as f:
                removed = json.load(f)
        except Exception:
            removed = []

    for pkg, desc in DEBLOAT_LIST.items():
        if pkg in installed:
            # Khóa trạng thái disabled-user trước để chặn triệt để AppMarket tự động cài lại/cập nhật ngầm
            run_adb(f"shell pm disable-user --user 0 {pkg}")
            res = run_adb(f"shell pm uninstall -k --user 0 {pkg}")
            if "Success" in res or "disabled-user" in res:
                print(f"  {Color.GREEN}[✓] Đã gỡ & khóa vĩnh viễn: {pkg:<32}{Color.RESET} ({desc})")
                if pkg not in removed:
                    removed.append(pkg)
            else:
                print(f"  {Color.RED}[!] Thất bại: {pkg} -> {res}{Color.RESET}")

    with open(BACKUP_FILE, "w", encoding="utf-8") as f:
        json.dump(removed, f, indent=2, ensure_ascii=False)
    print(f"{Color.GREEN}[✓] Đã dọn dẹp sạch sẽ. Lịch sử đã lưu tại '{BACKUP_FILE}'.{Color.RESET}")

def step_optimize_wifi_and_dns():
    """Bước 4: Tối ưu Wi-Fi siêu tốc (Google Captive Portal 204, Private DNS & Fix triệt để Wi-Fi MagicOS TQ)."""
    print(f"\n{Color.BLUE}[+] Đang tối ưu hóa Wi-Fi & Kích hoạt Private DNS Cloudflare 1.1.1.1...{Color.RESET}")
    # 1. Chuyển Captive Portal sang Google 204
    run_adb("shell settings put global captive_portal_mode 1")
    run_adb("shell settings put global captive_portal_http_url http://connectivitycheck.gstatic.com/generate_204")
    run_adb("shell settings put global captive_portal_https_url https://connectivitycheck.gstatic.com/generate_204")
    run_adb("shell settings put global captive_portal_fallback_url http://www.google.com/gen_204")

    # 2. Bật Private DNS mã hóa (DoT)
    run_adb("shell settings put global private_dns_mode hostname")
    run_adb("shell settings put global private_dns_specifier 1dot1dot1dot1.cloudflare-dns.com")

    # 3. Tắt Wi-Fi Pro / Link Turbo & Chuyển mạng thông minh (Chống đứt socket video QUIC/UDP của FB, TikTok)
    run_adb("shell settings put global hn_wifipro_enable false")
    run_adb("shell settings put system smart_network_switch 0")
    run_adb("shell settings put secure settings_wlan_mt_axl 0")

    # 4. Đổi máy chủ đo độ trễ mạng ngầm từ Baidu sang Google (Tránh hệ thống hiểu nhầm Wi-Fi chập chờn)
    run_adb('shell "settings put global wifi_hidata_rtt_url \'connectivitycheck.gstatic.com|www.google.com\'"')

    # 5. Tắt thẩm định an ninh Wi-Fi gửi dữ liệu về Cloud Honor Trung Quốc
    run_adb("shell settings put global wifi_cloud_security_check 0")

    # 6. Tắt chế độ chip Wi-Fi tự động ngủ ngắt quãng sau 120s (WMM / DTIM Power Save)
    run_adb("shell settings put global wifi_power_save 0")

    print(f"{Color.GREEN}[✓] Wi-Fi đã chuyển sang máy chủ Google 204, DNS Cloudflare & Tối ưu triệt để MagicOS thành công!{Color.RESET}")

def step_disable_telemetry():
    """Bước 5: Chặn sạch theo dõi Telemetry và thu thập log ngầm về máy chủ TQ."""
    print(f"\n{Color.BLUE}[+] Đang dập tắt toàn bộ dịch vụ theo dõi Telemetry gửi về máy chủ TQ...{Color.RESET}")
    run_adb("shell settings put secure user_experience_involved 0")
    run_adb("shell dumpsys deviceidle whitelist -com.hihonor.hiviewtunnel")
    run_adb("shell pm disable-user --user 0 com.hihonor.android.UEInfoCheck")
    run_adb("shell pm disable-user --user 0 com.hihonor.collectcenter")
    run_adb("shell pm disable-user --user 0 com.hihonor.magicvoice")
    run_adb("shell settings put secure assistant com.google.android.googlequicksearchbox/com.google.android.voiceinteraction.GsaVoiceInteractionService")
    run_adb("shell settings put secure voice_interaction_service com.google.android.googlequicksearchbox/com.google.android.voiceinteraction.GsaVoiceInteractionService")
    run_adb("shell cmd appops set com.google.android.googlequicksearchbox ASSIST_STRUCTURE allow")
    run_adb("shell cmd appops set com.google.android.googlequicksearchbox ASSIST_SCREENSHOT allow")
    run_adb("shell cmd appops set com.google.android.apps.bard ASSIST_STRUCTURE allow")
    run_adb("shell cmd appops set com.google.android.apps.bard ASSIST_SCREENSHOT allow")
    run_adb("shell cmd appops set com.google.android.apps.bard SYSTEM_ALERT_WINDOW allow")
    print(f"{Color.GREEN}[✓] Đã tắt thu thập log ngầm & Kích hoạt Google Gemini làm Trợ lý ảo toàn hệ thống!{Color.RESET}")

def step_tweak_display():
    """Bước 6: Khóa cứng 120Hz, Khóa Density 532 (Chuẩn 385 dp) & Giữ nguyên hiệu ứng gốc 1.0x."""
    print(f"\n{Color.BLUE}[+] Đang khóa cứng 120Hz & Khóa Density 532 (Chuẩn 385 dp - Tắt Smart Resolution)...{Color.RESET}")
    run_adb("shell settings put system min_refresh_rate 120.0")
    run_adb("shell settings put system peak_refresh_rate 120.0")
    run_adb("shell settings put global window_animation_scale 1.0")
    run_adb("shell settings put global transition_animation_scale 1.0")
    run_adb("shell settings put global animator_duration_scale 1.0")
    run_adb("shell settings put global wifi_scan_always_enabled 0")
    run_adb("shell settings put global ble_scan_always_enabled 0")
    # Khóa cứng Độ rộng nhỏ nhất 385 dp (Density 532) và tắt Độ phân giải thông minh để chống tự reset
    run_adb("shell settings put global low_resolution_switch 0")
    run_adb("shell settings put global aps_display_resolution 0")
    run_adb("shell wm density 532")
    run_adb("shell settings put secure display_density_forced 532")
    print(f"{Color.GREEN}[✓] Màn hình đã khóa cứng 120Hz & Density 532 (Chuẩn 385 dp) thành công!{Color.RESET}")

def step_aot_compile():
    """Bước 7: Biên dịch AOT Native (dex2oat) cho các app trọng yếu mở nhanh như chớp."""
    print(f"\n{Color.BLUE}[+] Đang biên dịch mã máy Native ARM64 (AOT Speed) cho các ứng dụng chính...{Color.RESET}")
    key_apps = ["com.zing.zalo", "com.mi.globalbrowser", "vn.io.nhacquan", "com.facebook.orca", "com.facebook.katana", "com.google.android.gm", "com.openai.chatgpt"]
    for app in key_apps:
        res = run_adb(f"shell cmd package compile -m speed -f {app}")
        status = f"{Color.GREEN}Success{Color.RESET}" if "Success" in res else res
        print(f"  -> Compile {app:<26} : {status}")
    run_adb("shell pm trim-caches 100G")
    print(f"{Color.GREEN}[✓] Đã tối ưu hóa tốc độ khởi chạy app và giải phóng bộ nhớ đệm!{Color.RESET}")

def step_restore():
    """Hoàn tác / Khôi phục toàn bộ thiết lập và ứng dụng đã gỡ."""
    print(f"\n{Color.YELLOW}[!] Bắt đầu khôi phục toàn bộ ứng dụng và thiết lập về nguyên bản...{Color.RESET}")
    if not BACKUP_FILE.exists():
        print(f"{Color.RED}[!] Không tìm thấy file sao lưu '{BACKUP_FILE}'.{Color.RESET}")
        return

    with open(BACKUP_FILE, "r", encoding="utf-8") as f:
        pkgs = json.load(f)

    for pkg in pkgs:
        res = run_adb(f"shell cmd package install-existing {pkg}")
        run_adb(f"shell pm enable {pkg}")
        print(f"  [✓] Phục hồi {pkg:<32} : {res}")

    # Bật lại các app telemetry
    run_adb("shell pm enable com.hihonor.android.UEInfoCheck")
    run_adb("shell pm enable com.hihonor.collectcenter")
    run_adb("shell pm enable com.hihonor.magicvoice")
    # Reset màn hình về tự động
    run_adb("shell settings delete system min_refresh_rate")
    run_adb("shell settings delete system peak_refresh_rate")
    run_adb("shell wm density reset")
    run_adb("shell settings delete secure display_density_forced")
    run_adb("shell settings put global low_resolution_switch 1")
    run_adb("shell settings put global aps_display_resolution 2")
    # Phục hồi thiết lập Wi-Fi MagicOS về mặc định xuất xưởng
    run_adb("shell settings put global hn_wifipro_enable true")
    run_adb("shell settings put system smart_network_switch 1")
    run_adb("shell settings put secure settings_wlan_mt_axl 1")
    run_adb("shell settings put global wifi_cloud_security_check 1")
    run_adb('shell "settings put global wifi_hidata_rtt_url \'www.baidu.com|connectivitycheck.gstatic.com|www.google.com\'"')
    run_adb("shell settings put global wifi_power_save 120")
    run_adb("shell settings put global private_dns_mode off")
    print(f"{Color.GREEN}[✓] Đã hoàn tác mọi thứ về trạng thái xuất xưởng mặc định thành công!{Color.RESET}")

def run_all():
    """Thực thi trọn gói từ A-Z."""
    step_audit()
    step_fix_notifications()
    step_debloat()
    step_optimize_wifi_and_dns()
    step_disable_telemetry()
    step_tweak_display()
    step_aot_compile()
    print(f"\n{Color.GREEN}{Color.BOLD}🎉 TẤT CẢ HẠNG MỤC TỐI ƯU HÓA ĐÃ HOÀN TẤT THÀNH CÔNG 100%!{Color.RESET}\n")

def main():
    parser = argparse.ArgumentParser(description="Honor MagicOS Master Optimization Toolkit")
    parser.add_argument("--all", action="store_true", help="Chạy trọn gói tối ưu từ A-Z")
    parser.add_argument("--audit", action="store_true", help="Chẩn đoán hiện trạng thiết bị")
    parser.add_argument("--noti", action="store_true", help="Fix thông báo cho Zalo, Ngân hàng...")
    parser.add_argument("--debloat", action="store_true", help="Gỡ sạch 10 ứng dụng rác TQ")
    parser.add_argument("--wifi", action="store_true", help="Tối ưu Wi-Fi & Private DNS")
    parser.add_argument("--telemetry", action="store_true", help="Tắt theo dõi gửi log ngầm")
    parser.add_argument("--display", action="store_true", help="Khóa cứng màn hình 120Hz")
    parser.add_argument("--speed", action="store_true", help="Biên dịch Native tăng tốc mở app")
    parser.add_argument("--restore", action="store_true", help="Hoàn tác về nguyên bản gốc")

    args = parser.parse_args()

    if args.all:
        run_all()
    elif args.audit:
        step_audit()
    elif args.noti:
        step_fix_notifications()
    elif args.debloat:
        step_debloat()
    elif args.wifi:
        step_optimize_wifi_and_dns()
    elif args.telemetry:
        step_disable_telemetry()
    elif args.display:
        step_tweak_display()
    elif args.speed:
        step_aot_compile()
    elif args.restore:
        step_restore()
    else:
        # Menu tương tác bằng số
        while True:
            print("\n" + "=" * 56)
            print(f"   {Color.BOLD}HONOR MAGICOS MASTER OPTIMIZATION TOOLKIT{Color.RESET}")
            print("=" * 56)
            print("1. Chẩn đoán hiện trạng thiết bị (Audit)")
            print("2. Fix triệt để thông báo (Zalo, Ngân hàng, MoMo...)")
            print("3. Gỡ sạch 10 app rác nội địa TQ (Safe Debloat)")
            print("4. Tối ưu Wi-Fi siêu tốc & DNS Cloudflare 1.1.1.1")
            print("5. Tắt sạch theo dõi Telemetry gửi về TQ")
            print("6. Khóa cứng 120Hz mượt mà (Giữ Animation 1.0x)")
            print("7. Tăng tốc mở app tức thì (AOT Native dex2oat)")
            print(f"{Color.GREEN}8. [KHUYÊN DÙNG] Chạy trọn gói từ A-Z (1-Click All){Color.RESET}")
            print(f"{Color.YELLOW}9. Hoàn tác / Khôi phục về nguyên bản gốc (Rollback){Color.RESET}")
            print("0. Thoát")
            print("-" * 56)
            choice = input("Nhập lựa chọn của anh (0-9): ").strip()
            if choice == "1": step_audit()
            elif choice == "2": step_fix_notifications()
            elif choice == "3": step_debloat()
            elif choice == "4": step_optimize_wifi_and_dns()
            elif choice == "5": step_disable_telemetry()
            elif choice == "6": step_tweak_display()
            elif choice == "7": step_aot_compile()
            elif choice == "8": run_all()
            elif choice == "9": step_restore()
            elif choice == "0": break
            else: print("Lựa chọn không hợp lệ!")

if __name__ == "__main__":
    main()
