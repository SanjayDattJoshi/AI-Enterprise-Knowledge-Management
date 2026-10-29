#!/bin/sh
set -e

if [ "$WORKER_MODE" = "true" ]; then
  echo "Starting Background Worker Process..."
  exec node dist/queue/worker.runner.js
else
  echo "Starting Web API Server..."
  exec node dist/index.js
fi
