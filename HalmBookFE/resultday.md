# Báo cáo công việc FE trong ngày

## Trang chủ và dữ liệu

- Loại bỏ dữ liệu tĩnh, dữ liệu mẫu và nội dung giả lập khỏi các phần đã xử lý trên trang chủ; giữ lại bố cục và form để tiếp tục tích hợp dữ liệu từ database.
- Đánh dấu các vị trí cần kết nối API bằng `TODO(API)`.
- Gỡ fallback ảnh NXB Trẻ gây gọi lặp tới trang 404 và giới hạn số lần áp dụng fallback ảnh.

## Tailwind và giao diện

- Khôi phục cấu hình Tailwind CDN theo yêu cầu.
- Thêm biến `CHAT_MESSAGE_FONT_SIZE` trong `src/component/user/TrangChu.jsx` để điều chỉnh cỡ chữ tin nhắn chatbot bằng giá trị pixel, ví dụ `"14px"`.

## Chatbot AI

- Gỡ cơ chế chatbot DOM cũ để tránh xung đột với trạng thái React.
- Nối các nút mở chatbot trên trang chủ vào handler React.
- Chuyển lời gọi chatbot sang `axiosInstance`, gửi Bearer token nếu có và kiểm tra nội dung phản hồi.
- Ngăn gửi nhiều request cùng lúc; hủy request đang chạy khi xóa hội thoại hoặc khi component bị unmount.
- Hoàn thiện trạng thái loading, nút xóa hội thoại, tiêu đề và lời chào trong cửa sổ chat.
- Bổ sung import `axios` còn thiếu trong `src/service/AxiosInstance.js`.

## Kiểm tra

- `npm run build`: thành công.
- Oxlint: thoát mã 0; còn cảnh báo tham số `event` không sử dụng ở các vị trí khác.
- Chưa xác nhận tích hợp trực tiếp với backend. Frontend hiện giả định endpoint `POST /api/chat` trả về JSON có dạng `{ "reply": "..." }`.

---

# Báo cáo công việc ngày 19/10/2026: Chức năng Thông Tin Cá Nhân

## 1. Backend (`DemoChatbot` - Spring Boot)
- **Cập nhật JPA Cache:** Thêm `clearAutomatically = true` vào annotation `@Modifying` của `updateCustomerInfo` trong `CustomerRepository.java`.
- **Kết quả:** Xóa sạch Persistence Context sau khi thực hiện UPDATE, đảm bảo `findCustomerById` luôn trả về entity mới nhất trực tiếp từ DB thay vì dữ liệu cũ trong cache.

## 2. Frontend (`halmbook` - Vite React)
- **API Endpoint:** Sửa URL lấy dữ liệu từ `/api/home/customer` thành `/api/home/customer/info` và bổ sung hàm `updateCustomer` gọi `PUT /api/home/customer/edit` trong `CustomerService.js`.
- **Xử lý Null & Crash:** Thêm trạng thái `isLoading` và áp dụng Optional Chaining (`customer?.customerName`), giải quyết hoàn toàn lỗi sập trắng màn hình (`TypeError: Cannot read properties of null`).
- **Form Binding 2 chiều:** Đồng bộ chuẩn xác state `profileData` với các trường dữ liệu BE (`customerName`, `phoneNumber`, `birthday`, `gender`, `email`, `address`). Format ngày sinh `YYYY-MM-DD` cho input type date và chuyển đổi giới tính boolean.
- **Tối ưu trải nghiệm Lưu (Chống giật màn hình):** Áp dụng Optimistic Update cập nhật state ngay lập tức khi nhấn Lưu, hỗ trợ tải ngầm `fetchCustomerData(silent = true)` mà không kích hoạt `isLoading`, giúp giao diện không bị giật/chớp.
- **Sửa Dark Mode Footer:** Sửa `@custom-variant dark (&:is(.dark, .dark *))` trong `src/index.css` để tăng CSS specificity và bổ sung CSS chuyên biệt cho footer trong `CaNhan.jsx`.
- **Bảo vệ Route:** Đưa `/canhan` vào `ProtectedRoute` trong `App.jsx`.

## 3. Kiểm tra
- `npm run build`: Biên dịch thành công 100% trong 1.71s.
