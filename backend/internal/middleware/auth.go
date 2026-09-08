package middleware

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/vhdcorp/event-api/internal/util"
)

type ctxKey string

const userCtxKey ctxKey = "auth_user"

type Claims struct {
	UserID uuid.UUID `json:"uid"`
	Email  string    `json:"email"`
	Role   string    `json:"role"`
	Name   string    `json:"name"`
	jwt.RegisteredClaims
}

type Auth struct {
	Secret      []byte
	ExpiryHours int
}

func NewAuth(secret string, expiryHours int) *Auth {
	return &Auth{Secret: []byte(secret), ExpiryHours: expiryHours}
}

func (a *Auth) Issue(id uuid.UUID, email, role, name string) (string, time.Time, error) {
	exp := time.Now().Add(time.Duration(a.ExpiryHours) * time.Hour)
	claims := Claims{
		UserID: id, Email: email, Role: role, Name: name,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   id.String(),
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "event-api",
		},
	}
	s, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(a.Secret)
	return s, exp, err
}

func (a *Auth) parse(token string) (*Claims, error) {
	c := &Claims{}
	_, err := jwt.ParseWithClaims(token, c, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return a.Secret, nil
	}, jwt.WithValidMethods([]string{"HS256"}))
	return c, err
}

// Require rejects anything without a valid bearer token.
func (a *Auth) Require(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw := bearer(r)
		if raw == "" {
			util.Error(w, http.StatusUnauthorized, "Bạn cần đăng nhập để tiếp tục")
			return
		}
		claims, err := a.parse(raw)
		if err != nil {
			util.Error(w, http.StatusUnauthorized, "Phiên đăng nhập đã hết hạn")
			return
		}
		ctx := context.WithValue(r.Context(), userCtxKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireAdmin layers a role check on top of Require.
func (a *Auth) RequireAdmin(next http.Handler) http.Handler {
	return a.Require(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if c := UserFrom(r.Context()); c == nil || c.Role != "admin" {
			util.Error(w, http.StatusForbidden, "Bạn không có quyền thực hiện thao tác này")
			return
		}
		next.ServeHTTP(w, r)
	}))
}

func UserFrom(ctx context.Context) *Claims {
	c, _ := ctx.Value(userCtxKey).(*Claims)
	return c
}

func bearer(r *http.Request) string {
	h := r.Header.Get("Authorization")
	if h == "" {
		return ""
	}
	parts := strings.SplitN(h, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
}
