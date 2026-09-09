package seed

import (
	"context"
	"fmt"
	"math/rand"
	"strconv"
	"time"

	"github.com/vhdcorp/event-api/internal/db"
	"github.com/vhdcorp/event-api/internal/util"
)

func seedGallery(ctx context.Context, d *db.DB) error {
	prev := strconv.Itoa(editionYear() - 1)
	prevAlbum := "VHD Summit " + prev
	var count int64
	if err := d.QueryRow(ctx, `SELECT count(*) FROM gallery_items`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	type item struct {
		title, desc, kind, url, thumb, album string
		size                                 int64
	}

	photoIDs := []struct{ id, title, album string }{
		{"photo-1540575467063-178a50c2df87", "Phiên toàn thể sáng ngày 1", prevAlbum},
		{"photo-1531058020387-3be344556be6", "Toàn cảnh hội trường Grand Ballroom", prevAlbum},
		{"photo-1523580494863-6f3031224c94", "Bài phát biểu khai mạc", prevAlbum},
		{"photo-1505373877841-8d25f7d46678", "Toạ đàm chuyên đề trải nghiệm khách hàng", prevAlbum},
		{"photo-1560439514-4e9645039924", "Khu vực kết nối giao thương", prevAlbum},
		{"photo-1591115765373-5207764f72e7", "Khu trưng bày công nghệ", "Triển lãm"},
		{"photo-1515187029135-18ee286d815b", "Buổi họp báo công bố chương trình", "Họp báo"},
		{"photo-1524178232363-1fb2b075b655", "Workshop vận hành F&B", "Workshop"},
		{"photo-1587825140708-dfaf72ae4b04", "Khán phòng phiên bế mạc", prevAlbum},
		{"photo-1559223607-a43c990c692c", "Sảnh đón khách Ariyana", "Địa điểm"},
		{"photo-1492684223066-81342ee5ff30", "Đêm Gala Dinner", "Gala"},
		{"photo-1475721027785-f74eccf877e2", "Lễ trao giải VHD Awards", "Gala"},
		{"photo-1511578314322-379afb476865", "Khách tham dự đăng ký tại sảnh", prevAlbum},
		{"photo-1517457373958-b7bdd4587205", "Phiên thực hành thiết kế dịch vụ", "Workshop"},
		{"photo-1583417319070-4a69db38a482", "Đà Nẵng — thành phố đăng cai", "Địa điểm"},
		{"photo-1528127269322-539801943592", "Không gian biển Mỹ Khê", "Địa điểm"},
	}

	items := make([]item, 0, len(photoIDs)+6)
	for _, p := range photoIDs {
		items = append(items, item{
			title: p.title, kind: "image", album: p.album,
			url:   img(p.id, 1600),
			thumb: img(p.id, 600),
			size:  int64(400_000 + rand.Intn(900_000)),
		})
	}

	videos := []struct{ title, url, thumbID, desc string }{
		{"VHD Summit " + prev + " — Video tổng kết", "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
			"photo-1540575467063-178a50c2df87", "Nhìn lại hai ngày diễn đàn với hơn 3.000 khách tham dự."},
		{"Phỏng vấn diễn giả: Chuyển đổi số ngành lưu trú", "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
			"photo-1523580494863-6f3031224c94", "Cuộc trò chuyện 12 phút bên lề phiên toàn thể."},
		{"Tham quan khu trưng bày công nghệ", "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
			"photo-1591115765373-5207764f72e7", "Một vòng qua bốn khu chức năng của triển lãm."},
	}
	for _, v := range videos {
		items = append(items, item{
			title: v.title, desc: v.desc, kind: "video", album: "Video",
			url: v.url, thumb: img(v.thumbID, 800),
		})
	}

	docs := []struct{ title, desc string }{
		{"Bộ nhận diện thương hiệu VHD Summit " + strconv.Itoa(editionYear()), "Logo, bảng màu và hướng dẫn sử dụng dành cho đối tác truyền thông."},
		{"Thông cáo báo chí — Công bố chương trình " + strconv.Itoa(editionYear()), "Bản đầy đủ dành cho cơ quan báo chí."},
		{"Hồ sơ tài trợ VHD Summit " + strconv.Itoa(editionYear()), "Chi tiết các hạng tài trợ và quyền lợi đi kèm."},
	}
	for _, doc := range docs {
		items = append(items, item{
			title: doc.title, desc: doc.desc, kind: "document", album: "Tài liệu báo chí",
			url:   "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
			thumb: "", size: int64(1_200_000 + rand.Intn(3_000_000)),
		})
	}

	for i, it := range items {
		if _, err := d.Exec(ctx, `
			INSERT INTO gallery_items (title, description, type, url, thumbnail, album,
			                           file_size, is_published, sort_order)
			VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,$8)`,
			it.title, it.desc, it.kind, it.url, it.thumb, it.album, it.size, i); err != nil {
			return err
		}
	}
	return nil
}

func seedPartners(ctx context.Context, d *db.DB) error {
	var count int64
	if err := d.QueryRow(ctx, `SELECT count(*) FROM partners`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	// Logos are generated as clean wordmarks so the partner wall looks consistent
	// without shipping third-party brand assets.
	// Wordmarks in the brand palette so the demo partner wall reads as one
	// piece rather than a grid of stock blue.
	logo := func(name string) string {
		return "https://placehold.co/400x200/f2f9f9/067c74/png?text=" + urlText(name)
	}

	partners := []struct {
		name, tier, site, desc string
	}{
		{"Vietnam Hospitality Group", "diamond", "https://example.com", "Tập đoàn vận hành 34 khách sạn và khu nghỉ dưỡng trên toàn quốc."},
		{"Booking Technologies", "diamond", "https://example.com", "Nền tảng đặt phòng phục vụ hơn 40 triệu người dùng khu vực châu Á."},
		{"Ariyana Convention Centre", "diamond", "https://example.com", "Đơn vị đăng cai và đồng tổ chức VHD Summit 2026."},
		{"Mekong Travel Tech", "platinum", "https://example.com", "Nền tảng phân phối tour trực tuyến khu vực phía Nam."},
		{"Pacific Resorts International", "platinum", "https://example.com", "Hệ thống 60 khu nghỉ dưỡng tại 9 quốc gia."},
		{"Asia Investment Partners", "gold", "https://example.com", "Quỹ đầu tư chuyên ngành hạ tầng du lịch Đông Nam Á."},
		{"GreenStay Vietnam", "gold", "https://example.com", "Tổ chức phát triển bộ tiêu chuẩn lưu trú bền vững."},
		{"Saigon Culinary Collective", "gold", "https://example.com", "Chuỗi 45 nhà hàng và mô hình bếp trung tâm."},
		{"Horizon Hotels Group", "silver", "https://example.com", "Danh mục 120 khách sạn khu vực châu Á – Thái Bình Dương."},
		{"Homestay Network Vietnam", "silver", "https://example.com", "Mạng lưới hơn 5.000 cơ sở lưu trú quy mô nhỏ."},
		{"European Hotel Alliance", "silver", "https://example.com", "Liên minh 900 khách sạn thành viên tại châu Âu."},
		{"Southeast Asia Tourism Board", "bronze", "https://example.com", "Cơ quan xúc tiến du lịch khu vực ASEAN."},
		{"VHD Corp", "bronze", "https://vhdcorp.com", "Đơn vị phát triển nền tảng công nghệ cho ngành dịch vụ."},
		{"Danang Tourism Association", "partner", "https://example.com", "Hiệp hội Du lịch thành phố Đà Nẵng."},
		{"Vietnam Hotel Association", "partner", "https://example.com", "Hiệp hội Khách sạn Việt Nam."},
		{"Travel Weekly Asia", "media", "https://example.com", "Tạp chí chuyên ngành du lịch khu vực châu Á."},
		{"Hospitality Vietnam", "media", "https://example.com", "Ấn phẩm chuyên ngành khách sạn – nhà hàng."},
	}

	for i, p := range partners {
		if _, err := d.Exec(ctx, `
			INSERT INTO partners (name, logo, website, description, tier, is_published, sort_order)
			VALUES ($1,$2,$3,$4,$5,TRUE,$6)`,
			p.name, logo(p.name), p.site, p.desc, p.tier, i); err != nil {
			return err
		}
	}
	return nil
}

func urlText(s string) string {
	out := make([]rune, 0, len(s))
	for _, r := range s {
		switch {
		case r == ' ':
			out = append(out, '+')
		case r == '&':
			out = append(out, '%', '2', '6')
		default:
			out = append(out, r)
		}
	}
	return string(out)
}

func seedRegistrations(ctx context.Context, d *db.DB) error {
	var count int64
	if err := d.QueryRow(ctx, `SELECT count(*) FROM registrations`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	names := []string{
		"Nguyễn Văn An", "Trần Thị Bích", "Lê Hoàng Nam", "Phạm Thu Hà", "Hoàng Minh Đức",
		"Vũ Thị Lan", "Đặng Quốc Việt", "Bùi Ngọc Mai", "Đỗ Thanh Tùng", "Ngô Thị Hương",
		"Dương Hải Long", "Lý Thu Trang", "Cao Văn Thành", "Phan Mỹ Linh", "Trịnh Đức Anh",
		"Mai Thị Nga", "Tô Quang Huy", "Hồ Kim Chi", "Lâm Bảo Khánh", "Đinh Thuỳ Dung",
		"Chu Minh Hiếu", "Tạ Thanh Vân", "Kiều Anh Tú", "Lương Hồng Nhung", "Vương Đình Phúc",
	}
	companies := []string{
		"Sunrise Hotel Danang", "Lotus Travel", "Mekong Resorts", "Hanoi Boutique Group",
		"Saigon Food Service", "Blue Ocean Hospitality", "Indochine Tours", "Pearl Bay Resort",
		"Green Leaf Homestay", "Central Coast Hotels",
	}
	titles := []string{
		"Giám đốc điều hành", "Trưởng phòng Kinh doanh", "Quản lý Vận hành", "Giám đốc Marketing",
		"Chuyên viên Đặt phòng", "Trưởng bộ phận F&B", "Giám đốc Công nghệ", "Quản lý Khách sạn",
	}
	tickets := []string{"visitor", "visitor", "visitor", "delegate", "delegate", "exhibitor", "press", "vip"}
	statuses := []string{"confirmed", "confirmed", "confirmed", "pending", "pending", "checked_in", "cancelled"}
	interests := [][]string{
		{"Công nghệ vận hành"}, {"Trải nghiệm khách hàng", "Marketing"},
		{"Đầu tư"}, {"Phát triển bền vững"}, {"F&B", "Chuỗi cung ứng"},
		{"Kết nối giao thương"}, {"Công nghệ vận hành", "Dữ liệu"},
	}

	rng := rand.New(rand.NewSource(20260820))
	for i, name := range names {
		email := fmt.Sprintf("%s%d@example.com", util.Slugify(name), i+1)
		created := time.Now().Add(-time.Duration(rng.Intn(13*24)) * time.Hour)
		if _, err := d.Exec(ctx, `
			INSERT INTO registrations (code, full_name, email, phone, company, job_title,
			                           country, ticket_type, interests, note, status, created_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
			util.RegistrationCode("EVT"), name, email,
			fmt.Sprintf("09%d", 10000000+rng.Intn(89999999)),
			companies[i%len(companies)], titles[i%len(titles)], "Vietnam",
			tickets[i%len(tickets)], interests[i%len(interests)], "",
			statuses[i%len(statuses)], created); err != nil {
			return err
		}
	}

	sample := []struct{ name, email, subject, msg string }{
		{"Nguyễn Thị Hồng", "hong.nguyen@example.com", "Hỏi về gói tài trợ",
			"Chào ban tổ chức, công ty chúng tôi quan tâm đến gói tài trợ hạng Vàng. Vui lòng gửi hồ sơ chi tiết. Xin cảm ơn."},
		{"Trần Văn Khoa", "khoa.tran@example.com", "Đăng ký gian hàng triển lãm",
			"Chúng tôi muốn đăng ký một gian hàng 18m² tại khu công nghệ vận hành. Xin cho biết chi phí và thời hạn đăng ký."},
		{"Lê Minh Châu", "chau.le@example.com", "Vé sinh viên",
			"Em là sinh viên năm cuối ngành Quản trị khách sạn, cho em hỏi chương trình học bổng tham dự còn nhận hồ sơ không ạ?"},
	}
	for _, c := range sample {
		if _, err := d.Exec(ctx, `
			INSERT INTO contacts (name, email, phone, subject, message, is_read)
			VALUES ($1,$2,'',$3,$4,FALSE)`, c.name, c.email, c.subject, c.msg); err != nil {
			return err
		}
	}
	return nil
}
