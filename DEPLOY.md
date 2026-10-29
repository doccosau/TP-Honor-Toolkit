# 🚀 Hướng Dẫn Deploy TP Honor Toolkit Lên Cloudflare Pages

Dự án **TP Honor Toolkit** được đóng gói hoàn toàn tĩnh (SPA React + Vite) với công nghệ WebUSB, cho phép chạy trực tiếp trên nền tảng **Cloudflare Pages** với tốc độ CDN toàn cầu và độ trễ cực thấp.

Có 2 cách để triển khai từ GitHub sang Cloudflare Pages:

---

## 🌟 CÁCH 1: KẾT NỐI TRỰC TIẾP TRÊN CLOUDFLARE DASHBOARD (KHUYÊN DÙNG - CỰC NHANH & DỄ)

*Cách này không cần tạo API Token hay cấu hình Secret phức tạp. Cloudflare sẽ tự động theo dõi repository GitHub của bạn.*

1. **Đăng nhập Cloudflare Dashboard**:
   - Truy cập: [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. **Tạo ứng dụng Pages**:
   - Ở thanh điều hướng bên trái, chọn **Workers & Pages**.
   - Bấm nút **Create application** &rarr; Chọn tab **Pages** &rarr; Bấm **Connect to Git**.
3. **Liên kết với GitHub**:
   - Chọn tài khoản GitHub của bạn (`doccosau`).
   - Cấp quyền truy cập cho kho lưu trữ: **`doccosau/TP-Honor-Toolkit`** &rarr; Bấm **Begin setup**.
4. **Cấu hình thông số Build (Build settings)**:
   - **Project name:** `tp-honor-toolkit` (hoặc tên tuỳ chọn).
   - **Production branch:** `main`.
   - **Framework preset:** Chọn `Vite` (hoặc `None`).
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (để trống).
5. **Hoàn tất**:
   - Bấm nút **Save and Deploy**.
   - Cloudflare sẽ tự động cài gói, build và cung cấp cho bạn một tên miền miễn phí dạng:  
     👉 `https://tp-honor-toolkit.pages.dev`
   - Từ nay về sau, mỗi khi bạn `git push` code mới lên nhánh `main`, Cloudflare sẽ tự động build và cập nhật trang web tức thì!

---

## ⚡ CÁCH 2: DEPLOY TỰ ĐỘNG QUA GITHUB ACTIONS

*Cách này sử dụng workflow CI/CD có sẵn tại [`.github/workflows/deploy-cloudflare.yml`](.github/workflows/deploy-cloudflare.yml) để tự build và deploy bằng Cloudflare Wrangler.*

### Bước 1: Lấy thông tin tài khoản Cloudflare
1. **Lấy Account ID:**
   - Đăng nhập [dash.cloudflare.com](https://dash.cloudflare.com).
   - Nhìn sang góc phải màn hình trang chủ (hoặc trong thanh URL), copy chuỗi **Account ID** (khoảng 32 ký tự).
2. **Tạo API Token:**
   - Bấm vào biểu tượng Avatar ở góc trên cùng bên phải &rarr; Chọn **My Profile**.
   - Chọn mục **API Tokens** ở menu bên trái &rarr; Bấm **Create Token**.
   - Tìm mục **Edit Cloudflare Workers** &rarr; Bấm **Use template**.
   - Hoặc tạo Custom Token với quyền: `Account` &rarr; `Cloudflare Pages` &rarr; `Edit`.
   - Bấm **Continue to summary** &rarr; Bấm **Create Token** và copy mã token vừa tạo.

### Bước 2: Cài đặt Secrets trên GitHub
1. Vào trang cấu hình Secrets của Repository trên GitHub:
   👉 `https://github.com/doccosau/TP-Honor-Toolkit/settings/secrets/actions`
2. Bấm **New repository secret** và thêm 2 khóa sau:
   - **Tên:** `CLOUDFLARE_API_TOKEN` &rarr; **Giá trị:** Dán API Token lấy ở Bước 1.
   - **Tên:** `CLOUDFLARE_ACCOUNT_ID` &rarr; **Giá trị:** Dán Account ID lấy ở Bước 1.

### Bước 3: Kích hoạt
- Mỗi khi bạn push code lên `main`, GitHub Actions sẽ tự động kích hoạt tiến trình:
  `npm ci` &rarr; `npm run build` &rarr; `wrangler pages deploy dist`.
- Bạn có thể theo dõi tiến độ deploy tại tab **Actions** trên GitHub:  
  👉 `https://github.com/doccosau/TP-Honor-Toolkit/actions`

---

## 🔒 Lưu Ý Về WebUSB & HTTPS Trên Cloudflare Pages
- Giao thức **WebUSB** (kết nối trực tiếp điện thoại Honor qua trình duyệt Chrome/Edge) bắt buộc phải chạy trên kết nối **HTTPS**.
- Cloudflare Pages mặc định cấp chứng chỉ SSL/HTTPS bảo mật miễn phí cho toàn bộ tên miền `*.pages.dev`, do đó tính năng WebUSB sẽ hoạt động ngay lập tức mà không cần bất kỳ cài đặt bổ sung nào!
