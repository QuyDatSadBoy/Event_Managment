package handlers

import (
	"net/http"
	"time"

	"github.com/vhdcorp/event-api/internal/models"
	"github.com/vhdcorp/event-api/internal/util"
)

const settingsCols = `event_name, event_tagline, event_description, hero_title, hero_subtitle,
	hero_image, logo, start_date, end_date, venue_name, venue_address, venue_map_url,
	contact_email, contact_phone, contact_address, about_title, about_content, about_image,
	socials, stats, highlights, hero_slides, seo_title, seo_description, registration_open, updated_at`

func scanSettings(row interface{ Scan(...any) error }) (models.Settings, error) {
	var s models.Settings
	err := row.Scan(&s.EventName, &s.EventTagline, &s.EventDescription, &s.HeroTitle,
		&s.HeroSubtitle, &s.HeroImage, &s.Logo, &s.StartDate, &s.EndDate, &s.VenueName,
		&s.VenueAddress, &s.VenueMapURL, &s.ContactEmail, &s.ContactPhone, &s.ContactAddress,
		&s.AboutTitle, &s.AboutContent, &s.AboutImage, &s.Socials, &s.Stats, &s.Highlights,
		&s.HeroSlides, &s.SEOTitle, &s.SEODescription, &s.RegistrationOpen, &s.UpdatedAt)
	if s.Socials == nil {
		s.Socials = map[string]any{}
	}
	if s.Stats == nil {
		s.Stats = []map[string]any{}
	}
	if s.Highlights == nil {
		s.Highlights = []map[string]any{}
	}
	if s.HeroSlides == nil {
		s.HeroSlides = []map[string]any{}
	}
	return s, err
}

func (h *Handler) GetSettings(w http.ResponseWriter, r *http.Request) {
	s, err := scanSettings(h.DB.QueryRow(r.Context(),
		`SELECT `+settingsCols+` FROM settings WHERE id = 1`))
	if err != nil {
		h.dbError(w, err, "Chưa có cấu hình sự kiện")
		return
	}
	util.OK(w, s)
}

type settingsInput struct {
	EventName        string           `json:"event_name"`
	EventTagline     string           `json:"event_tagline"`
	EventDescription string           `json:"event_description"`
	HeroTitle        string           `json:"hero_title"`
	HeroSubtitle     string           `json:"hero_subtitle"`
	HeroImage        string           `json:"hero_image"`
	Logo             string           `json:"logo"`
	StartDate        string           `json:"start_date"`
	EndDate          string           `json:"end_date"`
	VenueName        string           `json:"venue_name"`
	VenueAddress     string           `json:"venue_address"`
	VenueMapURL      string           `json:"venue_map_url"`
	ContactEmail     string           `json:"contact_email"`
	ContactPhone     string           `json:"contact_phone"`
	ContactAddress   string           `json:"contact_address"`
	AboutTitle       string           `json:"about_title"`
	AboutContent     string           `json:"about_content"`
	AboutImage       string           `json:"about_image"`
	Socials          map[string]any   `json:"socials"`
	Stats            []map[string]any `json:"stats"`
	Highlights       []map[string]any `json:"highlights"`
	HeroSlides       []map[string]any `json:"hero_slides"`
	SEOTitle         string           `json:"seo_title"`
	SEODescription   string           `json:"seo_description"`
	RegistrationOpen *bool            `json:"registration_open"`
}

func parseFlexTime(s string, loc *time.Location) *time.Time {
	if t, ok := parseTime(s, loc); ok {
		return &t
	}
	return nil
}

func (h *Handler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	var in settingsInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	v := util.NewValidator()
	v.Required("event_name", in.EventName, "Vui lòng nhập tên sự kiện")
	v.Email("contact_email", in.ContactEmail, "Email liên hệ không hợp lệ")
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Thông tin chưa hợp lệ", v.Errors)
		return
	}
	if in.Socials == nil {
		in.Socials = map[string]any{}
	}
	if in.Stats == nil {
		in.Stats = []map[string]any{}
	}
	if in.Highlights == nil {
		in.Highlights = []map[string]any{}
	}
	if in.HeroSlides == nil {
		in.HeroSlides = []map[string]any{}
	}
	regOpen := true
	if in.RegistrationOpen != nil {
		regOpen = *in.RegistrationOpen
	}

	s, err := scanSettings(h.DB.QueryRow(r.Context(), `
		UPDATE settings SET event_name=$1, event_tagline=$2, event_description=$3,
		   hero_title=$4, hero_subtitle=$5, hero_image=$6, logo=$7, start_date=$8, end_date=$9,
		   venue_name=$10, venue_address=$11, venue_map_url=$12, contact_email=$13,
		   contact_phone=$14, contact_address=$15, about_title=$16, about_content=$17,
		   about_image=$18, socials=$19, stats=$20, highlights=$21, hero_slides=$22,
		   seo_title=$23, seo_description=$24, registration_open=$25, updated_at=now()
		WHERE id = 1 RETURNING `+settingsCols,
		in.EventName, in.EventTagline, in.EventDescription, in.HeroTitle, in.HeroSubtitle,
		in.HeroImage, in.Logo, parseFlexTime(in.StartDate, h.Cfg.Location), parseFlexTime(in.EndDate, h.Cfg.Location),
		in.VenueName, in.VenueAddress, in.VenueMapURL, in.ContactEmail, in.ContactPhone,
		in.ContactAddress, in.AboutTitle, in.AboutContent, in.AboutImage, in.Socials,
		in.Stats, in.Highlights, in.HeroSlides, in.SEOTitle, in.SEODescription, regOpen))
	if err != nil {
		h.dbError(w, err, "Chưa có cấu hình sự kiện")
		return
	}
	util.OK(w, s)
}

// Home bundles everything the landing page renders into one round trip.
func (h *Handler) Home(w http.ResponseWriter, r *http.Request) {
	settings, err := scanSettings(h.DB.QueryRow(r.Context(),
		`SELECT `+settingsCols+` FROM settings WHERE id = 1`))
	if err != nil {
		h.dbError(w, err, "Chưa có cấu hình sự kiện")
		return
	}

	speakers := []models.Speaker{}
	if rows, err := h.DB.Query(r.Context(),
		`SELECT `+speakerCols+` FROM speakers WHERE is_published = TRUE
		 ORDER BY featured DESC, sort_order ASC, name ASC LIMIT 8`); err == nil {
		for rows.Next() {
			if sp, err := scanSpeaker(rows); err == nil {
				sp.Bio = ""
				speakers = append(speakers, sp)
			}
		}
		rows.Close()
	}

	posts := []models.Post{}
	if rows, err := h.DB.Query(r.Context(),
		`SELECT `+postListCols+` FROM posts WHERE is_published = TRUE
		 ORDER BY featured DESC, published_at DESC LIMIT 3`); err == nil {
		for rows.Next() {
			if p, err := scanPost(rows); err == nil {
				posts = append(posts, p)
			}
		}
		rows.Close()
	}

	partners := []models.Partner{}
	if rows, err := h.DB.Query(r.Context(),
		`SELECT `+partnerCols+` FROM partners WHERE is_published = TRUE
		 ORDER BY array_position(ARRAY['diamond','platinum','gold','silver','bronze','partner','media'], tier),
		          sort_order ASC LIMIT 24`); err == nil {
		for rows.Next() {
			if p, err := scanPartner(rows); err == nil {
				partners = append(partners, p)
			}
		}
		rows.Close()
	}

	gallery := []models.GalleryItem{}
	if rows, err := h.DB.Query(r.Context(),
		`SELECT `+galleryCols+` FROM gallery_items WHERE is_published = TRUE AND type = 'image'
		 ORDER BY sort_order ASC, created_at DESC LIMIT 8`); err == nil {
		for rows.Next() {
			if g, err := scanGallery(rows); err == nil {
				gallery = append(gallery, g)
			}
		}
		rows.Close()
	}

	// Only the first day's programme — the agenda page loads the rest.
	agendaPreview := []models.AgendaDay{}
	if rows, err := h.DB.Query(r.Context(),
		`SELECT id, label, title, date, sort_order FROM agenda_days ORDER BY sort_order, date LIMIT 1`); err == nil {
		for rows.Next() {
			var d models.AgendaDay
			if err := rows.Scan(&d.ID, &d.Label, &d.Title, &d.Date, &d.SortOrder); err == nil {
				d.Sessions = []models.AgendaSession{}
				agendaPreview = append(agendaPreview, d)
			}
		}
		rows.Close()
	}
	if len(agendaPreview) > 0 {
		if rows, err := h.DB.Query(r.Context(),
			`SELECT `+sessionCols+` FROM agenda_sessions
			 WHERE day_id = $1 AND is_published = TRUE
			 ORDER BY sort_order, start_time LIMIT 6`, agendaPreview[0].ID); err == nil {
			for rows.Next() {
				var s models.AgendaSession
				if err := rows.Scan(&s.ID, &s.DayID, &s.Title, &s.Description, &s.StartTime,
					&s.EndTime, &s.Room, &s.Track, &s.Type, &s.IsPublished, &s.SortOrder); err == nil {
					s.Speakers = []models.Speaker{}
					agendaPreview[0].Sessions = append(agendaPreview[0].Sessions, s)
				}
			}
			rows.Close()
		}
	}

	util.OK(w, util.Envelope{
		"settings": settings,
		"speakers": speakers,
		"posts":    posts,
		"partners": partners,
		"gallery":  gallery,
		"agenda":   agendaPreview,
	})
}
