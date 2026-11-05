# BẢNG ĐÁNH GIÁ TÍNH KHẢ THI KỸ THUẬT (FEATURE FEASIBILITY MATRIX)
> **Dự án:** TP Honor Battery & Performance Optimizer (`vn.tphonor.optimizer`)  
> **Phiên bản:** V2.0  
> **Đối tượng:** Android Framework / HONOR MagicOS (7.x - 10.x+)  
> **Nguyên tắc phân loại:** DIRECT · DERIVED · ESTIMATED · PRIVILEGED · UNAVAILABLE

---

## 1. HỆ THỐNG PHÂN LOẠI NGUỒN DỮ LIỆU & TÍNH KHẢ THI

Mọi chỉ số hiển thị trong ứng dụng phải được phân loại nghiêm ngặt theo 5 cấp độ:

| Ký hiệu | Cấp độ dữ liệu | Định nghĩa kỹ thuật | Yêu cầu quyền / Điều kiện |
|---|---|---|---|
| 🟢 `DIRECT` | Đo trực tiếp | Dữ liệu trả về nguyên bản từ Android Framework API công khai | Không cần quyền đặc biệt hoặc chỉ cần quyền phổ thông |
| 🔵 `DERIVED` | Tính toán trực tiếp | Kết quả toán học từ các dữ liệu `DIRECT` theo công thức vật lý | Không giả định thêm thông số ẩn |
| 🟡 `ESTIMATED` | Ước tính mô hình | Kết quả từ mô hình thống kê, hồi quy hoặc học máy cục bộ (EMA, Regression) | Cần hiển thị độ tin cậy và số lượng mẫu đo |
| 🟣 `PRIVILEGED` | Cần quyền nâng cao | Dữ liệu/thao tác chỉ khả dụng khi có `BATTERY_STATS`, `PACKAGE_USAGE_STATS`, Shizuku hoặc ADB | Cần cấp quyền chủ động từ người dùng |
| 🔴 `UNAVAILABLE` | Không khả dụng | Android Framework không cung cấp API cho ứng dụng bên thứ ba thông thường | Phải ẩn hoặc thông báo rõ giới hạn phần cứng |

---

## 2. MA TRẬN ĐÁNH GIÁ CHI TIẾT TỪNG TÍNH NĂNG

### 2.1. Phân hệ Giám sát Năng lượng & Phần cứng (Hardware Battery Monitoring)

| STT | Tính năng / Chỉ số | Phân loại | Android API sử dụng | Min API | Quyền hạn yêu cầu | Khả năng MagicOS | Giới hạn & Phương án dự phòng (Fallback) |
|:---:|---|:---:|---|:---:|---|---|---|
| 1 | Mức pin (`level` %) | 🟢 `DIRECT` | `BatteryManager.EXTRA_LEVEL` / `EXTRA_SCALE` | API 1 | Không cần | 100% hoạt động | Không có giới hạn |
| 2 | Trạng thái sạc (Charging / Discharging / Full) | 🟢 `DIRECT` | `BatteryManager.EXTRA_STATUS` | API 1 | Không cần | 100% hoạt động | Nhận qua sticky broadcast `ACTION_BATTERY_CHANGED` |
| 3 | Nguồn cấp điện (AC, USB, Wireless, Dock) | 🟢 `DIRECT` | `BatteryManager.EXTRA_PLUGGED` | API 1 | Không cần | 100% hoạt động | Trả về `BATTERY_PLUGGED_AC`, `USB`, `WIRELESS` |
| 4 | Điện áp pin ($U_{bat}$) | 🟢 `DIRECT` | `BatteryManager.EXTRA_VOLTAGE` ($mV$) | API 1 | Không cần | 100% hoạt động | Giá trị là điện áp cell pin ($3500 - 4450 mV$), không phải điện áp củ sạc |
| 5 | Dòng điện tức thời ($I_{bat}$) | 🟢 `DIRECT` | `BatteryManager.getIntProperty(BATTERY_PROPERTY_CURRENT_NOW)` | API 21 | Không cần | Hoạt động trên >95% máy Honor | Trả về $\mu A$. **Lưu ý:** Quy ước dấu khác nhau tùy kernel OEM (âm khi xả hoặc dương khi xả). Cần cơ chế tự động đảo dấu dựa trên `EXTRA_STATUS` |
| 6 | Dòng điện trung bình ($I_{avg}$) | 🟢 `DIRECT` | `BatteryManager.getIntProperty(BATTERY_PROPERTY_CURRENT_AVERAGE)` | API 21 | Không cần | Hoạt động trên hầu hết thiết bị | Một số kernel MediaTek trả về 0. Nếu = 0, fallback sang tính trung bình trượt $I_{bat}$ trong 60 giây |
| 7 | Nhiệt độ pin ($T_{bat}$) | 🟢 `DIRECT` | `BatteryManager.EXTRA_TEMPERATURE` ($0.1^\circ C$) | API 1 | Không cần | 100% hoạt động | Chia 10 để ra độ $^\circ C$. Dữ liệu nhiệt của cảm biến pin, **không đại diện cho CPU** |
| 8 | Công suất phía pin ($P_{bat}$) | 🔵 `DERIVED` | $P_{bat} = U_{bat} \times I_{bat}$ ($W$) | API 21 | Không cần | 100% (khi có dòng điện) | **Không phải công suất đầu vào củ sạc**. Phải ghi rõ nhãn *"Công suất nạp vào pin"* |
| 9 | Mức sáng màn hình | 🟢 `DIRECT` | `Settings.System.getInt(SCREEN_BRIGHTNESS)` | API 1 | Không cần quyền đọc | 100% hoạt động | Dùng làm trọng số ngữ cảnh cho AI dự đoán tốc độ hao pin |
| 10 | Trạng thái màn hình On/Off | 🟢 `DIRECT` | `Intent.ACTION_SCREEN_ON` / `OFF` | API 1 | Không cần | 100% hoạt động | Tách biệt chính xác thời gian sáng màn hình và thời gian chờ (Standby) |

---

### 2.2. Phân hệ Phân tích Sạc Nhanh (SuperCharge Analyzer)

| STT | Tính năng / Chỉ số | Phân loại | Android API sử dụng | Min API | Quyền hạn yêu cầu | Khả năng MagicOS | Giới hạn & Phương án dự phòng (Fallback) |
|:---:|---|:---:|---|:---:|---|---|---|
| 11 | Nhận diện chuẩn sạc nhanh | 🟡 `ESTIMATED` | Dựa trên $P_{bat}$ và ngưỡng dòng điện | API 21 | Không cần | Hoạt động nhưng mang tính phán đoán | **Tuyệt đối không tự gán nhãn Honor SuperCharge 66W/100W nếu không có API xác thực**. Phân loại: Sạc chuẩn (<10W), Sạc nhanh (10-25W), Sạc siêu tốc (>25W phía pin) |
| 12 | Đồ thị đường cong sạc ($P, U, I, T$) | 🔵 `DERIVED` | Ghi log chuỗi thời gian khi cắm sạc | API 21 | Không cần | 100% hoạt động | Lấy mẫu thích ứng: 5 giây/lần khi công suất biến thiên mạnh, 30 giây/lần khi dòng điện ổn định |
| 13 | Ước tính thời gian đạt 80% / 100% | 🟡 `ESTIMATED` | Thuật toán tích phân dòng sạc theo dung lượng còn thiếu | API 21 | Không cần | 100% hoạt động | Tính toán dựa trên tốc độ nạp hiện tại và đường cong giảm dòng ở pha CV (Constant Voltage) sau 80% |
| 14 | Điện áp / Dòng điện cổng USB-C ($V_{bus}, I_{bus}$) | 🔴 `UNAVAILABLE` | Cần sysfs `/sys/class/power_supply/usb/` | N/A | Cần Root | Không khả dụng với app thường | **KHÔNG hiển thị thông số giả định**. Phải ghi rõ: Không khả dụng nếu không có Root |

---

### 2.3. Phân hệ Sức khỏe Pin (Battery Health Intelligence)

| STT | Tính năng / Chỉ số | Phân loại | Android API sử dụng | Min API | Quyền hạn yêu cầu | Khả năng MagicOS | Giới hạn & Phương án dự phòng (Fallback) |
|:---:|---|:---:|---|:---:|---|---|---|
| 15 | Dung lượng thiết kế (Design Capacity) | 🟡 `ESTIMATED` / 🟣 `PRIVILEGED` | Đọc `com.android.internal.os.PowerProfile` qua Reflection | API 1 | Không cần quyền, nhưng có thể bị chặn trên Android 10+ (Non-SDK interface) | Hoạt động một phần | Nếu Reflection bị chặn: Cung cấp cơ sở dữ liệu nội bộ tra cứu theo model máy (HONOR Magic, Number series, X series) kết hợp cho phép người dùng nhập thủ công |
| 16 | Dung lượng sạc đầy ước tính ($Q_{full}$) | 🟡 `ESTIMATED` | Thuật toán Coulomb Counter qua các phiên sạc $\Delta \% \ge 50\%$ | API 21 | Không cần | 100% hoạt động | Yêu cầu tối thiểu 5 phiên sạc hợp lệ để đưa ra kết quả có độ tin cậy. Hiển thị kèm sai số $\pm X\%$ |
| 17 | Tỷ lệ sức khỏe pin (Health %) | 🟡 `ESTIMATED` | $\text{Health} = \frac{Q_{full\_est}}{Q_{design}} \times 100\%$ | API 21 | Không cần | 100% hoạt động | **Không dùng `BatteryManager.EXTRA_HEALTH` để tính %** (vì API này chỉ trả về enum GOOD/DEAD/OVERHEAT) |
| 18 | Số chu kỳ sạc phần cứng (Cycle Count) | 🟣 `PRIVILEGED` / 🔴 `UNAVAILABLE` | `BatteryManager.BATTERY_PROPERTY_CYCLE_COUNT` | API 34+ | Cần Android 14+ | Rất ít máy MagicOS trả về dữ liệu này cho app bên thứ ba | **Fallback:** Tự tính chu kỳ ước tính tích lũy (Estimated Cycles) trong cơ sở dữ liệu nội bộ ($100\%$ sạc tích lũy = 1 chu kỳ) |

---

### 2.4. Mô hình AI Dự đoán Thời lượng Pin (AI Battery Life Predictor)

| STT | Tính năng / Chỉ số | Phân loại | Phương pháp kỹ thuật | Min API | Quyền hạn yêu cầu | Khả năng MagicOS | Giới hạn & Phương án dự phòng (Fallback) |
|:---:|---|:---:|---|:---:|---|---|---|
| 19 | Dự đoán thời gian cạn pin (Giờ:Phút) | 🟡 `ESTIMATED` | Multi-stage: Moving Average $\rightarrow$ EMA $\rightarrow$ Context Regression | API 26 | Không cần | 100% hoạt động | Hiển thị khoảng tin cậy (Confidence Interval $\pm 20$ phút). Nếu dữ liệu $< 2$ giờ: Hiển thị nhãn *"Đang học dữ liệu"* |
| 20 | Tốc độ tiêu thụ On-Screen (%/h) | 🔵 `DERIVED` | Tính từ khoảng thời gian `ACTION_SCREEN_ON` và độ sụt pin | API 26 | Không cần | 100% hoạt động | Lọc bỏ các khoảng đo $< 5$ phút để tránh nhiễu |
| 21 | Tốc độ tiêu thụ Standby (%/h) | 🔵 `DERIVED` | Tính từ khoảng thời gian `ACTION_SCREEN_OFF` và độ sụt pin | API 26 | Không cần | 100% hoạt động | Đo đạc chính xác mức hao pin trong chế độ nghỉ Doze Mode |

---

### 2.5. Phân tích Ứng dụng Ngốn Pin (Background Drain Analyzer)

| STT | Tính năng / Chỉ số | Phân loại | Android API sử dụng | Min API | Quyền hạn yêu cầu | Khả năng MagicOS | Giới hạn & Phương án dự phòng (Fallback) |
|:---:|---|:---:|---|:---:|---|---|---|
| 22 | Thời gian sử dụng Foreground của app | 🟣 `PRIVILEGED` | `UsageStatsManager.queryUsageStats()` | API 21 | `PACKAGE_USAGE_STATS` (Cần người dùng cấp trong Cài đặt) | 100% hoạt động sau khi cấp quyền | App không có quyền này thì không thể phân tích thời gian dùng ứng dụng |
| 23 | App Standby Bucket (Active, Working, Frequent, Rare) | 🟢 `DIRECT` | `UsageStatsManager.getAppStandbyBucket()` | API 28 | `PACKAGE_USAGE_STATS` | Hoạt động trên MagicOS | Cho biết hệ thống MagicOS đang xếp app vào nhóm ưu tiên nào |
| 24 | Chi tiết CPU Time / Wakelock từng app | 🟣 `PRIVILEGED` | `dumpsys batterystats` hoặc `BATTERY_STATS` | API 21 | **Cần ADB hoặc Shizuku** | Chỉ khả dụng trong Chế độ Nâng cao (Advanced Mode) | **Trong chế độ thường:** Không thể đo CPU từng app. Thay vào đó, tính điểm rủi ro (Heuristic Score) dựa trên: Tần suất chạy ngầm, Standby Bucket và danh mục app chạy ngầm đã biết |
| 25 | Thao tác "Đóng băng" / Tắt app ngầm | 🟢 `DIRECT` / 🟣 `PRIVILEGED` | **Thường:** Mở `ACTION_APPLICATION_DETAILS_SETTINGS` để người dùng Force Stop<br>**Nâng cao:** `am force-stop` qua Shizuku | API 21 | Shizuku (tùy chọn) | 100% an toàn | **Không tự động kill app bằng API thường** (vì `killBackgroundProcesses` vô dụng trên Android hiện đại) |

---

### 2.6. Giám sát Nhiệt độ Hệ thống (Thermal Sentinel)

| STT | Tính năng / Chỉ số | Phân loại | Android API sử dụng | Min API | Quyền hạn yêu cầu | Khả năng MagicOS | Giới hạn & Phương án dự phòng (Fallback) |
|:---:|---|:---:|---|:---:|---|---|---|
| 26 | Trạng thái nghẽn nhiệt (Thermal Status) | 🟢 `DIRECT` | `PowerManager.OnThermalStatusChangedListener` | API 29 | Không cần | Hoạt động trên Android 10+ | Báo cáo các mức: NONE, LIGHT, MODERATE, SEVERE, CRITICAL |
| 27 | Khoảng dự trữ nhiệt (Thermal Headroom) | 🟢 `DIRECT` | `PowerManager.getThermalHeadroom()` | API 30 | Không cần | Hoạt động trên Android 11+ | Giá trị $0.0 - 1.0$ (1.0 = bắt đầu bóp xung/throttling) |
| 28 | Nhiệt độ lõi CPU/GPU từng nhân ($^\circ C$) | 🔴 `UNAVAILABLE` | Đọc `/sys/class/thermal/thermal_zone*/temp` | N/A | Bị chặn bởi SELinux trên hầu hết Android 10+ | Không khả dụng với app thường | **Tuyệt đối không lấy nhiệt độ pin để gán nhãn là nhiệt độ CPU**. Nếu sysfs bị chặn, ghi rõ: *"Yêu cầu quyền Root để đọc cảm biến CPU từng nhân"* |

---

### 2.7. Trợ lý Sạc Thông Minh & Chống Trộm (Smart Charge Assistant)

| STT | Tính năng / Chỉ số | Phân loại | Android API sử dụng | Min API | Quyền hạn yêu cầu | Khả năng MagicOS | Giới hạn & Phương án dự phòng (Fallback) |
|:---:|---|:---:|---|:---:|---|---|---|
| 29 | Cảnh báo đạt ngưỡng sạc 80% | 🟢 `DIRECT` | `BroadcastReceiver(ACTION_BATTERY_CHANGED)` + Notification/Ringtone | API 26 | `POST_NOTIFICATIONS` | 100% hoạt động | Phát âm thanh và thông báo nhắc người dùng ngắt sạc |
| 30 | Tự động ngắt dòng sạc ở mức 80% phần cứng | 🔴 `UNAVAILABLE` | Không có public API trên Android | N/A | Cần Kernel Driver / Root | Không khả dụng cho ứng dụng thường | **Thay thế bằng:** Tư vấn người dùng bật tính năng *"Bảo vệ sạc thông minh"* trong Cài đặt MagicOS (mở Intent trực tiếp) |
| 31 | Đọc mốc báo thức gần nhất | 🟢 `DIRECT` | `AlarmManager.getNextAlarmClock()` | API 21 | Không cần | Hoạt động trên MagicOS | Dùng để tính toán khoảng thời gian sạc qua đêm |
| 32 | Cảnh báo rút sạc chống trộm (Anti-Theft) | 🟢 `DIRECT` | `ACTION_POWER_DISCONNECTED` + `KeyguardManager.isDeviceLocked()` | API 26 | `FOREGROUND_SERVICE` | 100% hoạt động | Kèm thời gian hoãn 3 giây tránh báo động nhầm |

---

## 3. TỔNG KẾT & KẾT LUẬN KIỂM TOÁN

1. **Số lượng tính năng đạt chuẩn API công khai (Standard Mode):** 24/32 tính năng (75%) hoạt động hoàn chỉnh mà không cần quyền nguy hiểm hay can thiệp hệ thống.
2. **Số lượng tính năng cần chế độ nâng cao (Shizuku / ADB):** 4/32 tính năng (quản lý package, xem CPU time chi tiết).
3. **Số lượng tính năng bất khả thi và phải điều chỉnh phạm vi:**
   - *Tự ngắt sạc phần cứng:* Chuyển sang nhắc nhở thông minh và mở cài đặt MagicOS.
   - *Đọc điện áp VBUS USB-C:* Chuyển sang đo công suất phía pin $P_{bat}$.
   - *Tự động đóng băng app bằng API thường:* Chuyển sang điều hướng App Info hoặc lệnh Shizuku khi có quyền.
   - *Đọc nhiệt độ CPU từng nhân:* Dùng Thermal Status & Thermal Headroom của `PowerManager` chuẩn Android.
