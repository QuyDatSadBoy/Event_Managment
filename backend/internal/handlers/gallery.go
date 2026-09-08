package handlers

import (
	"net/http"
	"strings"

	"github.com/vhdcorp/event-api/internal/models"
	"github.com/vhdcorp/event-api/internal/util"
)

const galleryCols = `id, title, description, type, url, thumbnail, album, file_size,
	is_published, sort_order, created_at`

func scanGallery(row interface{ Scan(...any) error }) (models.GalleryItem, error) {
	var g models.GalleryItem
	err := row.Scan(&g.ID, &g.Title, &g.Description, &g.Type, &g.URL, &g.Thumbnail,
		&g.Album, &g.FileSize, &g.IsPublished, &g.SortOrder, &g.CreatedAt)
	return g, err
}

func (h *Handler) ListGallery(w http.ResponseWriter, r *http.Request) {
	admin := isAdminScope(r)
	page, perPage, offset := util.Paginate(r, 24, 120)
	kind := strings.TrimSpace(r.URL.Query().Get("type"))
	album := strings.TrimSpace(r.URL.Query().Get("album"))

	where := []string{"TRUE"}
	args := []any{}
	if !admin {
		where = append(where, "is_published = TRUE")
	}
	if kind != "" && kind != "all" {
		args = append(args, kind)
		where = append(where, "type = $"+itoa(len(args)))
	}
	if album != "" && album != "all" {
		args = append(args, album)
		where = append(where, "album = $"+itoa(len(args)))
	}
	cond := strings.Join(where, " AND ")

	var total int64
	if err := h.DB.QueryRow(r.Context(), `SELECT count(*) FROM gallery_items WHERE `+cond, args...).Scan(&total); err != nil {
		h.dbError(w, err, "")
		return
	}

	args = append(args, perPage, offset)
	rows, err := h.DB.Query(r.Context(),
		`SELECT `+galleryCols+` FROM gallery_items WHERE `+cond+
			` ORDER BY sort_order ASC, created_at DESC
			  LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args)), args...)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	defer rows.Close()

	list := []models.GalleryItem{}
	for rows.Next() {
		if g, err := scanGallery(rows); err == nil {
			list = append(list, g)
		}
	}
	util.List(w, list, models.Meta{Page: page, PerPage: perPage, Total: total,
		TotalPages: util.TotalPages(total, perPage)})
}

// GalleryAlbums powers the filter chips on the public gallery page.
func (h *Handler) GalleryAlbums(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(r.Context(), `
		SELECT album, count(*) FROM gallery_items
		WHERE is_published = TRUE AND album <> '' GROUP BY album ORDER BY album`)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	defer rows.Close()

	out := []util.Envelope{}
	for rows.Next() {
		var name string
		var n int
		if err := rows.Scan(&name, &n); err == nil {
			out = append(out, util.Envelope{"name": name, "count": n})
		}
	}
	util.OK(w, out)
}

type galleryInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Type        string `json:"type"`
	URL         string `json:"url"`
	Thumbnail   string `json:"thumbnail"`
	Album       string `json:"album"`
	FileSize    int64  `json:"file_size"`
	IsPublished *bool  `json:"is_published"`
	SortOrder   int    `json:"sort_order"`
}

var galleryTypes = []string{"image", "video", "document"}

func (h *Handler) CreateGalleryItem(w http.ResponseWriter, r *http.Request) {
	var in galleryInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	if in.Type == "" {
		in.Type = "image"
	}
	v := util.NewValidator()
	v.Required("url", in.URL, "Vui lòng tải tệp lên hoặc dán đường dẫn")
	v.In("type", in.Type, galleryTypes, "Loại tệp không hợp lệ")
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Thông tin chưa hợp lệ", v.Errors)
		return
	}
	published := true
	if in.IsPublished != nil {
		published = *in.IsPublished
	}

	g, err := scanGallery(h.DB.QueryRow(r.Context(), `
		INSERT INTO gallery_items (title, description, type, url, thumbnail, album,
		                           file_size, is_published, sort_order)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING `+galleryCols,
		in.Title, in.Description, in.Type, in.URL, in.Thumbnail, in.Album,
		in.FileSize, published, in.SortOrder))
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	util.Created(w, g)
}

func (h *Handler) UpdateGalleryItem(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "id")
	if !ok {
		return
	}
	var in galleryInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	if in.Type == "" {
		in.Type = "image"
	}
	v := util.NewValidator()
	v.Required("url", in.URL, "Vui lòng tải tệp lên hoặc dán đường dẫn")
	v.In("type", in.Type, galleryTypes, "Loại tệp không hợp lệ")
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Thông tin chưa hợp lệ", v.Errors)
		return
	}
	published := true
	if in.IsPublished != nil {
		published = *in.IsPublished
	}

	g, err := scanGallery(h.DB.QueryRow(r.Context(), `
		UPDATE gallery_items SET title=$1, description=$2, type=$3, url=$4, thumbnail=$5,
		       album=$6, file_size=$7, is_published=$8, sort_order=$9, updated_at=now()
		WHERE id=$10 RETURNING `+galleryCols,
		in.Title, in.Description, in.Type, in.URL, in.Thumbnail, in.Album,
		in.FileSize, published, in.SortOrder, id))
	if err != nil {
		h.dbError(w, err, "Không tìm thấy mục thư viện")
		return
	}
	util.OK(w, g)
}

func (h *Handler) DeleteGalleryItem(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "id")
	if !ok {
		return
	}
	tag, err := h.DB.Exec(r.Context(), `DELETE FROM gallery_items WHERE id = $1`, id)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	if tag.RowsAffected() == 0 {
		util.Error(w, http.StatusNotFound, "Không tìm thấy mục thư viện")
		return
	}
	util.OK(w, util.Envelope{"message": "Đã xoá khỏi thư viện"})
}
