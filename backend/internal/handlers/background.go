package handlers

import (
	"context"
	"time"
)

// backgroundCtx detaches short fire-and-forget writes from the request lifetime.
func backgroundCtx() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), 5*time.Second)
}
