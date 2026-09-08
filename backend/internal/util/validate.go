package util

import (
	"net/mail"
	"strings"
)

// Validator accumulates field errors so a request reports all its problems at once.
type Validator struct{ Errors map[string]string }

func NewValidator() *Validator { return &Validator{Errors: map[string]string{}} }

func (v *Validator) Valid() bool { return len(v.Errors) == 0 }

func (v *Validator) add(field, msg string) {
	if _, exists := v.Errors[field]; !exists {
		v.Errors[field] = msg
	}
}

func (v *Validator) Check(ok bool, field, msg string) {
	if !ok {
		v.add(field, msg)
	}
}

func (v *Validator) Required(field, value, msg string) {
	v.Check(strings.TrimSpace(value) != "", field, msg)
}

func (v *Validator) Email(field, value, msg string) {
	if strings.TrimSpace(value) == "" {
		return
	}
	_, err := mail.ParseAddress(value)
	v.Check(err == nil, field, msg)
}

func (v *Validator) MaxLen(field, value string, n int, msg string) {
	v.Check(len([]rune(value)) <= n, field, msg)
}

func (v *Validator) In(field, value string, allowed []string, msg string) {
	if value == "" {
		return
	}
	for _, a := range allowed {
		if a == value {
			return
		}
	}
	v.add(field, msg)
}
