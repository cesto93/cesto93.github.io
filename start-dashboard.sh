#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

# Kill any previous hugo server, remove stale lock
pkill -f "hugo server" 2>/dev/null || true
rm -f .hugo_build.lock

echo "Starting Hugo server..."
echo "Open http://localhost:1313/en/posts/free-llm-dashboard/"
echo "   or http://localhost:1313/it/posts/dashboard-llm-gratuiti/"
echo "Press Ctrl+C to stop"
echo ""

exec hugo server --port 1313
