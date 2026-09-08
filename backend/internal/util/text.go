package util

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"regexp"
	"strings"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

var (
	nonSlug  = regexp.MustCompile(`[^a-z0-9]+`)
	dashRuns = regexp.MustCompile(`-{2,}`)
	// Go's RE2 has no backreferences, so script and style get one pattern each.
	scriptRe = regexp.MustCompile(`(?is)<script\b[^>]*>.*?</script\s*>`)
	styleRe  = regexp.MustCompile(`(?is)<style\b[^>]*>.*?</style\s*>`)
	tagRe    = regexp.MustCompile(`(?s)<[^>]*>`)
)

// Slugify turns "Chuyển đổi số 2026!" into "chuyen-doi-so-2026".
func Slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.NewReplacer("đ", "d", "Đ", "d").Replace(s)

	// Strip diacritics: decompose, drop combining marks, recompose.
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	if out, _, err := transform.String(t, s); err == nil {
		s = out
	}

	s = nonSlug.ReplaceAllString(s, "-")
	s = dashRuns.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if s == "" {
		s = "item"
	}
	return s
}

// StripHTML gives a plain-text version of rich content, for excerpts.
func StripHTML(s string) string {
	s = scriptRe.ReplaceAllString(s, " ")
	s = styleRe.ReplaceAllString(s, " ")
	s = tagRe.ReplaceAllString(s, " ")
	s = strings.NewReplacer("&nbsp;", " ", "&amp;", "&", "&lt;", "<", "&gt;", ">", "&quot;", `"`).Replace(s)
	return strings.Join(strings.Fields(s), " ")
}

func Truncate(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return strings.TrimSpace(string(r[:n])) + "…"
}

const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no look-alike glyphs

// RegistrationCode returns a short, human-readable ticket code.
func RegistrationCode(prefix string) string {
	b := make([]byte, 8)
	for i := range b {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(codeAlphabet))))
		if err != nil {
			return fmt.Sprintf("%s-%08d", prefix, i)
		}
		b[i] = codeAlphabet[n.Int64()]
	}
	return fmt.Sprintf("%s-%s-%s", prefix, string(b[:4]), string(b[4:]))
}
