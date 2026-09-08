package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"

	"github.com/vhdcorp/event-api/internal/middleware"
	"github.com/vhdcorp/event-api/internal/util"
)

func (h *Handler) Routes() http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Recoverer)
	r.Use(middleware.Logger)
	r.Use(middleware.SecurityHeaders)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   h.Cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Requested-With"},
		ExposedHeaders:   []string{"Content-Disposition"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Public form endpoints are the only unauthenticated writes, so they get a limiter.
	formLimiter := middleware.NewRateLimiter(10, time.Hour)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		if err := h.DB.Ping(r.Context()); err != nil {
			util.Error(w, http.StatusServiceUnavailable, "database unavailable")
			return
		}
		util.JSON(w, http.StatusOK, util.Envelope{"status": "ok", "time": time.Now()})
	})

	r.Route("/api", func(api chi.Router) {
		// ---------------- Public ----------------
		api.Group(func(pub chi.Router) {
			pub.Get("/home", h.Home)
			pub.Get("/settings", h.GetSettings)

			pub.Get("/speakers", h.ListSpeakers)
			pub.Get("/speakers/{key}", h.GetSpeaker)

			pub.Get("/agenda", h.GetAgenda)

			pub.Get("/posts", h.ListPosts)
			pub.Get("/posts/{key}", h.GetPost)
			pub.Get("/posts/{key}/related", h.RelatedPosts)

			pub.Get("/gallery", h.ListGallery)
			pub.Get("/gallery/albums", h.GalleryAlbums)

			pub.Get("/partners", h.ListPartners)

			pub.With(formLimiter.Handler).Post("/registrations", h.CreateRegistration)
			pub.With(formLimiter.Handler).Post("/contacts", h.CreateContact)
		})

		// ---------------- Auth ----------------
		api.Post("/auth/login", h.Login)
		api.With(h.Auth.Require).Get("/auth/me", h.Me)
		api.With(h.Auth.Require).Post("/auth/change-password", h.ChangePassword)

		// ---------------- Admin ----------------
		api.Route("/admin", func(adm chi.Router) {
			adm.Use(h.Auth.Require)

			adm.Get("/stats", h.DashboardStats)

			adm.Get("/settings", h.GetSettings)
			adm.Put("/settings", h.UpdateSettings)

			adm.Get("/speakers", h.ListSpeakers)
			adm.Get("/speakers/{key}", h.GetSpeaker)
			adm.Post("/speakers", h.CreateSpeaker)
			adm.Put("/speakers/{key}", h.UpdateSpeaker)
			adm.Delete("/speakers/{key}", h.DeleteSpeaker)

			adm.Get("/agenda", h.GetAgenda)
			adm.Post("/agenda/days", h.CreateAgendaDay)
			adm.Put("/agenda/days/{id}", h.UpdateAgendaDay)
			adm.Delete("/agenda/days/{id}", h.DeleteAgendaDay)
			adm.Post("/agenda/sessions", h.CreateSession)
			adm.Put("/agenda/sessions/{id}", h.UpdateSession)
			adm.Delete("/agenda/sessions/{id}", h.DeleteSession)

			adm.Get("/posts", h.ListPosts)
			adm.Get("/posts/{key}", h.GetPost)
			adm.Post("/posts", h.CreatePost)
			adm.Put("/posts/{key}", h.UpdatePost)
			adm.Delete("/posts/{key}", h.DeletePost)

			adm.Get("/gallery", h.ListGallery)
			adm.Post("/gallery", h.CreateGalleryItem)
			adm.Put("/gallery/{id}", h.UpdateGalleryItem)
			adm.Delete("/gallery/{id}", h.DeleteGalleryItem)

			adm.Get("/partners", h.ListPartners)
			adm.Post("/partners", h.CreatePartner)
			adm.Put("/partners/{id}", h.UpdatePartner)
			adm.Delete("/partners/{id}", h.DeletePartner)

			adm.Get("/registrations", h.ListRegistrations)
			adm.Get("/registrations/export", h.ExportRegistrations)
			adm.Patch("/registrations/{id}", h.UpdateRegistrationStatus)
			adm.Delete("/registrations/{id}", h.DeleteRegistration)

			adm.Get("/contacts", h.ListContacts)
			adm.Patch("/contacts/{id}/read", h.MarkContactRead)
			adm.Delete("/contacts/{id}", h.DeleteContact)

			adm.Post("/upload", h.Upload)
			adm.Get("/media", h.ListMedia)
			adm.Delete("/media/{id}", h.DeleteMedia)
		})
	})

	r.Handle("/uploads/*", h.uploadsHandler())

	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		util.Error(w, http.StatusNotFound, "Không tìm thấy đường dẫn")
	})
	r.MethodNotAllowed(func(w http.ResponseWriter, r *http.Request) {
		util.Error(w, http.StatusMethodNotAllowed, "Phương thức không được hỗ trợ")
	})
	return r
}

// uploadsHandler serves the media directory with long-lived caching. Filenames
// are random and never reused, so the content at a URL cannot change.
func (h *Handler) uploadsHandler() http.Handler {
	root, err := filepath.Abs(h.Cfg.UploadDir)
	if err != nil {
		root = h.Cfg.UploadDir
	}
	fs := http.FileServer(neuteredFS{http.Dir(root)})
	return http.StripPrefix("/uploads/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "..") {
			util.Error(w, http.StatusBadRequest, "Đường dẫn không hợp lệ")
			return
		}
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		fs.ServeHTTP(w, r)
	}))
}

// neuteredFS blocks directory listings while still serving files.
type neuteredFS struct{ fs http.FileSystem }

func (n neuteredFS) Open(name string) (http.File, error) {
	f, err := n.fs.Open(name)
	if err != nil {
		return nil, err
	}
	stat, err := f.Stat()
	if err != nil {
		_ = f.Close()
		return nil, err
	}
	if stat.IsDir() {
		_ = f.Close()
		return nil, os.ErrNotExist
	}
	return f, nil
}
