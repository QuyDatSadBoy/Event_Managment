package handlers

import (
	"net/http"
	"strings"

	"github.com/vhdcorp/event-api/internal/models"
	"github.com/vhdcorp/event-api/internal/util"
)

const partnerCols = `id, name, logo, website, description, tier, is_published, sort_order, created_at`

var partnerTiers = []string{"diamond", "platinum", "gold", "silver", "bronze", "partner", "media"}

func scanPartner(row interface{ Scan(...any) error }) (models.Partner, error) {
	var p models.Partner
	err := row.Scan(&p.ID, &p.Name, &p.Logo, &p.Website, &p.Description, &p.Tier,
		&p.IsPublished, &p.SortOrder, &p.CreatedAt)
	return p, err
}

func (h *Handler) ListPartners(w http.ResponseWriter, r *http.Request) {
	admin := isAdminScope(r)
	tier := strings.TrimSpace(r.URL.Query().Get("tier"))

	where := []string{"TRUE"}
	args := []any{}
	if !admin {
		where = append(where, "is_published = TRUE")
	}
	if tier != "" && tier != "all" {
		args = append(args, tier)
		where = append(where, "tier = $"+itoa(len(args)))
	}

	// array_position keeps diamond above platinum above gold … in one pass.
	rows, err := h.DB.Query(r.Context(),
		`SELECT `+partnerCols+` FROM partners WHERE `+strings.Join(where, " AND ")+`
		 ORDER BY array_position(ARRAY['diamond','platinum','gold','silver','bronze','partner','media'], tier),
		          sort_order ASC, name ASC`, args...)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	defer rows.Close()

	list := []models.Partner{}
	for rows.Next() {
		if p, err := scanPartner(rows); err == nil {
			list = append(list, p)
		}
	}
	util.OK(w, list)
}

type partnerInput struct {
	Name        string `json:"name"`
	Logo        string `json:"logo"`
	Website     string `json:"website"`
	Description string `json:"description"`
	Tier        string `json:"tier"`
	IsPublished *bool  `json:"is_published"`
	SortOrder   int    `json:"sort_order"`
}

func (h *Handler) CreatePartner(w http.ResponseWriter, r *http.Request) {
	var in partnerInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	if in.Tier == "" {
		in.Tier = "partner"
	}
	v := util.NewValidator()
	v.Required("name", in.Name, "Vui lòng nhập tên đối tác")
	v.In("tier", in.Tier, partnerTiers, "Hạng đối tác không hợp lệ")
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Thông tin chưa hợp lệ", v.Errors)
		return
	}
	published := true
	if in.IsPublished != nil {
		published = *in.IsPublished
	}

	p, err := scanPartner(h.DB.QueryRow(r.Context(), `
		INSERT INTO partners (name, logo, website, description, tier, is_published, sort_order)
		VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING `+partnerCols,
		strings.TrimSpace(in.Name), in.Logo, in.Website, in.Description, in.Tier, published, in.SortOrder))
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	util.Created(w, p)
}

func (h *Handler) UpdatePartner(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "id")
	if !ok {
		return
	}
	var in partnerInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	if in.Tier == "" {
		in.Tier = "partner"
	}
	v := util.NewValidator()
	v.Required("name", in.Name, "Vui lòng nhập tên đối tác")
	v.In("tier", in.Tier, partnerTiers, "Hạng đối tác không hợp lệ")
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Thông tin chưa hợp lệ", v.Errors)
		return
	}
	published := true
	if in.IsPublished != nil {
		published = *in.IsPublished
	}

	p, err := scanPartner(h.DB.QueryRow(r.Context(), `
		UPDATE partners SET name=$1, logo=$2, website=$3, description=$4, tier=$5,
		       is_published=$6, sort_order=$7, updated_at=now()
		WHERE id=$8 RETURNING `+partnerCols,
		strings.TrimSpace(in.Name), in.Logo, in.Website, in.Description, in.Tier,
		published, in.SortOrder, id))
	if err != nil {
		h.dbError(w, err, "Không tìm thấy đối tác")
		return
	}
	util.OK(w, p)
}

func (h *Handler) DeletePartner(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r, "id")
	if !ok {
		return
	}
	tag, err := h.DB.Exec(r.Context(), `DELETE FROM partners WHERE id = $1`, id)
	if err != nil {
		h.dbError(w, err, "")
		return
	}
	if tag.RowsAffected() == 0 {
		util.Error(w, http.StatusNotFound, "Không tìm thấy đối tác")
		return
	}
	util.OK(w, util.Envelope{"message": "Đã xoá đối tác"})
}
