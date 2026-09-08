package util

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
)

type Envelope map[string]any

func JSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if payload == nil {
		return
	}
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		// Header is already flushed at this point; logging is all that's left.
		return
	}
}

func OK(w http.ResponseWriter, data any) { JSON(w, http.StatusOK, Envelope{"data": data}) }

func Created(w http.ResponseWriter, data any) {
	JSON(w, http.StatusCreated, Envelope{"data": data})
}

func List(w http.ResponseWriter, data any, meta any) {
	JSON(w, http.StatusOK, Envelope{"data": data, "meta": meta})
}

func Error(w http.ResponseWriter, status int, message string) {
	JSON(w, status, Envelope{"error": message})
}

func ErrorFields(w http.ResponseWriter, status int, message string, fields map[string]string) {
	JSON(w, status, Envelope{"error": message, "fields": fields})
}

// Decode reads a JSON body with a hard size cap and rejects unknown fields.
func Decode(w http.ResponseWriter, r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, 2<<20) // 2 MB is plenty for a form payload
	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(dst); err != nil {
		return err
	}
	// A second token means the client sent more than one JSON value.
	if err := dec.Decode(&struct{}{}); err != io.EOF {
		return errSingleJSON
	}
	return nil
}

type constErr string

func (e constErr) Error() string { return string(e) }

const errSingleJSON = constErr("body must contain a single JSON object")

// Paginate reads ?page= and ?per_page= with sane bounds.
func Paginate(r *http.Request, defPerPage, maxPerPage int) (page, perPage, offset int) {
	page, _ = strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ = strconv.Atoi(r.URL.Query().Get("per_page"))
	if perPage < 1 {
		perPage = defPerPage
	}
	if perPage > maxPerPage {
		perPage = maxPerPage
	}
	return page, perPage, (page - 1) * perPage
}

func TotalPages(total int64, perPage int) int {
	if perPage <= 0 {
		return 0
	}
	p := int(total) / perPage
	if int(total)%perPage != 0 {
		p++
	}
	return p
}

func QueryBool(r *http.Request, key string) (val, present bool) {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return false, false
	}
	b, err := strconv.ParseBool(raw)
	return b, err == nil
}
