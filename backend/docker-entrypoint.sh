#!/bin/sh
set -e

STATIC_JSON_PATH="/app/static-jsons/petrobras.json"

if [ -f "$STATIC_JSON_PATH" ]; then
  export PETROBRAS_JSON_PATH="$STATIC_JSON_PATH"
fi

exec dotnet Poddynho.Api.dll
