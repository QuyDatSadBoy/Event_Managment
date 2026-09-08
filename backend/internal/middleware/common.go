package middleware

import (
	"log"
	"net/http"
	"runtime/debug"
	"sync"
	"time"

	"github.com/vhdcorp/event-api/internal/util"
)

type statusWriter struct {
	http.ResponseWriter
	status int
	bytes  int
}

func (w *statusWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *statusWriter) Write(b []byte) (int, error) {
	if w.status == 0 {
		w.status = http.StatusOK
	}
	n, err := w.ResponseWriter.Write(b)
	w.bytes += n
	return n, err
}

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w}
		next.ServeHTTP(sw, r)
		if sw.status == 0 {
			sw.status = http.StatusOK
		}
		log.Printf("%s %s %d %dB %s", r.Method, r.URL.Path, sw.status, sw.bytes, time.Since(start).Round(time.Microsecond))
	})
}

func Recoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("[panic] %s %s: %v\n%s", r.Method, r.URL.Path, rec, debug.Stack())
				util.Error(w, http.StatusInternalServerError, "Đã có lỗi xảy ra, vui lòng thử lại")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "SAMEORIGIN")
		h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		next.ServeHTTP(w, r)
	})
}

// RateLimiter is a small fixed-window limiter keyed by client IP.
// Public write endpoints (registration, contact) are the ones that need it.
type RateLimiter struct {
	mu       sync.Mutex
	hits     map[string]*window
	limit    int
	interval time.Duration
}

type window struct {
	count int
	reset time.Time
}

func NewRateLimiter(limit int, interval time.Duration) *RateLimiter {
	rl := &RateLimiter{hits: map[string]*window{}, limit: limit, interval: interval}
	go rl.sweep()
	return rl
}

func (rl *RateLimiter) sweep() {
	for range time.Tick(5 * time.Minute) {
		rl.mu.Lock()
		now := time.Now()
		for k, w := range rl.hits {
			if now.After(w.reset) {
				delete(rl.hits, k)
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := clientIP(r)
		rl.mu.Lock()
		win, ok := rl.hits[ip]
		now := time.Now()
		if !ok || now.After(win.reset) {
			win = &window{reset: now.Add(rl.interval)}
			rl.hits[ip] = win
		}
		win.count++
		over := win.count > rl.limit
		rl.mu.Unlock()

		if over {
			util.Error(w, http.StatusTooManyRequests, "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func clientIP(r *http.Request) string {
	if ip := r.Header.Get("CF-Connecting-IP"); ip != "" {
		return ip
	}
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		if i := len(ip); i > 0 {
			for j := 0; j < i; j++ {
				if ip[j] == ',' {
					return ip[:j]
				}
			}
		}
		return ip
	}
	return r.RemoteAddr
}
