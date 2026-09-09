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

## Thiết kế và kiểm thử

Dự án được xây theo bộ skill thiết kế và review sau — cài bằng một lệnh:

```bash
./scripts/install-skills.sh
```

Gồm `impeccable` (định hướng thiết kế và ngưỡng chất lượng), bộ `ui-ux-pro-max`,
hướng dẫn của Vercel (`web-interface-guidelines`, `web-design-guidelines`,
`react-best-practices`, `vercel-optimize`) và `awesome-design-md`. Thư mục
`.claude/skills/` không được commit vì các bộ này nặng khoảng 13 MB dữ liệu
font và icon.

Ngôn ngữ thiết kế được ghi lại trong [`DESIGN.md`](DESIGN.md) — bảng màu, thang
chữ, nhịp dọc, quy tắc chuyển động, ngưỡng vùng chạm và ngân sách hiệu năng.
Đọc file đó trước khi sửa giao diện.

Bộ kiểm thử tự động (chạy bằng Playwright, mã nguồn trong `scripts/qa/`):

| Kiểm thử | Phạm vi |
|---|---|
| `audit` | 11 trang × 9 độ rộng màn hình: tràn ngang, vùng chạm, cỡ chữ ô nhập, thứ bậc tiêu đề, độ dài dòng, ảnh gây xô lệch |
| `contrast` | Đo tương phản **từ pixel thật** — cách duy nhất đánh giá đúng chữ nằm trên ảnh |
| `perf` | LCP / CLS / TBT ở hồ sơ Slow 4G + CPU chậm 4×, lấy trung vị 3 lần tải nguội |
| `crawl` | 13 trang × 3 khung nhìn: mã trạng thái, lỗi console, ảnh hỏng |
| `admin` | 21 kịch bản: đăng nhập, CRUD từng module, phân quyền, đăng xuất |
| `forms` | Đăng ký và liên hệ: kiểm tra dữ liệu, trùng email, mã vé |

Kết quả đo trên bản đang chạy (Slow 4G + CPU 4×, qua Cloudflare):

| | LCP | CLS | TBT |
|---|---|---|---|
| Ngưỡng tốt | < 2,5s | < 0,1 | < 200ms |
| Thực đo | 1,7–1,9s | 0 | 51–169ms |

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
- **Ảnh nền các trang con** chỉ tải ở 768px, chất lượng 40. Chúng nằm dưới lớp
  phủ tối 92% nên chi tiết không nhìn thấy; tải ảnh full-width khiến chúng trở
  thành phần tử LCP của mọi trang và mất 2,5–4,4 giây.
