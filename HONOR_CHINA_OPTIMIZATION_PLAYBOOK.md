# CẨM NANG VÀ LỆNH TỐI ƯU HÓA ĐIỆN THOẠI HONOR NỘI ĐỊA TRUNG QUỐC (MAGICOS)

> **Mục đích:** Hướng dẫn và bộ lệnh mẫu chuẩn chỉ nhất để biến bất kỳ máy Honor nội địa Trung Quốc nào (Magic 5/6/7, Honor 90/100/200/X80 Pro Max...) thành máy chuẩn sử dụng tại Việt Nam: **100% nổ thông báo tức thì, sạch rác TQ, Wi-Fi siêu ổn định, khóa 120Hz mượt mà và an toàn tuyệt đối**.

---

## ⚡ CÁCH 1: CHẠY TOOL PYTHON 1-CLICK (NHANH NHẤT)

Nếu có máy tính Linux/Mac/Windows cài sẵn Python:
Cắm cáp điện thoại, bật **Gỡ lỗi qua USB (USB Debugging)** và chạy 1 lệnh duy nhất:

```bash
python3 scripts/honor_magic_master.py --all
```

*Lệnh trên sẽ tự động:*
1. Chẩn đoán toàn diện thiết bị.
2. Whitelist và cấp quyền `AppOps` (`POST_NOTIFICATION`, `WAKE_LOCK`, `SYSTEM_ALERT_WINDOW`) cho toàn bộ app liên lạc & ngân hàng.
3. Gỡ sạch 12 app rác nội địa TQ (bao gồm Service Gallery chống quẹt nhầm góc, Baidu Swan Mini Programs; giữ nguyên My Honor, App Market, Music, Tạp chí màn hình khóa, Mẹo vặt, Bàn phím gốc, Trình sửa video).
4. Đổi Captive Portal sang Google 204 và bật Private DNS Cloudflare 1.1.1.1.
5. Tắt theo dõi Telemetry và gửi log về máy chủ TQ.
6. Khóa cứng 120Hz (giữ nguyên Animation 1.0x).
7. Biên dịch mã máy AOT Native (dex2oat) cho Zalo, Mi Browser, Nhạc Quán, Messenger, ChatGPT mở tức thì.
8. Lưu bản ghi hoàn tác vào `honor_debloat_backup.json` (phục hồi bằng lệnh `python3 scripts/honor_magic_master.py --restore`).

---

## 🛠️ CÁCH 2: CHẠY BẰNG TAY TỪNG LỆNH ADB (NẾU DÙNG WEBADB HOẶC CMD)

### Bước 1: Fix thông báo (Doze Mode & AppOps)
```bash
# Whitelist Doze Mode
adb shell dumpsys deviceidle whitelist +com.zing.zalo
adb shell dumpsys deviceidle whitelist +com.facebook.orca
adb shell dumpsys deviceidle whitelist +com.facebook.katana
adb shell dumpsys deviceidle whitelist +com.google.android.gm
adb shell dumpsys deviceidle whitelist +org.telegram.messenger
adb shell dumpsys deviceidle whitelist +com.whatsapp
adb shell dumpsys deviceidle whitelist +com.tpb.mb.gprsandroid
adb shell dumpsys deviceidle whitelist +com.vnpay.vpbankonline
adb shell dumpsys deviceidle whitelist +vn.banvietbank.mobilebanking
adb shell dumpsys deviceidle whitelist +com.mservice.momotransfer
adb shell dumpsys deviceidle whitelist +xyz.be.cake
adb shell dumpsys deviceidle whitelist +vn.io.nhacquan

# Cấp quyền chạy nền, cửa sổ nổi, foreground & hiển thị thông báo
for pkg in com.zing.zalo com.facebook.orca com.facebook.katana com.google.android.gm org.telegram.messenger com.whatsapp; do
    adb shell cmd appops set $pkg RUN_IN_BACKGROUND allow
    adb shell cmd appops set $pkg RUN_ANY_IN_BACKGROUND allow
    adb shell cmd appops set $pkg POST_NOTIFICATION allow
    adb shell cmd appops set $pkg WAKE_LOCK allow
    adb shell cmd appops set $pkg SYSTEM_ALERT_WINDOW allow
    adb shell cmd appops set $pkg START_FOREGROUND allow
    adb shell cmd appops set $pkg SCHEDULE_EXACT_ALARM allow
    adb shell cmd appops set $pkg ACCESS_RESTRICTED_SETTINGS allow
done

# Cấp quyền Dữ liệu nền không giới hạn (Network Policy - Chống rớt mạng socket ngầm, hỗ trợ cả app nhân bản)
for pkg in com.zing.zalo com.facebook.orca com.facebook.katana com.google.android.gm org.telegram.messenger com.whatsapp com.google.android.gms; do
    for uid in $(adb shell pm list packages -U $pkg 2>/dev/null | awk -F'uid:' '{print $2}' | tr ',' ' '); do
        [ -n "$uid" ] && adb shell cmd netpolicy add restrict-background-whitelist $uid
    done
done
```

### Bước 2: Gỡ & Khóa vĩnh viễn 12 app rác nội địa TQ (Chống App Market tự cài lại)
> [!IMPORTANT]
> Trên MagicOS 8/9/10, nếu chỉ dùng `pm uninstall`, kho ứng dụng **Honor App Market** (`com.hihonor.appmarket`) khi quét cập nhật ngầm sẽ coi các app này là "ứng dụng hệ thống còn sót (residual apps)" và tự động tải bản update mới để kích hoạt lại.
> Bằng cách đặt trạng thái **`pm disable-user --user 0`** trước khi gỡ, Android sẽ đánh dấu vĩnh viễn là người dùng chủ động vô hiệu hóa, khiến App Market bỏ qua hoàn toàn.

```bash
# Vô hiệu hóa và gỡ sạch 12 ứng dụng rác (Bao gồm Service Gallery & Baidu Swan Mini-App)
for pkg in com.honor.browser com.hihonor.browserhomepage com.hihonor.gamecenter com.hihonor.game.kitserver com.hihonor.quickgame com.hihonor.cloudmusic com.honor.yoyocards com.hihonor.hiboard com.hihonor.redteamobile.roaming com.sohu.inputmethod.sogou.honor com.hihonor.servicecenter com.baidu.swan; do
    adb shell pm disable-user --user 0 $pkg
    adb shell pm uninstall -k --user 0 $pkg
done
```

### Bước 3: Tối ưu Wi-Fi Siêu Tốc & Fix Triệt Để Lag Mạng MagicOS (Facebook/TikTok)
```bash
# 1. Chuyển Captive Portal sang Google 204
adb shell settings put global captive_portal_mode 1
adb shell settings put global captive_portal_http_url http://connectivitycheck.gstatic.com/generate_204
adb shell settings put global captive_portal_https_url https://connectivitycheck.gstatic.com/generate_204
adb shell settings put global captive_portal_fallback_url http://www.google.com/gen_204

# 2. Bật Private DNS mã hóa (DoT - Tránh modem nhà mạng VN đầu độc DNS)
# Dùng Cloudflare (mặc định):
adb shell settings put global private_dns_mode hostname
adb shell settings put global private_dns_specifier 1dot1dot1dot1.cloudflare-dns.com
# Hoặc Google DNS: dns.google
# Hoặc NextDNS cá nhân: <ID>.dns.nextdns.io

# 3. Tắt Wi-Fi Pro & Chuyển mạng thông minh (Tránh Link Turbo gây đứt socket video QUIC/UDP của FB/TikTok)
adb shell settings put global hn_wifipro_enable false
adb shell settings put system smart_network_switch 0
adb shell settings put secure settings_wlan_mt_axl 0

# 4. Đổi máy chủ đo độ trễ mạng ngầm từ Baidu TQ sang Google (Tránh hệ thống hiểu nhầm Wi-Fi chập chờn)
adb shell "settings put global wifi_hidata_rtt_url 'connectivitycheck.gstatic.com|www.google.com'"

# 5. Tắt thẩm định an ninh Wi-Fi qua Cloud Honor Trung Quốc
adb shell settings put global wifi_cloud_security_check 0

# 6. Tắt chip Wi-Fi tự động ngủ ngắt quãng sau 120s (Chống khựng video)
adb shell settings put global wifi_power_save 0
```

### Bước 4: Tắt Telemetry theo dõi gửi log ngầm TQ
```bash
adb shell settings put secure user_experience_involved 0
adb shell dumpsys deviceidle whitelist -com.hihonor.hiviewtunnel
adb shell pm disable-user --user 0 com.hihonor.android.UEInfoCheck
adb shell pm disable-user --user 0 com.hihonor.collectcenter
```

### Bước 5: Khóa cứng 120Hz & Khóa Mật độ hiển thị (Chuẩn 385 dp)
> **Lưu ý kỹ thuật về hiển thị**: Màn hình 1.5K của Honor có chiều rộng vật lý là 1280 px. Để đạt **Độ rộng nhỏ nhất 385 dp** chuẩn mắt (Sweet spot vừa vặn nhất, icon và chữ cân đối) trong Tùy chọn nhà phát triển, giá trị density quy đổi chính xác là **532** (`1280 * 160 / 385 ≈ 532`). Đồng thời tắt tính năng "Độ phân giải thông minh" (`low_resolution_switch = 0`) để hệ thống không tự ý ghi đè density về 560.
```bash
# 1. Khóa cứng 120Hz & Animation gốc 1.0x
adb shell settings put system min_refresh_rate 120.0
adb shell settings put system peak_refresh_rate 120.0
adb shell settings put global window_animation_scale 1.0
adb shell settings put global transition_animation_scale 1.0
adb shell settings put global animator_duration_scale 1.0
adb shell settings put global wifi_scan_always_enabled 0
adb shell settings put global ble_scan_always_enabled 0

# 2. Khóa cứng Độ rộng nhỏ nhất 385 dp (Density 532 - Tắt Smart Resolution chống tự reset)
adb shell settings put global low_resolution_switch 0
adb shell settings put global aps_display_resolution 0
adb shell wm density 532
adb shell settings put secure display_density_forced 532
```

### Bước 6: Tăng tốc mở app tức thì (Biên dịch Native ARM64)
```bash
adb shell cmd package compile -m speed -f com.zing.zalo
adb shell cmd package compile -m speed -f com.mi.globalbrowser
adb shell cmd package compile -m speed -f vn.io.nhacquan
adb shell cmd package compile -m speed -f com.facebook.orca
adb shell cmd package compile -m speed -f com.facebook.katana
adb shell cmd package compile -m speed -f com.google.android.gm
adb shell cmd package compile -m speed -f com.openai.chatgpt
adb shell pm trim-caches 100G
```


### Bước 7: Chuyển ứng dụng Thời tiết mặc định sang Tiếng Anh (Độ C)
> **Lưu ý kỹ thuật**: File APK Thời tiết nội địa (`com.hihonor.android.totemweather`) chỉ chứa gói ngôn ngữ Tiếng Trung (`zh`) và Tiếng Anh (`en`), không có Tiếng Việt. Nếu ép sang `vi-VN`, hệ thống sẽ tự fallback về Tiếng Trung. Lệnh sau chuyển app sang **Tiếng Anh chuẩn quốc tế (en-GB - hiển thị độ C)**:
```bash
adb shell cmd locale set-app-locales com.hihonor.android.totemweather --locales en-GB
adb shell am force-stop com.hihonor.android.totemweather
```
*(Nếu muốn xem thời tiết 100% Tiếng Việt, khuyến nghị dùng Widget Google Thời tiết đã có sẵn trên máy hoặc app Weawow).*


### Bước 8: Kích hoạt Google Gemini làm Trợ lý ảo toàn hệ thống (Thay thế YOYO)
> **Lưu ý kỹ thuật**: Trên MagicOS nội địa, hệ điều hành mặc định gán cứng `voice_interaction_service` cho Honor MagicVoice (`com.hihonor.magicvoice`). Để cử chỉ vuốt góc và phím cứng mở thẳng Google/Gemini, ta đóng băng `com.hihonor.magicvoice` và phân quyền cho Google & Gemini:
```bash
adb shell pm disable-user --user 0 com.hihonor.magicvoice
adb shell settings put secure assistant com.google.android.googlequicksearchbox/com.google.android.voiceinteraction.GsaVoiceInteractionService
adb shell settings put secure voice_interaction_service com.google.android.googlequicksearchbox/com.google.android.voiceinteraction.GsaVoiceInteractionService
adb shell cmd appops set com.google.android.googlequicksearchbox ASSIST_STRUCTURE allow
adb shell cmd appops set com.google.android.googlequicksearchbox ASSIST_SCREENSHOT allow
adb shell cmd appops set com.google.android.apps.bard ASSIST_STRUCTURE allow
adb shell cmd appops set com.google.android.apps.bard ASSIST_SCREENSHOT allow
adb shell cmd appops set com.google.android.apps.bard SYSTEM_ALERT_WINDOW allow
```

---

## 📱 THAO TÁC QUAN TRỌNG TRÊN ĐIỆN THOẠI (BẰNG TAY)

1. **Bật Khởi chạy liên kết (Secondary Launch)**:
   * Vào **Cài đặt** > **Pin** > **Quản lý khởi động ứng dụng (App launch)**.
   * Tìm: Zalo, Facebook, Gmail, TPBank, VPBank, MoMo...
   * Chuyển sang **Quản lý thủ công** và **BẬT CẢ 3 CÔNG TẮC**:
     - `[x]` Tự khởi chạy
     - `[x]` **Khởi chạy liên kết** *(Cho phép Google FCM đánh thức app)*
     - `[x]` Chạy ngầm
2. **Khóa đa nhiệm**:
   * Mở Zalo, Messenger > Vuốt đa nhiệm > Vuốt nhẹ thẻ ứng dụng xuống để hiện **biểu tượng ổ khóa 🔒**.
3. **Gmail**:
   * Mở app Gmail > Cài đặt > Chọn tài khoản > Mục Thông báo: Đổi sang **Tất cả (All)**.

---

## 🔄 LỆNH PHỤC HỒI / HOÀN TÁC NGUYÊN BẢN (KHI CẦN BÁN MÁY)
```bash
adb shell cmd package install-existing com.honor.browser
adb shell cmd package install-existing com.hihonor.browserhomepage
adb shell cmd package install-existing com.hihonor.gamecenter
adb shell cmd package install-existing com.hihonor.cloudmusic
adb shell cmd package install-existing com.hihonor.hiboard
adb shell cmd package install-existing com.hihonor.servicecenter
adb shell pm enable com.hihonor.servicecenter
adb shell cmd package install-existing com.baidu.swan
adb shell pm enable com.baidu.swan
adb shell pm enable com.hihonor.android.UEInfoCheck
adb shell pm enable com.hihonor.collectcenter
adb shell pm enable com.hihonor.magicvoice
adb shell settings delete system min_refresh_rate
adb shell settings delete system peak_refresh_rate
adb shell wm density reset
adb shell settings delete secure display_density_forced
adb shell settings put global low_resolution_switch 1
adb shell settings put global aps_display_resolution 2
adb shell settings put global hn_wifipro_enable true
adb shell settings put system smart_network_switch 1
adb shell settings put secure settings_wlan_mt_axl 1
adb shell settings put global wifi_cloud_security_check 1
adb shell "settings put global wifi_hidata_rtt_url 'www.baidu.com|connectivitycheck.gstatic.com|www.google.com'"
adb shell settings put global wifi_power_save 120
adb shell settings put global private_dns_mode off
```
