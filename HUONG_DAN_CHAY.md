# Hướng Dẫn Khởi Chạy Hệ Thống TalentNet

Đây là tài liệu hướng dẫn nhanh để cấu hình và khởi chạy toàn bộ dự án TalentNet một cách hoàn chỉnh.

## 1. Yêu cầu hệ thống
- Node.js (phiên bản 18+ khuyến nghị)
- Trình quản lý package: `npm` (gói kèm theo Node.js)
- Trình duyệt web (Chrome, Edge, Firefox,...)

## 2. Cấu hình Môi trường
Bảo đảm bạn có 2 file tên là `.env` và `env` ngay trong thư mục gốc của dự án (`idea-nests`). Nội dung của cả hai file này phải giống nhau và chứa đầy đủ thiết lập sau (chú ý giữ nguyên cấu trúc nếu bạn đã có sẵn).

Đặc biệt, lưu ý bỏ comment (xóa dấu `#`) ở dòng `VITE_GOOGLE_API_KEY` để frontend không hiển thị dữ liệu mô phỏng giả:

```env
# ─── Database ───
MONGODB_URI="mongodb+srv://..." 

# ─── Backend Connector Gateway ───
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/google/callback"

# ─── Thông tin Bot TalentNet (Service Account) ───
GOOGLE_SERVICE_ACCOUNT_EMAIL="bot-data-sync@sonorous-cacao-493410-m9.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# ─── Server & CORS ───
FRONTEND_URL=http://localhost:8080
PORT=3001

# ─── Frontend (Vite) ───
VITE_GOOGLE_API_KEY="..." # QUAN TRỌNG: KHÔNG ĐƯỢC CÓ DẤU # BẤT KỲ Ở ĐẦU DÒNG
VITE_BACKEND_URL=http://localhost:3001
```

## 3. Khởi chạy Ứng dụng (Yêu cầu mở 2 Terminal)

Hệ thống TalentNet bao gồm 2 phần là Backend (Express) và Frontend (Vite React). Bạn cần chạy đồng thời cả 2 bằng cách mở **2 cửa sổ Terminal** (hoặc tab dòng lệnh) riêng biệt.

### Mở Terminal 1 - Khởi chạy Backend (Gateway & Cronjob):
Tại thư mục gốc của dự án, cài đặt thư viện (nếu chưa) và bật server backend:
```bash
npm install
npm run server:dev
```
Backend sẽ khởi chạy trên cổng `3001`. Khi thành công, terminal sẽ thông báo đã kết nối `MongoDB: Connected ✓` và `Auto-sync cronjob initialized`.

### Mở Terminal 2 - Khởi chạy Frontend (Giao diện Web):
Mở một cửa sổ dòng lệnh thứ hai, đảm bảo đang ở thư mục gốc của dự án, và chạy lệnh:
```bash
npm run dev
```
Frontend sẽ khởi chạy trên cổng `8080` (http://localhost:8080).

## 4. Hướng dẫn Kiểm tra Tính Năng
1. Truy cập [http://localhost:8080](http://localhost:8080) và đăng nhập vào ứng dụng (bạn có thể tạo nhanh một tài khoản nếu cần).
2. Tạo hoặc truy cập một Workspace/Project.
3. Chuyển sang Cài đặt tích hợp (**Tích hợp**).
4. Bạn có thể sử dụng tính năng **Kết nối qua Bot hệ thống**:
   - Nhập URL Google Sheet chứa dữ liệu công việc.
   - (Bảo đảm bạn đã Share Google Sheet của bạn cho email bot `bot-data-sync@sonorous-cacao-493410-m9.iam.gserviceaccount.com` với quyền Viewer).
   - Bấm Đồng bộ.
5. Truy cập phần **Analysis (Phân tích dữ liệu)**:
   - Các biểu đồ tổng quan, số liệu công việc hoàn thành/quá hạn/bị chặn sẽ lấy từ Google Sheet bạn vừa gắn thay vì sử dụng dữ liệu mô phỏng.

## 5. Sửa lỗi chung (Troubleshooting)
- **Vẫn Thấy Chữ "Đang Sử Dụng Dữ Liệu Mô Phỏng"**: Mở file `.env`, chắc chắn bạn đã xóa `#` tại dòng `VITE_GOOGLE_API_KEY`, sau đó **tắt và chạy lại `npm run dev`** ở Terminal Frontend để nạp lại biến môi trường.
- **Lỗi Mất Kết Nối Khi Phân Tích Dữ Liệu**: Đảm bảo Backend (`npm run server:dev`) vẫn đang chạy song song, không bị thoát ra.
- **Bot Tự Động Rút Dữ Liệu**: Dự án có cơ chế Background Sync (Cronjob mỗi 1 phút). Dữ liệu mới từ Sheet sẽ được nền tảng tự đồng bộ vào MongoDB nếu chọn chế độ "Auto Sync" ở phần cài đặt tích hợp.
