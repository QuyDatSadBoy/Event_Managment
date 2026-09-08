package handlers

import (
	"net/http"
	"strings"

	"github.com/vhdcorp/event-api/internal/models"
	"github.com/vhdcorp/event-api/internal/util"
)

const contactCols = `id, name, email, phone, subject, message, is_read, created_at`

type contactInput struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Phone   string `json:"phone"`
	Subject string `json:"subject"`
	Message string `json:"message"`
	Website string `json:"website"` // honeypot
}

func (h *Handler) CreateContact(w http.ResponseWriter, r *http.Request) {
	var in contactInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	if strings.TrimSpace(in.Website) != "" {
		util.Created(w, util.Envelope{"message": "Đã gửi liên hệ"})
		return
	}

	in.Name = strings.TrimSpace(in.Name)
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))

	v := util.NewValidator()
	v.Required("name", in.Name, "Vui lòng nhập họ và tên")
	v.Required("email", in.Email, "Vui lòng nhập email")
	v.Email("email", in.Email, "Email không hợp lệ")
	v.Required("message", in.Message, "Vui lòng nhập nội dung")
	v.MaxLen("message", in.Message, 3000, "Nội dung quá dài")
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Vui lòng kiểm tra lại thông tin", v.Errors)
		return
	}

	var c models.Contact
	err := h.DB.QueryRow(r.Context(), `
		INSERT INTO contacts (name, email, phone, subject, message)
		VALUES ($1,$2,$3,$4,$5) RETURNING `+contactCols,
		in.Name, in.Email, in.Phone, in.Subject, in.Message,
	).Scan(&c.ID, &c.Name, &c.Email, &c.Phone, &c.Subject, &c.Message, &c.IsRead, &c.CreatedAt)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	util.Created(w, c)
}

func (h *Handler) ListContacts(w http.ResponseWriter, r *http.Request) {
	page, perPage, offset := util.Paginate(r, 20, 100)
	unreadOnly, present := util.QueryBool(r, "unread")

	cond := "TRUE"
	if present && unreadOnly {
		cond = "is_read = FALSE"
	}

	var total int64
	if err := h.DB.QueryRow(r.Context(), `SELECT count(*) FROM contacts WHERE `+cond).Scan(&total); err != nil {
		h.dbError(w, err, "")
		return
	}
	rows, err := h.DB.Query(r.Context(),
		`SELECT `+contactCols+` FROM contacts WHERE `+cond+
			` ORDER BY created_at DESC LIMIT $1 OFFSET $2`, perPage, offset)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	defer rows.Close()

	list := []models.Contact{}
	for rows.Next() {
		var c models.Contact
		if err := rows.Scan(&c.ID, &c.Name, &c.Email, &c.Phone, &c.Subject,
			&c.Message, &c.IsRead, &c.CreatedAt); err == nil {
			list = append(list, c)
		}
	}
	util.List(w, list, models.Meta{Page: page, PerPage: perPage, Total: total,
		TotalPages: util.TotalPages(total, perPage)})
}

func (h *Handler) MarkContactRead(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "id")
	if !ok {
		return
	}
	var c models.Contact
	err := h.DB.QueryRow(r.Context(),
		`UPDATE contacts SET is_read = NOT is_read WHERE id = $1 RETURNING `+contactCols, id,
	).Scan(&c.ID, &c.Name, &c.Email, &c.Phone, &c.Subject, &c.Message, &c.IsRead, &c.CreatedAt)
	if err != nil {
		h.dbError(w, err, "Không tìm thấy liên hệ")
		return
	}
	util.OK(w, c)
}

func (h *Handler) DeleteContact(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "id")
	if !ok {
		return
	}
	tag, err := h.DB.Exec(r.Context(), `DELETE FROM contacts WHERE id = $1`, id)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	if tag.RowsAffected() == 0 {
		util.Error(w, http.StatusNotFound, "Không tìm thấy liên hệ")
		return
	}
	util.OK(w, util.Envelope{"message": "Đã xoá liên hệ"})
}
