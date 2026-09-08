package main

import (
	"context"
	"errors"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/vhdcorp/event-api/internal/config"
	"github.com/vhdcorp/event-api/internal/db"
	"github.com/vhdcorp/event-api/internal/handlers"
	"github.com/vhdcorp/event-api/internal/middleware"
	"github.com/vhdcorp/event-api/internal/seed"
)

func main() {
	seedDemo := flag.Bool("seed", false, "insert demo content after migrating, then exit")
	migrateOnly := flag.Bool("migrate", false, "run migrations then exit")
	flag.Parse()

	log.SetFlags(log.LstdFlags | log.Lmsgprefix)
	log.SetPrefix("[event-api] ")

	cfg := config.Load()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	database, err := db.Connect(ctx, cfg.DatabaseURL)
	cancel()
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer database.Close()

	migCtx, migCancel := context.WithTimeout(context.Background(), 2*time.Minute)
	if err := database.Migrate(migCtx); err != nil {
		migCancel()
		log.Fatalf("migrate: %v", err)
	}
	migCancel()

	// The first admin is created on every boot if the users table is empty,
	// so a fresh VPS is usable straight after deploy.
	bootCtx, bootCancel := context.WithTimeout(context.Background(), 30*time.Second)
	if err := seed.EnsureBaseline(bootCtx, database, cfg.AdminEmail, cfg.AdminPassword); err != nil {
		log.Printf("[warn] baseline seed: %v", err)
	}
	bootCancel()

	if *migrateOnly {
		log.Println("migrations complete")
		return
	}
	if *seedDemo {
		sCtx, sCancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer sCancel()
		if err := seed.Demo(sCtx, database); err != nil {
			log.Fatalf("seed: %v", err)
		}
		log.Println("demo content inserted")
		return
	}

	if err := os.MkdirAll(cfg.UploadDir, 0o755); err != nil {
		log.Fatalf("upload dir: %v", err)
	}

	auth := middleware.NewAuth(cfg.JWTSecret, cfg.JWTExpiryHours)
	h := handlers.New(database, cfg, auth)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           h.Routes(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       60 * time.Second,
		WriteTimeout:      120 * time.Second, // uploads and CSV export need room
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		log.Printf("listening on :%s (env=%s)", cfg.Port, cfg.Env)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("listen: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	log.Println("shutting down…")
	shutCtx, shutCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer shutCancel()
	if err := srv.Shutdown(shutCtx); err != nil {
		log.Printf("forced shutdown: %v", err)
	}
	log.Println("stopped")
}
