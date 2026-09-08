package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID  `json:"id"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	Name         string     `json:"name"`
	Role         string     `json:"role"`
	Avatar       string     `json:"avatar"`
	IsActive     bool       `json:"is_active"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

type Settings struct {
	EventName        string           `json:"event_name"`
	EventTagline     string           `json:"event_tagline"`
	EventDescription string           `json:"event_description"`
	HeroTitle        string           `json:"hero_title"`
	HeroSubtitle     string           `json:"hero_subtitle"`
	HeroImage        string           `json:"hero_image"`
	Logo             string           `json:"logo"`
	StartDate        *time.Time       `json:"start_date"`
	EndDate          *time.Time       `json:"end_date"`
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
	RegistrationOpen bool             `json:"registration_open"`
	UpdatedAt        time.Time        `json:"updated_at"`
}

type Speaker struct {
	ID          uuid.UUID      `json:"id"`
	Slug        string         `json:"slug"`
	Name        string         `json:"name"`
	Title       string         `json:"title"`
	Company     string         `json:"company"`
	Country     string         `json:"country"`
	Photo       string         `json:"photo"`
	Bio         string         `json:"bio"`
	ShortBio    string         `json:"short_bio"`
	Topics      []string       `json:"topics"`
	Socials     map[string]any `json:"socials"`
	Featured    bool           `json:"featured"`
	IsPublished bool           `json:"is_published"`
	SortOrder   int            `json:"sort_order"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`

	Sessions []AgendaSession `json:"sessions,omitempty"`
	Posts    []Post          `json:"posts,omitempty"`
}

type AgendaDay struct {
	ID        uuid.UUID       `json:"id"`
	Label     string          `json:"label"`
	Title     string          `json:"title"`
	Date      time.Time       `json:"date"`
	SortOrder int             `json:"sort_order"`
	Sessions  []AgendaSession `json:"sessions"`
}

type AgendaSession struct {
	ID          uuid.UUID `json:"id"`
	DayID       uuid.UUID `json:"day_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	StartTime   string    `json:"start_time"`
	EndTime     string    `json:"end_time"`
	Room        string    `json:"room"`
	Track       string    `json:"track"`
	Type        string    `json:"type"`
	IsPublished bool      `json:"is_published"`
	SortOrder   int       `json:"sort_order"`

	DayLabel   string     `json:"day_label,omitempty"`
	DayDate    *time.Time `json:"day_date,omitempty"`
	Speakers   []Speaker  `json:"speakers"`
	SpeakerIDs []string   `json:"speaker_ids,omitempty"`
}

type Post struct {
	ID          uuid.UUID  `json:"id"`
	Slug        string     `json:"slug"`
	Title       string     `json:"title"`
	Excerpt     string     `json:"excerpt"`
	Content     string     `json:"content"`
	Cover       string     `json:"cover"`
	Category    string     `json:"category"`
	Tags        []string   `json:"tags"`
	AuthorName  string     `json:"author_name"`
	SpeakerID   *uuid.UUID `json:"speaker_id"`
	IsPublished bool       `json:"is_published"`
	Featured    bool       `json:"featured"`
	Views       int        `json:"views"`
	PublishedAt time.Time  `json:"published_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	Speaker *Speaker `json:"speaker,omitempty"`
}

type GalleryItem struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Type        string    `json:"type"`
	URL         string    `json:"url"`
	Thumbnail   string    `json:"thumbnail"`
	Album       string    `json:"album"`
	FileSize    int64     `json:"file_size"`
	IsPublished bool      `json:"is_published"`
	SortOrder   int       `json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
}

type Partner struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Logo        string    `json:"logo"`
	Website     string    `json:"website"`
	Description string    `json:"description"`
	Tier        string    `json:"tier"`
	IsPublished bool      `json:"is_published"`
	SortOrder   int       `json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
}

type Registration struct {
	ID         uuid.UUID `json:"id"`
	Code       string    `json:"code"`
	FullName   string    `json:"full_name"`
	Email      string    `json:"email"`
	Phone      string    `json:"phone"`
	Company    string    `json:"company"`
	JobTitle   string    `json:"job_title"`
	Country    string    `json:"country"`
	TicketType string    `json:"ticket_type"`
	Interests  []string  `json:"interests"`
	Note       string    `json:"note"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}

type Contact struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Subject   string    `json:"subject"`
	Message   string    `json:"message"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

type Media struct {
	ID           uuid.UUID `json:"id"`
	Filename     string    `json:"filename"`
	OriginalName string    `json:"original_name"`
	URL          string    `json:"url"`
	MimeType     string    `json:"mime_type"`
	Size         int64     `json:"size"`
	CreatedAt    time.Time `json:"created_at"`
}

// Meta carries pagination info alongside a list payload.
type Meta struct {
	Page       int   `json:"page"`
	PerPage    int   `json:"per_page"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}
