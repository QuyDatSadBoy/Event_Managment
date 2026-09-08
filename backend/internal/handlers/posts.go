package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/vhdcorp/event-api/internal/models"
	"github.com/vhdcorp/event-api/internal/util"
)

const postCols = `id, slug, title, excerpt, content, cover, category, tags, author_name,
	speaker_id, is_published, featured, views, published_at, created_at, updated_at`

const postListCols = `id, slug, title, excerpt, '' AS content, cover, category, tags, author_name,
	speaker_id, is_published, featured, views, published_at, created_at, updated_at`

func scanPost(row interface{ Scan(...any) error }) (models.Post, error) {
	var p models.Post
	err := row.Scan(&p.ID, &p.Slug, &p.Title, &p.Excerpt, &p.Content, &p.Cover, &p.Category,
		&p.Tags, &p.AuthorName, &p.SpeakerID, &p.IsPublished, &p.Featured, &p.Views,
		&p.PublishedAt, &p.CreatedAt, &p.UpdatedAt)
	if p.Tags == nil {
		p.Tags = []string{}
	}
	return p, err
}

func (h *Handler) ListPosts(w http.ResponseWriter, r *http.Request) {
	admin := isAdminScope(r)
	page, perPage, offset := util.Paginate(r, 9, 60)
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	category := strings.TrimSpace(r.URL.Query().Get("category"))
	tag := strings.TrimSpace(r.URL.Query().Get("tag"))
	featuredOnly, _ := util.QueryBool(r, "featured")

	where := []string{"TRUE"}
	args := []any{}
	if !admin {
		where = append(where, "is_published = TRUE", "published_at <= now()")
	}
	if category != "" && category != "all" {
		args = append(args, category)
		where = append(where, "category = $"+itoa(len(args)))
	}
	if tag != "" {
		args = append(args, tag)
		where = append(where, "$"+itoa(len(args))+" = ANY(tags)")
	}
	if q != "" {
		args = append(args, "%"+strings.ToLower(q)+"%")
		n := itoa(len(args))
		where = append(where, "(lower(title) LIKE $"+n+" OR lower(excerpt) LIKE $"+n+")")
	}
	if featuredOnly {
		where = append(where, "featured = TRUE")
	}
	cond := strings.Join(where, " AND ")

	var total int64
	if err := h.DB.QueryRow(r.Context(), `SELECT count(*) FROM posts WHERE `+cond, args...).Scan(&total); err != nil {
		h.dbError(w, err, "")
		return
	}

	args = append(args, perPage, offset)
	rows, err := h.DB.Query(r.Context(),
		`SELECT `+postListCols+` FROM posts WHERE `+cond+
			` ORDER BY featured DESC, published_at DESC
			  LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args)), args...)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	defer rows.Close()

	list := []models.Post{}
	for rows.Next() {
		p, err := scanPost(rows)
		if err != nil {
			h.dbError(w, err, "")
			return
		}
		list = append(list, p)
	}
	util.List(w, list, models.Meta{Page: page, PerPage: perPage, Total: total,
		TotalPages: util.TotalPages(total, perPage)})
}

func (h *Handler) GetPost(w http.ResponseWriter, r *http.Request) {
	key := chiURLParam(r, "key")
	cond := "p.slug = $1"
	var arg any = key
	if id, err := uuid.Parse(key); err == nil {
		cond = "p.id = $1"
		arg = id
	}
	admin := isAdminScope(r)
	if !admin {
		cond += " AND p.is_published = TRUE"
	}

	p, err := scanPost(h.DB.QueryRow(r.Context(),
		`SELECT `+prefixCols("p", postCols)+` FROM posts p WHERE `+cond, arg))
	if err != nil {
		h.dbError(w, err, "Không tìm thấy bài viết")
		return
	}

	if p.SpeakerID != nil {
		if sp, err := scanSpeaker(h.DB.QueryRow(r.Context(),
			`SELECT `+speakerCols+` FROM speakers WHERE id = $1`, *p.SpeakerID)); err == nil {
			p.Speaker = &sp
		}
	}
	if !admin {
		// Fire-and-forget: a view counter must never slow the page down.
		go func(id uuid.UUID) {
			ctx, cancel := backgroundCtx()
			defer cancel()
			_, _ = h.DB.Exec(ctx, `UPDATE posts SET views = views + 1 WHERE id = $1`, id)
		}(p.ID)
	}
	util.OK(w, p)
}

// RelatedPosts backs the "đọc thêm" strip on the article page.
func (h *Handler) RelatedPosts(w http.ResponseWriter, r *http.Request) {
	slug := chiURLParam(r, "key")
	rows, err := h.DB.Query(r.Context(), `
		SELECT `+postListCols+` FROM posts
		WHERE is_published = TRUE AND slug <> $1
		  AND category = COALESCE((SELECT category FROM posts WHERE slug = $1), category)
		ORDER BY published_at DESC LIMIT 3`, slug)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	defer rows.Close()

	list := []models.Post{}
	for rows.Next() {
		if p, err := scanPost(rows); err == nil {
			list = append(list, p)
		}
	}
	util.OK(w, list)
}

type postInput struct {
	Title       string   `json:"title"`
	Slug        string   `json:"slug"`
	Excerpt     string   `json:"excerpt"`
	Content     string   `json:"content"`
	Cover       string   `json:"cover"`
	Category    string   `json:"category"`
	Tags        []string `json:"tags"`
	AuthorName  string   `json:"author_name"`
	SpeakerID   string   `json:"speaker_id"`
	IsPublished *bool    `json:"is_published"`
	Featured    bool     `json:"featured"`
	PublishedAt string   `json:"published_at"`
}

var postCategories = []string{"news", "speech", "press", "announcement"}

func (in *postInput) prepare(loc *time.Location) (*uuid.UUID, time.Time, *util.Validator) {
	in.Title = strings.TrimSpace(in.Title)
	if in.Tags == nil {
		in.Tags = []string{}
	}
	if in.Category == "" {
		in.Category = "news"
	}
	if in.Excerpt == "" && in.Content != "" {
		in.Excerpt = util.Truncate(util.StripHTML(in.Content), 200)
	}

	v := util.NewValidator()
	v.Required("title", in.Title, "Vui lòng nhập tiêu đề")
	v.MaxLen("title", in.Title, 300, "Tiêu đề quá dài")
	v.In("category", in.Category, postCategories, "Chuyên mục không hợp lệ")

	var speakerID *uuid.UUID
	if s := strings.TrimSpace(in.SpeakerID); s != "" {
		if id, err := uuid.Parse(s); err == nil {
			speakerID = &id
		}
	}

	publishedAt := time.Now()
	if t, ok := parseTime(in.PublishedAt, loc); ok {
		publishedAt = t
	}
	return speakerID, publishedAt, v
}

func (h *Handler) CreatePost(w http.ResponseWriter, r *http.Request) {
	var in postInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	speakerID, publishedAt, v := in.prepare(h.Cfg.Location)
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Thông tin chưa hợp lệ", v.Errors)
		return
	}
	base := in.Slug
	if base == "" {
		base = in.Title
	}
	slug, err := h.uniqueSlug(r.Context(), "posts", base, nil)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	published := true
	if in.IsPublished != nil {
		published = *in.IsPublished
	}

	p, err := scanPost(h.DB.QueryRow(r.Context(), `
		INSERT INTO posts (slug, title, excerpt, content, cover, category, tags, author_name,
		                   speaker_id, is_published, featured, published_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING `+postCols,
		slug, in.Title, in.Excerpt, in.Content, in.Cover, in.Category, in.Tags,
		in.AuthorName, speakerID, published, in.Featured, publishedAt))
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	util.Created(w, p)
}

func (h *Handler) UpdatePost(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "key")
	if !ok {
		return
	}
	var in postInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	speakerID, publishedAt, v := in.prepare(h.Cfg.Location)
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Thông tin chưa hợp lệ", v.Errors)
		return
	}
	base := in.Slug
	if base == "" {
		base = in.Title
	}
	slug, err := h.uniqueSlug(r.Context(), "posts", base, &id)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	published := true
	if in.IsPublished != nil {
		published = *in.IsPublished
	}

	p, err := scanPost(h.DB.QueryRow(r.Context(), `
		UPDATE posts SET slug=$1, title=$2, excerpt=$3, content=$4, cover=$5, category=$6,
		       tags=$7, author_name=$8, speaker_id=$9, is_published=$10, featured=$11,
		       published_at=$12, updated_at=now()
		WHERE id=$13 RETURNING `+postCols,
		slug, in.Title, in.Excerpt, in.Content, in.Cover, in.Category, in.Tags,
		in.AuthorName, speakerID, published, in.Featured, publishedAt, id))
	if err != nil {
		h.dbError(w, err, "Không tìm thấy bài viết")
		return
	}
	util.OK(w, p)
}

func (h *Handler) DeletePost(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "key")
	if !ok {
		return
	}
	tag, err := h.DB.Exec(r.Context(), `DELETE FROM posts WHERE id = $1`, id)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	if tag.RowsAffected() == 0 {
		util.Error(w, http.StatusNotFound, "Không tìm thấy bài viết")
		return
	}
	util.OK(w, util.Envelope{"message": "Đã xoá bài viết"})
}
