package handlers

import (
	"net/http"
	"strings"

	"github.com/google/uuid"

	"github.com/vhdcorp/event-api/internal/models"
	"github.com/vhdcorp/event-api/internal/util"
)

const speakerCols = `id, slug, name, title, company, country, photo, bio, short_bio,
	topics, socials, featured, is_published, sort_order, created_at, updated_at`

func scanSpeaker(row interface{ Scan(...any) error }) (models.Speaker, error) {
	var s models.Speaker
	err := row.Scan(&s.ID, &s.Slug, &s.Name, &s.Title, &s.Company, &s.Country, &s.Photo,
		&s.Bio, &s.ShortBio, &s.Topics, &s.Socials, &s.Featured, &s.IsPublished,
		&s.SortOrder, &s.CreatedAt, &s.UpdatedAt)
	if s.Topics == nil {
		s.Topics = []string{}
	}
	if s.Socials == nil {
		s.Socials = map[string]any{}
	}
	return s, err
}

// ListSpeakers serves both the public grid and the admin table.
func (h *Handler) ListSpeakers(w http.ResponseWriter, r *http.Request) {
	admin := isAdminScope(r)
	page, perPage, offset := util.Paginate(r, 24, 100)
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	featuredOnly, _ := util.QueryBool(r, "featured")

	where := []string{"TRUE"}
	args := []any{}
	if !admin {
		where = append(where, "is_published = TRUE")
	}
	if q != "" {
		args = append(args, "%"+strings.ToLower(q)+"%")
		where = append(where, "(lower(name) LIKE $1 OR lower(company) LIKE $1 OR lower(title) LIKE $1)")
	}
	if featuredOnly {
		where = append(where, "featured = TRUE")
	}
	cond := strings.Join(where, " AND ")

	var total int64
	if err := h.DB.QueryRow(r.Context(),
		`SELECT count(*) FROM speakers WHERE `+cond, args...).Scan(&total); err != nil {
		h.dbError(w, err, "")
		return
	}

	args = append(args, perPage, offset)
	rows, err := h.DB.Query(r.Context(),
		`SELECT `+speakerCols+` FROM speakers WHERE `+cond+
			` ORDER BY featured DESC, sort_order ASC, name ASC
			  LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args)), args...)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	defer rows.Close()

	list := []models.Speaker{}
	for rows.Next() {
		s, err := scanSpeaker(rows)
		if err != nil {
			h.dbError(w, err, "")
			return
		}
		list = append(list, s)
	}
	util.List(w, list, models.Meta{Page: page, PerPage: perPage, Total: total,
		TotalPages: util.TotalPages(total, perPage)})
}

// GetSpeaker accepts either a UUID or a slug, so admin and public share it.
func (h *Handler) GetSpeaker(w http.ResponseWriter, r *http.Request) {
	key := chiURLParam(r, "key")
	cond := "slug = $1"
	var arg any = key
	if id, err := uuid.Parse(key); err == nil {
		cond = "id = $1"
		arg = id
	}
	if !isAdminScope(r) {
		cond += " AND is_published = TRUE"
	}

	s, err := scanSpeaker(h.DB.QueryRow(r.Context(),
		`SELECT `+speakerCols+` FROM speakers WHERE `+cond, arg))
	if err != nil {
		h.dbError(w, err, "Không tìm thấy diễn giả")
		return
	}

	s.Sessions = h.sessionsForSpeaker(r, s.ID)
	s.Posts = h.postsForSpeaker(r, s.ID)
	util.OK(w, s)
}

func (h *Handler) sessionsForSpeaker(r *http.Request, speakerID uuid.UUID) []models.AgendaSession {
	rows, err := h.DB.Query(r.Context(), `
		SELECT s.id, s.day_id, s.title, s.description, s.start_time, s.end_time,
		       s.room, s.track, s.type, s.is_published, s.sort_order, d.label, d.date
		FROM agenda_sessions s
		JOIN session_speakers ss ON ss.session_id = s.id
		JOIN agenda_days d       ON d.id = s.day_id
		WHERE ss.speaker_id = $1 AND s.is_published = TRUE
		ORDER BY d.sort_order, s.sort_order, s.start_time`, speakerID)
	if err != nil {
		return []models.AgendaSession{}
	}
	defer rows.Close()

	out := []models.AgendaSession{}
	for rows.Next() {
		var s models.AgendaSession
		if err := rows.Scan(&s.ID, &s.DayID, &s.Title, &s.Description, &s.StartTime, &s.EndTime,
			&s.Room, &s.Track, &s.Type, &s.IsPublished, &s.SortOrder, &s.DayLabel, &s.DayDate); err != nil {
			continue
		}
		s.Speakers = []models.Speaker{}
		out = append(out, s)
	}
	return out
}

func (h *Handler) postsForSpeaker(r *http.Request, speakerID uuid.UUID) []models.Post {
	rows, err := h.DB.Query(r.Context(), `
		SELECT id, slug, title, excerpt, cover, category, published_at
		FROM posts WHERE speaker_id = $1 AND is_published = TRUE
		ORDER BY published_at DESC LIMIT 6`, speakerID)
	if err != nil {
		return []models.Post{}
	}
	defer rows.Close()

	out := []models.Post{}
	for rows.Next() {
		var p models.Post
		if err := rows.Scan(&p.ID, &p.Slug, &p.Title, &p.Excerpt, &p.Cover,
			&p.Category, &p.PublishedAt); err != nil {
			continue
		}
		p.Tags = []string{}
		out = append(out, p)
	}
	return out
}

type speakerInput struct {
	Name        string         `json:"name"`
	Slug        string         `json:"slug"`
	Title       string         `json:"title"`
	Company     string         `json:"company"`
	Country     string         `json:"country"`
	Photo       string         `json:"photo"`
	Bio         string         `json:"bio"`
	ShortBio    string         `json:"short_bio"`
	Topics      []string       `json:"topics"`
	Socials     map[string]any `json:"socials"`
	Featured    bool           `json:"featured"`
	IsPublished *bool          `json:"is_published"`
	SortOrder   int            `json:"sort_order"`
}

func (in *speakerInput) normalise() {
	in.Name = strings.TrimSpace(in.Name)
	if in.Topics == nil {
		in.Topics = []string{}
	}
	if in.Socials == nil {
		in.Socials = map[string]any{}
	}
	if in.ShortBio == "" && in.Bio != "" {
		in.ShortBio = util.Truncate(util.StripHTML(in.Bio), 180)
	}
}

func (h *Handler) CreateSpeaker(w http.ResponseWriter, r *http.Request) {
	var in speakerInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	in.normalise()

	v := util.NewValidator()
	v.Required("name", in.Name, "Vui lòng nhập tên diễn giả")
	v.MaxLen("name", in.Name, 200, "Tên quá dài")
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Thông tin chưa hợp lệ", v.Errors)
		return
	}

	base := in.Slug
	if base == "" {
		base = in.Name
	}
	slug, err := h.uniqueSlug(r.Context(), "speakers", base, nil)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	published := true
	if in.IsPublished != nil {
		published = *in.IsPublished
	}

	s, err := scanSpeaker(h.DB.QueryRow(r.Context(), `
		INSERT INTO speakers (slug, name, title, company, country, photo, bio, short_bio,
		                      topics, socials, featured, is_published, sort_order)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
		RETURNING `+speakerCols,
		slug, in.Name, in.Title, in.Company, in.Country, in.Photo, in.Bio, in.ShortBio,
		in.Topics, in.Socials, in.Featured, published, in.SortOrder))
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	util.Created(w, s)
}

func (h *Handler) UpdateSpeaker(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "key")
	if !ok {
		return
	}
	var in speakerInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	in.normalise()

	v := util.NewValidator()
	v.Required("name", in.Name, "Vui lòng nhập tên diễn giả")
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Thông tin chưa hợp lệ", v.Errors)
		return
	}

	base := in.Slug
	if base == "" {
		base = in.Name
	}
	slug, err := h.uniqueSlug(r.Context(), "speakers", base, &id)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	published := true
	if in.IsPublished != nil {
		published = *in.IsPublished
	}

	s, err := scanSpeaker(h.DB.QueryRow(r.Context(), `
		UPDATE speakers SET slug=$1, name=$2, title=$3, company=$4, country=$5, photo=$6,
		       bio=$7, short_bio=$8, topics=$9, socials=$10, featured=$11, is_published=$12,
		       sort_order=$13, updated_at=now()
		WHERE id=$14 RETURNING `+speakerCols,
		slug, in.Name, in.Title, in.Company, in.Country, in.Photo, in.Bio, in.ShortBio,
		in.Topics, in.Socials, in.Featured, published, in.SortOrder, id))
	if err != nil {
		h.dbError(w, err, "Không tìm thấy diễn giả")
		return
	}
	util.OK(w, s)
}

func (h *Handler) DeleteSpeaker(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "key")
	if !ok {
		return
	}
	tag, err := h.DB.Exec(r.Context(), `DELETE FROM speakers WHERE id = $1`, id)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	if tag.RowsAffected() == 0 {
		util.Error(w, http.StatusNotFound, "Không tìm thấy diễn giả")
		return
	}
	util.OK(w, util.Envelope{"message": "Đã xoá diễn giả"})
}
