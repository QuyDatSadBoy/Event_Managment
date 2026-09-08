# Event Management — VHD Summit

Nền tảng quản lý sự kiện gồm **trang công khai** (12 trang) và **trang quản trị**
(9 module). Backend viết bằng Go, frontend bằng Next.js, chạy trên VPS nhỏ dưới
pm2 + nginx.

```
                       ┌──────────── nginx (TLS, gzip, cache) ────────────┐
   Cloudflare  ──────► │  /            → Next.js  :3002                   │
                       │  /api/*       → Go API   :8090                   │
                       │  /uploads/*   → Go API   :8090 (tệp đã tải lên)  │
                       └──────────────────────┬──────────────────────────┘
                                              │
                                       PostgreSQL 16
```

## Tính năng

**Trang công khai**

| Trang | Đường dẫn |
|---|---|
| Trang chủ | `/` |
| Giới thiệu sự kiện | `/gioi-thieu` |
| Chương trình (agenda) | `/chuong-trinh` |
| Danh sách diễn giả | `/dien-gia` |
| Chi tiết diễn giả | `/dien-gia/[slug]` |
| Tin tức & bài viết | `/tin-tuc` |
| Chi tiết bài viết / bài phát biểu | `/tin-tuc/[slug]` |
| Thư viện ảnh, video, tài liệu | `/thu-vien` |
| Đăng ký tham dự | `/dang-ky` |
| Cảm ơn sau đăng ký | `/dang-ky/hoan-tat` |
| Đối tác & nhà tài trợ | `/doi-tac` |
| Liên hệ | `/lien-he` |

**Trang quản trị** (`/admin`, cần đăng nhập)

Tổng quan · Chương trình · Diễn giả · Tin tức & Bài viết · Thư viện · Đối tác ·
Đăng ký · Liên hệ · Cấu hình sự kiện

Chi tiết cách dùng: [`docs/HUONG-DAN.md`](docs/HUONG-DAN.md).

## Yêu cầu

**Máy phát triển:** Go ≥ 1.24, Node ≥ 20, Docker (chỉ để chạy PostgreSQL cục bộ).
**Máy chủ:** Ubuntu, Node ≥ 20, PostgreSQL, nginx, pm2 — script deploy tự cài
nếu thiếu (`--provision`).

## Chạy trên máy phát triển

```bash
# 1. PostgreSQL
docker run -d --name event_pg -p 55432:5432 \
  -e POSTGRES_USER=event -e POSTGRES_PASSWORD=devpass -e POSTGRES_DB=event_db \
  postgres:16-alpine

# 2. API (cổng 8090) — tạo bảng và nạp dữ liệu mẫu ở lần đầu
cd backend
cp .env.example .env
go run ./cmd/server -seed     # chỉ chạy một lần
go run ./cmd/server

# 3. Giao diện (cổng 3002)
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

Mở http://localhost:3002 — quản trị tại http://localhost:3002/admin
(`admin@vhdcorp.com` / `Admin@12345`, đổi ngay khi lên production).

## Triển khai

```bash
cp deploy/deploy.env.example deploy/deploy.env   # điền thông tin máy chủ
./scripts/deploy.sh --provision                  # lần đầu trên VPS mới
./scripts/deploy.sh                              # các lần sau
```

Script build **ngay trên máy bạn** (binary Go tĩnh + Next.js standalone) rồi
đẩy lên máy chủ, nên VPS không cần cài Go hay biên dịch gì — đây là lý do một
lần deploy chỉ mất chưa tới một phút trên máy 2 nhân.

| Lệnh | Việc |
|---|---|
| `./scripts/deploy.sh` | Build và triển khai |
| `./scripts/deploy.sh --provision` | Cài các gói còn thiếu trên máy chủ trước |
| `./scripts/deploy.sh --seed` | Nạp thêm dữ liệu mẫu (bỏ qua bảng đã có dữ liệu) |
| `./scripts/deploy.sh --skip-build` | Dùng lại `dist.tar.gz` đã build |
| `./scripts/deploy.sh --status` | Xem tình trạng dịch vụ |
| `./scripts/deploy.sh --logs` | Xem log đang chạy |
| `./scripts/deploy.sh --rollback` | Quay về bản phát hành trước |

**Đổi sang VPS khác:** sửa `deploy/deploy.env` rồi chạy `--provision`. Không cần
sửa gì trong mã nguồn.

Cấu trúc trên máy chủ:

```
/root/event-mgmt/
├── current              → symlink tới bản phát hành đang chạy
├── releases/            3 bản gần nhất, dùng để rollback
├── shared/
│   ├── api.env          bí mật, chmod 600
│   └── uploads/         tệp đã tải lên, không bị mất khi deploy
├── logs/
└── ecosystem.config.js  cấu hình pm2 (sinh tự động)
```

Gắn tên miền: [`docs/CLOUDFLARE.md`](docs/CLOUDFLARE.md).

## Cấu trúc mã nguồn

```
backend/                 Go 1.24 · chi · pgx · JWT
├── cmd/server/          điểm khởi động, cờ -migrate và -seed
└── internal/
    ├── config/          đọc biến môi trường
    ├── db/              pool + migration nhúng sẵn
    ├── handlers/        REST handler và router
    ├── middleware/      xác thực, log, giới hạn tần suất
    ├── models/          kiểu dữ liệu
    ├── seed/            dữ liệu mẫu
    └── util/            HTTP, kiểm tra dữ liệu, xử lý chuỗi

frontend/                Next.js 16 · React 19 · Tailwind 4 · TypeScript
└── src/
    ├── app/(site)/      12 trang công khai
    ├── app/admin/       9 màn hình quản trị
    ├── components/      ui/ · site/ · admin/
    └── lib/             API client, kiểu dữ liệu, tiện ích
```

## Ghi chú kỹ thuật

- **Migration** nhúng trong binary (`go:embed`) và chạy mỗi lần khởi động, nên
  không cần công cụ ngoài trên máy chủ.
- **Ảnh CDN không đi qua trình tối ưu của Next.** Trang đối tác hiển thị 17 logo
  cùng lúc; tối ưu tất cả trên máy chủ 2 nhân làm quá ngưỡng bộ nhớ và pm2 khởi
  động lại tiến trình — người dùng thấy 502. Xem `src/lib/image-loader.ts`.
- **Múi giờ:** ô nhập ngày giờ không kèm chênh lệch múi giờ. Giao diện gửi lên
  dạng ISO có offset, còn API hiểu giá trị "trần" theo `APP_TIMEZONE`
  (mặc định `Asia/Ho_Chi_Minh`).
- **Biểu mẫu công khai** có bẫy bot ẩn và giới hạn 10 lần gửi mỗi giờ theo IP.
- **Tải tệp lên** chỉ nhận đúng danh sách định dạng, kiểm tra theo nội dung tệp
  chứ không tin phần mở rộng, và đặt lại tên ngẫu nhiên.
