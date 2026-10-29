<div align="center">
  <img src="logo.png" alt="TP Honor Toolkit Logo" width="120" style="border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.4);" />
  <h1>TP HONOR TOOLKIT</h1>
  <p><b>Bộ Tiện Ích Quản Trị, Chẩn Đoán &amp; Tối Ưu Hóa Chuyên Sâu Cho Điện Thoại Honor MagicOS</b></p>
  <p>
    <i>Tối ưu hóa toàn diện dòng máy Honor nội địa Trung Quốc sang trải nghiệm mượt mà, ổn định tại Việt Nam</i>
  </p>
</div>

---

## 🌟 Giới Thiệu Tổng Quan

**TP Honor Toolkit** là bộ giải pháp phần mềm chuyên sâu được thiết kế dành riêng cho các thiết bị Honor chạy hệ điều hành **MagicOS** (đặc biệt là các phiên bản máy nội địa Trung Quốc như Honor Magic 6 Pro, Magic 7 Pro, Magic V2/V3, Honor 100/200 series, X9b/X50...). 

Công cụ giúp người dùng dễ dàng khắc phục triệt để các vấn đề thường gặp trên máy nội địa (trễ thông báo, bloatware tiếng Trung, rớt Wi-Fi, trợ lý YOYO không nhận diện tiếng Việt...), đồng thời cung cấp bảng chẩn đoán phần cứng và quản lý ứng dụng chuyên nghiệp theo tiêu chuẩn **Toolkit Standard**.

---

## 🚀 Tính Năng Nổi Bật

### 1. 🔍 Chẩn Đoán & Kiểm Định Phần Cứng Thật (Toolkit Standard)
- **Kiểm định pin nâng cao**: Đo dung lượng pin thiết kế vs dung lượng pin thực tế, số chu kỳ sạc (Charge Cycle Count), nhiệt độ cell pin, điện áp BMS và đánh giá mức độ chai pin theo thời gian thực.
- **Bóc tách cấu hình chi tiết**: Đọc trực tiếp phần cứng gồm chip SoC Snapdragon / Dimensity, xung nhịp CPU, GPU, RAM LPDDR, bộ nhớ UFS, thông số cảm biến Camera, Baseband modem và mã bo mạch chủ.
- **Xuất báo cáo kiểm định**: Hỗ trợ tạo và in báo cáo tình trạng máy chuyên nghiệp (phục vụ kỹ thuật viên kiểm tra máy cũ / thu mua / test máy).

### 2. ⚡ Playbook Tối Ưu Hóa 1-Click (Honor Magic Master)
- **Fix triệt để trễ thông báo**: Tự động cấu hình `deviceidle whitelist` và cấp quyền `AppOps` (`POST_NOTIFICATION`, `RUN_IN_BACKGROUND`, `WAKE_LOCK`) cho Zalo, Messenger, Telegram, Gmail và toàn bộ app ngân hàng (TPBank, Vietcombank, VPBank, MB, MoMo...).
- **Gỡ sạch Bloatware nội địa**: Tắt và gỡ 12+ ứng dụng rác tiếng Trung (Game Center, Quick Game, HiBoard tin tức TQ, Yoyo Cards, Redtea Roaming, Baidu Swan Mini-Apps...) an toàn 100%, không lo chạm góc quẹt nhầm.
- **Tối ưu kết nối Wi-Fi & Mạng**:
  - Chuyển máy chủ Captive Portal sang chuẩn `Google 204` (xóa thông báo "Mạng có thể bị giới hạn").
  - Kích hoạt Private DNS Cloudflare `1.1.1.1` chống đầu độc DNS.
  - Tắt Link Turbo và Wi-Fi Pro gây đứt socket UDP khi xem video Facebook/TikTok.
  - Tắt tính năng tự ngủ của chip Wi-Fi sau 120s không hoạt động.
- **Tắt Telemetry ngầm**: Chặn các tiến trình gửi log phân tích thói quen sử dụng về máy chủ Trung Quốc (`UEInfoCheck`, `hiviewtunnel`, `collectcenter`).
- **Khóa cứng 120Hz & Mật độ hiển thị chuẩn**:
  - Ép tần số quét cố định 120Hz mượt mà (giữ nguyên Animation 1.0x).
  - Khóa mật độ hiển thị DPI 385dp chuẩn mắt (Density 532 trên màn hình 1.5K) và tắt Smart Resolution chống tự reset.
- **Biên dịch AOT Native (dex2oat)**: Ép biên dịch mã máy trước (Ahead-Of-Time) cho Zalo, Messenger, ChatGPT, Nhạc Quán... mở ứng dụng tức thì không có độ trễ.

### 3. 📦 Quản Trị Ứng Dụng Toàn Diện (App Manager)
- **Phân loại thông minh**: Tự động lọc và hiển thị theo nhóm: *Bloatware nội địa*, *Google Ecosystem*, *Ứng dụng hệ thống*, *Ứng dụng người dùng*.
- **Thao tác nhanh**: Đóng băng (Freeze/Disable), Gỡ cài đặt (Uninstall), Khôi phục (Re-enable/Install existing).
- **Trích xuất APK**: Xuất trực tiếp file APK của bất kỳ ứng dụng nào trên máy về máy tính chỉ với 1 click.
- **Kéo thả cài đặt**: Hỗ trợ kéo thả cài đặt hàng loạt file `.apk` vào điện thoại một cách tiện lợi.

### 4. 🤖 Kích Hoạt Trợ Lý Ảo Google Gemini & Trợ Lý VXM
- Vô hiệu hóa trợ lý YOYO tiếng Trung mặc định của Honor.
- Phân quyền trợ lý toàn hệ thống cho **Google Assistant / Google Gemini** hoặc **Trợ lý VXM tiếng Việt**.
- Hỗ trợ cử chỉ vuốt góc màn hình và phím nguồn để gọi trợ lý ảo nhanh chóng.

### 5. 🖥️ Chiếu Màn Hình Scrcpy 120Hz Độ Trễ Siêu Thấp
- Tích hợp sẵn bộ điều khiển Scrcpy qua Web/Desktop.
- Điều khiển điện thoại bằng chuột, phím, bàn rê chuột trên máy tính với khung hình mượt mà lên tới 120fps.

### 6. 📚 Kho Dữ Liệu Thiết Bị Honor (125+ Model)
- Tra cứu tức thì thông số kỹ thuật, mã model nội địa và quốc tế (ví dụ: `BVL-AN00` = Magic 6 Pro), chipset, dung lượng pin và chuẩn sạc nhanh của toàn bộ hệ sinh thái smartphone Honor.

---

## 💻 Hướng Dẫn Sử Dụng Trên Máy Tính

### Yêu Cầu Chuẩn Bị
1. Cáp kết nối Type-C (khuyên dùng cáp truyền dữ liệu tốt).
2. Trên điện thoại Honor:
   - Vào **Cài đặt** > **Về điện thoại** > Bấm 7 lần vào **Số phiên bản (Build Number)** để mở *Tùy chọn nhà phát triển*.
   - Vào **Cài đặt** > **Hệ thống & cập nhật** > **Tùy chọn nhà phát triển**.
   - Bật **Gỡ lỗi qua USB (USB Debugging)**.

---

### Cách 1: Khởi Chạy Giao Diện Trực Quan (Khuyên Dùng)

Khởi động giao diện quản trị đồ họa đầy đủ tính năng:

```bash
# Trên Linux / macOS
./run.sh

# Hoặc trên Windows
run.bat
```

Sau khi chạy, giao diện sẽ tự động mở trên trình duyệt tại: `http://localhost:5050`

---

### Cách 2: Tối Ưu Nhanh 1-Click Bằng Python CLI

Nếu muốn tối ưu nhanh toàn bộ máy mà không cần mở giao diện web:

```bash
python3 scripts/honor_magic_master.py --all
```

*Lệnh trên sẽ tự động thực thi chuỗi tác vụ tối ưu: Whitelist thông báo, gỡ bloatware, fix Wi-Fi, khóa 120Hz, tắt telemetry và lưu bản ghi sao lưu hoàn tác.*

---

## 🛠️ Danh Sách Lệnh ADB Tối Ưu Thủ Công (Dành Cho Kỹ Thuật Viên)

<details>
<summary><b>Nhấn vào đây để xem chi tiết từng lệnh ADB</b></summary>

### 1. Fix trễ thông báo (Doze Mode & AppOps)
```bash
# Whitelist Doze Mode cho các app liên lạc & ngân hàng
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

# Cấp quyền chạy nền & hiển thị thông báo
adb shell cmd appops set com.zing.zalo RUN_IN_BACKGROUND allow
adb shell cmd appops set com.zing.zalo POST_NOTIFICATION allow
adb shell cmd appops set com.zing.zalo WAKE_LOCK allow
adb shell cmd appops set com.facebook.orca RUN_IN_BACKGROUND allow
adb shell cmd appops set com.facebook.orca POST_NOTIFICATION allow
adb shell cmd appops set com.facebook.katana RUN_IN_BACKGROUND allow
adb shell cmd appops set com.facebook.katana POST_NOTIFICATION allow
adb shell cmd appops set com.google.android.gm RUN_IN_BACKGROUND allow
adb shell cmd appops set com.google.android.gm POST_NOTIFICATION allow
```

### 2. Gỡ sạch ứng dụng rác nội địa Trung Quốc
```bash
adb shell pm disable-user --user 0 com.honor.browser
adb shell pm uninstall -k --user 0 com.honor.browser
adb shell pm disable-user --user 0 com.hihonor.browserhomepage
adb shell pm uninstall -k --user 0 com.hihonor.browserhomepage
adb shell pm disable-user --user 0 com.hihonor.gamecenter
adb shell pm uninstall -k --user 0 com.hihonor.gamecenter
adb shell pm disable-user --user 0 com.hihonor.game.kitserver
adb shell pm uninstall -k --user 0 com.hihonor.game.kitserver
adb shell pm disable-user --user 0 com.hihonor.quickgame
adb shell pm uninstall -k --user 0 com.hihonor.quickgame
adb shell pm disable-user --user 0 com.hihonor.cloudmusic
adb shell pm uninstall -k --user 0 com.hihonor.cloudmusic
adb shell pm disable-user --user 0 com.honor.yoyocards
adb shell pm uninstall -k --user 0 com.honor.yoyocards
adb shell pm disable-user --user 0 com.hihonor.hiboard
adb shell pm uninstall -k --user 0 com.hihonor.hiboard
adb shell pm disable-user --user 0 com.hihonor.redteamobile.roaming
adb shell pm uninstall -k --user 0 com.hihonor.redteamobile.roaming
adb shell pm disable-user --user 0 com.sohu.inputmethod.sogou.honor
adb shell pm uninstall -k --user 0 com.sohu.inputmethod.sogou.honor
adb shell pm disable-user --user 0 com.hihonor.servicecenter
adb shell pm uninstall -k --user 0 com.hihonor.servicecenter
adb shell pm disable-user --user 0 com.baidu.swan
adb shell pm uninstall -k --user 0 com.baidu.swan
```

### 3. Tối ưu Wi-Fi & Fix lag socket mạng MagicOS
```bash
# 1. Đổi Captive Portal sang Google 204
adb shell settings put global captive_portal_mode 1
adb shell settings put global captive_portal_http_url http://connectivitycheck.gstatic.com/generate_204
adb shell settings put global captive_portal_https_url https://connectivitycheck.gstatic.com/generate_204
adb shell settings put global captive_portal_fallback_url http://www.google.com/gen_204

# 2. Bật Private DNS Cloudflare
adb shell settings put global private_dns_mode hostname
adb shell settings put global private_dns_specifier 1dot1dot1dot1.cloudflare-dns.com

# 3. Tắt Link Turbo và Wi-Fi Pro (chống khựng video)
adb shell settings put global hn_wifipro_enable false
adb shell settings put system smart_network_switch 0
adb shell settings put secure settings_wlan_mt_axl 0

# 4. Đổi máy chủ kiểm tra RTT sang Google
adb shell "settings put global wifi_hidata_rtt_url 'connectivitycheck.gstatic.com|www.google.com'"
adb shell settings put global wifi_cloud_security_check 0
adb shell settings put global wifi_power_save 0
```

### 4. Tắt Telemetry theo dõi gửi log
```bash
adb shell settings put secure user_experience_involved 0
adb shell dumpsys deviceidle whitelist -com.hihonor.hiviewtunnel
adb shell pm disable-user --user 0 com.hihonor.android.UEInfoCheck
adb shell pm disable-user --user 0 com.hihonor.collectcenter
```

### 5. Khóa 120Hz & Độ rộng hiển thị 385dp chuẩn mắt
```bash
adb shell settings put system min_refresh_rate 120.0
adb shell settings put system peak_refresh_rate 120.0
adb shell settings put global window_animation_scale 1.0
adb shell settings put global transition_animation_scale 1.0
adb shell settings put global animator_duration_scale 1.0
adb shell settings put global wifi_scan_always_enabled 0
adb shell settings put global ble_scan_always_enabled 0

# Khóa density 532 (tương đương 385 dp trên màn hình 1.5K Honor)
adb shell settings put global low_resolution_switch 0
adb shell settings put global aps_display_resolution 0
adb shell wm density 532
adb shell settings put secure display_density_forced 532
```

### 6. Kích hoạt Google Gemini làm trợ lý ảo
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
</details>

---

## 📱 Cài Đặt Khuyến Nghị Bằng Tay Trên Điện Thoại

Để đảm bảo các ứng dụng nhắn tin nhận thông báo tức thì 100%:

1. **Bật Khởi chạy liên kết (Secondary Launch)**:
   - Vào **Cài đặt** > **Pin** > **Quản lý khởi động ứng dụng (App launch)**.
   - Tìm ứng dụng (Zalo, Messenger, Gmail, Ngân hàng...).
   - Chuyển sang **Quản lý thủ công** và **BẬT CẢ 3 MỤC**:
     - `[x]` Tự khởi chạy
     - `[x]` **Khởi chạy liên kết** *(Cho phép nhận tín hiệu push FCM)*
     - `[x]` Chạy ngầm
2. **Khóa thẻ đa nhiệm**:
   - Mở ứng dụng > Vào giao diện đa nhiệm > Vuốt nhẹ thẻ ứng dụng xuống để hiện **biểu tượng ổ khóa 🔒**.
3. **Cài đặt Gmail**:
   - Mở app Gmail > **Cài đặt** > Chọn tài khoản > Mục **Thông báo**: Chọn **Tất cả (All)**.

---

## 🔄 Phục Hồi Về Trạng Thái Nguyên Bản (Khi Cần Bán Máy)

Nếu muốn đưa máy về nguyên trạng xuất xưởng ban đầu:

```bash
# Phục hồi nhanh qua script:
python3 scripts/honor_magic_master.py --restore

# Hoặc bằng lệnh ADB thủ công:
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

---

<div align="center">
  <sub>TP Honor Toolkit &copy; 2026. Phát triển vì cộng đồng người dùng Honor tại Việt Nam.</sub>
</div>
