#!/usr/bin/env bash
# Packs the Agent Object Model's packages from ../../agent-om (or AGENT_OM_DIR)
# into vendor/agent-om/, where channels/package.json installs them from (file:
# tarballs, as an npm user gets them): core, built first, which the app runs;
# and actions and agent, which ship their source and which only the dev-mode
# chat uses (agent_om/chat/). It sets each tarball's checksum in
# package-lock.json, which npm keeps while the version stays the same. Run it
# again after changing agent-om, then `npm install`.
set -euo pipefail

webapp="$(cd "$(dirname "$0")/.." && pwd)"
agentom="${AGENT_OM_DIR:-$webapp/../../agent-om}"
out="$webapp/vendor/agent-om"

mkdir -p "$out"
rm -f "$out"/*.tgz
(cd "$agentom" && pnpm --filter @agent-om/core build)
for pkg in core actions agent; do
    (cd "$agentom/packages/$pkg" && pnpm pack --pack-destination "$out" >/dev/null)
done
node -e '
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const [lockPath, dir] = process.argv.slice(1);
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
for (const pkg of ["core", "actions", "agent"]) {
    const entry = lock.packages[`node_modules/@agent-om/${pkg}`];
    if (entry) {
        entry.integrity = "sha512-" + crypto.createHash("sha512").update(fs.readFileSync(path.join(dir, `agent-om-${pkg}-0.0.0.tgz`))).digest("base64");
    }
}
fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
' "$webapp/package-lock.json" "$out"
ls "$out"
