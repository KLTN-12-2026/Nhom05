# HALM Book Web

Frontend React/Vite của HALM Book. Cấu trúc module, quy tắc phiên đăng nhập và dữ liệu được mô tả trong [ARCHITECTURE.md](./ARCHITECTURE.md).

## Chạy local

Cài dependency theo lockfile bằng npm ci. Backend mặc định http://localhost:8082; đặt VITE_API_BASE_URL trước khi chạy dev/build nếu dùng địa chỉ khác. Không ghi token hay mật khẩu vào cấu hình frontend.

- npm run dev: máy chủ Vite local (cấu hình HTTPS hiện có).
- npm run build: tạo bản production.
- npm run preview: xem bản đã build.
- npm run lint: kiểm tra mã, bao gồm lỗi JSX thiếu import.
- npm test: kiểm tra phiên, chính sách chọn JWT theo endpoint và cấu hình route.

Đối chiếu thay đổi và kết quả xác minh tại báo cáo WEB_REFACTOR_REPORT.md ở thư mục gốc repo.
