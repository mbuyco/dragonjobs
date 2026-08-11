#!/usr/bin/env bash

set -euo pipefail

# Get current directory
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_NAME="dragonjobs.db"

docker run -d \
  -p 8080:8080 \
  -v "${DIR}/../data/:/data" \
  -e SQLITE_DATABASE="/data/${DB_NAME}" \
  coleifer/sqlite-web
