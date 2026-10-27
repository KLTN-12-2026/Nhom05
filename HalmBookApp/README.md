# HALMBOOK

Ứng dụng đọc sách được xây dựng với Expo SDK 58, React Native và TypeScript.

## Chạy dự án

```bash
npm install
npm start
```

Các lệnh tiện ích:

```bash
npm run android
npm run ios
npm run web
npm run lint
npx tsc --noEmit
npx expo-doctor
```

## Kết nối backend

API URL được đọc từ biến môi trường `EXPO_PUBLIC_API_URL`.

```bash
Copy-Item .env.example .env.local
```

Sau đó sửa URL trong `.env.local`:

- Android Emulator: `http://10.0.2.2:8082`
- iOS Simulator hoặc web: `http://localhost:8082`
- Thiết bị thật: `http://<IPv4-của-máy-chạy-backend>:8082`, với hai thiết bị cùng mạng LAN

Không commit `.env.local`. Expo sẽ nạp các biến có tiền tố `EXPO_PUBLIC_` vào ứng dụng lúc chạy.

## Cấu trúc

Ứng dụng sử dụng `App.tsx` và navigation nội bộ bằng state. Package `expo-router` vẫn được giữ trong dependency tree để tương thích với bộ package Expo hiện tại, nhưng dự án không sử dụng file-based routing.
