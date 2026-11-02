# Mattermost Team Edition built from this checkout, for the Agent-Ready Web
# Benchmark: the webapp's production bundle, the server and mmctl, and the
# layout of the official image (server/build/Dockerfile) without downloading
# a release. No enterprise code and no prepackaged plugins.
#
#   docker build -t mattermost-benchmark .
#   docker run -e DATABASE_URL=postgresql://user:pass@db:5432/mattermost -p 8065:8065 mattermost-benchmark

ARG BUILD_NUMBER=12.0.1

FROM node:24.11.1-bookworm AS webapp
WORKDIR /src/webapp
COPY webapp/ ./
RUN npm ci && npm run build

FROM golang:1.26.10-bookworm AS server
ARG BUILD_NUMBER
WORKDIR /src/server
ENV GOFLAGS=-buildvcs=false
COPY server/ ./
# What `make build-cmd-linux` and `make package-prep` do for a team build
# (server/Makefile, server/build/release.mk), for this machine's architecture.
RUN go work init . ./public \
  && go build -trimpath -tags production -o /out/bin/ \
    -ldflags "-X 'github.com/mattermost/mattermost/server/public/model.BuildNumber=${BUILD_NUMBER}' \
      -X 'github.com/mattermost/mattermost/server/public/model.BuildDate=n/a' \
      -X 'github.com/mattermost/mattermost/server/public/model.BuildHash=n/a' \
      -X 'github.com/mattermost/mattermost/server/public/model.BuildHashEnterprise=none' \
      -X 'github.com/mattermost/mattermost/server/public/model.BuildEnterpriseReady=false'" \
    ./cmd/mattermost ./cmd/mmctl \
  && mkdir -p /out/config \
  && OUTPUT_CONFIG=/out/config/config.json go run ./scripts/config_generator \
  && sed -i -e 's|"ConsoleLevel": "DEBUG"|"ConsoleLevel": "INFO"|g' \
    -e 's|"SiteURL": "http://localhost:8065"|"SiteURL": ""|g' \
    -e 's|"SendEmailNotifications": true,|"SendEmailNotifications": false,|g' \
    /out/config/config.json \
  && rm -rf templates/*.mjml templates/partials

FROM debian:bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates media-types tzdata \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 2000 mattermost \
  && useradd --uid 2000 --gid 2000 --home-dir /mattermost mattermost
WORKDIR /mattermost
COPY --from=server /out/bin/ bin/
COPY --from=server /out/config/ config/
COPY --from=server /src/server/i18n/ i18n/
COPY --from=server /src/server/fonts/ fonts/
COPY --from=server /src/server/templates/ templates/
COPY --from=webapp /src/webapp/channels/dist/ client/
COPY server/build/benchmark-entrypoint.sh bin/
RUN mkdir -p data logs plugins client/plugins && chown -R mattermost:mattermost /mattermost
USER mattermost
ENV PATH="/mattermost/bin:${PATH}" \
  MM_SERVICESETTINGS_ENABLELOCALMODE=true
EXPOSE 8065
ENTRYPOINT ["benchmark-entrypoint.sh"]
CMD ["mattermost"]
