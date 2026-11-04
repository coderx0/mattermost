#!/usr/bin/env bash
# Starts the webapp's dev server with the Agent Object Model's chat
# (channels/src/agent_om/chat/): the app at http://localhost:9005, its
# requests sent on to a running Mattermost server (MM_URL, by default the
# Agent-Ready Web Benchmark's patched build at http://127.0.0.1:3312), and a
# column at the right where Claude Haiku carries out a request on the page.
# Every request calls the Anthropic API with ANTHROPIC_API_KEY. Each run's
# transcript is written to channels/transcripts/.
set -euo pipefail

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
    echo "ANTHROPIC_API_KEY is needed" >&2
    exit 1
fi
cd "$(dirname "$0")/../channels"
MM_SERVICESETTINGS_SITEURL="${MM_URL:-http://127.0.0.1:3312}" exec npm run dev-server
