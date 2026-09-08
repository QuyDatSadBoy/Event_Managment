package seed

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/google/uuid"

	"github.com/vhdcorp/event-api/internal/db"
	"github.com/vhdcorp/event-api/internal/util"
)

const unsplash = "https://images.unsplash.com/"

func img(id string, w int) string {
	return fmt.Sprintf("%s%s?auto=format&fit=crop&w=%d&q=80", unsplash, id, w)
}

func portrait(id string) string {
	return fmt.Sprintf("%s%s?auto=format&fit=crop&w=600&h=600&q=80", unsplash, id)
}

// Demo fills an empty database with a complete, presentable event so the site
// looks finished the moment it is deployed. Existing rows are left alone.
func Demo(ctx context.Context, d *db.DB) error {
	year := editionYear()
	if err := seedSettings(ctx, d); err != nil {
		return fmt.Errorf("settings: %w", err)
	}
	speakerIDs, err := seedSpeakers(ctx, d)
	if err != nil {
		return fmt.Errorf("speakers: %w", err)
	}
	if err := seedAgenda(ctx, d, speakerIDs, year); err != nil {
		return fmt.Errorf("agenda: %w", err)
	}
	if err := seedPosts(ctx, d, speakerIDs, year); err != nil {
		return fmt.Errorf("posts: %w", err)
	}
	if err := seedGallery(ctx, d); err != nil {
		return fmt.Errorf("gallery: %w", err)
	}
	if err := seedPartners(ctx, d); err != nil {
		return fmt.Errorf("partners: %w", err)
	}
	if err := seedRegistrations(ctx, d); err != nil {
		return fmt.Errorf("registrations: %w", err)
	}
	return nil
}

var ict = time.FixedZone("ICT", 7*3600)

// editionYear picks the next 20–21 August that has not happened yet, so the demo
// always reads as an upcoming event no matter when it is seeded.
func editionYear() int {
	now := time.Now().In(ict)
	year := now.Year()
	if time.Date(year, 8, 20, 8, 0, 0, 0, ict).Before(now) {
		year++
	}
	return year
}

func seedSettings(ctx context.Context, d *db.DB) error {
	year := editionYear()
	start := time.Date(year, 8, 20, 8, 0, 0, 0, ict)
	end := time.Date(year, 8, 21, 17, 30, 0, 0, ict)
	edition := strconv.Itoa(year)

	socials := map[string]any{
		"facebook":  "https://facebook.com/vhdsummit",
		"linkedin":  "https://linkedin.com/company/vhdcorp",
		"youtube":   "https://youtube.com/@vhdsummit",
		"instagram": "https://instagram.com/vhdsummit",
	}
	stats := []map[string]any{
		{"value": 3500, "suffix": "+", "label": "Khách tham dự", "icon": "users"},
		{"value": 60, "suffix": "+", "label": "Diễn giả quốc tế", "icon": "mic"},
		{"value": 120, "suffix": "+", "label": "Đơn vị trưng bày", "icon": "building"},
		{"value": 25, "suffix": "", "label": "Quốc gia & vùng lãnh thổ", "icon": "globe"},
	}
	highlights := []map[string]any{
		{
			"icon":        "presentation",
			"title":       "Diễn đàn cấp cao",
			"description": "Hai ngày toạ đàm cùng lãnh đạo ngành khách sạn, du lịch và công nghệ khu vực Đông Nam Á.",
		},
		{
			"icon":        "handshake",
			"title":       "Kết nối giao thương",
			"description": "Lịch hẹn 1-1 được ghép tự động giữa nhà cung cấp và người mua theo nhu cầu thực tế.",
		},
		{
			"icon":        "sparkles",
			"title":       "Khu trưng bày công nghệ",
			"description": "Trải nghiệm trực tiếp giải pháp vận hành, thanh toán và tự động hoá cho ngành dịch vụ.",
		},
		{
			"icon":        "award",
			"title":       "Vinh danh VHD Awards",
			"description": "Tôn vinh những đơn vị dẫn đầu về đổi mới trải nghiệm khách hàng trong năm.",
		},
	}
	slides := []map[string]any{
		{"image": img("photo-1540575467063-178a50c2df87", 1920), "caption": "Phiên toàn thể VHD Summit " + strconv.Itoa(year-1)},
		{"image": img("photo-1531058020387-3be344556be6", 1920), "caption": "Khu vực triển lãm công nghệ"},
		{"image": img("photo-1560439514-4e9645039924", 1920), "caption": "Đêm gala kết nối đối tác"},
		{"image": img("photo-1523580494863-6f3031224c94", 1920), "caption": "Toạ đàm chuyên đề"},
	}

	about := `<p><strong>VHD Summit ` + edition + `</strong> là diễn đàn thường niên quy tụ cộng đồng khách sạn, nhà hàng, du lịch và công nghệ dịch vụ tại Việt Nam cùng khu vực. Sau bốn kỳ tổ chức, sự kiện đã trở thành điểm hẹn của hơn 12.000 lượt khách chuyên ngành.</p>
<p>Kỳ ` + edition + ` mở rộng sang ba trục nội dung: <em>vận hành thông minh</em>, <em>trải nghiệm khách hàng cá nhân hoá</em> và <em>phát triển bền vững</em>. Chương trình gồm 2 phiên toàn thể, 12 toạ đàm chuyên đề, khu trưng bày 4.000m² và chuỗi hoạt động kết nối giao thương được ghép lịch tự động.</p>
<p>Sự kiện được tổ chức tại Ariyana Convention Centre — trung tâm hội nghị lớn nhất miền Trung, nơi từng đăng cai Tuần lễ Cấp cao APEC.</p>`

	_, err := d.Exec(ctx, `
		UPDATE settings SET
			event_name = $1, event_tagline = $2, event_description = $3,
			hero_title = $4, hero_subtitle = $5, hero_image = $6,
			start_date = $7, end_date = $8,
			venue_name = $9, venue_address = $10, venue_map_url = $11,
			contact_email = $12, contact_phone = $13, contact_address = $14,
			about_title = $15, about_content = $16, about_image = $17,
			socials = $18, stats = $19, highlights = $20, hero_slides = $21,
			seo_title = $22, seo_description = $23, registration_open = TRUE, updated_at = now()
		WHERE id = 1`,
		"VHD Summit "+edition,
		"Vietnam Hospitality & Digital Forum",
		"Diễn đàn công nghệ, đổi mới và giao thương cho ngành khách sạn – du lịch Việt Nam.",
		"Kiến tạo tương lai ngành dịch vụ Việt Nam",
		"Hai ngày hội tụ lãnh đạo ngành khách sạn, du lịch và công nghệ — Đà Nẵng, 20–21.08."+edition,
		img("photo-1540575467063-178a50c2df87", 1920),
		start, end,
		"Ariyana Convention Centre",
		"107 Võ Nguyên Giáp, Ngũ Hành Sơn, Đà Nẵng",
		"https://www.google.com/maps?q=Ariyana+Convention+Centre+Da+Nang&output=embed",
		"info@vhdsummit.com", "+84 236 3968 888",
		"Tầng 12, Toà nhà VHD, 107 Võ Nguyên Giáp, Đà Nẵng",
		"Về VHD Summit "+edition, about, img("photo-1517457373958-b7bdd4587205", 1400),
		socials, stats, highlights, slides,
		"VHD Summit "+edition+" — Vietnam Hospitality & Digital Forum",
		"Diễn đàn công nghệ và giao thương ngành khách sạn – du lịch, 20–21.08."+edition+" tại Đà Nẵng. Đăng ký tham dự miễn phí.",
	)
	return err
}

type speakerSeed struct {
	name, title, company, country, photo, shortBio, bio string
	topics                                              []string
	featured                                            bool
	socials                                             map[string]any
}

func seedSpeakers(ctx context.Context, d *db.DB) ([]uuid.UUID, error) {
	var count int64
	if err := d.QueryRow(ctx, `SELECT count(*) FROM speakers`).Scan(&count); err != nil {
		return nil, err
	}
	if count > 0 {
		return existingSpeakerIDs(ctx, d)
	}

	people := []speakerSeed{
		{
			name: "Nguyễn Minh Quân", title: "Tổng Giám đốc", company: "Vietnam Hospitality Group",
			country: "Việt Nam", photo: portrait("photo-1560250097-0b93528c311a"),
			shortBio: "20 năm điều hành chuỗi khách sạn 4–5 sao tại Việt Nam và Đông Nam Á.",
			bio: `<p>Ông Nguyễn Minh Quân có hơn 20 năm kinh nghiệm điều hành trong ngành khách sạn, từng giữ vị trí quản lý cấp cao tại các tập đoàn quốc tế trước khi dẫn dắt Vietnam Hospitality Group.</p>
<p>Dưới sự điều hành của ông, tập đoàn đã mở rộng từ 6 lên 34 cơ sở trên toàn quốc, đồng thời triển khai nền tảng vận hành số hoá dùng chung giúp giảm 28% chi phí quản trị.</p>
<p>Ông là thành viên Hội đồng tư vấn Du lịch Quốc gia và thường xuyên tham gia hoạch định chính sách phát triển du lịch bền vững.</p>`,
			topics: []string{"Chiến lược vận hành", "Chuyển đổi số", "Phát triển bền vững"}, featured: true,
			socials: map[string]any{"linkedin": "https://linkedin.com/in/example", "twitter": "https://x.com/example"},
		},
		{
			name: "Sarah Chen", title: "VP of Product", company: "Booking Technologies APAC",
			country: "Singapore", photo: portrait("photo-1573496359142-b8d87734a5a2"),
			shortBio: "Dẫn dắt sản phẩm đặt phòng phục vụ hơn 40 triệu người dùng khu vực châu Á.",
			bio: `<p>Sarah Chen phụ trách toàn bộ dòng sản phẩm đặt phòng của Booking Technologies tại khu vực châu Á – Thái Bình Dương, phục vụ hơn 40 triệu người dùng hoạt động hằng tháng.</p>
<p>Bà tập trung vào cá nhân hoá trải nghiệm đặt phòng bằng dữ liệu hành vi, và là người khởi xướng chương trình “Local First” giúp các cơ sở lưu trú nhỏ tiếp cận khách quốc tế.</p>`,
			topics: []string{"Sản phẩm số", "Cá nhân hoá trải nghiệm", "Dữ liệu khách hàng"}, featured: true,
			socials: map[string]any{"linkedin": "https://linkedin.com/in/example"},
		},
		{
			name: "Trần Hải Đăng", title: "Giám đốc Công nghệ", company: "Mekong Travel Tech",
			country: "Việt Nam", photo: portrait("photo-1519085360753-af0119f7cbe7"),
			shortBio: "Kiến trúc sư nền tảng đặt tour phục vụ 2.000 đại lý du lịch.",
			bio: `<p>Ông Trần Hải Đăng xây dựng và vận hành nền tảng phân phối tour trực tuyến lớn nhất khu vực Đồng bằng sông Cửu Long, kết nối hơn 2.000 đại lý và nhà cung cấp dịch vụ.</p>
<p>Ông tập trung vào kiến trúc hệ thống chịu tải cao và bài toán đồng bộ tồn kho theo thời gian thực giữa nhiều kênh bán.</p>`,
			topics: []string{"Kiến trúc hệ thống", "API mở", "Tự động hoá"}, featured: true,
			socials: map[string]any{"linkedin": "https://linkedin.com/in/example"},
		},
		{
			name: "Emily Nakamura", title: "Head of Guest Experience", company: "Pacific Resorts International",
			country: "Nhật Bản", photo: portrait("photo-1580489944761-15a19d654956"),
			shortBio: "Thiết kế hành trình khách hàng cho 60 khu nghỉ dưỡng tại 9 quốc gia.",
			bio: `<p>Emily Nakamura phụ trách thiết kế trải nghiệm khách hàng cho toàn bộ hệ thống 60 khu nghỉ dưỡng của Pacific Resorts International.</p>
<p>Bà nổi tiếng với phương pháp “service blueprint” áp dụng cho ngành nghỉ dưỡng, giúp nâng chỉ số hài lòng khách hàng trung bình từ 8,1 lên 9,3 điểm trong ba năm.</p>`,
			topics: []string{"Trải nghiệm khách hàng", "Thiết kế dịch vụ", "Đào tạo nhân sự"}, featured: true,
			socials: map[string]any{"linkedin": "https://linkedin.com/in/example"},
		},
		{
			name: "Lê Thị Phương Anh", title: "Đồng sáng lập", company: "GreenStay Vietnam",
			country: "Việt Nam", photo: portrait("photo-1494790108377-be9c29b29330"),
			shortBio: "Xây dựng bộ tiêu chuẩn lưu trú xanh đầu tiên áp dụng tại Việt Nam.",
			bio: `<p>Bà Lê Thị Phương Anh đồng sáng lập GreenStay Vietnam, tổ chức phát triển bộ tiêu chuẩn lưu trú bền vững dành riêng cho điều kiện Việt Nam.</p>
<p>Bộ tiêu chuẩn hiện được áp dụng tại hơn 180 cơ sở, giúp giảm trung bình 34% lượng nước và 22% điện năng tiêu thụ trên mỗi đêm phòng.</p>`,
			topics:  []string{"Du lịch bền vững", "ESG", "Vận hành xanh"},
			socials: map[string]any{"linkedin": "https://linkedin.com/in/example"},
		},
		{
			name: "David Park", title: "Managing Director", company: "Asia Investment Partners",
			country: "Hàn Quốc", photo: portrait("photo-1507003211169-0a1dd7228f2d"),
			shortBio: "Điều phối hơn 1,2 tỷ USD vốn đầu tư vào hạ tầng du lịch Đông Nam Á.",
			bio: `<p>David Park dẫn dắt hoạt động đầu tư của Asia Investment Partners tại thị trường Đông Nam Á, với danh mục tập trung vào hạ tầng lưu trú và nền tảng công nghệ du lịch.</p>
<p>Ông đã trực tiếp tham gia hơn 40 thương vụ, tổng giá trị vượt 1,2 tỷ USD trong giai đoạn 2015–2025.</p>`,
			topics:  []string{"Đầu tư", "M&A", "Định giá doanh nghiệp"},
			socials: map[string]any{"linkedin": "https://linkedin.com/in/example"},
		},
		{
			name: "Phạm Quốc Huy", title: "Giám đốc Vận hành", company: "Saigon Culinary Collective",
			country: "Việt Nam", photo: portrait("photo-1500648767791-00dcc994a43e"),
			shortBio: "Vận hành chuỗi 45 nhà hàng, chuyên gia tối ưu chi phí bếp trung tâm.",
			bio: `<p>Ông Phạm Quốc Huy điều hành chuỗi 45 nhà hàng thuộc Saigon Culinary Collective, phụ trách chuẩn hoá quy trình bếp trung tâm và chuỗi cung ứng.</p>
<p>Mô hình bếp trung tâm do ông thiết kế giúp rút ngắn thời gian phục vụ trung bình 40% và giảm 18% hao hụt nguyên liệu.</p>`,
			topics:  []string{"F&B", "Chuỗi cung ứng", "Tối ưu chi phí"},
			socials: map[string]any{"linkedin": "https://linkedin.com/in/example"},
		},
		{
			name: "Anna Müller", title: "Sustainability Director", company: "European Hotel Alliance",
			country: "Đức", photo: portrait("photo-1438761681033-6461ffad8d80"),
			shortBio: "Chuyên gia chứng nhận bền vững cho hơn 900 khách sạn tại châu Âu.",
			bio: `<p>Anna Müller phụ trách chương trình chứng nhận bền vững của European Hotel Alliance, hiện áp dụng tại hơn 900 khách sạn thành viên.</p>
<p>Bà là đồng tác giả khung báo cáo phát thải dành riêng cho ngành lưu trú, được nhiều thị trường châu Á tham chiếu.</p>`,
			topics:  []string{"Phát thải carbon", "Chứng nhận quốc tế", "Báo cáo ESG"},
			socials: map[string]any{"linkedin": "https://linkedin.com/in/example"},
		},
		{
			name: "Vũ Ngọc Bảo", title: "Trưởng bộ phận Dữ liệu", company: "VHD Corp",
			country: "Việt Nam", photo: portrait("photo-1506794778202-cad84cf45f1d"),
			shortBio: "Xây dựng hệ thống dự báo nhu cầu phòng theo thời gian thực.",
			bio: `<p>Ông Vũ Ngọc Bảo dẫn dắt đội ngũ dữ liệu tại VHD Corp, xây dựng hệ thống dự báo nhu cầu và định giá động cho các đối tác lưu trú.</p>
<p>Hệ thống hiện xử lý hơn 300 triệu điểm dữ liệu mỗi ngày, giúp đối tác cải thiện trung bình 12% doanh thu trên mỗi phòng khả dụng.</p>`,
			topics:  []string{"Định giá động", "Machine Learning", "Dự báo nhu cầu"},
			socials: map[string]any{"linkedin": "https://linkedin.com/in/example"},
		},
		{
			name: "Michelle Tan", title: "Regional Marketing Lead", company: "Southeast Asia Tourism Board",
			country: "Malaysia", photo: portrait("photo-1544005313-94ddf0286df2"),
			shortBio: "Điều phối các chiến dịch xúc tiến du lịch liên quốc gia trong ASEAN.",
			bio: `<p>Michelle Tan điều phối các chiến dịch xúc tiến du lịch liên quốc gia trong khối ASEAN, tập trung vào thị trường nguồn Đông Bắc Á và châu Âu.</p>
<p>Bà chủ trì chiến dịch “One Region, Many Stories” thu hút hơn 400 triệu lượt tiếp cận trong năm đầu triển khai.</p>`,
			topics:  []string{"Xúc tiến du lịch", "Marketing số", "Truyền thông thương hiệu"},
			socials: map[string]any{"linkedin": "https://linkedin.com/in/example"},
		},
		{
			name: "Hoàng Anh Tuấn", title: "Sáng lập", company: "Homestay Network Vietnam",
			country: "Việt Nam", photo: portrait("photo-1472099645785-5658abf4ff4e"),
			shortBio: "Kết nối hơn 5.000 homestay địa phương lên nền tảng phân phối chung.",
			bio: `<p>Ông Hoàng Anh Tuấn sáng lập Homestay Network Vietnam, mạng lưới hỗ trợ hơn 5.000 cơ sở lưu trú quy mô nhỏ tiếp cận kênh phân phối quốc tế.</p>
<p>Mô hình hợp tác xã số do ông thiết kế giúp các chủ homestay chia sẻ chi phí công nghệ và đào tạo vận hành.</p>`,
			topics:  []string{"Du lịch cộng đồng", "Kinh tế chia sẻ", "Chuyển đổi số SME"},
			socials: map[string]any{"linkedin": "https://linkedin.com/in/example"},
		},
		{
			name: "Laura Bennett", title: "Chief Revenue Officer", company: "Horizon Hotels Group",
			country: "Úc", photo: portrait("photo-1487412720507-e7ab37603c6f"),
			shortBio: "Chuyên gia quản trị doanh thu cho danh mục 120 khách sạn.",
			bio: `<p>Laura Bennett phụ trách quản trị doanh thu toàn hệ thống 120 khách sạn của Horizon Hotels Group tại châu Á – Thái Bình Dương.</p>
<p>Bà tiên phong áp dụng mô hình định giá theo phân khúc nhu cầu, nâng chỉ số RevPAR toàn hệ thống thêm 19% sau hai năm.</p>`,
			topics:  []string{"Revenue Management", "Phân khúc thị trường", "Kênh phân phối"},
			socials: map[string]any{"linkedin": "https://linkedin.com/in/example"},
		},
	}

	ids := make([]uuid.UUID, 0, len(people))
	for i, p := range people {
		var id uuid.UUID
		err := d.QueryRow(ctx, `
			INSERT INTO speakers (slug, name, title, company, country, photo, bio, short_bio,
			                      topics, socials, featured, is_published, sort_order)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,TRUE,$12) RETURNING id`,
			util.Slugify(p.name), p.name, p.title, p.company, p.country, p.photo, p.bio,
			p.shortBio, p.topics, p.socials, p.featured, i,
		).Scan(&id)
		if err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

func existingSpeakerIDs(ctx context.Context, d *db.DB) ([]uuid.UUID, error) {
	rows, err := d.Query(ctx, `SELECT id FROM speakers ORDER BY sort_order LIMIT 20`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ids := []uuid.UUID{}
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err == nil {
			ids = append(ids, id)
		}
	}
	return ids, nil
}
