#!/usr/bin/env bash
# Triggers a Coolify redeploy so the FF tracker's build-time Steam fetch
# runs again. Meant to run on a cron on the Coolify host itself (not
# GitHub Actions) so the "Allowed IPs for API Access" setting can be
# locked to just this machine instead of GitHub's huge, rotating
# Actions-runner IP ranges.
#
# Reads COOLIFY_WEBHOOK_URL (the resource's Configuration -> Webhooks ->
# "Deploy Webhook (auth required)" URL) and COOLIFY_API_TOKEN (a token
# with the `deploy` permission scope, from Keys & Tokens -> API Tokens)
# from the environment — set these in whatever env file your cron entry
# sources, never hardcode them here.
set -euo pipefail

: "${COOLIFY_WEBHOOK_URL:?COOLIFY_WEBHOOK_URL not set}"
: "${COOLIFY_API_TOKEN:?COOLIFY_API_TOKEN not set}"

curl -sf -X GET "${COOLIFY_WEBHOOK_URL}" \
  -H "Authorization: Bearer ${COOLIFY_API_TOKEN}"
