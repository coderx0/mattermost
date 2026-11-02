#!/usr/bin/env bash
# Packs the Agent Object Model's core package from ../../agent-om (or
# AGENT_OM_DIR) into vendor/agent-om/, where channels/package.json installs it
# from (a file: tarball, as an npm user gets it). Run it again after changing
# agent-om, then `npm install`.
set -euo pipefail

webapp="$(cd "$(dirname "$0")/.." && pwd)"
agentom="${AGENT_OM_DIR:-$webapp/../../agent-om}"
out="$webapp/vendor/agent-om"

mkdir -p "$out"
rm -f "$out"/*.tgz
(cd "$agentom" && pnpm --filter @agent-om/core build)
(cd "$agentom/packages/core" && pnpm pack --pack-destination "$out" >/dev/null)
ls "$out"
