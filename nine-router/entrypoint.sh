#!/bin/sh
# Start headroom with --no-telemetry to avoid cloud auth requirement
headroom proxy --host 0.0.0.0 --port 8787 --no-telemetry &
exec /entrypoint.sh "$@"
