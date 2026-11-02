#!/bin/sh
# The root Dockerfile's entrypoint: a database address given as DATABASE_URL
# (as the Agent-Ready Web Benchmark gives it) becomes Mattermost's data source.
# The benchmark's database has no TLS.
if [ -n "$DATABASE_URL" ] && [ -z "$MM_SQLSETTINGS_DATASOURCE" ]; then
  export MM_SQLSETTINGS_DRIVERNAME=postgres
  export MM_SQLSETTINGS_DATASOURCE="${DATABASE_URL}?sslmode=disable&connect_timeout=10"
fi
exec "$@"
