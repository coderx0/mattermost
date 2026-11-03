#!/usr/bin/env bash
# Packs the Agent Object Model's core package from ../../agent-om (or
# AGENT_OM_DIR) into vendor/agent-om/, where channels/package.json installs it
# from (a file: tarball, as an npm user gets it), and sets the tarball's
# checksum in package-lock.json, which npm keeps when the version stays the
# same. Run it again after changing agent-om, then `npm install`.
set -euo pipefail

webapp="$(cd "$(dirname "$0")/.." && pwd)"
agentom="${AGENT_OM_DIR:-$webapp/../../agent-om}"
out="$webapp/vendor/agent-om"

mkdir -p "$out"
rm -f "$out"/*.tgz
(cd "$agentom" && pnpm --filter @agent-om/core build)
(cd "$agentom/packages/core" && pnpm pack --pack-destination "$out" >/dev/null)
node -e '
const fs = require("fs");
const crypto = require("crypto");
const [lockPath, tgz] = process.argv.slice(1);
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
lock.packages["node_modules/@agent-om/core"].integrity = "sha512-" + crypto.createHash("sha512").update(fs.readFileSync(tgz)).digest("base64");
fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
' "$webapp/package-lock.json" "$out/agent-om-core-0.0.0.tgz"
ls "$out"
