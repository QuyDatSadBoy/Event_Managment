# Gắn tên miền qua Cloudflare

Trang đã chạy trên máy chủ. Việc còn lại là trỏ tên miền về đó.

- **Máy chủ:** `116.118.6.61`
- **Tên miền dự kiến:** `event.vhdcorp.com`
- Muốn dùng tên khác: sửa `DOMAIN` trong `deploy/deploy.env` rồi chạy lại
  `./scripts/deploy.sh --skip-build`, sau đó tạo bản ghi theo tên mới.

---

## Bước 1 — Tạo bản ghi DNS

Vào **Cloudflare → chọn `vhdcorp.com` → DNS → Records → Add record**

| Ô | Điền |
|---|---|
| Type | `A` |
| Name | `event` |
| IPv4 address | `116.118.6.61` |
| Proxy status | **Proxied** (đám mây màu cam) |
| TTL | Auto |

Bấm **Save**.

> Để **Proxied** thì Cloudflare mới che IP gốc, bật CDN và chống DDoS. Nếu để
> DNS only (đám mây xám), trình duyệt sẽ báo lỗi chứng chỉ vì chứng chỉ trên máy
> chủ là chứng chỉ gốc của Cloudflare, không phải chứng chỉ công khai.

---

## Bước 2 — Kiểm tra chế độ SSL

**SSL/TLS → Overview**, chọn **Full**.

- **Full** — Cloudflare kết nối tới máy chủ bằng HTTPS và không bắt buộc chứng
  chỉ phải khớp tên miền. Đây là chế độ đang dùng cho `vhdcorp.com` và
  `assistant.vhdcorp.com`, và là chế độ đúng cho trang này.
- **Không chọn Full (strict)** — chứng chỉ gốc hiện tại có CN là `vhdcorp.com`
  và không có mục nào cho tên miền con, nên strict sẽ báo lỗi 526.
- **Không chọn Flexible** — sẽ tạo vòng lặp chuyển hướng vì nginx đã tự chuyển
  HTTP sang HTTPS.

---

## Bước 3 — Chờ và kiểm tra

Bản ghi thường có hiệu lực sau 1–2 phút.

```bash
# Đúng thì trả về IP của Cloudflare (dạng 104.x hoặc 172.x), không phải IP máy chủ
dig +short event.vhdcorp.com

# Đúng thì in ra {"status":"ok",...}
curl -s https://event.vhdcorp.com/health

# Đúng thì trả về 200
curl -s -o /dev/null -w '%{http_code}\n' https://event.vhdcorp.com/
```

Sau đó mở https://event.vhdcorp.com trên trình duyệt.

---

## Nếu gặp lỗi

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| **Lỗi 526** | SSL đang để Full (strict) | Chuyển về **Full** |
| **Lỗi 521** | Không kết nối được máy chủ | `./scripts/deploy.sh --status` |
| **Lỗi 522** | Tường lửa chặn Cloudflare | Mở cổng 80 và 443 cho dải IP Cloudflare |
| **Chuyển hướng lặp vô hạn** | SSL đang để Flexible | Chuyển về **Full** |
| **Cảnh báo chứng chỉ** | Proxy đang tắt | Bật lại **Proxied** (đám mây cam) |
| **Vẫn ra trang cũ** | Cache Cloudflare | **Caching → Purge Everything** |

---

## Nên bật thêm (không bắt buộc)

**SSL/TLS → Edge Certificates**

- **Always Use HTTPS**: bật
- **Automatic HTTPS Rewrites**: bật
- **Minimum TLS Version**: TLS 1.2

**Speed → Optimization**

- **Brotli**: bật

**Caching → Configuration**

- Trang đã tự đặt `Cache-Control` phù hợp cho từng loại nội dung, nên giữ
  **Caching Level: Standard** là đủ. Không bật "Cache Everything" vì sẽ làm
  trang quản trị bị lưu đệm sai.

**Security → WAF**

- Có thể thêm một quy tắc giới hạn tần suất cho `/admin/*` nếu muốn siết thêm
  truy cập vào trang quản trị.
