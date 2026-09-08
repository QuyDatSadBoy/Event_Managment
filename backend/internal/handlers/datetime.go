package handlers

import (
	"strings"
	"time"
)

// Layouts a client may send. RFC3339 carries its own offset; the rest are
// "naive" wall-clock values from <input type="datetime-local"> / "date".
var (
	offsetLayouts = []string{time.RFC3339, "2006-01-02T15:04:05Z07:00", "2006-01-02T15:04Z07:00"}
	naiveLayouts  = []string{"2006-01-02T15:04:05", "2006-01-02T15:04", "2006-01-02"}
)

// parseTime resolves a client timestamp. Values without an offset are read in
// `loc` — the event's timezone — so "publish now" from the admin means now for
// the person clicking it, not seven hours from now.
func parseTime(value string, loc *time.Location) (time.Time, bool) {
	value = strings.TrimSpace(value)
	if value == "" {
		return time.Time{}, false
	}
	for _, layout := range offsetLayouts {
		if t, err := time.Parse(layout, value); err == nil {
			return t, true
		}
	}
	if loc == nil {
		loc = time.UTC
	}
	for _, layout := range naiveLayouts {
		if t, err := time.ParseInLocation(layout, value, loc); err == nil {
			return t, true
		}
	}
	return time.Time{}, false
}

// parseDateOnly accepts a calendar date, tolerating a trailing time part.
func parseDateOnly(value string, loc *time.Location) (time.Time, bool) {
	value = strings.TrimSpace(value)
	if value == "" {
		return time.Time{}, false
	}
	if loc == nil {
		loc = time.UTC
	}
	datePart := strings.Split(value, "T")[0]
	t, err := time.ParseInLocation("2006-01-02", datePart, loc)
	return t, err == nil
}
