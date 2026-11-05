# BẢNG ĐÁNH GIÁ TÍNH KHẢ THI KỸ THUẬT (FEATURE FEASIBILITY MATRIX) — V2.1
> **Dự án:** TP Honor Battery & Performance Optimizer (`vn.tphonor.optimizer`)  
> **Phiên bản:** V2.1 (Technical Correction Release)  
> **Cấu hình SDK:** `minSdk = 26` · `compileSdk = 36` (Android 16) · `targetSdk = 36`  
> **Hệ thống phân loại dữ liệu:** 🟢 DIRECT · 🔵 DERIVED · 🟡 ESTIMATED · 🟣 PRIVILEGED · 🔴 UNAVAILABLE

---

## 1. NGUYÊN TẮC PHÂN LOẠI & TRUNG THỰC DỮ LIỆU

Ứng dụng tuân thủ nghiêm ngặt chuẩn mực kỹ thuật phần mềm Android: **Tuyệt đối không hiển thị dữ liệu ESTIMATED hoặc DERIVED dưới danh nghĩa dữ liệu đo trực tiếp DIRECT**.

| Cấp độ dữ liệu | Định nghĩa kỹ thuật | Phương pháp xử lý trên UI |
|---|---|---|
| 🟢 `DIRECT` | Dữ liệu trả về nguyên bản từ Android Framework API công khai (`BatteryManager`, `PowerManager`) | Hiển thị giá trị kèm đơn vị đo chuẩn ($mV, mA, ^\circ C$) |
| 🔵 `DERIVED` | Kết quả tính toán toán học thuần túy từ các biến DIRECT theo công thức vật lý đã kiểm chứng | Hiển thị nhãn công thức hoặc giải thích rõ nguồn gốc |
| 🟡 `ESTIMATED` | Kết quả tính từ mô hình thống kê, hồi quy hoặc học máy cục bộ (EMA, Regression, Coulomb Counter) | **Bắt buộc** hiển thị kèm khoảng tin cậy (Confidence Interval) và số lượng mẫu đo |
| 🟣 `PRIVILEGED` | Dữ liệu/thao tác chỉ khả dụng khi người dùng cấp quyền nâng cao (`PACKAGE_USAGE_STATS`, ADB, Shizuku) | Yêu cầu người dùng kích hoạt chủ động, có fallback khi không có quyền |
| 🔴 `UNAVAILABLE` | Android Framework và Kernel không cung cấp API cho ứng dụng bên thứ ba thông thường | Ẩn hoặc ghi rõ *"Yêu cầu quyền Root / Phần cứng không hỗ trợ"* |

---

## 2. MA TRẬN ĐÁNH GIÁ CHI TIẾT TỪNG TÍNH NĂNG (FEATURE FEASIBILITY MATRIX)

### 2.1. Phân hệ Giám sát Năng lượng & Phần cứng (Hardware Battery Monitoring)

| STT | Tính năng / Chỉ số | Phân loại | Android API sử dụng | Min API | Quyền hạn yêu cầu | Khả năng trên MagicOS | Giới hạn kỹ thuật & Phương án Fallback |
|:---:|---|:---:|---|:---:|---|---|---|
| 1 | Mức pin (`level` %) | 🟢 `DIRECT` | `BatteryManager.EXTRA_LEVEL` / `EXTRA_SCALE` | API 1 | Không cần | 100% hoạt động | Nhận qua sticky broadcast `ACTION_BATTERY_CHANGED`. |
| 2 | Trạng thái sạc / xả | 🟢 `DIRECT` | `BatteryManager.EXTRA_STATUS` | API 1 | Không cần | 100% hoạt động | Nhận diện: `CHARGING`, `DISCHARGING`, `FULL`, `NOT_CHARGING`. |
| 3 | Nguồn cấp điện (AC, USB, Wireless) | 🟢 `DIRECT` | `BatteryManager.EXTRA_PLUGGED` | API 1 | Không cần | 100% hoạt động | Trả về `BATTERY_PLUGGED_AC`, `USB`, `WIRELESS`, `DOCK`. |
| 4 | Điện áp cell pin ($U_{bat}$) | 🟢 `DIRECT` | `BatteryManager.EXTRA_VOLTAGE` ($mV$) | API 1 | Không cần | 100% hoạt động | Điện áp tức thời của cell pin ($3.5V - 4.45V$), **không phải điện áp củ sạc**. |
| 5 | Dòng điện tức thời ($I_{bat}$) | 🟢 `DIRECT` | `BatteryManager.getIntProperty(BATTERY_PROPERTY_CURRENT_NOW)` | API 21 | Không cần | >95% thiết bị HONOR | Trả về $\mu A \rightarrow mA$. **Lưu ý:** Quy ước dấu khác nhau tùy kernel OEM (Qualcomm thường trả về âm khi xả, dương khi sạc; một số chip MediaTek ngược lại). Cần bộ lọc `BatteryPropertyReader` tự động phát hiện và chuẩn hóa dấu dựa trên `EXTRA_STATUS`. |
| 6 | Dòng điện trung bình ($I_{avg}$) | 🟢 `DIRECT` | `BatteryManager.getIntProperty(BATTERY_PROPERTY_CURRENT_AVERAGE)` | API 21 | Không cần | Hầu hết thiết bị | Một số kernel trả về 0. Fallback: Tính trung bình trượt (Moving Average) của các mẫu $I_{bat}$ trong 60 giây gần nhất. |
| 7 | Nhiệt độ pin ($T_{bat}$) | 🟢 `DIRECT` | `BatteryManager.EXTRA_TEMPERATURE` ($0.1^\circ C$) | API 1 | Không cần | 100% hoạt động | Chia 10 để ra độ $^\circ C$. Cảm biến nhiệt vật lý của pin, **tuyệt đối không đại diện cho CPU**. |
| 8 | Công suất phía pin ($P_{bat}$) | 🔵 `DERIVED` | $P_{bat} = U_{bat} \times I_{bat}$ ($W$) | API 21 | Không cần | 100% (khi có dòng điện) | **Công suất nạp vào/xả ra tại cell pin**. Do tổn hao chuyển đổi PMIC (hiệu suất ~85-92%) và dòng tiêu thụ nuôi hệ thống, $P_{bat}$ luôn thấp hơn công suất đầu vào USB-C. |
| 9 | Mức sáng màn hình | 🟢 `DIRECT` | `Settings.System.getInt(SCREEN_BRIGHTNESS)` | API 1 | Không cần quyền đọc | 100% hoạt động | Dùng làm biến ngữ cảnh cho mô hình dự đoán tốc độ hao pin. |
| 10 | Trạng thái màn hình On/Off | 🟢 `DIRECT` | `Intent.ACTION_SCREEN_ON` / `OFF` | API 1 | Không cần | 100% hoạt động | Tách biệt chính xác thời gian sáng màn hình (On-Screen) và thời gian chờ (Standby). |

---

### 2.2. Phân hệ Phân tích Sạc Nhanh (SuperCharge Analyzer)

| STT | Tính năng / Chỉ số | Phân loại | Android API sử dụng | Min API | Quyền hạn yêu cầu | Khả năng trên MagicOS | Giới hạn kỹ thuật & Phương án Fallback |
|:---:|---|:---:|---|:---:|---|---|---|
| 11 | Phân loại mức sạc | 🟡 `ESTIMATED` | Dựa trên công suất phía pin $P_{bat}$ | API 21 | Không cần | 100% hoạt động | **Không tự gán nhãn SuperCharge 66W/100W nếu không có API xác thực**. Phân loại: *Sạc Tiêu Chuẩn (<10W), Sạc Nhanh (10-25W), Sạc Siêu Tốc Phía Pin (>25W)*. Nhãn "Honor SuperCharge" chỉ hiển thị khi thiết bị phát broadcast hệ thống xác thực `[REQUIRES DEVICE-LEVEL VERIFICATION]`. |
| 12 | Đồ thị đường cong sạc ($P, U, I, T$) | 🔵 `DERIVED` | Lưu chuỗi thời gian khi cắm sạc vào Room DB | API 21 | Không cần | 100% hoạt động | Lấy mẫu thích ứng: 5 giây/lần khi công suất biến thiên mạnh, 30 giây/lần khi vào pha CV (Constant Voltage) ổn định. |
| 13 | Ước tính thời gian đạt 80% / 100% | 🟡 `ESTIMATED` | Tích phân dòng sạc theo dung lượng còn thiếu | API 21 | Không cần | 100% hoạt động | Tính toán dựa trên mô hình phi tuyến tính pha sạc CC-CV. Hiển thị khoảng tin cậy $\pm 10$ phút. |
| 14 | Điện áp / Dòng điện cổng USB-C ($V_{bus}, I_{bus}$) | 🔴 `UNAVAILABLE` | Cần sysfs `/sys/class/power_supply/usb/` | N/A | Cần Root | Không khả dụng với app thường | **KHÔNG hiển thị số liệu giả định**. Ghi rõ: Không khả dụng đối với ứng dụng chuẩn Android. |

---

### 2.3. Phân hệ Sức khỏe Pin (Battery Health Intelligence)

| STT | Tính năng / Chỉ số | Phân loại | Android API sử dụng | Min API | Quyền hạn yêu cầu | Khả năng trên MagicOS | Giới hạn kỹ thuật & Phương án Fallback |
|:---:|---|:---:|---|:---:|---|---|---|
| 15 | Dung lượng thiết kế (Design Capacity) | 🟡 `ESTIMATED` / 🟣 `PRIVILEGED` | Đọc `com.android.internal.os.PowerProfile` qua Reflection | API 1 | Không cần quyền, nhưng có thể bị chặn trên Android 10+ (Non-SDK interface restriction) | Hoạt động một phần | **Fallback:** Tra cứu bảng dữ liệu cục bộ theo model máy Honor (Magic, Number, X series) kết hợp cho phép người dùng nhập thủ công trong Cài đặt nếu hệ thống chặn Reflection. |
| 16 | Dung lượng sạc đầy ước tính ($Q_{full\_est}$) | 🟡 `ESTIMATED` | Tích phân dòng Coulomb Counter theo quy tắc hình thang (Trapezoidal Rule) | API 21 | Không cần | 100% hoạt động | **Điều kiện dữ liệu hợp lệ khắt khe:** Chỉ chấp nhận phiên sạc có $\Delta \text{Level} \ge 75\%$ (bắt đầu $\le 15\%$, kết thúc $\ge 90\%$), màn hình chủ yếu tắt ($T_{on}/T_{total} < 10\%$), nhiệt độ $15-40^\circ C$. Yêu cầu tối thiểu 5 phiên hợp lệ, loại trừ ngoại lai bằng IQR. Sai số dự kiến: $\pm 5\% - 8\%$. |
| 17 | Tỷ lệ sức khỏe pin (Health %) | 🟡 `ESTIMATED` | $\text{Health} = \frac{\overline{Q_{full\_est}}}{Q_{design}} \times 100\%$ | API 21 | Không cần | 100% hoạt động | **Không dùng `BatteryManager.EXTRA_HEALTH` để tính %** (vì API này chỉ trả về enum định tính GOOD/DEAD/OVERHEAT). |
| 18 | Số chu kỳ sạc phần cứng (Cycle Count) | 🟣 `PRIVILEGED` / 🔴 `UNAVAILABLE` | `BatteryManager.BATTERY_PROPERTY_CYCLE_COUNT` | API 34+ | Android 14+ | Rất ít OEM cấp dữ liệu này cho app bên thứ ba `[REQUIRES DEVICE-LEVEL VERIFICATION]` | Nếu API trả về $\le 0$, kích hoạt bộ đếm chu kỳ tích lũy nội bộ trong cơ sở dữ liệu ($100\%$ sạc tích lũy = 1 chu kỳ). Ghi nhãn rõ ràng: *"Chu kỳ ước tính (Estimated Cycles)"*. |

---

### 2.4. Mô hình AI Dự đoán Thời lượng Pin (AI Battery Life Predictor)

| STT | Tính năng / Chỉ số | Phân loại | Phương pháp kỹ thuật | Min API | Quyền hạn yêu cầu | Khả năng trên MagicOS | Giới hạn kỹ thuật & Phương án Fallback |
|:---:|---|:---:|---|:---:|---|---|---|
| 19 | Dự đoán thời gian cạn pin | 🟡 `ESTIMATED` | Multi-stage: Moving Average $\rightarrow$ EMA $\rightarrow$ Hồi quy tuyến tính phân đoạn theo ngữ cảnh (Context-aware Linear Regression) | API 26 | Không cần | 100% hoạt động | **Loại bỏ toàn bộ các hệ số nhân tùy ý**. Áp dụng hồi quy thực nghiệm dựa trên tốc độ xả đo được khi On-Screen và Standby. Bắt buộc hiển thị khoảng tin cậy $\pm 15-30$ phút. Khi dữ liệu $< 2$ giờ: Hiển thị nhãn *"Đang thu thập dữ liệu"*. |
| 20 | Tốc độ tiêu thụ On-Screen (%/h) | 🔵 `DERIVED` | Tính từ các khoảng thời gian `ACTION_SCREEN_ON` và độ sụt pin tương ứng | API 26 | Không cần | 100% hoạt động | Lọc bỏ các khoảng đo ngắn $< 5$ phút để loại bỏ nhiễu lấy mẫu. |
| 21 | Tốc độ tiêu thụ Standby (%/h) | 🔵 `DERIVED` | Tính từ các khoảng thời gian `ACTION_SCREEN_OFF` và độ sụt pin tương ứng | API 26 | Không cần | 100% hoạt động | Đo đạc mức độ hao pin khi máy đi vào chế độ nghỉ Doze Mode. |

---

### 2.5. Phân tích Hoạt động Ứng dụng (App Activity & Background Exposure Analyzer)

| STT | Tính năng / Chỉ số | Phân loại | Android API sử dụng | Min API | Quyền hạn yêu cầu | Khả năng trên MagicOS | Giới hạn kỹ thuật & Phương án Fallback |
|:---:|---|:---:|---|:---:|---|---|---|
| 22 | Thời gian sử dụng Foreground của app | 🟣 `PRIVILEGED` | `UsageStatsManager.queryUsageStats()` | API 21 | `PACKAGE_USAGE_STATS` (Người dùng cấp trong Cài đặt) | 100% hoạt động sau khi cấp quyền | Bắt buộc giải thích lý do trước khi chuyển người dùng đến trang cấp quyền trong Cài đặt. |
| 23 | App Standby Bucket | 🟢 `DIRECT` | `UsageStatsManager.getAppStandbyBucket()` | API 28 | `PACKAGE_USAGE_STATS` | Hoạt động trên MagicOS | **Không coi bucket ACTIVE/WORKING_SET là bằng chứng ngốn pin**. Đây là trạng thái bình thường của app người dùng hay mở. |
| 24 | Chỉ số Hoạt động Tiềm ẩn (App Activity Index) | 🟡 `ESTIMATED` | Tỷ lệ thời gian foreground, tần suất khởi chạy trong các khung giờ pin tụt nhanh | API 28 | `PACKAGE_USAGE_STATS` | 100% hoạt động | **Đổi tên từ Drain Score thành App Activity Index**. Không tuyên bố đo chính xác mAh tiêu thụ của app khi không có quyền `BATTERY_STATS`. |
| 25 | Nhận diện ứng dụng rác nội địa (Debloat Catalog) | 🟢 `DIRECT` | So khớp danh sách package đã cài đặt với catalog tĩnh | API 26 | `<queries>` trong Manifest | 100% hoạt động | **Tách biệt hoàn toàn khỏi chỉ số tiêu thụ năng lượng**. Đóng vai trò là danh mục tư vấn (Advisory Catalog) nhận diện các dịch vụ nội địa Trung Quốc cài sẵn. |
| 26 | Đọc CPU Time / Wakelock chi tiết từng app | 🟣 `PRIVILEGED` | `dumpsys batterystats --charged` | API 21 | **Cần Shizuku hoặc ADB** | Chỉ khả dụng trong Chế độ Nâng cao | Trong chế độ thường: Ẩn thông số này, không tạo số liệu giả. |
| 27 | Đóng băng ứng dụng (Force Stop) | 🟢 `DIRECT` / 🟣 `PRIVILEGED` | **Thường:** Mở `ACTION_APPLICATION_DETAILS_SETTINGS`<br>**Nâng cao:** `am force-stop` qua Shizuku | API 21 | Shizuku (Tùy chọn) | 100% hoạt động | Không tự động đóng băng trong nền. Mọi thao tác qua Shizuku đều phải có hộp thoại xác nhận từ người dùng. |

---

### 2.6. Giám sát Nhiệt độ Hệ thống (Thermal Sentinel)

| STT | Tính năng / Chỉ số | Phân loại | Android API sử dụng | Min API | Quyền hạn yêu cầu | Khả năng trên MagicOS | Giới hạn kỹ thuật & Phương án Fallback |
|:---:|---|:---:|---|:---:|---|---|---|
| 28 | Trạng thái nghẽn nhiệt (Thermal Status) | 🟢 `DIRECT` | `PowerManager.OnThermalStatusChangedListener` | API 29 | Không cần | Android 10+ (MagicOS 4+) | Trả về các mức: `NONE`, `LIGHT`, `MODERATE`, `SEVERE`, `CRITICAL`, `EMERGENCY`, `SHUTDOWN`. |
| 29 | Khoảng dự trữ nhiệt (Thermal Headroom) | 🟢 `DIRECT` | `PowerManager.getThermalHeadroom(forecastSeconds)` | API 30 | Không cần | Android 11+ (MagicOS 5+) | Trả về giá trị $0.0 - 1.0+$ (1.0 = bắt đầu bóp xung/throttling). |
| 30 | Nhiệt độ lõi CPU/GPU từng nhân ($^\circ C$) | 🔴 `UNAVAILABLE` | Đọc `/sys/class/thermal/thermal_zone*/temp` | N/A | Bị chặn bởi SELinux | Không khả dụng với app thường | **Tuyệt đối không lấy nhiệt độ pin để gán nhãn CPU**. Nếu sysfs bị chặn, hiển thị nhãn: *"Yêu cầu quyền Root để đọc cảm biến từng nhân CPU"*. |

---

### 2.7. Trợ lý Sạc Thông Minh & Chống Trộm (Smart Charge Assistant)

| STT | Tính năng / Chỉ số | Phân loại | Android API sử dụng | Min API | Quyền hạn yêu cầu | Khả năng trên MagicOS | Giới hạn kỹ thuật & Phương án Fallback |
|:---:|---|:---:|---|:---:|---|---|---|
| 31 | Cảnh báo đạt ngưỡng sạc 80% | 🟢 `DIRECT` | `BroadcastReceiver(ACTION_BATTERY_CHANGED)` + Notification/Ringtone | API 26 | `POST_NOTIFICATIONS` (API 33+) | 100% hoạt động | Phát âm thanh và thông báo nhắc người dùng ngắt sạc. |
| 32 | Tự động ngắt dòng sạc ở mức 80% phần cứng | 🔴 `UNAVAILABLE` | Không có public API trên Android AOSP | N/A | Cần Kernel Driver / Root | Không khả dụng với app thường | **Thay thế bằng giải pháp tư vấn:** Mở trực tiếp trang cài đặt *"Bảo vệ sạc thông minh"* có sẵn của Honor MagicOS thông qua Intent discovery `[REQUIRES DEVICE-LEVEL VERIFICATION]`. |
| 33 | Đọc mốc báo thức gần nhất | 🟢 `DIRECT` | `AlarmManager.getNextAlarmClock()` | API 21 | Không cần | Hoạt động trên MagicOS | Dùng để tính toán khoảng thời gian sạc qua đêm và gợi ý thời điểm cắm sạc bù. |
| 34 | Cảnh báo rút sạc chống trộm (Anti-Theft) | 🟢 `DIRECT` | `ACTION_POWER_DISCONNECTED` + `KeyguardManager.isDeviceLocked()` | API 26 | `FOREGROUND_SERVICE` (`specialUse`), `USE_FULL_SCREEN_INTENT` (API 34+) | 100% hoạt động | Có thời gian hoãn 5 giây (Grace Period). Nếu mở khóa máy trong 5 giây, hủy báo động. Nếu không, phát còi hú âm lượng lớn qua `AudioAttributes.USAGE_ALARM`. |

---

## 3. TỔNG KẾT PHÂN LOẠI & KẾ HOẠCH NGIỆM THU

* **DIRECT / DERIVED (Dữ liệu xác thực 100%):** 21 tính năng.
* **ESTIMATED (Mô hình ước tính có khoảng tin cậy):** 7 tính năng.
* **PRIVILEGED (Cần quyền đặc biệt / Shizuku):** 4 tính năng.
* **UNAVAILABLE (Đã điều chỉnh phạm vi minh bạch):** 2 tính năng (Tự ngắt sạc phần cứng, đọc nhiệt độ CPU từng nhân).
