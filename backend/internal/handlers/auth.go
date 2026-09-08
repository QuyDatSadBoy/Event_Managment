package handlers

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/vhdcorp/event-api/internal/middleware"
	"github.com/vhdcorp/event-api/internal/models"
	"github.com/vhdcorp/event-api/internal/util"
)

type loginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var in loginInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))

	v := util.NewValidator()
	v.Required("email", in.Email, "Vui lòng nhập email")
	v.Required("password", in.Password, "Vui lòng nhập mật khẩu")
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Thông tin chưa hợp lệ", v.Errors)
		return
	}

	var u models.User
	err := h.DB.QueryRow(r.Context(),
		`SELECT id, email, password_hash, name, role, avatar, is_active, created_at
		 FROM users WHERE email = $1`, in.Email,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Role, &u.Avatar, &u.IsActive, &u.CreatedAt)

	// Same message for "no such user" and "wrong password" — do not leak which.
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			util.Error(w, http.StatusUnauthorized, "Email hoặc mật khẩu không đúng")
			return
		}
		util.Error(w, http.StatusInternalServerError, "Lỗi hệ thống")
		return
	}
	if !u.IsActive {
		util.Error(w, http.StatusForbidden, "Tài khoản đã bị vô hiệu hoá")
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(in.Password)) != nil {
		util.Error(w, http.StatusUnauthorized, "Email hoặc mật khẩu không đúng")
		return
	}

	token, exp, err := h.Auth.Issue(u.ID, u.Email, u.Role, u.Name)
	if err != nil {
		util.Error(w, http.StatusInternalServerError, "Không tạo được phiên đăng nhập")
		return
	}
	_, _ = h.DB.Exec(r.Context(), `UPDATE users SET last_login_at = now() WHERE id = $1`, u.ID)

	util.JSON(w, http.StatusOK, util.Envelope{"data": util.Envelope{
		"token":      token,
		"expires_at": exp.Format(time.RFC3339),
		"user":       u,
	}})
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	claims := middleware.UserFrom(r.Context())
	if claims == nil {
		util.Error(w, http.StatusUnauthorized, "Chưa đăng nhập")
		return
	}
	var u models.User
	err := h.DB.QueryRow(r.Context(),
		`SELECT id, email, name, role, avatar, is_active, last_login_at, created_at
		 FROM users WHERE id = $1`, claims.UserID,
	).Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.Avatar, &u.IsActive, &u.LastLoginAt, &u.CreatedAt)
	if err != nil {
		h.dbError(w, err, "Không tìm thấy tài khoản")
		return
	}
	util.OK(w, u)
}

type changePasswordInput struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	claims := middleware.UserFrom(r.Context())
	var in changePasswordInput
	if err := util.Decode(w, r, &in); err != nil {
		util.Error(w, http.StatusBadRequest, "Dữ liệu gửi lên không hợp lệ")
		return
	}
	v := util.NewValidator()
	v.Required("current_password", in.CurrentPassword, "Vui lòng nhập mật khẩu hiện tại")
	v.Check(len(in.NewPassword) >= 8, "new_password", "Mật khẩu mới phải từ 8 ký tự")
	if !v.Valid() {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Thông tin chưa hợp lệ", v.Errors)
		return
	}

	var hash string
	if err := h.DB.QueryRow(r.Context(),
		`SELECT password_hash FROM users WHERE id = $1`, claims.UserID).Scan(&hash); err != nil {
		h.dbError(w, err, "Không tìm thấy tài khoản")
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.CurrentPassword)) != nil {
		util.ErrorFields(w, http.StatusUnprocessableEntity, "Mật khẩu hiện tại không đúng",
			map[string]string{"current_password": "Mật khẩu hiện tại không đúng"})
		return
	}
	newHash, err := bcrypt.GenerateFromPassword([]byte(in.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		util.Error(w, http.StatusInternalServerError, "Không đổi được mật khẩu")
		return
	}
	if _, err := h.DB.Exec(r.Context(),
		`UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
		string(newHash), claims.UserID); err != nil {
		util.Error(w, http.StatusInternalServerError, "Không đổi được mật khẩu")
		return
	}
	util.OK(w, util.Envelope{"message": "Đổi mật khẩu thành công"})
}
