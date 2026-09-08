package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

// Thin indirection so the rest of the package does not import chi directly.
func chiURLParam(r *http.Request, name string) string { return chi.URLParam(r, name) }
