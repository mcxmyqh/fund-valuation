#!/bin/bash
cd "$(dirname "$0")"
nohup python3 watchlist_server.py > watchlist_server.log 2>&1 &
echo $! > watchlist_server.pid
echo "Watchlist server started (pid: $(cat watchlist_server.pid))"
