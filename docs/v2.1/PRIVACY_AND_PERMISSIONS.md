# CHÍNH SÁCH BẢO MẬT, QUYỀN HẠN & DỮ LIỆU CÁ NHÂN (PRIVACY & PERMISSIONS) — V2.1
> **Dự án:** TP Honor Battery & Performance Optimizer (`vn.tphonor.optimizer`)  
> **Phiên bản tài liệu:** V2.1 (Technical Correction Release)  
> **Cấu hình SDK:** `minSdk = 26` · `compileSdk = 36` · `targetSdk = 36`  
> **Nguyên tắc cốt lõi:** 100% Offline · Zero-Network · Zero-Camera · Local Data Sovereignty

---

## 1. CAM KẾT KHÔNG KẾT NỐI MẠNG (ZERO-NETWORK POLICY)

Khác biệt hoàn toàn với các ứng dụng tối ưu pin thương mại thường xuyên âm thầm tải dữ liệu thiết bị lên máy chủ quảng cáo, TP Honor Optimizer thực thi nguyên tắc **Zero-Network Policy** tuyệt đối ở cấp độ hệ thống:

```xml
<!-- Khai báo trong AndroidManifest.xml: Gỡ bỏ hoàn toàn quyền INTERNET -->
<uses-permission
    android:name="android.permission.INTERNET"
    tools:node="remove" />
```

* **Khóa cứng ở cấp độ Kernel:** Hệ điều hành Android sẽ từ chối mọi yêu cầu tạo kết nối mạng (Socket, HTTP, HTTPS) từ ứng dụng.
* **Người dùng tự kiểm chứng:** Trong trang *Thông tin ứng dụng (App Info)* của Android, ứng dụng **hoàn toàn không có mục Sử dụng Dữ liệu (Mobile Data & Wi-Fi)**.
* **AI Offline 100%:** Mô hình hồi quy EMA và các thuật toán tính toán dung lượng pin đều chạy cục bộ trên chip xử lý của thiết bị, không cần bất kỳ máy chủ đám mây nào.

---

## 2. CAM KẾT KHÔNG CAMERA (ZERO-CAMERA POLICY)

* Ứng dụng **tuyệt đối không khai báo** quyền `android.permission.CAMERA`.
* Không sử dụng CameraX, Camera2 hay bất kỳ API nào có liên quan đến cảm biến hình ảnh.
* Đảm bảo **100% không bao giờ kích hoạt chấm xanh bảo mật (Privacy Indicator)** trên thanh trạng thái của Android 12 trở lên.

---

## 3. DANH MỤC QUYỀN HẠN ĐÃ ĐỒNG BỘ (SYNCHRONIZED PERMISSIONS)

Toàn bộ quyền hạn được rà soát và đồng bộ chính xác với ma trận tương thích kỹ thuật:

| Quyền hạn hệ thống | Cấp độ bảo vệ | API Level | Thời điểm yêu cầu | Giải trình mục đích kỹ thuật thực tế | Phương án Fallback khi bị từ chối |
|---|---|:---:|---|---|---|
| `POST_NOTIFICATIONS` | Runtime | 33+ | Khi người dùng bật tính năng Cảnh báo sạc 80% hoặc Chống trộm | Gửi thông báo khi pin đạt 80%, cảnh báo quá nhiệt và hiển thị trạng thái còi chống trộm | Ứng dụng chỉ hiển thị trạng thái trên màn hình khi đang mở, không thể báo động nền. |
| `PACKAGE_USAGE_STATS` | Special App Access | 21+ | Khi người dùng mở tab **"Hoạt động Ứng dụng" (App Activity)** | Đọc thời gian chạy foreground từ hệ thống để thống kê ứng dụng chiếm dụng thời gian sáng màn hình | Không hiển thị thời gian dùng của app, chỉ hiển thị danh mục tư vấn Debloat tĩnh. |
| `FOREGROUND_SERVICE` | Normal | 28+ | Khi người dùng chủ động kích hoạt chế độ Chống trộm rút sạc | Duy trì tiến trình nền tạm thời để lắng nghe sự kiện rút cáp khi màn hình khóa | Không phát hiện được việc rút sạc khi màn hình đang tắt. |
| `FOREGROUND_SERVICE_SPECIAL_USE` | Normal | 34+ | Đi kèm `FOREGROUND_SERVICE` trên Android 14/15/16 | Tuân thủ chính sách FGS mới của Android, khai báo subtype `anti_theft_power_disconnect_protection` | Bắt buộc khai báo trong Manifest để không bị crash trên Android 14+. |
| `USE_FULL_SCREEN_INTENT` | Normal / Special | 34+ | Khi còi chống trộm kích hoạt lúc màn hình đang khóa | Hiển thị giao diện khẩn cấp nhập mật khẩu tắt còi ngay trên màn hình khóa | Chỉ phát âm thanh, người dùng phải tự bật sáng màn hình để mở app tắt còi. |
| `SCHEDULE_EXACT_ALARM` | Normal / Special | 31+ | Khi người dùng bật tính năng Sạc đêm thông minh đồng bộ giờ thức dậy | Đặt lịch kiểm tra sạc chính xác trước giờ báo thức buổi sáng | Chuyển sang dùng `WorkManager` kiểm tra với độ trễ cho phép (5-10 phút). |
| `VIBRATE` | Normal | 1+ | Khi pin chạm ngưỡng 80% hoặc còi chống trộm hú | Tạo rung xúc giác cảnh báo người dùng | Chỉ phát âm thanh chuông, không rung. |
| `WAKE_LOCK` | Normal | 1+ | Trong lúc phát còi báo động chống trộm (tối đa 60 giây) | Giữ CPU tạm thời thức để phát trọn vẹn âm thanh báo động khi màn hình tắt | Âm thanh có thể bị hệ điều hành ngắt khi máy đi vào chế độ Deep Sleep. |
| **GỠ BỎ** `INTERNET` | Bị loại bỏ | N/A | Khởi tạo dự án | Đảm bảo tính riêng tư tuyệt đối, chặn mọi giao tiếp mạng | Chặn ở cấp OS. |
| **GỠ BỎ** `CAMERA` | Bị loại bỏ | N/A | Khởi tạo dự án | Không gây lo lắng chấm xanh, bảo vệ quyền riêng tư 100% | Không có quyền camera. |

---

## 4. BẢO MẬT TRONG CHẾ ĐỘ NÂNG CAO SHIZUKU (ADVANCED MODE BOUNDARY)

Chế độ Shizuku là tính năng **hoàn toàn tùy chọn**, tuân thủ nghiêm ngặt các ranh giới kỹ thuật:

1. **Ranh giới quyền hạn:** Shizuku giao tiếp thông qua Binder IPC dưới định danh tiến trình `shell` (UID 2000). Ứng dụng **không có quyền Root (UID 0)** và không thể can thiệp vào các tệp hệ thống được bảo vệ bởi SELinux.
2. **Quy tắc xác nhận chủ động (Explicit Consent):**
   * Ứng dụng **không bao giờ tự ý chạy lệnh đóng băng ngầm (`am force-stop`)**.
   * Mọi thao tác đều hiển thị hộp thoại xác nhận rõ ràng: Tên ứng dụng, ảnh hưởng tiềm ẩn và yêu cầu bấm *"Xác nhận"* từ người dùng.
3. **Nhật ký kiểm toán (Local Audit Trail):** Mọi lệnh shell thực thi đều được ghi lại vào tệp nhật ký cục bộ kèm timestamp và mã phản hồi của shell để người dùng theo dõi minh bạch.
4. **Hủy kết nối tức thì:** Người dùng có thể tắt công tắc Shizuku trong Cài đặt bất cứ lúc nào để hủy bỏ hoàn toàn kết nối Binder.

---

## 5. QUYỀN SỞ HỮU DỮ LIỆU CỦA NGƯỜI DÙNG (DATA SOVEREIGNTY)

* **Xóa dữ liệu 1-chạm:** Cung cấp nút *"Xóa toàn bộ lịch sử dữ liệu"* trong tab Cài đặt. Khi bấm, toàn bộ cơ sở dữ liệu SQLite Room và cấu hình DataStore sẽ bị xóa sạch hoàn toàn.
* **Không đọc dữ liệu nhạy cảm:** Ứng dụng không xin quyền đọc SMS, không xin quyền đọc Danh bạ, không xin quyền Vị trí (GPS), không đọc Clipboard.
* **Tự động sạch khi gỡ app:** Mọi tệp cơ sở dữ liệu đều nằm trong phân vùng nội bộ ứng dụng (`/data/data/vn.tphonor.optimizer/`). Khi gỡ cài đặt, Android tự động dọn dẹp sạch sẽ 100%, không để lại bất kỳ tệp rác nào trên thiết bị.
