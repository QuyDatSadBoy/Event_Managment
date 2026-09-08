package handlers

import (
	"net/http"

	"github.com/vhdcorp/event-api/internal/models"
	"github.com/vhdcorp/event-api/internal/util"
)

// DashboardStats feeds the admin overview cards and the recent-activity lists.
func (h *Handler) DashboardStats(w http.ResponseWriter, r *http.Request) {
	counts := util.Envelope{}
	var (
		regTotal, regPending, regConfirmed int64
		speakers, posts, gallery, partners int64
		sessions, contactsUnread           int64
	)

	err := h.DB.QueryRow(r.Context(), `
		SELECT
			(SELECT count(*) FROM registrations),
			(SELECT count(*) FROM registrations WHERE status = 'pending'),
			(SELECT count(*) FROM registrations WHERE status = 'confirmed'),
			(SELECT count(*) FROM speakers),
			(SELECT count(*) FROM posts),
			(SELECT count(*) FROM gallery_items),
			(SELECT count(*) FROM partners),
			(SELECT count(*) FROM agenda_sessions),
			(SELECT count(*) FROM contacts WHERE is_read = FALSE)
	`).Scan(&regTotal, &regPending, &regConfirmed, &speakers, &posts, &gallery,
		&partners, &sessions, &contactsUnread)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	counts["registrations"] = regTotal
	counts["registrations_pending"] = regPending
	counts["registrations_confirmed"] = regConfirmed
	counts["speakers"] = speakers
	counts["posts"] = posts
	counts["gallery"] = gallery
	counts["partners"] = partners
	counts["sessions"] = sessions
	counts["contacts_unread"] = contactsUnread

	// Sign-ups per day for the last 14 days, gap-filled so the chart has no holes.
	trend := []util.Envelope{}
	if rows, err := h.DB.Query(r.Context(), `
		SELECT d::date AS day, COALESCE(c.n, 0)
		FROM generate_series(current_date - interval '13 days', current_date, interval '1 day') d
		LEFT JOIN (
			SELECT created_at::date AS day, count(*) AS n
			FROM registrations
			WHERE created_at >= current_date - interval '13 days'
			GROUP BY 1
		) c ON c.day = d::date
		ORDER BY day`); err == nil {
		for rows.Next() {
			var day any
			var n int64
			if err := rows.Scan(&day, &n); err == nil {
				trend = append(trend, util.Envelope{"date": day, "count": n})
			}
		}
		rows.Close()
	}

	byTicket := []util.Envelope{}
	if rows, err := h.DB.Query(r.Context(),
		`SELECT ticket_type, count(*) FROM registrations GROUP BY 1 ORDER BY 2 DESC`); err == nil {
		for rows.Next() {
			var t string
			var n int64
			if err := rows.Scan(&t, &n); err == nil {
				byTicket = append(byTicket, util.Envelope{"ticket_type": t, "count": n})
			}
		}
		rows.Close()
	}

	recent := []models.Registration{}
	if rows, err := h.DB.Query(r.Context(),
		`SELECT `+regCols+` FROM registrations ORDER BY created_at DESC LIMIT 8`); err == nil {
		for rows.Next() {
			if g, err := scanRegistration(rows); err == nil {
				recent = append(recent, g)
			}
		}
		rows.Close()
	}

	util.OK(w, util.Envelope{
		"counts":    counts,
		"trend":     trend,
		"by_ticket": byTicket,
		"recent":    recent,
	})
}
