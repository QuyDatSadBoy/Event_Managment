package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/vhdcorp/event-api/internal/models"
	"github.com/vhdcorp/event-api/internal/util"
)

// Only formats the site actually renders. Anything else is rejected outright
// so an upload form can never become a way to drop executable content.
var allowedUploads = map[string]string{
	"image/jpeg":      ".jpg",
	"image/png":       ".png",
	"image/webp":      ".webp",
	"image/gif":       ".gif",
	"image/avif":      ".avif",
	"image/svg+xml":   ".svg",
	"application/pdf": ".pdf",
	"video/mp4":       ".mp4",
	"video/webm":      ".webm",
}

func randomName(ext string) string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return time.Now().Format("20060102") + "-" + hex.EncodeToString(b) + ext
}

func (h *Handler) Upload(w http.ResponseWriter, r *http.Request) {
	maxBytes := h.Cfg.MaxUploadMB << 20
	r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
	if err := r.ParseMultipartForm(8 << 20); err != nil {
		util.Error(w, http.StatusRequestEntityTooLarge,
			"Tệp quá lớn (tối đa "+itoa(int(h.Cfg.MaxUploadMB))+"MB)")
		return
	}
	defer func() { _ = r.MultipartForm.RemoveAll() }()

	file, header, err := r.FormFile("file")
	if err != nil {
		util.Error(w, http.StatusBadRequest, "Vui lòng chọn tệp để tải lên")
		return
	}
	defer file.Close()

	// Trust the bytes, not the client's Content-Type header.
	head := make([]byte, 512)
	n, _ := io.ReadFull(file, head)
	head = head[:n]
	detected, _, _ := strings.Cut(http.DetectContentType(head), ";")
	detected = strings.TrimSpace(detected)

	ext, ok := allowedUploads[detected]
	if !ok {
		// DetectContentType reports SVG and some video containers as octet-stream;
		// fall back to the extension for exactly those, still against the allowlist.
		fallback := strings.ToLower(filepath.Ext(header.Filename))
		byExt := mime.TypeByExtension(fallback)
		if e, ok2 := allowedUploads[strings.Split(byExt, ";")[0]]; ok2 {
			ext, detected, ok = e, strings.Split(byExt, ";")[0], true
		}
	}
	if !ok {
		util.Error(w, http.StatusUnsupportedMediaType,
			"Định dạng không được hỗ trợ. Chấp nhận: JPG, PNG, WebP, GIF, AVIF, SVG, PDF, MP4, WebM")
		return
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		util.Error(w, http.StatusInternalServerError, "Không đọc được tệp")
		return
	}

	// One directory per month keeps any single folder from growing unbounded.
	sub := time.Now().Format("2006/01")
	dir := filepath.Join(h.Cfg.UploadDir, sub)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		util.Error(w, http.StatusInternalServerError, "Không tạo được thư mục lưu trữ")
		return
	}

	name := randomName(ext)
	dst, err := os.Create(filepath.Join(dir, name))
	if err != nil {
		util.Error(w, http.StatusInternalServerError, "Không lưu được tệp")
		return
	}
	written, err := io.Copy(dst, file)
	closeErr := dst.Close()
	if err != nil || closeErr != nil {
		_ = os.Remove(filepath.Join(dir, name))
		util.Error(w, http.StatusInternalServerError, "Không lưu được tệp")
		return
	}

	url := "/uploads/" + sub + "/" + name
	var m models.Media
	err = h.DB.QueryRow(r.Context(), `
		INSERT INTO media (filename, original_name, url, mime_type, size)
		VALUES ($1,$2,$3,$4,$5)
		RETURNING id, filename, original_name, url, mime_type, size, created_at`,
		name, header.Filename, url, detected, written,
	).Scan(&m.ID, &m.Filename, &m.OriginalName, &m.URL, &m.MimeType, &m.Size, &m.CreatedAt)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	if h.Cfg.PublicBaseURL != "" {
		m.URL = h.Cfg.PublicBaseURL + url
	}
	util.Created(w, m)
}

func (h *Handler) ListMedia(w http.ResponseWriter, r *http.Request) {
	page, perPage, offset := util.Paginate(r, 30, 100)

	var total int64
	if err := h.DB.QueryRow(r.Context(), `SELECT count(*) FROM media`).Scan(&total); err != nil {
		h.dbError(w, err, "")
		return
	}
	rows, err := h.DB.Query(r.Context(), `
		SELECT id, filename, original_name, url, mime_type, size, created_at
		FROM media ORDER BY created_at DESC LIMIT $1 OFFSET $2`, perPage, offset)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	defer rows.Close()

	list := []models.Media{}
	for rows.Next() {
		var m models.Media
		if err := rows.Scan(&m.ID, &m.Filename, &m.OriginalName, &m.URL,
			&m.MimeType, &m.Size, &m.CreatedAt); err == nil {
			list = append(list, m)
		}
	}
	util.List(w, list, models.Meta{Page: page, PerPage: perPage, Total: total,
		TotalPages: util.TotalPages(total, perPage)})
}

func (h *Handler) DeleteMedia(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "id")
	if !ok {
		return
	}
	var url string
	if err := h.DB.QueryRow(r.Context(),
		`DELETE FROM media WHERE id = $1 RETURNING url`, id).Scan(&url); err != nil {
		h.dbError(w, err, "Không tìm thấy tệp")
		return
	}
	// Keep the row deletion authoritative; a leftover file on disk is harmless.
	if rel := strings.TrimPrefix(url, "/uploads/"); rel != url && !strings.Contains(rel, "..") {
		_ = os.Remove(filepath.Join(h.Cfg.UploadDir, filepath.Clean(rel)))
	}
	util.OK(w, util.Envelope{"message": "Đã xoá tệp"})
}
