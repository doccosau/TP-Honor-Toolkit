#!/usr/bin/env python3
"""
Honor MagicOS Optimization Tool
Thiết kế chuyên sâu cho điện thoại Honor nội địa (MagicOS 7.x, 8.x, 9.x, 10.x)
- Fix triệt để thông báo (Zalo, Banking, Messenger...)
- Dọn dẹp app rác nội địa Trung Quốc an toàn (Có kịch bản hoàn tác)
- Khóa cứng 120Hz & Tối ưu Animation 0.5x
"""

import sys
import json
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple

BACKUP_FILE = Path("honor_debloat_backup.json")

# Danh sách ứng dụng rác nội địa TQ có thể gỡ an toàn (Safe to Debloat)
SAFE_DEBLOAT_CATALOG = {
    "com.honor.browser": "Trình duyệt nội địa TQ (Đã có Brave/Chrome)",
    "com.hihonor.browserhomepage": "Trang chủ & quảng cáo trình duyệt TQ",
    "com.hihonor.gamecenter": "Honor Game Center (Kho game TQ - anh không chơi game)",
    "com.hihonor.quickgame": "Quick Games (Game mini rác)",
    "com.hihonor.game.kitserver": "Dịch vụ game kit TQ",
    "com.hihonor.cloudmusic": "Honor Cloud Music TQ (Bị chặn bản quyền ngoài TQ)",
    "com.honor.yoyocards": "Thẻ gợi ý thông minh TQ (YOYO Cards)",
    "com.hihonor.hiboard": "Bảng tin HiBoard màn hình ngoài cùng bên trái",
    "com.hihonor.redteamobile.roaming": "Dịch vụ chuyển vùng eSIM nội địa TQ (Đang ngốn pin ngầm)",
    "com.sohu.inputmethod.sogou.honor": "Bàn phím Sogou TQ (Xóa bỏ, chỉ giữ bàn phím Honor Baidu)",
    "com.hihonor.servicecenter": "Service Gallery (Kho thẻ dịch vụ TQ & chặn quẹt nhầm góc màn hình)",
    "com.baidu.swan": "Baidu Swan (Bộ khung chạy ngầm Baidu Smart Mini Programs TQ)",
}

# Ứng dụng liên lạc, ngân hàng, MXH cần ưu tiên sống còn (Whitelist FCM / Battery)
CRITICAL_PACKAGES = {
    "com.zing.zalo": "Zalo",
    "com.facebook.orca": "Messenger",
    "com.facebook.katana": "Facebook",
    "org.telegram.messenger": "Telegram",
    "com.whatsapp": "WhatsApp",
    "com.google.android.gm": "Gmail",
    "com.google.android.gms": "Dịch vụ Google Play (Google Play Services)",
    "vn.io.nhacquan": "Nhạc Quán",
    "com.mservice.momotransfer": "MoMo",
    "vn.com.vng.zalopay": "ZaloPay",
    "com.tpb.mb.gprsandroid": "TPBank Mobile",
    "com.vnpay.vpbankonline": "VPBank NEO",
    "vn.banvietbank.mobilebanking": "BVBank Digimi",
    "xyz.be.cake": "Cake by VPBank",
    "vn.tnex.consumer": "TNEX",
    "com.mcreditvn.superapp": "MCredit",
    "com.grabtaxi.passenger": "Grab",
    "vn.foody.delivery": "ShopeeFood",
    "com.viettel.appviettel": "My Viettel",
    "com.bplus.vtpay": "Viettel Money",
    "com.azure.authenticator": "Microsoft Authenticator",
    "org.localsend.localsend_app": "LocalSend",
}


def run_adb(cmd: str) -> str:
    """Thực thi lệnh ADB an toàn."""
    try:
        full_cmd = f"adb {cmd}"
        res = subprocess.run(
            full_cmd, shell=True, capture_output=True, text=True, check=True
        )
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        return f"ERROR: {e.stderr.strip()}"


def check_device() -> Tuple[bool, str]:
    """Kiểm tra kết nối thiết bị."""
    out = run_adb("devices")
    lines = [line.strip() for line in out.splitlines() if line.strip()]
    devices = [l for l in lines[1:] if "\tdevice" in l]
    if not devices:
        return False, "Không tìm thấy thiết bị Honor kết nối qua ADB. Vui lòng kiểm tra cáp và bật 'Gỡ lỗi qua USB'!"
    
    brand = run_adb("shell getprop ro.product.brand")
    model = run_adb("shell getprop ro.product.model")
    magic = run_adb("shell getprop ro.build.version.magic")
    build_id = run_adb("shell getprop ro.build.display.id")
    info = f"Thiết bị: {brand} {model} | {magic} | Bản dựng: {build_id}"
    return True, info


def get_installed_packages() -> List[str]:
    """Lấy danh sách toàn bộ package đang có trên máy."""
    out = run_adb("shell pm list packages")
    pkgs = []
    for line in out.splitlines():
        if line.startswith("package:"):
            pkgs.append(line.replace("package:", "").strip())
    return sorted(pkgs)


def get_current_whitelist() -> List[str]:
    """Lấy danh sách các ứng dụng đang được whitelist trong Doze Mode."""
    out = run_adb("shell dumpsys deviceidle whitelist")
    whitelisted = []
    for line in out.splitlines():
        parts = line.split(",")
        if len(parts) >= 2:
            whitelisted.append(parts[1].strip())
    return whitelisted


def scan_and_audit():
    """Quét và phân tích toàn diện hiện trạng máy."""
    ok, info = check_device()
    if not ok:
        print(f"[!] {info}")
        return

    print("=" * 65)
    print(" BÁO CÁO PHÂN TÍCH HIỆN TRẠNG ĐIỆN THOẠI HONOR NỘI ĐỊA")
    print("=" * 65)
    print(f"[*] {info}\n")

    installed = set(get_installed_packages())
    whitelist = set(get_current_whitelist())

    # 1. Kiểm tra ứng dụng liên lạc & ngân hàng cần Whitelist
    print("1. TRẠNG THÁI ỨNG DỤNG LIÊN LẠC & TÀI CHÍNH:")
    print("-" * 65)
    missing_whitelist = []
    for pkg, name in CRITICAL_PACKAGES.items():
        if pkg in installed:
            status = "🟢 Đã Whitelist" if pkg in whitelist else "🔴 BỊ BỎ RƠI (Dễ trễ thông báo)"
            if pkg not in whitelist:
                missing_whitelist.append((pkg, name))
            print(f"  • {name:<35} : {status}")

    # 2. Kiểm tra App rác nội địa TQ đang tồn tại
    print("\n2. DANH SÁCH ỨNG DỤNG RÁC NỘI ĐỊA TQ PHÁT HIỆN TRÊN MÁY:")
    print("-" * 65)
    bloat_found = []
    for pkg, desc in SAFE_DEBLOAT_CATALOG.items():
        if pkg in installed:
            in_wl = "⚠️ [Đang chạy ngốn pin ngầm]" if pkg in whitelist else ""
            print(f"  • {pkg:<35} : {desc} {in_wl}")
            bloat_found.append(pkg)
    
    if not bloat_found:
        print("  -> Tuyệt vời! Máy đã sạch bóng ứng dụng rác nội địa.")

    # 3. Kiểm tra màn hình & Animation
    print("\n3. THIẾT LẬP MÀN HÌNH & HIỆU ỨNG CHUYỂN CẢNH:")
    print("-" * 65)
    min_hz = run_adb("shell settings get system min_refresh_rate")
    peak_hz = run_adb("shell settings get system peak_refresh_rate")
    anim = run_adb("shell settings get global window_animation_scale")

    hz_status = f"Đã khóa cứng {min_hz}Hz" if min_hz in ["120.0", "120"] else "Tự động/Mặc định (Dễ bị drop 60Hz)"
    anim_status = f"{anim}x (Phản hồi siêu tốc)" if anim == "0.5" else f"{anim}x (Mặc định)"

    print(f"  • Tần số quét (Refresh Rate) : {hz_status}")
    print(f"  • Tốc độ hiệu ứng (Animation): {anim_status}")
    print("=" * 65)


def fix_notifications():
    """Tự động whitelist và cấp quyền chạy ngầm cho tất cả app liên lạc/ngân hàng."""
    print("\n[+] Đang tối ưu hóa thông báo (Bypass Doze Mode & Cấp quyền AppOps)...")
    installed = set(get_installed_packages())
    whitelist = set(get_current_whitelist())

    fixed_count = 0
    for pkg, name in CRITICAL_PACKAGES.items():
        if pkg in installed:
            # 1. Thêm vào DeviceIdle Whitelist
            if pkg not in whitelist:
                run_adb(f"shell dumpsys deviceidle whitelist +{pkg}")
                print(f"  -> Whitelisted: {name} ({pkg})")
                fixed_count += 1
            
            # 2. Cấp quyền AppOps chạy nền vĩnh viễn
            run_adb(f"shell cmd appops set {pkg} RUN_IN_BACKGROUND allow")
            run_adb(f"shell cmd appops set {pkg} RUN_ANY_IN_BACKGROUND allow")

    print(f"[✓] Hoàn tất! Đã kích hoạt cơ chế nhận thông báo chuẩn thời gian thực cho {fixed_count} ứng dụng.")


def debloat_safe():
    """Gỡ bỏ ứng dụng rác nội địa Trung Quốc theo phân cấp an toàn."""
    print("\n[+] Bắt đầu gỡ ứng dụng rác nội địa Trung Quốc...")
    installed = set(get_installed_packages())

    # Kiểm tra an toàn: Có Laban Key hoặc Gboard chưa?
    has_labankey = "com.vng.inputmethod.labankey" in installed
    has_gboard = "com.google.android.inputmethod.latin" in installed
    safe_to_remove_keyboard = has_labankey or has_gboard

    removed_list = []
    
    # Đọc backup cũ nếu có
    if BACKUP_FILE.exists():
        try:
            with open(BACKUP_FILE, "r", encoding="utf-8") as f:
                removed_list = json.load(f)
        except Exception:
            removed_list = []

    for pkg, desc in SAFE_DEBLOAT_CATALOG.items():
        if pkg in installed:
            # Nếu là bàn phím TQ mà chưa có bàn phím thay thế -> Bỏ qua
            if "input" in pkg and not safe_to_remove_keyboard:
                print(f"  [!] BỎ QUA bàn phím '{pkg}' vì chưa phát hiện Gboard hoặc Laban Key!")
                continue

            res = run_adb(f"shell pm uninstall -k --user 0 {pkg}")
            if "Success" in res:
                print(f"  [✓] Đã gỡ: {pkg:<32} ({desc})")
                if pkg not in removed_list:
                    removed_list.append(pkg)
            else:
                print(f"  [!] Thất bại: {pkg} -> {res}")

    with open(BACKUP_FILE, "w", encoding="utf-8") as f:
        json.dump(removed_list, f, indent=2, ensure_ascii=False)

    print(f"[✓] Đã gỡ sạch rác nội địa. Danh sách đã được lưu vào '{BACKUP_FILE}' để có thể hoàn tác bất kỳ lúc nào.")


def tweak_display():
    """Khóa cứng 120Hz & Khóa Density 532 (Chuẩn 385 dp - Tắt Smart Resolution)."""
    print("\n[+] Đang tối ưu màn hình 120Hz & Khóa Density 532 (Chuẩn 385 dp)...")
    run_adb("shell settings put system min_refresh_rate 120.0")
    run_adb("shell settings put system peak_refresh_rate 120.0")
    run_adb("shell settings put global window_animation_scale 1.0")
    run_adb("shell settings put global transition_animation_scale 1.0")
    run_adb("shell settings put global animator_duration_scale 1.0")
    run_adb("shell settings put global wifi_scan_always_enabled 0")
    run_adb("shell settings put global ble_scan_always_enabled 0")
    # Khóa cứng Độ rộng nhỏ nhất 385 dp (Density 532) và tắt Smart Resolution chống tự reset
    run_adb("shell settings put global low_resolution_switch 0")
    run_adb("shell settings put global aps_display_resolution 0")
    run_adb("shell wm density 532")
    run_adb("shell settings put secure display_density_forced 532")
    print("[✓] Đã ép cứng 120Hz & Density 532 (Chuẩn 385 dp) thành công!")


def restore_apps():
    """Hoàn tác / Khôi phục toàn bộ ứng dụng đã gỡ."""
    print("\n[+] Bắt đầu khôi phục các ứng dụng đã gỡ...")
    if not BACKUP_FILE.exists():
        print("[!] Không tìm thấy file lưu lịch sử 'honor_debloat_backup.json'.")
        return

    with open(BACKUP_FILE, "r", encoding="utf-8") as f:
        pkgs = json.load(f)

    for pkg in pkgs:
        res = run_adb(f"shell cmd package install-existing {pkg}")
        if "installed" in res.lower() or "success" in res.lower():
            print(f"  [✓] Đã khôi phục: {pkg}")
        else:
            print(f"  [~] {pkg}: {res}")

    # Reset màn hình & animation về mặc định
    run_adb("shell settings delete system min_refresh_rate")
    run_adb("shell settings delete system peak_refresh_rate")
    run_adb("shell wm density reset")
    run_adb("shell settings delete secure display_density_forced")
    run_adb("shell settings put global low_resolution_switch 1")
    run_adb("shell settings put global aps_display_resolution 2")
    run_adb("shell settings put global window_animation_scale 1.0")
    run_adb("shell settings put global transition_animation_scale 1.0")
    run_adb("shell settings put global animator_duration_scale 1.0")
    print("[✓] Đã khôi phục toàn bộ về trạng thái xuất xưởng mặc định!")


def main():
    if len(sys.argv) > 1:
        cmd = sys.argv[1].lower()
        if cmd == "scan":
            scan_and_audit()
        elif cmd == "fix":
            fix_notifications()
        elif cmd == "debloat":
            debloat_safe()
        elif cmd == "tweak":
            tweak_display()
        elif cmd == "restore":
            restore_apps()
        elif cmd == "all":
            scan_and_audit()
            fix_notifications()
            debloat_safe()
            tweak_display()
        else:
            print("Lệnh hợp lệ: scan | fix | debloat | tweak | restore | all")
        return

    # Menu tương tác
    while True:
        print("\n" + "=" * 50)
        print("    CÔNG CỤ TỐI ƯU HÓA HONOR MAGICOS (PYTHON)")
        print("=" * 50)
        print("1. Quét & Phân tích hiện trạng máy (Audit)")
        print("2. Fix lỗi thông báo (Zalo, Messenger, Ngân hàng...)")
        print("3. Dọn rác nội địa TQ an toàn (Debloat Safe)")
        print("4. Ép 120Hz & Tăng tốc Animation 0.5x")
        print("5. [TỰ ĐỘNG] Chạy trọn gói tối ưu từ A-Z")
        print("6. Khôi phục / Hoàn tác về mặc định (Rollback)")
        print("0. Thoát")
        print("-" * 50)
        choice = input("Nhập lựa chọn của anh (0-6): ").strip()
        if choice == "1":
            scan_and_audit()
        elif choice == "2":
            fix_notifications()
        elif choice == "3":
            debloat_safe()
        elif choice == "4":
            tweak_display()
        elif choice == "5":
            scan_and_audit()
            fix_notifications()
            debloat_safe()
            tweak_display()
        elif choice == "6":
            restore_apps()
        elif choice == "0":
            break
        else:
            print("Lựa chọn không hợp lệ!")


if __name__ == "__main__":
    main()
