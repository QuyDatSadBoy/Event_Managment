package handlers

import (
	"encoding/csv"
	"net/http"
	"strings"
	"time"

	"github.com/vhdcorp/event-api/internal/models"
	"github.com/vhdcorp/event-api/internal/util"
)

const regCols = `id, code, full_name, email, phone, company, job_title, country,
	ticket_type, interests, note, status, created_at`

var (
	ticketTypes = []string{"visitor", "delegate", "exhibitor", "press", "vip"}
	regStatuses = []string{"pending", "confirmed", "cancelled", "checked_in"}
)

func scanRegistration(row interface{ Scan(...any) error }) (models.Registration, error) {
	var g models.Registration
	err := row.Scan(&g.ID, &g.Code, &g.FullName, &g.Email, &g.Phone, &g.Company,
		&g.JobTitle, &g.Country, &g.TicketType, &g.Interests, &g.Note, &g.Status, &g.CreatedAt)
	if g.Interests == nil {
		g.Interests = []string{}
	}
	return g, err
}

type registrationInput struct {
	FullName   string   `json:"full_name"`
	Email      string   `json:"email"`
	Phone      string   `json:"phone"`
	Company    string   `json:"company"`
	JobTitle   string   `json:"job_title"`
	Country    string   `json:"country"`
	TicketType string   `json:"ticket_type"`
	Interests  []string `json:"interests"`
	Note       string   `json:"note"`
	Website    string   `json:"website"` // honeypot: real people leave this empty
}

// CreateRegistration is the public sign-up endpoint behind the rate limiter.
func (h *Handler) CreateRegistration(w http.ResponseWriter, r *http.Request) {
	var in registrationInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	// Bots fill every field they see. Answer 201 so they do not learn anything.
	if strings.TrimSpace(in.Website) != "" {
		util.Created(w, util.Envelope{"code": "OK", "message": "Đăng ký thành công"})
		return
	}

	var open bool
	if err := h.DB.QueryRow(r.Context(),
		`SELECT registration_open FROM settings WHERE id = 1`).Scan(&open); err == nil && !open {
		util.Error(w, http.StatusForbidden, "Cổng đăng ký hiện đã đóng")
		return
	}

	in.FullName = strings.TrimSpace(in.FullName)
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	if in.TicketType == "" {
		in.TicketType = "visitor"
	}
	if in.Country == "" {
		in.Country = "Vietnam"
	}
	if in.Interests == nil {
		in.Interests = []string{}
	}

	v := util.NewValidator()
	v.Required("full_name", in.FullName, "Vui lòng nhập họ và tên")
	v.MaxLen("full_name", in.FullName, 150, "Họ tên quá dài")
	v.Required("email", in.Email, "Vui lòng nhập email")
	v.Email("email", in.Email, "Email không hợp lệ")
	v.Required("phone", in.Phone, "Vui lòng nhập số điện thoại")
	v.In("ticket_type", in.TicketType, ticketTypes, "Loại vé không hợp lệ")
	v.MaxLen("note", in.Note, 1000, "Ghi chú quá dài")
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Vui lòng kiểm tra lại thông tin", v.Errors)
		return
	}

	var dupe bool
	if err := h.DB.QueryRow(r.Context(),
		`SELECT EXISTS(SELECT 1 FROM registrations WHERE email = $1 AND status <> 'cancelled')`,
		in.Email).Scan(&dupe); err == nil && dupe {
		util.ErrorFields(w, http.StatusConflict, "Email này đã được đăng ký",
			map[string]string{"email": "Email này đã được đăng ký cho sự kiện"})
		return
	}

	code := util.RegistrationCode("EVT")
	reg, err := scanRegistration(h.DB.QueryRow(r.Context(), `
		INSERT INTO registrations (code, full_name, email, phone, company, job_title,
		                           country, ticket_type, interests, note)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING `+regCols,
		code, in.FullName, in.Email, in.Phone, in.Company, in.JobTitle,
		in.Country, in.TicketType, in.Interests, in.Note))
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	util.Created(w, reg)
}

func (h *Handler) ListRegistrations(w http.ResponseWriter, r *http.Request) {
	page, perPage, offset := util.Paginate(r, 20, 200)
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	status := strings.TrimSpace(r.URL.Query().Get("status"))
	ticket := strings.TrimSpace(r.URL.Query().Get("ticket_type"))

	where := []string{"TRUE"}
	args := []any{}
	if status != "" && status != "all" {
		args = append(args, status)
		where = append(where, "status = $"+itoa(len(args)))
	}
	if ticket != "" && ticket != "all" {
		args = append(args, ticket)
		where = append(where, "ticket_type = $"+itoa(len(args)))
	}
	if q != "" {
		args = append(args, "%"+strings.ToLower(q)+"%")
		n := itoa(len(args))
		where = append(where, "(lower(full_name) LIKE $"+n+" OR lower(email) LIKE $"+n+
			" OR lower(company) LIKE $"+n+" OR lower(code) LIKE $"+n+")")
	}
	cond := strings.Join(where, " AND ")

	var total int64
	if err := h.DB.QueryRow(r.Context(), `SELECT count(*) FROM registrations WHERE `+cond, args...).Scan(&total); err != nil {
		h.dbError(w, err, "")
		return
	}

	args = append(args, perPage, offset)
	rows, err := h.DB.Query(r.Context(),
		`SELECT `+regCols+` FROM registrations WHERE `+cond+
			` ORDER BY created_at DESC LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args)), args...)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	defer rows.Close()

	list := []models.Registration{}
	for rows.Next() {
		if g, err := scanRegistration(rows); err == nil {
			list = append(list, g)
		}
	}
	util.List(w, list, models.Meta{Page: page, PerPage: perPage, Total: total,
		TotalPages: util.TotalPages(total, perPage)})
}

type regStatusInput struct {
	Status string `json:"status"`
}

func (h *Handler) UpdateRegistrationStatus(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "id")
	if !ok {
		return
	}
	var in regStatusInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	v := util.NewValidator()
	v.Required("status", in.Status, "Vui lòng chọn trạng thái")
	v.In("status", in.Status, regStatuses, "Trạng thái không hợp lệ")
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Thông tin chưa hợp lệ", v.Errors)
		return
	}

	reg, err := scanRegistration(h.DB.QueryRow(r.Context(),
		`UPDATE registrations SET status=$1, updated_at=now() WHERE id=$2 RETURNING `+regCols,
		in.Status, id))
	if err != nil {
		h.dbError(w, err, "Không tìm thấy đăng ký")
		return
	}
	util.OK(w, reg)
}

func (h *Handler) DeleteRegistration(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "id")
	if !ok {
		return
	}
	tag, err := h.DB.Exec(r.Context(), `DELETE FROM registrations WHERE id = $1`, id)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	if tag.RowsAffected() == 0 {
		util.Error(w, http.StatusNotFound, "Không tìm thấy đăng ký")
		return
	}
	util.OK(w, util.Envelope{"message": "Đã xoá đăng ký"})
}

// ExportRegistrations streams the whole list as CSV for the admin download button.
func (h *Handler) ExportRegistrations(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(r.Context(), `SELECT `+regCols+` FROM registrations ORDER BY created_at DESC`)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	defer rows.Close()

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition",
		`attachment; filename="registrations-`+time.Now().Format("20060102-1504")+`.csv"`)
	// BOM so Excel opens Vietnamese names correctly.
	_, _ = w.Write([]byte{0xEF, 0xBB, 0xBF})

	cw := csv.NewWriter(w)
	defer cw.Flush()
	_ = cw.Write([]string{"Mã", "Họ tên", "Email", "Điện thoại", "Công ty", "Chức danh",
		"Quốc gia", "Loại vé", "Quan tâm", "Ghi chú", "Trạng thái", "Thời gian"})

	for rows.Next() {
		g, err := scanRegistration(rows)
		if err != nil {
			continue
		}
		_ = cw.Write([]string{g.Code, g.FullName, g.Email, g.Phone, g.Company, g.JobTitle,
			g.Country, g.TicketType, strings.Join(g.Interests, "; "), g.Note, g.Status,
			g.CreatedAt.Format("2006-01-02 15:04")})
	}
}
