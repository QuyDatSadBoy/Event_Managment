package handlers

import (
	"context"
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/vhdcorp/event-api/internal/config"
	"github.com/vhdcorp/event-api/internal/db"
	"github.com/vhdcorp/event-api/internal/middleware"
	"github.com/vhdcorp/event-api/internal/util"
)

type Handler struct {
	DB   *db.DB
	Cfg  *config.Config
	Auth *middleware.Auth
}

func New(database *db.DB, cfg *config.Config, auth *middleware.Auth) *Handler {
	return &Handler{DB: database, Cfg: cfg, Auth: auth}
}

// idParam pulls a UUID out of the URL and writes the 400 itself when it is bad.
func idParam(w http.ResponseWriter, r *http.Request, name string) (uuid.UUID, bool) {
	raw := chiURLParam(r, name)
	id, err := uuid.Parse(raw)
	if err != nil {
		util.Error(w, http.StatusBadRequest, "Mã không hợp lệ")
		return uuid.Nil, false
	}
	return id, true
}

// notFound maps pgx's no-rows sentinel onto a 404 and everything else onto a 500.
func (h *Handler) dbError(w http.ResponseWriter, err error, notFoundMsg string) {
	if errors.Is(err, pgx.ErrNoRows) {
		util.Error(w, http.StatusNotFound, notFoundMsg)
		return
	}
	util.Error(w, http.StatusInternalServerError, "Lỗi truy vấn dữ liệu: "+err.Error())
}

// uniqueSlug appends -2, -3 … until the slug is free in the given table.
func (h *Handler) uniqueSlug(ctx context.Context, table, base string, excludeID *uuid.UUID) (string, error) {
	slug := util.Slugify(base)
	candidate := slug
	for i := 2; i < 200; i++ {
		var exists bool
		var err error
		q := `SELECT EXISTS(SELECT 1 FROM ` + table + ` WHERE slug = $1)`
		if excludeID != nil {
			q = `SELECT EXISTS(SELECT 1 FROM ` + table + ` WHERE slug = $1 AND id <> $2)`
			err = h.DB.QueryRow(ctx, q, candidate, *excludeID).Scan(&exists)
		} else {
			err = h.DB.QueryRow(ctx, q, candidate).Scan(&exists)
		}
		if err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
		candidate = slug + "-" + itoa(i)
	}
	return candidate, nil
}

func itoa(i int) string {
	if i == 0 {
		return "0"
	}
	var b [20]byte
	pos := len(b)
	for i > 0 {
		pos--
		b[pos] = byte('0' + i%10)
		i /= 10
	}
	return string(b[pos:])
}

// isAdminScope is true when the request carried a valid admin token, which is
// what unlocks unpublished rows in the shared list/detail handlers.
func isAdminScope(r *http.Request) bool {
	return middleware.UserFrom(r.Context()) != nil
}
