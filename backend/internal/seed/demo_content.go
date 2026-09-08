package seed

import (
	"context"
	"strconv"
	"time"

	"github.com/google/uuid"

	"github.com/vhdcorp/event-api/internal/db"
	"github.com/vhdcorp/event-api/internal/util"
)

type sessionSeed struct {
	start, end, title, desc, room, track, kind string
	speakers                                   []int // indexes into the seeded speaker list
}

func seedAgenda(ctx context.Context, d *db.DB, sp []uuid.UUID, year int) error {
	var count int64
	if err := d.QueryRow(ctx, `SELECT count(*) FROM agenda_days`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	ed := strconv.Itoa(year)
	days := []struct {
		label, title string
		date         time.Time
		sessions     []sessionSeed
	}{
		{
			label: "Ngày 1", title: "Khai mạc & Diễn đàn cấp cao",
			date: time.Date(year, 8, 20, 0, 0, 0, 0, time.UTC),
			sessions: []sessionSeed{
				{start: "08:00", end: "09:00", title: "Đón khách & Check-in", kind: "break", room: "Sảnh chính",
					desc: "Nhận thẻ tham dự, tài liệu chương trình và cà phê chào buổi sáng."},
				{start: "09:00", end: "09:30", title: "Lễ khai mạc VHD Summit " + ed, kind: "ceremony",
					room: "Grand Ballroom", track: "Toàn thể", speakers: []int{0},
					desc: "Phát biểu khai mạc và giới thiệu định hướng chương trình hai ngày."},
				{start: "09:30", end: "10:15", title: "Keynote: Ngành dịch vụ Việt Nam trong thập kỷ số", kind: "keynote",
					room: "Grand Ballroom", track: "Toàn thể", speakers: []int{0, 1},
					desc: "Bức tranh toàn cảnh về dịch chuyển hành vi du khách và những năng lực mới mà doanh nghiệp dịch vụ cần xây dựng."},
				{start: "10:15", end: "10:45", title: "Giải lao & Kết nối", kind: "break", room: "Khu triển lãm",
					desc: "Tham quan khu trưng bày công nghệ và gặp gỡ nhà cung cấp."},
				{start: "10:45", end: "11:45", title: "Toạ đàm: Cá nhân hoá trải nghiệm khách hàng bằng dữ liệu", kind: "panel",
					room: "Grand Ballroom", track: "Trải nghiệm", speakers: []int{1, 3, 8},
					desc: "Ba góc nhìn từ nền tảng đặt phòng, khối vận hành khu nghỉ dưỡng và đội ngũ dữ liệu về ranh giới giữa cá nhân hoá và quyền riêng tư."},
				{start: "11:45", end: "13:15", title: "Tiệc trưa networking", kind: "networking", room: "Ocean Hall",
					desc: "Bàn tiệc được xếp theo nhóm quan tâm đã đăng ký trước."},
				{start: "13:15", end: "14:15", title: "Workshop: Xây dựng bếp trung tâm cho chuỗi F&B", kind: "workshop",
					room: "Phòng A2", track: "Vận hành", speakers: []int{6},
					desc: "Hướng dẫn từng bước chuẩn hoá quy trình, tính điểm hoà vốn và lộ trình triển khai cho chuỗi từ 10 điểm bán."},
				{start: "13:15", end: "14:15", title: "Toạ đàm: Dòng vốn vào hạ tầng du lịch Đông Nam Á", kind: "panel",
					room: "Phòng B1", track: "Đầu tư", speakers: []int{5, 11},
					desc: "Khẩu vị nhà đầu tư năm " + ed + ", các mô hình định giá và những sai lầm thường gặp khi gọi vốn."},
				{start: "14:30", end: "15:30", title: "Chuyên đề: Định giá động cho khách sạn quy mô vừa", kind: "session",
					room: "Grand Ballroom", track: "Doanh thu", speakers: []int{11, 8},
					desc: "Cách triển khai định giá động khi chưa có đội ngũ dữ liệu chuyên trách."},
				{start: "15:30", end: "16:00", title: "Giải lao", kind: "break", room: "Khu triển lãm"},
				{start: "16:00", end: "17:00", title: "Chuyên đề: Kiến trúc API mở cho hệ sinh thái du lịch", kind: "session",
					room: "Phòng B1", track: "Công nghệ", speakers: []int{2},
					desc: "Bài học từ việc kết nối 2.000 đại lý lên một nền tảng phân phối duy nhất."},
				{start: "18:30", end: "21:00", title: "Gala Dinner & VHD Awards " + ed, kind: "networking",
					room: "Ariyana Beach Lawn", track: "Toàn thể",
					desc: "Đêm vinh danh các đơn vị dẫn đầu về đổi mới trải nghiệm khách hàng."},
			},
		},
		{
			label: "Ngày 2", title: "Chuyên đề & Kết nối giao thương",
			date: time.Date(year, 8, 21, 0, 0, 0, 0, time.UTC),
			sessions: []sessionSeed{
				{start: "08:30", end: "09:00", title: "Cà phê buổi sáng", kind: "break", room: "Sảnh chính"},
				{start: "09:00", end: "09:45", title: "Keynote: Du lịch bền vững — từ cam kết đến số liệu", kind: "keynote",
					room: "Grand Ballroom", track: "Bền vững", speakers: []int{7, 4},
					desc: "Khung báo cáo phát thải dành cho ngành lưu trú và cách bắt đầu khi chưa có dữ liệu nền."},
				{start: "09:45", end: "10:45", title: "Toạ đàm: Chuẩn lưu trú xanh tại Việt Nam", kind: "panel",
					room: "Grand Ballroom", track: "Bền vững", speakers: []int{4, 7, 10},
					desc: "Chi phí thực tế, thời gian hoàn vốn và phản hồi của du khách sau khi áp dụng bộ tiêu chuẩn xanh."},
				{start: "10:45", end: "11:15", title: "Giải lao", kind: "break", room: "Khu triển lãm"},
				{start: "11:15", end: "12:15", title: "Chuyên đề: Đưa homestay địa phương ra thị trường quốc tế", kind: "session",
					room: "Phòng A2", track: "Cộng đồng", speakers: []int{10},
					desc: "Mô hình hợp tác xã số giúp cơ sở nhỏ chia sẻ chi phí công nghệ và đào tạo."},
				{start: "11:15", end: "12:15", title: "Chuyên đề: Thiết kế dịch vụ theo service blueprint", kind: "workshop",
					room: "Phòng B1", track: "Trải nghiệm", speakers: []int{3},
					desc: "Thực hành lập bản đồ dịch vụ cho một hành trình lưu trú hoàn chỉnh."},
				{start: "12:15", end: "13:30", title: "Tiệc trưa", kind: "break", room: "Ocean Hall"},
				{start: "13:30", end: "16:00", title: "Business Matching — Kết nối giao thương 1-1", kind: "networking",
					room: "Khu B, Tầng 2", track: "Giao thương",
					desc: "Lịch hẹn 15 phút được ghép tự động theo nhu cầu mua – bán đã khai báo khi đăng ký."},
				{start: "13:30", end: "14:30", title: "Chuyên đề: Xúc tiến du lịch liên quốc gia trong ASEAN", kind: "session",
					room: "Grand Ballroom", track: "Marketing", speakers: []int{9},
					desc: "Bài học từ chiến dịch “One Region, Many Stories”."},
				{start: "16:15", end: "17:00", title: "Phiên tổng kết & Bế mạc", kind: "ceremony",
					room: "Grand Ballroom", track: "Toàn thể", speakers: []int{0, 1, 3},
					desc: "Tóm lược các cam kết hành động và công bố chủ đề VHD Summit `+strconv.Itoa(year+1)+`."},
			},
		},
	}

	for di, day := range days {
		var dayID uuid.UUID
		if err := d.QueryRow(ctx, `
			INSERT INTO agenda_days (label, title, date, sort_order)
			VALUES ($1,$2,$3,$4) RETURNING id`,
			day.label, day.title, day.date, di).Scan(&dayID); err != nil {
			return err
		}
		for si, s := range day.sessions {
			kind := s.kind
			if kind == "" {
				kind = "session"
			}
			var sesID uuid.UUID
			if err := d.QueryRow(ctx, `
				INSERT INTO agenda_sessions (day_id, title, description, start_time, end_time,
				                             room, track, type, is_published, sort_order)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,$9) RETURNING id`,
				dayID, s.title, s.desc, s.start, s.end, s.room, s.track, kind, si).Scan(&sesID); err != nil {
				return err
			}
			for _, idx := range s.speakers {
				if idx < len(sp) {
					if _, err := d.Exec(ctx, `
						INSERT INTO session_speakers (session_id, speaker_id) VALUES ($1,$2)
						ON CONFLICT DO NOTHING`, sesID, sp[idx]); err != nil {
						return err
					}
				}
			}
		}
	}
	return nil
}

func seedPosts(ctx context.Context, d *db.DB, sp []uuid.UUID, year int) error {
	var count int64
	if err := d.QueryRow(ctx, `SELECT count(*) FROM posts`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	type postSeed struct {
		title, excerpt, content, cover, category, author string
		tags                                             []string
		speakerIdx                                       int
		featured                                         bool
		daysAgo                                          int
	}

	ed := strconv.Itoa(year)
	posts := []postSeed{
		{
			title:    "VHD Summit " + ed + " chính thức mở cổng đăng ký",
			excerpt:  "Diễn đàn thường niên của ngành khách sạn – du lịch Việt Nam trở lại tại Đà Nẵng với quy mô lớn nhất từ trước tới nay.",
			cover:    img("photo-1540575467063-178a50c2df87", 1400),
			category: "announcement", author: "Ban tổ chức", featured: true, speakerIdx: -1, daysAgo: 2,
			tags: []string{"Thông báo", "Đăng ký"},
			content: `<p>Ban tổ chức VHD Summit chính thức mở cổng đăng ký tham dự kỳ ` + ed + `, diễn ra trong hai ngày <strong>20 và 21 tháng 8 năm ` + ed + `</strong> tại Ariyana Convention Centre, Đà Nẵng.</p>
<h2>Quy mô lớn nhất từ trước tới nay</h2>
<p>Kỳ ` + ed + ` dự kiến đón hơn 3.500 khách chuyên ngành đến từ 25 quốc gia và vùng lãnh thổ, cùng 120 đơn vị trưng bày trên diện tích 4.000m². Chương trình gồm 2 phiên toàn thể, 12 toạ đàm chuyên đề và chuỗi hoạt động kết nối giao thương được ghép lịch tự động.</p>
<h2>Ba trục nội dung chính</h2>
<p>So với các kỳ trước, nội dung năm nay được tổ chức quanh ba trục: vận hành thông minh, trải nghiệm khách hàng cá nhân hoá và phát triển bền vững. Mỗi trục có một phiên toàn thể mở đầu và các toạ đàm chuyên sâu đi kèm.</p>
<h2>Đăng ký tham dự</h2>
<p>Vé tham dự diễn đàn miễn phí cho khách chuyên ngành đã đăng ký trước. Khách đăng ký trước ngày 30/6/` + ed + ` sẽ được ưu tiên xếp lịch trong chương trình kết nối giao thương 1-1.</p>`,
		},
		{
			title:    "Bài phát biểu: Ngành dịch vụ Việt Nam trong thập kỷ số",
			excerpt:  "Toàn văn bài phát biểu khai mạc của ông Nguyễn Minh Quân về những năng lực mới mà doanh nghiệp dịch vụ cần xây dựng.",
			cover:    img("photo-1523580494863-6f3031224c94", 1400),
			category: "speech", author: "Nguyễn Minh Quân", featured: true, speakerIdx: 0, daysAgo: 5,
			tags: []string{"Bài phát biểu", "Chuyển đổi số"},
			content: `<p>Kính thưa quý vị đại biểu,</p>
<p>Mười năm qua, ngành dịch vụ Việt Nam đã đi qua một chặng đường mà ít ai hình dung được vào năm 2016. Chúng ta đã chứng kiến sự dịch chuyển của toàn bộ kênh phân phối, sự thay đổi trong kỳ vọng của du khách, và gần đây nhất là áp lực phải chứng minh cam kết bền vững bằng số liệu chứ không chỉ bằng lời nói.</p>
<h2>Ba năng lực bắt buộc</h2>
<p>Từ thực tiễn điều hành 34 cơ sở trên toàn quốc, tôi cho rằng có ba năng lực mà mọi doanh nghiệp dịch vụ đều phải xây dựng, bất kể quy mô.</p>
<p><strong>Thứ nhất là năng lực đọc dữ liệu của chính mình.</strong> Rất nhiều đơn vị đang ngồi trên một kho dữ liệu đặt phòng, phản hồi khách hàng và vận hành mà chưa từng đặt câu hỏi đúng với nó. Không cần một đội ngũ khoa học dữ liệu để bắt đầu — chỉ cần một người biết đặt câu hỏi.</p>
<p><strong>Thứ hai là năng lực chuẩn hoá quy trình.</strong> Công nghệ chỉ khuếch đại quy trình sẵn có. Một quy trình lộn xộn khi số hoá sẽ trở thành một quy trình lộn xộn chạy nhanh hơn.</p>
<p><strong>Thứ ba là năng lực đo lường tác động môi trường.</strong> Trong ba năm tới, đây sẽ chuyển từ lợi thế cạnh tranh thành điều kiện tối thiểu để tiếp cận các thị trường nguồn lớn.</p>
<h2>Lời kết</h2>
<p>Diễn đàn hai ngày này không nhằm đưa ra câu trả lời cuối cùng. Nó tồn tại để chúng ta trao đổi những gì đã thử, đã sai và đã học được. Xin cảm ơn quý vị.</p>`,
		},
		{
			title:    "Công bố danh sách 12 diễn giả đầu tiên",
			excerpt:  "Danh sách gồm lãnh đạo tập đoàn khách sạn, chuyên gia công nghệ và nhà đầu tư đến từ 6 quốc gia.",
			cover:    img("photo-1531058020387-3be344556be6", 1400),
			category: "news", author: "Ban tổ chức", speakerIdx: -1, daysAgo: 9,
			tags: []string{"Diễn giả"},
			content: `<p>Ban tổ chức công bố danh sách 12 diễn giả đầu tiên của VHD Summit ` + ed + `, đến từ Việt Nam, Singapore, Nhật Bản, Hàn Quốc, Đức, Malaysia và Úc.</p>
<h2>Đa dạng góc nhìn</h2>
<p>Danh sách năm nay được xây dựng theo nguyên tắc cân bằng giữa ba nhóm: người trực tiếp vận hành, người xây dựng công nghệ và người phân bổ vốn. Cách tiếp cận này nhằm bảo đảm mỗi chủ đề đều được nhìn từ cả góc thực thi lẫn góc chiến lược.</p>
<h2>Còn tiếp tục cập nhật</h2>
<p>Danh sách đầy đủ dự kiến gồm hơn 60 diễn giả và sẽ được công bố theo từng đợt cho đến tháng 7/` + ed + `.</p>`,
		},
		{
			title:    "Chuẩn lưu trú xanh: chi phí thật và thời gian hoàn vốn",
			excerpt:  "Sau 180 cơ sở áp dụng, GreenStay Vietnam công bố số liệu thực tế về chi phí đầu tư và mức tiết kiệm đạt được.",
			cover:    img("photo-1517457373958-b7bdd4587205", 1400),
			category: "news", author: "Lê Thị Phương Anh", speakerIdx: 4, daysAgo: 14,
			tags: []string{"Bền vững", "ESG"},
			content: `<p>Câu hỏi thường gặp nhất khi tư vấn chuyển đổi xanh không phải là “có nên làm không”, mà là “bao lâu thì hoàn vốn”. Sau ba năm triển khai tại 180 cơ sở, chúng tôi đã có đủ số liệu để trả lời.</p>
<h2>Chi phí đầu tư ban đầu</h2>
<p>Với một khách sạn 60 phòng, chi phí trung bình để đạt mức chứng nhận cơ bản là 380–520 triệu đồng, phần lớn nằm ở hệ thống nước nóng, thiết bị chiếu sáng và cải tạo hệ thống xử lý rác thải.</p>
<h2>Mức tiết kiệm đo được</h2>
<p>Trung bình các cơ sở giảm được 34% lượng nước và 22% điện năng tiêu thụ trên mỗi đêm phòng. Với công suất phòng 65%, thời gian hoàn vốn nằm trong khoảng 22–31 tháng.</p>
<h2>Phần khó định lượng</h2>
<p>Ngoài tiết kiệm trực tiếp, các cơ sở ghi nhận tỷ lệ đặt phòng từ thị trường châu Âu tăng đáng kể sau khi có chứng nhận. Đây là phần chúng tôi chưa đưa vào tính toán hoàn vốn vì còn phụ thuộc nhiều biến số khác.</p>`,
		},
		{
			title:    "Khu trưng bày công nghệ " + ed + " mở rộng lên 4.000m²",
			excerpt:  "120 đơn vị trưng bày với bốn khu chức năng: vận hành, thanh toán, trải nghiệm khách và thiết bị.",
			cover:    img("photo-1591115765373-5207764f72e7", 1400),
			category: "news", author: "Ban tổ chức", speakerIdx: -1, daysAgo: 18,
			tags: []string{"Triển lãm"},
			content: `<p>Khu trưng bày của VHD Summit ` + ed + ` mở rộng lên 4.000m², tăng 60% so với kỳ trước, với 120 đơn vị tham gia.</p>
<h2>Bốn khu chức năng</h2>
<p>Không gian được chia thành bốn khu để khách tham quan dễ định hướng: giải pháp vận hành, hạ tầng thanh toán, công nghệ trải nghiệm khách và thiết bị – nội thất.</p>
<h2>Lịch demo cố định</h2>
<p>Mỗi khu có một sân khấu nhỏ với lịch demo cố định 30 phút một lượt, công bố trước trên ứng dụng sự kiện để khách chủ động sắp xếp.</p>`,
		},
		{
			title:    "Bài phát biểu: Cá nhân hoá mà không đánh đổi quyền riêng tư",
			excerpt:  "Sarah Chen chia sẻ cách Booking Technologies cân bằng giữa gợi ý cá nhân hoá và giới hạn thu thập dữ liệu.",
			cover:    img("photo-1505373877841-8d25f7d46678", 1400),
			category: "speech", author: "Sarah Chen", speakerIdx: 1, daysAgo: 24,
			tags: []string{"Bài phát biểu", "Dữ liệu"},
			content: `<p>Khi chúng tôi bắt đầu xây dựng hệ thống gợi ý cá nhân hoá vào năm 2019, giả định ngầm là càng nhiều dữ liệu thì gợi ý càng tốt. Năm năm sau, chúng tôi biết giả định đó sai.</p>
<h2>Điểm bão hoà của dữ liệu</h2>
<p>Trên tập dữ liệu thực tế của chúng tôi, chất lượng gợi ý đạt gần mức tối đa chỉ với ba nhóm tín hiệu: lịch sử tìm kiếm trong phiên, khoảng giá đã xem và loại hình lưu trú đã đặt trước đó. Việc bổ sung thêm hàng chục tín hiệu khác cải thiện chưa tới 2%.</p>
<h2>Thiết kế lại từ giới hạn</h2>
<p>Phát hiện này cho phép chúng tôi làm điều ngược với thông lệ ngành: chủ động thu hẹp phạm vi dữ liệu thu thập. Hệ thống hiện tại không lưu hồ sơ hành vi dài hạn cho người dùng chưa đăng nhập.</p>
<h2>Kết quả</h2>
<p>Tỷ lệ chuyển đổi không giảm. Điều thay đổi rõ rệt là chi phí hạ tầng và mức độ phức tạp khi tuân thủ quy định ở từng thị trường.</p>`,
		},
		{
			title:    "Chương trình kết nối giao thương 1-1 trở lại với thuật toán ghép mới",
			excerpt:  "Hệ thống ghép lịch hẹn dựa trên nhu cầu mua – bán khai báo khi đăng ký, thay cho cách đăng ký thủ công trước đây.",
			cover:    img("photo-1560439514-4e9645039924", 1400),
			category: "news", author: "Ban tổ chức", speakerIdx: -1, daysAgo: 30,
			tags: []string{"Giao thương"},
			content: `<p>Chương trình Business Matching năm nay chuyển sang mô hình ghép lịch tự động dựa trên nhu cầu khai báo, thay vì để hai bên tự tìm nhau như các kỳ trước.</p>
<h2>Cách hoạt động</h2>
<p>Khi đăng ký, mỗi khách chọn nhóm sản phẩm – dịch vụ quan tâm và vai trò của mình trong giao dịch. Hệ thống sẽ đề xuất lịch hẹn 15 phút vào chiều ngày thứ hai của sự kiện.</p>
<h2>Vì sao thay đổi</h2>
<p>Khảo sát sau kỳ ` + strconv.Itoa(year-1) + ` cho thấy 41% khách không đặt được cuộc hẹn nào vì không biết bắt đầu từ đâu. Mô hình mới nhằm giải quyết đúng vấn đề đó.</p>`,
		},
		{
			title:    "Thông cáo báo chí: VHD Summit " + ed + " công bố nhà tài trợ Kim cương",
			excerpt:  "Ba đơn vị đồng hành ở hạng Kim cương cùng cam kết tài trợ chương trình học bổng tham dự cho 200 sinh viên ngành du lịch.",
			cover:    img("photo-1515187029135-18ee286d815b", 1400),
			category: "press", author: "Ban truyền thông", speakerIdx: -1, daysAgo: 36,
			tags: []string{"Thông cáo", "Tài trợ"},
			content: `<p><em>Đà Nẵng, tháng 7/` + ed + `</em> — Ban tổ chức VHD Summit ` + ed + ` công bố ba đơn vị đồng hành ở hạng Kim cương của kỳ diễn đàn năm nay.</p>
<h2>Học bổng tham dự cho sinh viên</h2>
<p>Cùng với gói tài trợ, ba đơn vị cam kết đóng góp cho chương trình học bổng tham dự dành cho 200 sinh viên năm cuối các ngành du lịch, khách sạn và công nghệ tại khu vực miền Trung.</p>
<h2>Đăng ký học bổng</h2>
<p>Sinh viên quan tâm có thể đăng ký qua cổng đăng ký chung, chọn loại vé “Sinh viên” và đính kèm thẻ sinh viên còn hiệu lực.</p>
<hr />
<p><strong>Liên hệ báo chí:</strong> press@vhdsummit.com — +84 236 3968 888</p>`,
		},
		{
			title:    "Định giá động cho khách sạn vừa và nhỏ: bắt đầu từ đâu",
			excerpt:  "Không cần đội ngũ dữ liệu chuyên trách — bài viết phác thảo lộ trình ba bước áp dụng được ngay.",
			cover:    img("photo-1524178232363-1fb2b075b655", 1400),
			category: "news", author: "Vũ Ngọc Bảo", speakerIdx: 8, daysAgo: 42,
			tags: []string{"Doanh thu", "Dữ liệu"},
			content: `<p>Định giá động thường bị hiểu là thứ chỉ dành cho chuỗi lớn có đội ngũ phân tích riêng. Trên thực tế, phần lớn giá trị nằm ở ba bước đầu tiên, và cả ba đều làm được bằng bảng tính.</p>
<h2>Bước 1: Phân loại ngày</h2>
<p>Chia lịch năm thành bốn nhóm ngày theo mức nhu cầu lịch sử. Chỉ riêng việc đặt bốn mức giá thay vì một đã đóng góp phần lớn mức cải thiện doanh thu.</p>
<h2>Bước 2: Đặt ngưỡng lấp đầy</h2>
<p>Với mỗi nhóm ngày, xác định mốc lấp đầy tại thời điểm 14 ngày và 7 ngày trước ngày ở. Dưới ngưỡng thì giảm giá, trên ngưỡng thì tăng.</p>
<h2>Bước 3: Ghi lại mọi lần điều chỉnh</h2>
<p>Đây là bước hay bị bỏ qua nhất và cũng là bước quyết định. Không có nhật ký điều chỉnh thì sang năm sau sẽ không có dữ liệu để cải thiện quy tắc.</p>`,
		},
	}

	for _, p := range posts {
		var speakerID *uuid.UUID
		if p.speakerIdx >= 0 && p.speakerIdx < len(sp) {
			id := sp[p.speakerIdx]
			speakerID = &id
		}
		publishedAt := time.Now().AddDate(0, 0, -p.daysAgo)
		if _, err := d.Exec(ctx, `
			INSERT INTO posts (slug, title, excerpt, content, cover, category, tags,
			                   author_name, speaker_id, is_published, featured, views, published_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE,$10,$11,$12)`,
			util.Slugify(p.title), p.title, p.excerpt, p.content, p.cover, p.category,
			p.tags, p.author, speakerID, p.featured, 120+p.daysAgo*17, publishedAt); err != nil {
			return err
		}
	}
	return nil
}
