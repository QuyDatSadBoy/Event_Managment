package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config holds every knob the server reads at boot.
type Config struct {
	Port           string
	DatabaseURL    string
	JWTSecret      string
	JWTExpiryHours int
	UploadDir      string
	PublicBaseURL  string
	AllowedOrigins []string
	Env            string
	AdminEmail     string
	AdminPassword  string
	MaxUploadMB    int64
	Location       *time.Location
}

func Load() *Config {
	// .env is optional — in production everything comes from the process env.
	_ = godotenv.Load()

	c := &Config{
		Port:           env("PORT", "8090"),
		DatabaseURL:    env("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/event_db?sslmode=disable"),
		JWTSecret:      env("JWT_SECRET", "change-me-in-production"),
		JWTExpiryHours: envInt("JWT_EXPIRY_HOURS", 24*7),
		UploadDir:      env("UPLOAD_DIR", "./uploads"),
		PublicBaseURL:  strings.TrimRight(env("PUBLIC_BASE_URL", ""), "/"),
		Env:            env("APP_ENV", "development"),
		AdminEmail:     env("ADMIN_EMAIL", "admin@vhdcorp.com"),
		AdminPassword:  env("ADMIN_PASSWORD", "Admin@12345"),
		MaxUploadMB:    int64(envInt("MAX_UPLOAD_MB", 25)),
	}

	// Datetime-local inputs carry no offset. Reading them as UTC would push
	// every "publish now" seven hours into the future for a Vietnam editor, so
	// naive values are resolved against the event's own timezone.
	loc, err := time.LoadLocation(env("APP_TIMEZONE", "Asia/Ho_Chi_Minh"))
	if err != nil {
		log.Printf("[WARN] unknown APP_TIMEZONE, falling back to UTC: %v", err)
		loc = time.UTC
	}
	c.Location = loc

	origins := env("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3002")
	for _, o := range strings.Split(origins, ",") {
		if o = strings.TrimSpace(o); o != "" {
			c.AllowedOrigins = append(c.AllowedOrigins, o)
		}
	}

	if c.Env == "production" && c.JWTSecret == "change-me-in-production" {
		log.Println("[WARN] JWT_SECRET is still the default value — set it before going live")
	}
	return c
}

func (c *Config) IsProd() bool { return c.Env == "production" }

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func envInt(k string, def int) int {
	if v := os.Getenv(k); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}
