# Hướng dẫn sử dụng trang quản trị

Đăng nhập tại `https://<tên-miền>/admin`.

Tài khoản đầu tiên được tạo tự động ở lần chạy đầu, lấy từ `ADMIN_EMAIL` và
`ADMIN_PASSWORD` trong `deploy/deploy.env`. **Hãy đổi mật khẩu ngay sau lần đăng
nhập đầu tiên.**

---

## Tổng quan

Số liệu đăng ký, nội dung và liên hệ chưa đọc. Biểu đồ hiển thị lượt đăng ký
14 ngày gần nhất. Bấm vào mỗi thẻ để đi thẳng tới màn hình quản lý tương ứng.

---

## Chương trình

Chương trình gồm hai lớp: **ngày** và **phiên** thuộc ngày đó.

1. **Thêm ngày** — đặt nhãn (`Ngày 1`), tiêu đề và ngày diễn ra.
2. **Thêm phiên** — chọn ngày, nhập tên phiên, giờ bắt đầu và kết thúc, phòng,
   chủ đề và loại phiên.
3. **Gán diễn giả** — tích chọn trong danh sách ở cuối biểu mẫu. Diễn giả đã gán
   sẽ hiện cả trên trang chương trình lẫn trang cá nhân của họ.

Loại phiên quyết định màu nhãn hiển thị: Keynote, Toạ đàm, Chuyên đề, Workshop,
Kết nối, Giải lao, Nghi thức.

> Xoá một ngày sẽ xoá luôn toàn bộ phiên thuộc ngày đó.

---

## Diễn giả

Mỗi diễn giả có ảnh chân dung, chức danh, đơn vị, tiểu sử và danh sách chủ đề
chuyên môn.

- **Ảnh vuông** cho kết quả đẹp nhất trên lưới diễn giả.
- **Giới thiệu ngắn** để trống sẽ tự sinh từ tiểu sử.
- **Diễn giả nổi bật** được xếp lên đầu danh sách và hiện trên trang chủ.
- **Thứ tự hiển thị**: số nhỏ hiện trước.
- Đường dẫn trang diễn giả sinh tự động từ tên (`Nguyễn Minh Quân` →
  `/dien-gia/nguyen-minh-quan`).

Nút con mắt để ẩn hoặc hiện diễn giả trên trang công khai mà không cần xoá.

---

## Tin tức & Bài viết

Bốn chuyên mục dùng chung một mẫu hiển thị:

| Chuyên mục | Dùng cho |
|---|---|
| Tin tức | Tin thường ngày |
| Thông báo | Thông báo từ ban tổ chức |
| Bài phát biểu | Toàn văn bài nói của diễn giả |
| Thông cáo báo chí | Nội dung dành cho báo chí |

Với **bài phát biểu**, chọn diễn giả ở ô "Gắn với diễn giả" — bài sẽ hiện thêm
trong trang cá nhân của diễn giả đó, kèm hồ sơ diễn giả bên cạnh bài viết.

Trình soạn thảo có các nút đậm, nghiêng, tiêu đề, danh sách, trích dẫn và chèn
liên kết. Dán nội dung từ Word hay Google Docs sẽ tự động bỏ định dạng gốc để
không phá vỡ giao diện. Nút `</>` cho phép sửa HTML trực tiếp.

Bỏ tích "Đăng công khai" để lưu thành bản nháp.

---

## Thư viện

Ba loại nội dung:

- **Hình ảnh** — tải trực tiếp lên máy chủ.
- **Video** — dán liên kết YouTube hoặc Vimeo. Nếu không đặt ảnh đại diện,
  hệ thống tự lấy ảnh từ YouTube.
- **Tài liệu** — tải PDF lên hoặc dán đường dẫn; hiển thị kèm nút tải xuống.

Nút **Tải nhiều ảnh** cho phép chọn nhiều tệp một lần; mỗi tệp thành một mục
riêng, tên lấy theo tên tệp.

**Bộ sưu tập** là nhãn nhóm tự do (ví dụ `VHD Summit 2026`, `Gala`). Ô nhập có
gợi ý các bộ sưu tập đã có để tránh gõ sai.

---

## Đối tác

Hạng tài trợ quyết định kích thước logo trên trang công khai — Kim cương lớn
nhất, giảm dần tới Bảo trợ truyền thông. Logo nền trong suốt (PNG hoặc SVG) cho
kết quả đẹp nhất.

---

## Đăng ký

Danh sách khách đăng ký qua trang công khai. Đổi trạng thái ngay trên bảng:
Chờ duyệt → Đã xác nhận → Đã check-in, hoặc Đã huỷ.

Bấm vào tên để xem chi tiết: liên hệ, đơn vị, chủ đề quan tâm và ghi chú.

**Xuất CSV** tải toàn bộ danh sách, mở được trực tiếp bằng Excel (đã xử lý font
tiếng Việt).

---

## Liên hệ

Tin nhắn gửi qua biểu mẫu liên hệ. Tin chưa đọc có viền đậm và nhãn "Mới".
Nút **Trả lời qua email** mở sẵn trình gửi thư với địa chỉ và tiêu đề.

---

## Cấu hình sự kiện

Năm nhóm thiết lập:

- **Thông tin chung** — tên, khẩu hiệu, thời gian, địa điểm, và công tắc mở hoặc
  đóng cổng đăng ký.
- **Trang chủ** — tiêu đề lớn, slideshow ảnh nền, dải số liệu và bốn thẻ điểm
  nhấn.
- **Giới thiệu** — nội dung trang giới thiệu.
- **Liên hệ & Mạng xã hội** — thông tin hiển thị ở chân trang và trang liên hệ.
- **SEO** — tiêu đề và mô tả hiển thị trên kết quả tìm kiếm, có khung xem trước.

Nhớ bấm **Lưu thay đổi** ở góc trên bên phải.

> Thay đổi nội dung xuất hiện trên trang công khai trong vòng một phút — các
> trang được lưu đệm 60 giây để giảm tải cho máy chủ.

---

## Câu hỏi thường gặp

**Đóng cổng đăng ký thế nào?**
Cấu hình sự kiện → Thông tin chung → tắt "Mở cổng đăng ký". Trang đăng ký sẽ
hiện thông báo thay cho biểu mẫu.

**Đổi mật khẩu quản trị?**
Hiện đổi qua API:
`POST /api/auth/change-password` với `current_password` và `new_password`.

**Ảnh tải lên nằm ở đâu?**
`/root/event-mgmt/shared/uploads` trên máy chủ — thư mục này nằm ngoài thư mục
bản phát hành nên không bị mất khi triển khai lại.

**Lỡ xoá nhầm thì sao?**
Chưa có thùng rác. Với dữ liệu quan trọng, hãy sao lưu định kỳ:
```bash
sudo -u postgres pg_dump event_db | gzip > event_db-$(date +%F).sql.gz
```
