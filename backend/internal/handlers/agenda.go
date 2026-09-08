package handlers

import (
	"net/http"
	"strings"

	"github.com/google/uuid"

	"github.com/vhdcorp/event-api/internal/models"
	"github.com/vhdcorp/event-api/internal/util"
)

const sessionCols = `id, day_id, title, description, start_time, end_time, room, track,
	type, is_published, sort_order`

// GetAgenda returns the whole programme as days -> sessions -> speakers in one call,
// which is all the public agenda page needs.
func (h *Handler) GetAgenda(w http.ResponseWriter, r *http.Request) {
	admin := isAdminScope(r)

	dayRows, err := h.DB.Query(r.Context(),
		`SELECT id, label, title, date, sort_order FROM agenda_days ORDER BY sort_order, date`)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	defer dayRows.Close()

	days := []models.AgendaDay{}
	index := map[uuid.UUID]int{}
	for dayRows.Next() {
		var d models.AgendaDay
		if err := dayRows.Scan(&d.ID, &d.Label, &d.Title, &d.Date, &d.SortOrder); err != nil {
			h.dbError(w, err, "")
			return
		}
		d.Sessions = []models.AgendaSession{}
		index[d.ID] = len(days)
		days = append(days, d)
	}
	dayRows.Close()

	pubFilter := ""
	if !admin {
		pubFilter = " WHERE is_published = TRUE"
	}
	sesRows, err := h.DB.Query(r.Context(),
		`SELECT `+sessionCols+` FROM agenda_sessions`+pubFilter+` ORDER BY sort_order, start_time`)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	defer sesRows.Close()

	sessionIdx := map[uuid.UUID][2]int{} // session id -> (day index, session index)
	for sesRows.Next() {
		var s models.AgendaSession
		if err := sesRows.Scan(&s.ID, &s.DayID, &s.Title, &s.Description, &s.StartTime,
			&s.EndTime, &s.Room, &s.Track, &s.Type, &s.IsPublished, &s.SortOrder); err != nil {
			h.dbError(w, err, "")
			return
		}
		di, ok := index[s.DayID]
		if !ok {
			continue
		}
		s.Speakers = []models.Speaker{}
		s.SpeakerIDs = []string{}
		days[di].Sessions = append(days[di].Sessions, s)
		sessionIdx[s.ID] = [2]int{di, len(days[di].Sessions) - 1}
	}
	sesRows.Close()

	// One extra query attaches every speaker to its sessions — no N+1.
	spRows, err := h.DB.Query(r.Context(), `
		SELECT ss.session_id, `+prefixCols("sp", speakerCols)+`
		FROM session_speakers ss
		JOIN speakers sp ON sp.id = ss.speaker_id
		ORDER BY sp.sort_order, sp.name`)
	if err == nil {
		defer spRows.Close()
		for spRows.Next() {
			var sid uuid.UUID
			var sp models.Speaker
			if err := spRows.Scan(&sid, &sp.ID, &sp.Slug, &sp.Name, &sp.Title, &sp.Company,
				&sp.Country, &sp.Photo, &sp.Bio, &sp.ShortBio, &sp.Topics, &sp.Socials,
				&sp.Featured, &sp.IsPublished, &sp.SortOrder, &sp.CreatedAt, &sp.UpdatedAt); err != nil {
				continue
			}
			pos, ok := sessionIdx[sid]
			if !ok {
				continue
			}
			if sp.Topics == nil {
				sp.Topics = []string{}
			}
			if sp.Socials == nil {
				sp.Socials = map[string]any{}
			}
			sp.Bio = "" // keep the agenda payload small
			target := &days[pos[0]].Sessions[pos[1]]
			target.Speakers = append(target.Speakers, sp)
			target.SpeakerIDs = append(target.SpeakerIDs, sp.ID.String())
		}
	}

	util.OK(w, days)
}

func prefixCols(prefix, cols string) string {
	parts := strings.Split(cols, ",")
	for i, p := range parts {
		parts[i] = prefix + "." + strings.TrimSpace(p)
	}
	return strings.Join(parts, ", ")
}

// ---------- Days ----------

type dayInput struct {
	Label     string `json:"label"`
	Title     string `json:"title"`
	Date      string `json:"date"` // YYYY-MM-DD
	SortOrder int    `json:"sort_order"`
}

func (h *Handler) CreateAgendaDay(w http.ResponseWriter, r *http.Request) {
	var in dayInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	v := util.NewValidator()
	v.Required("label", in.Label, "Vui lòng nhập nhãn ngày (VD: Ngày 1)")
	date, dateOK := parseDateOnly(in.Date, h.Cfg.Location)
	v.Check(dateOK, "date", "Ngày không hợp lệ")
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Thông tin chưa hợp lệ", v.Errors)
		return
	}

	var d models.AgendaDay
	err := h.DB.QueryRow(r.Context(), `
		INSERT INTO agenda_days (label, title, date, sort_order)
		VALUES ($1,$2,$3,$4) RETURNING id, label, title, date, sort_order`,
		in.Label, in.Title, date, in.SortOrder,
	).Scan(&d.ID, &d.Label, &d.Title, &d.Date, &d.SortOrder)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	d.Sessions = []models.AgendaSession{}
	util.Created(w, d)
}

func (h *Handler) UpdateAgendaDay(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "id")
	if !ok {
		return
	}
	var in dayInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	v := util.NewValidator()
	v.Required("label", in.Label, "Vui lòng nhập nhãn ngày")
	date, dateOK := parseDateOnly(in.Date, h.Cfg.Location)
	v.Check(dateOK, "date", "Ngày không hợp lệ")
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Thông tin chưa hợp lệ", v.Errors)
		return
	}

	var d models.AgendaDay
	err := h.DB.QueryRow(r.Context(), `
		UPDATE agenda_days SET label=$1, title=$2, date=$3, sort_order=$4, updated_at=now()
		WHERE id=$5 RETURNING id, label, title, date, sort_order`,
		in.Label, in.Title, date, in.SortOrder, id,
	).Scan(&d.ID, &d.Label, &d.Title, &d.Date, &d.SortOrder)
	if err != nil {
		h.dbError(w, err, "Không tìm thấy ngày trong chương trình")
		return
	}
	d.Sessions = []models.AgendaSession{}
	util.OK(w, d)
}

func (h *Handler) DeleteAgendaDay(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "id")
	if !ok {
		return
	}
	// ON DELETE CASCADE removes the day's sessions with it.
	tag, err := h.DB.Exec(r.Context(), `DELETE FROM agenda_days WHERE id = $1`, id)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	if tag.RowsAffected() == 0 {
		util.Error(w, http.StatusNotFound, "Không tìm thấy ngày trong chương trình")
		return
	}
	util.OK(w, util.Envelope{"message": "Đã xoá ngày và các phiên thuộc ngày đó"})
}

// ---------- Sessions ----------

type sessionInput struct {
	DayID       string   `json:"day_id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	StartTime   string   `json:"start_time"`
	EndTime     string   `json:"end_time"`
	Room        string   `json:"room"`
	Track       string   `json:"track"`
	Type        string   `json:"type"`
	IsPublished *bool    `json:"is_published"`
	SortOrder   int      `json:"sort_order"`
	SpeakerIDs  []string `json:"speaker_ids"`
}

var sessionTypes = []string{"session", "keynote", "panel", "break", "networking", "workshop", "ceremony"}

func (h *Handler) validateSession(in *sessionInput) (uuid.UUID, *util.Validator) {
	v := util.NewValidator()
	v.Required("title", in.Title, "Vui lòng nhập tên phiên")
	v.Required("start_time", in.StartTime, "Vui lòng nhập giờ bắt đầu")
	v.In("type", in.Type, sessionTypes, "Loại phiên không hợp lệ")
	dayID, err := uuid.Parse(in.DayID)
	v.Check(err == nil, "day_id", "Vui lòng chọn ngày")
	if in.Type == "" {
		in.Type = "session"
	}
	return dayID, v
}

func (h *Handler) writeSessionSpeakers(r *http.Request, sessionID uuid.UUID, ids []string) {
	_, _ = h.DB.Exec(r.Context(), `DELETE FROM session_speakers WHERE session_id = $1`, sessionID)
	for _, raw := range ids {
		sid, err := uuid.Parse(raw)
		if err != nil {
			continue
		}
		_, _ = h.DB.Exec(r.Context(),
			`INSERT INTO session_speakers (session_id, speaker_id) VALUES ($1,$2)
			 ON CONFLICT DO NOTHING`, sessionID, sid)
	}
}

func (h *Handler) CreateSession(w http.ResponseWriter, r *http.Request) {
	var in sessionInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	dayID, v := h.validateSession(&in)
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Thông tin chưa hợp lệ", v.Errors)
		return
	}
	published := true
	if in.IsPublished != nil {
		published = *in.IsPublished
	}

	var s models.AgendaSession
	err := h.DB.QueryRow(r.Context(), `
		INSERT INTO agenda_sessions (day_id, title, description, start_time, end_time,
		                             room, track, type, is_published, sort_order)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING `+sessionCols,
		dayID, in.Title, in.Description, in.StartTime, in.EndTime, in.Room, in.Track,
		in.Type, published, in.SortOrder,
	).Scan(&s.ID, &s.DayID, &s.Title, &s.Description, &s.StartTime, &s.EndTime,
		&s.Room, &s.Track, &s.Type, &s.IsPublished, &s.SortOrder)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	h.writeSessionSpeakers(r, s.ID, in.SpeakerIDs)
	s.Speakers = []models.Speaker{}
	s.SpeakerIDs = in.SpeakerIDs
	util.Created(w, s)
}

func (h *Handler) UpdateSession(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "id")
	if !ok {
		return
	}
	var in sessionInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	dayID, v := h.validateSession(&in)
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Thông tin chưa hợp lệ", v.Errors)
		return
	}
	published := true
	if in.IsPublished != nil {
		published = *in.IsPublished
	}

	var s models.AgendaSession
	err := h.DB.QueryRow(r.Context(), `
		UPDATE agenda_sessions SET day_id=$1, title=$2, description=$3, start_time=$4,
		       end_time=$5, room=$6, track=$7, type=$8, is_published=$9, sort_order=$10,
		       updated_at=now()
		WHERE id=$11 RETURNING `+sessionCols,
		dayID, in.Title, in.Description, in.StartTime, in.EndTime, in.Room, in.Track,
		in.Type, published, in.SortOrder, id,
	).Scan(&s.ID, &s.DayID, &s.Title, &s.Description, &s.StartTime, &s.EndTime,
		&s.Room, &s.Track, &s.Type, &s.IsPublished, &s.SortOrder)
	if err != nil {
		h.dbError(w, err, "Không tìm thấy phiên")
		return
	}
	h.writeSessionSpeakers(r, s.ID, in.SpeakerIDs)
	s.Speakers = []models.Speaker{}
	s.SpeakerIDs = in.SpeakerIDs
	util.OK(w, s)
}

func (h *Handler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "id")
	if !ok {
		return
	}
	tag, err := h.DB.Exec(r.Context(), `DELETE FROM agenda_sessions WHERE id = $1`, id)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	if tag.RowsAffected() == 0 {
		util.Error(w, http.StatusNotFound, "Không tìm thấy phiên")
		return
	}
	util.OK(w, util.Envelope{"message": "Đã xoá phiên"})
}
