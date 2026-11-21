# Cấu trúc Web HALM Book

Giữ giao diện hiện tại; tách cấu hình, truy cập dữ liệu, vòng đời tương tác và phần trình bày để có thể sửa độc lập.

| Khu vực | Trách nhiệm |
|---|---|
| `src/config/api.js` | Một nguồn cấu hình Backend qua `VITE_API_BASE_URL`; ghép URL và nhận diện origin API. |
| `src/constants/routes.js` | Đường dẫn chính và alias theo từng nhóm public/user/admin. |
| `src/routes/AppRoutes.jsx` | Lazy loading và guard; alias kế thừa đúng guard của nhóm. |
| `src/services/axiosClient.js`, `requestPolicy.js` | Chọn phiên theo endpoint, xử lý hết phiên/khóa tài khoản, timeout. Không gửi JWT tới host tài liệu bên ngoài. |
| `src/services/authToken.js` | Lưu/đọc/xóa hai phiên USER và ADMIN độc lập; đăng xuất gọi đúng Backend và tôn trọng tùy chọn ghi nhớ. |
| `src/utils/browserStorage.js` | Đọc storage an toàn, xử lý dữ liệu JSON lỗi hoặc storage bị chặn. |
| `src/components/user/styles/` | CSS và cấu hình trình bày của từng trang. Vẫn mount `<style>` cùng trang để giữ hành vi giao diện cũ. |
| `src/components/user/layout/` | Layout chỉ ghép Header, Footer, chatbot và đăng nhập. Modal pháp lý dùng portal, focus trap và Escape. |
| `src/features/books/detailInteractions.js` | Các tương tác DOM còn lại của trang chi tiết sách; không chạy DOM side effect ngay khi import. |
| `src/hooks/useBookDetailInteractions.js`, `src/utils/domScope.js` | Khởi tạo sau khi dữ liệu/DOM sẵn sàng; dọn listener, timer và audio khi đổi trang. |
| `src/components/admin/legacy-runtime.jsx` | Ranh giới tương thích các trang quản trị cũ; dùng chung bộ tải tài nguyên. Mã admin dùng DOM/eval vẫn được cô lập tại đây, chưa chuyển toàn bộ sang React thuần. |

Không đưa tài khoản, sách hay giao dịch QA vào source hoặc dữ liệu mặc định. Ví và lịch sử phải dùng response Backend. Khi yêu cầu nạp thất bại, không tạo mã giao dịch giả hoặc thông báo thành công. `public/sample.pdf` là tài nguyên có sẵn của dự án, không phải fixture do Codex thêm; kiểm thử render PDF này không chứng minh đủ nội dung tác phẩm trả phí.

## Cấu hình và kiểm tra

Đặt `VITE_API_BASE_URL` khi chạy dev/build; mặc định local là `http://localhost:8082`. Không ghi địa chỉ QA riêng vào source. Bản build đã đóng gói giữ giá trị biến môi trường tại thời điểm build.

```sh
npm test
npm run lint
npm run build
```

Test Node kiểm tra ranh giới phiên, origin API, storage và ghi nhớ đăng nhập. Kiểm thử tích hợp các luồng tài chính cần Backend/MySQL thật; unit test dùng mock không thay thế kiểm thử đồng thời qua HTTP.

Backend lưu snapshot breakdown và fingerprint của đơn mới; migration bổ sung ở `Database/migrations/20261116_checkout_receipts.sql`. Migration không xóa dữ liệu; phải xử lý các transaction_no trùng đã được xác minh trước khi thêm unique index. Đơn cũ chưa có snapshot dùng nhánh tương thích, không thể tái tạo chắc chắn hạng/giá lịch sử nếu dữ liệu gốc đã thay đổi.

Fixture của kiểm thử tích hợp phải có danh sách ID chính xác và được dọn sau khi kết thúc. Không xóa dữ liệu bằng prefix chung, không tắt foreign key, không reset bảng hay số tăng tự động.
