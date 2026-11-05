# CHÍNH SÁCH BẢO MẬT, QUYỀN HẠN & DỮ LIỆU CÁ NHÂN (PRIVACY & PERMISSIONS)
> **Dự án:** TP Honor Battery & Performance Optimizer (`vn.tphonor.optimizer`)  
> **Phiên bản tài liệu:** V2.0  
> **Nguyên tắc cốt lõi:** 100% Offline · Zero-Network · Zero-Camera · Local Data Sovereignty

---

## 1. CAM KẾT KHÔNG KẾT NỐI MẠNG (ZERO-NETWORK POLICY)

Khác với các ứng dụng pin và dọn rác thương mại thường thu thập thông tin thiết bị để bán dữ liệu quảng cáo, TP Honor Optimizer thực thi chính sách **Zero-Network Policy** tuyệt đối:

1. **Gỡ bỏ quyền Internet trong AndroidManifest:**
   ```xml
   <uses-permission
       android:name="android.permission.INTERNET"
       tools:node="remove" />
   ```
   * Hệ điều hành Android sẽ chặn hoàn toàn mọi nỗ lực tạo kết nối Socket, HTTP, HTTPS từ mã nguồn ứng dụng ở cấp độ Kernel.
   * Người dùng có thể tự kiểm chứng trong phần Thông tin ứng dụng (App Info): Ứng dụng **không có quyền sử dụng dữ liệu mạng di động hay Wi-Fi**.

2. **Xử lý AI 100% On-Device:**
   * Toàn bộ thuật toán hồi quy dự đoán thời lượng pin, phân tích đường cong sạc và chấm điểm rủi ro ứng dụng ngốn pin đều chạy cục bộ bằng CPU của máy.
   * Không gửi dữ liệu thói quen sử dụng, thời gian bật màn hình hay danh sách ứng dụng đã cài đặt lên bất kỳ máy chủ nào.

---

## 2. CAM KẾT KHÔNG SỬ DỤNG CAMERA (ZERO-CAMERA POLICY)

* Ứng dụng **tuyệt đối không khai báo** `android.permission.CAMERA`.
* Không sử dụng CameraX, Camera2 hay bất kỳ API thị giác máy tính nào.
* Trên Android 12 trở lên, ứng dụng đảm bảo **không bao giờ làm xuất hiện chấm xanh bảo mật (Privacy Indicator)** trên thanh trạng thái hệ thống.

---

## 3. DANH MỤC QUYỀN HẠN HỆ THỐNG & GIẢI TRÌNH MỤC ĐÍCH

Ứng dụng tuân thủ nguyên tắc **Tối thiểu hóa quyền hạn (Principle of Least Privilege)**: Chỉ yêu cầu quyền khi người dùng truy cập vào tính năng tương ứng.

| Tên quyền | Cấp độ bảo vệ | Khi nào yêu cầu? | Giải trình mục đích sử dụng | Xử lý khi bị từ chối |
|---|---|---|---|---|
| `POST_NOTIFICATIONS` | Runtime (API 33+) | Khi người dùng bật tính năng Cảnh báo sạc 80% hoặc Còi chống trộm | Hiển thị thông báo khi pin đạt ngưỡng 80%, cảnh báo nhiệt độ cao và duy trì thông báo Foreground Service trong phiên sạc | Tính năng cảnh báo âm thanh nền bị vô hiệu hóa. Ứng dụng chỉ hiển thị trạng thái khi mở màn hình. |
| `PACKAGE_USAGE_STATS` | Special App Access (Cài đặt hệ thống) | Khi người dùng mở tab **"Phát hiện App ngậm pin" (Drainer)** | Đọc thời gian chạy foreground của các ứng dụng trong ngày để tính điểm rủi ro ngốn pin | Ứng dụng không hiển thị được thời gian dùng chi tiết của từng app, chỉ hiển thị danh mục các app rác nội địa Honor đã biết. |
| `FOREGROUND_SERVICE` | Normal | Khi cắm sạc hoặc khi kích hoạt chế độ Chống trộm rút sạc | Duy trì tiến trình ghi nhận biểu đồ sạc và phát âm thanh còi hú khi máy bị rút cáp lúc khóa màn hình | Không ghi nhận được biểu đồ sạc liên tục khi màn hình tắt. |
| `FOREGROUND_SERVICE_DATA_SYNC` | Normal (API 34+) | Khai báo đi kèm `FOREGROUND_SERVICE` trên Android 14+ | Tuân thủ quy định phân loại Foreground Service của Android 14+ cho việc thu thập dữ liệu chuỗi thời gian | Bắt buộc khai báo trong Manifest để không bị crash trên Android 14+. |
| `SCHEDULE_EXACT_ALARM` | Normal / Special | Khi người dùng bật tính năng Sạc đêm thông minh đồng bộ giờ thức dậy | Kích hoạt kiểm tra sạc bù vào đúng thời điểm 30 phút trước giờ báo thức | Chuyển sang dùng `WorkManager` kiểm tra với độ trễ dao động 5-10 phút. |
| `VIBRATE` | Normal | Khi pin đạt 80% hoặc báo động chống trộm | Rung phản hồi xúc giác cho người dùng | Chỉ phát âm thanh, không rung. |
| `WAKE_LOCK` | Normal | Trong lúc phát còi báo động chống trộm (tối đa 60 giây) | Giữ CPU thức để phát trọn vẹn chuông còi hú khi màn hình đang tắt | Âm thanh có thể bị hệ thống ngắt khi máy đi vào chế độ Deep Sleep. |

---

## 4. BẢO MẬT TRONG CHẾ ĐỘ NÂNG CAO (ADVANCED MODE - SHIZUKU / ADB)

Chế độ nâng cao là tính năng **hoàn toàn tùy chọn**, dành riêng cho người dùng am hiểu công nghệ:

1. **Không yêu cầu Root:** Sử dụng giao thức IPC an toàn của Shizuku để giao tiếp với tiến trình hệ thống `system_server`.
2. **Cơ chế xác nhận người dùng (Explicit User Consent):**
   * Ứng dụng **không bao giờ tự động đóng băng (`am force-stop`) hoặc vô hiệu hóa (`pm disable`)** bất kỳ ứng dụng nào trong nền.
   * Mọi thao tác đều hiển thị hộp thoại xác nhận rõ ràng: Tên package, hậu quả tiềm ẩn và nút *"Xác nhận"* chủ động.
3. **Nhật ký thao tác (Audit Trail):**
   * Mọi lệnh shell thực thi qua Shizuku đều được ghi nhận vào nhật ký cục bộ (`AuditLog`) kèm timestamp để người dùng có thể kiểm tra lại bất cứ lúc nào.
4. **Khả năng thu hồi quyền 1-chạm:** Người dùng có thể tắt hoàn toàn chế độ Shizuku trong phần Cài đặt của ứng dụng, lập tức hủy kết nối Binder.

---

## 5. QUYỀN SỞ HỮU DỮ LIỆU & QUẢN TRỊ DỮ LIỆU CÁ NHÂN (USER DATA RIGHTS)

* **Toàn quyền xóa dữ liệu (Right to Erasure):** Trong tab **Cài đặt**, ứng dụng cung cấp nút:
  > **🗑️ Xóa toàn bộ lịch sử dữ liệu**
  * Thao tác này sẽ thực thi lệnh xóa toàn bộ các bảng Room Database (`battery_snapshots`, `charging_sessions`, `app_drain_records`, `daily_battery_summaries`) và đặt lại DataStore về mặc định.
* **Không lưu trữ dữ liệu nhạy cảm:** Ứng dụng không đọc tin nhắn, không đọc danh bạ, không đọc vị trí GPS, không lưu ảnh hay nội dung clipboard.
* **An toàn khi gỡ cài đặt:** Toàn bộ cơ sở dữ liệu Room và tệp cấu hình DataStore nằm trong vùng lưu trữ nội bộ (`/data/data/vn.tphonor.optimizer/`). Khi người dùng gỡ cài đặt ứng dụng, hệ thống Android sẽ tự động xóa sạch 100% dữ liệu mà không để lại rác trên bộ nhớ máy.
