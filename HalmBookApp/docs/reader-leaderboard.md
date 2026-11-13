# Xếp hạng độc giả — frontend Expo

Trang chủ → Xếp Hạng → `ReaderLeaderboard`. Nút quay lại về trang chủ.
Không thay đổi backend, cơ sở dữ liệu, điểm hay số dư Khoai.

## Trạng thái hiện tại

Backend hiện chưa có API xếp hạng theo kỳ. Mặc định trang thông báo chưa kết nối,
không tạo dữ liệu giả, không suy diễn điểm từ số dư ví hoặc lịch sử đọc cục bộ.
Mốc thưởng là thông tin dự kiến; app không cung cấp nút nhận thưởng.

## Hợp đồng dữ liệu để tích hợp sau này

Chỉ cấu hình `EXPO_PUBLIC_LEADERBOARD_PATH` khi API tương ứng thực sự tồn tại.
Giá trị là đường dẫn tương đối bắt đầu bằng `/`, không gồm query string;
app dùng API base URL và Bearer token hiện có, gọi GET với `period=week|month`.
Không đặt URL máy chủ khác vào biến này. Khởi động lại Expo sau khi đổi biến môi trường.

Response JSON:

```ts
interface RankedReader {
  customerId: string;
  name: string;
  avatarUrl: string | null;
  rank: number;   // số nguyên dương, thứ hạng liên tiếp, mỗi người một hạng
  points: number; // số nguyên không âm, chỉ hoạt động đọc hợp lệ trong kỳ
}
interface Response {
  period: 'week' | 'month';
  startsAt: string; // ISO-8601 có múi giờ
  endsAt: string;   // mốc kết thúc không bao gồm trong kỳ
  top: RankedReader[]; // 0–10 người thực, xếp theo điểm giảm dần
  me: RankedReader | null; // null cho khách hoặc tài khoản chưa xếp hạng
  above: RankedReader | null; // người ở hạng me.rank - 1, kể cả ngoài Top 10
}
```

Tuần bắt đầu 00:00 thứ Hai, tháng bắt đầu 00:00 ngày 1, UTC+7.
Máy chủ cần chốt thứ tự khi bằng điểm bằng một quy tắc ổn định. Frontend
giữ thứ hạng chính thức từ máy chủ, không tự tính một bảng xếp hạng khác.
`me` trong Top 10 phải khớp `top`; người hạng 1 không có `above`.
Tiến độ = điểm hiện tại / (điểm người trên + 1); điểm cần thêm = hiệu điểm + 1.
Không có dữ liệu người trên thì không suy diễn tiến độ.

App làm mới mỗi 30 giây khi hoạt động, khi trở về foreground, khi kéo làm mới,
khi đổi tab hoặc đổi kỳ. Hủy request cũ để tránh dữ liệu tab trước ghi đè tab mới.
Đếm ngược dùng thời gian thiết bị; điểm và thứ hạng cần được máy chủ xác nhận.

## Phạm vi cần backend trong tương lai

- Ghi nhận hoạt động đọc được xác thực, giới hạn gian lận và lưu điểm theo kỳ.
- Cung cấp bảng Top 10, thứ hạng cá nhân và người đứng trên từ cùng snapshot.
- Chốt tuần/tháng bằng tác vụ máy chủ, kể cả khi không ai mở app.
- Trao thưởng trong transaction với khóa chống trùng `(period, periodStart, customerId)`;
  ghi lịch sử nhận thưởng và giao dịch ví vào cùng transaction.
- Mốc Khoai: 50, 40, 30, 25, 20, 15, 12, 10, 7, 5 cho hạng 1–10.

Những chức năng máy chủ trên **chưa được triển khai** theo phạm vi chỉ frontend.
