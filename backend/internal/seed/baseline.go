package seed

import (
	"context"
	"log"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"github.com/vhdcorp/event-api/internal/db"
)

// EnsureBaseline guarantees a settings row and at least one admin account exist.
// It is safe to call on every boot.
func EnsureBaseline(ctx context.Context, database *db.DB, adminEmail, adminPassword string) error {
	if _, err := database.Exec(ctx, `
		INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`); err != nil {
		return err
	}

	var users int64
	if err := database.QueryRow(ctx, `SELECT count(*) FROM users`).Scan(&users); err != nil {
		return err
	}
	if users > 0 {
		return nil
	}

	email := strings.ToLower(strings.TrimSpace(adminEmail))
	hash, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	if _, err := database.Exec(ctx, `
		INSERT INTO users (email, password_hash, name, role)
		VALUES ($1, $2, $3, 'admin')`, email, string(hash), "Quản trị viên"); err != nil {
		return err
	}
	log.Printf("[seed] created first admin account: %s", email)
	return nil
}
