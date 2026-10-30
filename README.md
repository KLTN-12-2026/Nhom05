# HALM BOOK

**Nền tảng đọc sách trực tuyến thông minh tích hợp trợ lý AI**

> **Khóa luận tốt nghiệp:** Xây dựng nền tảng đọc sách trực tuyến HALM Book tích hợp trợ lý AI  
> **Giảng viên hướng dẫn:** ThS. Trịnh Sử Trường Thi  

HALM BOOK là hệ sinh thái đọc và thuê sách điện tử thế hệ mới, mang đến trải nghiệm tiếp cận tri thức liền mạch trên cả nền tảng **Web** và **Ứng dụng di động (Mobile App)**. Dự án kết hợp công nghệ AI đàm thoại hiện đại (Google Gemini) để đồng hành, giải đáp thắc mắc và gợi ý sách thông minh cho độc giả, đi cùng hệ thống đọc sách chuyên sâu (bản scan lật trang 3D và chế độ dàn trang chữ động Reflow Text).

---

## Cấu trúc dự án

Repo được tổ chức theo kiến trúc Monorepo phân tách rõ ràng giữa các phân hệ:

```text
KLTN-PushGit/
├── Database/              # Kịch bản khởi tạo Cơ sở dữ liệu MySQL hoàn chỉnh
│   └── HALMBOOK_SCHEMA_FULL.sql
├── HalmBookBE/            # Phân hệ Backend API (Java 21, Spring Boot 4, Spring AI)
├── HalmBookFE/            # Phân hệ Web Client (React 19, Vite 8, Tailwind CSS v4)
├── HalmBookApp/           # Phân hệ Mobile App (React Native, Expo SDK 58, TypeScript)
└── README.md              # Tài liệu hướng dẫn tổng quan và cài đặt hệ thống
```

---

## Tính năng nổi bật

### 1. Trải nghiệm Đọc sách Chuyên sâu (HALM Reader)
- **Hiệu ứng lật sách 3D sống động:** Đọc ấn bản scan PDF với hoạt ảnh lật trang chân thực, hỗ trợ phóng to thu nhỏ, toàn màn hình và điều hướng trực quan.
- **Chế độ Chữ tinh chỉnh (Reflow Text Mode):** Tự động dàn trang theo kích thước chữ (A- / A+) không bị tràn cuộn ngang, tùy chỉnh font chữ (Serif, Sans, Trọng lượng) và bảng màu nền đọc (Giấy ngà, Đêm, Cổ điển).
- **Ghi chú & Đánh dấu trang (Bookmark & Notes):** Lưu lại trang đang đọc dở, đánh dấu đoạn trích tâm đắc và đồng bộ trực tiếp vào Tủ sách cá nhân.

### 2. Trợ lý Ảo AI Đàm thoại (HALM AI Assistant)
- Tích hợp mô hình ngôn ngữ lớn (Google Gemini / OpenAI compatible) hỗ trợ tương tác tự nhiên theo ngữ cảnh.
- Hỗ trợ độc giả tóm tắt nội dung chương sách, giải thích thuật ngữ chuyên sâu, định hướng lộ trình đọc và gợi ý tựa sách phù hợp theo sở thích.

### 3. Kinh tế Độc giả & Hệ thống Hạng thành viên
- **Tiền tệ số (Hệ thống Khoai 🥔):** Mua gói nạp Khoai linh hoạt với các ưu đãi tích lũy.
- **Đa dạng hình thức sở hữu:** Thuê sách theo thời hạn (1 tuần, 1 tháng...) để tiết kiệm chi phí hoặc mở khóa "Sở Hữu Trọn Đời" lưu vào tủ sách vĩnh viễn.
- **Cấp bậc thành viên (Membership Tier):** Phân hạng độc giả (*Thợ Cày*, *Cao Thủ Cày*, *Lão Nông*, *Đại Điền Chủ*) dựa trên số sách đã đọc và khoai tích lũy, nhận đặc quyền giảm giá và huy hiệu danh dự.

### 4. Đa nền tảng & Giao diện Cao cấp
- **Dark Mode thông minh:** Chuyển đổi mượt mà giữa chế độ Sáng (Paper Parchment) và Tối (Obsidian Starry Sky) đồng bộ toàn diện trên mọi màn hình.
- **Đồng bộ Web & Mobile:** Trải nghiệm tài khoản, tủ sách cá nhân và lịch sử đọc được đồng bộ hóa xuyên suốt từ trình duyệt web đến ứng dụng điện thoại.

### 5. Cổng Quản trị Toàn diện (Admin Portal)
- Quản lý kho sách số, phân loại thể loại và tải lên tệp PDF/EPUB lên hạ tầng Cloudinary.
- Theo dõi lịch sử giao dịch thuê/mua sách, nạp khoai, thống kê doanh thu và quản lý danh sách khách hàng.

---

## Bảng công nghệ sử dụng

| Phân hệ / Thành phần | Công nghệ chính |
|---|---|
| **Frontend Web** | React 19, Vite 8, Tailwind CSS v4, Phosphor Icons, Axios, React Router v7, Three.js, GSAP |
| **Mobile App** | React Native 0.88, Expo SDK 58, TypeScript, Expo Router, Reanimated, Lucide Icons |
| **Backend API** | Java 21, Spring Boot 4.1, Spring Security, JWT (JSON Web Token), Spring Data JPA, Spring Mail |
| **Trợ lý AI** | Spring AI, OpenAI Starter kết nối Google Gemini API (`gemini-3.6-flash`) |
| **Lưu trữ Tệp & Sách** | Cloudinary API (quản lý ảnh bìa và file sách số PDF) |
| **Cơ sở dữ liệu** | MySQL 8.0+ (`halmbook` database với UTF8MB4 Unicode) |
| **Giao thức & Bảo mật** | HTTPS nội bộ với `vite-plugin-mkcert`, CORS, Stateless JWT Filter |

---

## Yêu cầu môi trường

Trước khi cài đặt, hãy đảm bảo máy tính đã cài đặt các công cụ sau:

- **Node.js:** Phiên bản `v20.x` hoặc `v22 LTS` kèm `npm`.
- **JDK (Java Development Kit):** Phiên bản `Java 21` (khuyên dùng Oracle JDK 21 hoặc Eclipse Temurin 21).
- **Cơ sở dữ liệu:** MySQL Server `8.0` hoặc cao hơn (chạy qua MySQL Workbench, XAMPP, hoặc Docker) mở cổng mặc định `3306`.
- **Git & Shell:** PowerShell (trên Windows) hoặc Bash/Terminal (trên macOS/Linux).
- *(Tùy chọn cho Mobile)* Ứng dụng **Expo Go** trên điện thoại Android/iOS để chạy thử app qua mạng LAN.

---

## Hướng dẫn cài đặt & Khởi chạy

Các lệnh dưới đây thực hiện bằng **PowerShell** tại thư mục gốc của dự án (`KLTN-PushGit`).

### Bước 1: Khởi tạo Cơ sở dữ liệu MySQL

1. Mở dịch vụ MySQL Server trên máy của bạn (port mặc định `3306`).
2. Mở MySQL Workbench hoặc chạy lệnh import file schema đã chuẩn bị sẵn trong thư mục `Database`:

```powershell
# Chạy trực tiếp qua MySQL CLI (thay 'root' và nhập mật khẩu của bạn)
mysql -u root -p < Database/HALMBOOK_SCHEMA_FULL.sql
```

> **Lưu ý:** Script sẽ tự động tạo cơ sở dữ liệu `halmbook` và khởi tạo đầy đủ cấu trúc bảng (Categories, Books, Accounts, Customers, Orders, Chat Sessions, Tiers...).

---

### Bước 2: Cấu hình và Khởi động Backend (HalmBookBE)

1. Mở file `HalmBookBE/src/main/resources/application.yml` để cấu hình thông số kết nối hoặc thiết lập các biến môi trường tương ứng:

```yaml
server:
  port: 8082

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/halmbook
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:your_mysql_password}
```

2. Di chuyển vào thư mục `HalmBookBE` và khởi chạy server bằng Gradle Wrapper:

```powershell
cd HalmBookBE

# Thiết lập biến môi trường (Ví dụ nếu có tài khoản Gemini API & MySQL)
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your_password"
$env:GEMINI_KEY="your_google_gemini_api_key"

# Khởi động Spring Boot server
.\gradlew.bat bootRun
```

Khi màn hình console hiển thị `Started HalmBookBeApplication in ... seconds` trên cổng **8082**, backend đã sẵn sàng.

---

### Bước 3: Cài đặt và Khởi động Frontend Web (HalmBookFE)

Mở một cửa sổ Terminal/PowerShell mới và điều hướng đến thư mục `HalmBookFE`:

```powershell
cd HalmBookFE

# Cài đặt các thư viện phụ thuộc
npm install

# Khởi chạy máy chủ phát triển Vite
npm run dev
```

Trình duyệt sẽ mở tại địa chỉ: **[https://localhost:5173](https://localhost:5173)** (hoặc `http://localhost:5173`).

> **Mẹo:** `HalmBookFE` được cấu hình chứng chỉ HTTPS nội bộ bằng `vite-plugin-mkcert` để hỗ trợ an toàn cho popup Google Auth và Web Crypto API.

---

### Bước 4: (Tùy chọn) Khởi động Ứng dụng Di động (HalmBookApp)

Nếu muốn trải nghiệm ứng dụng đọc sách trên điện thoại thông minh:

1. Mở một cửa sổ Terminal mới và di chuyển vào `HalmBookApp`:

```powershell
cd HalmBookApp

# Tạo file cấu hình từ file mẫu
Copy-Item .env.example .env.local

# Cài đặt dependencies
npm install
```

2. Mở file `HalmBookApp/.env.local` và trỏ `EXPO_PUBLIC_API_URL` đến địa chỉ IPv4 máy tính của bạn (để thiết bị thật cùng mạng Wi-Fi gọi được Backend):

```dotenv
EXPO_PUBLIC_API_URL=http://<IP_V4_MAY_TINH>:8082
# Ví dụ: EXPO_PUBLIC_API_URL=http://192.168.1.15:8082
# Nếu chạy trên trình giả lập Android Emulator: http://10.0.2.2:8082
```

3. Khởi chạy máy chủ Metro Bundler:

```powershell
npm start
```

Dùng ứng dụng **Expo Go** trên điện thoại quét mã QR hiển thị trên màn hình terminal để khởi chạy app.

---

## Danh mục địa chỉ truy cập trên máy cá nhân

| Phân hệ / Dịch vụ | Địa chỉ truy cập | Ghi chú |
|---|---|---|
| **Website Độc giả (FE)** | [https://localhost:5173](https://localhost:5173) | Giao diện đọc sách, trang chủ, giỏ hàng, tủ sách |
| **Trang Quản trị (Admin)** | [https://localhost:5173/admin/sach](https://localhost:5173/admin/sach) | Quản lý kho sách, khách hàng, thống kê doanh thu |
| **Backend REST API** | [http://localhost:8082](http://localhost:8082) | Cổng tiếp nhận toàn bộ request từ Web & App |
| **API Sách** | `http://localhost:8082/api/home/books` | Danh sách sách công khai |
| **API Xác thực** | `http://localhost:8082/api/auth` | Đăng nhập, đăng ký, OAuth, JWT |
| **Cơ sở dữ liệu MySQL** | `localhost:3306` | Database `halmbook` |
| **Expo Dev Server (Mobile)** | `http://localhost:8081` | Metro Bundler cho React Native |

---

## Chi tiết các biến môi trường cần thiết

Dưới đây là danh sách các biến môi trường cấu hình trong file `application.yml` của Backend (`HalmBookBE`):

| Biến môi trường | Bắt buộc | Mô tả |
|---|---|---|
| `DB_USERNAME` | Có | Tên tài khoản MySQL (mặc định: `root`) |
| `DB_PASSWORD` | Có | Mật khẩu truy cập cơ sở dữ liệu MySQL |
| `GEMINI_KEY` | Tùy chọn | API Key của Google Gemini dùng cho Trợ lý AI Chatbot |
| `JWT_SECRET` | Không | Khóa bí mật mã hóa JWT (đã có chuỗi mặc định an toàn cho môi trường dev) |
| `MAIL_PASSWORD` | Tùy chọn | Mật khẩu ứng dụng (App Password) của Gmail dùng gửi mã OTP khôi phục mật khẩu |
| `CLOUDINARY_CLOUD_NAME` | Tùy chọn | Tên Cloud của tài khoản Cloudinary để lưu file sách và ảnh |
| `CLOUDINARY_API_KEY` | Tùy chọn | API Key tài khoản Cloudinary |
| `CLOUDINARY_API_SECRET` | Tùy chọn | API Secret tài khoản Cloudinary |
| `GOOGLE_CLIENT_ID` | Tùy chọn | Client ID từ Google Cloud Console phục vụ Google OAuth2 Login |

---

## Hướng dẫn dừng ứng dụng

Để tắt các dịch vụ khi kết thúc phiên làm việc:
- **Frontend / Backend / Mobile:** Bấm tổ hợp phím `Ctrl + C` tại cửa sổ Terminal tương ứng và chọn `Y` để dừng tiến trình.
- Dữ liệu sách, tài khoản và lịch sử đọc được bảo lưu nguyên vẹn trong MySQL Database.

---

## Bản quyền & Đóng góp

Dự án được thực hiện phục vụ cho đề tài Khóa luận tốt nghiệp chuyên ngành Công nghệ Thông tin. Mọi hành vi sao chép, trích dẫn cần ghi rõ nguồn và tác giả đề tài.
