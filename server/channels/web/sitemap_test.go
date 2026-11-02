// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package web

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSitemapHandler(t *testing.T) {
	t.Run("serves the client's semantic sitemap, not cached for long", func(t *testing.T) {
		dir := t.TempDir()
		require.NoError(t, os.WriteFile(filepath.Join(dir, "semantic-sitemap.json"), []byte(`{"path":"/"}`), 0600))

		res := httptest.NewRecorder()
		sitemapHandler(dir).ServeHTTP(res, httptest.NewRequest(http.MethodGet, "/semantic-sitemap.json", nil))

		assert.Equal(t, http.StatusOK, res.Code)
		assert.Equal(t, `{"path":"/"}`, res.Body.String())
		assert.Equal(t, "application/json", res.Header().Get("Content-Type"))
		assert.Equal(t, "no-cache", res.Header().Get("Cache-Control"))
	})

	t.Run("answers 404 in a build without one", func(t *testing.T) {
		res := httptest.NewRecorder()
		sitemapHandler(t.TempDir()).ServeHTTP(res, httptest.NewRequest(http.MethodGet, "/semantic-sitemap.json", nil))

		assert.Equal(t, http.StatusNotFound, res.Code)
	})
}
