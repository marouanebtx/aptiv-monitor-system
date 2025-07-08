@echo off
title APTIV Monitoring Launcher

:: ✅ Go to project directory
cd /d "D:\aptiv-monitor-dashboard"

:: ✅ Step 1 - Start monitor.py in hidden window
start "" /min python monitor.py

:: ✅ Step 2 - Wait 2 seconds for file generation
timeout /t 2 >nul

:: ✅ Step 3 - Start web server (serves current folder)
start "" python -m http.server 8080

:: ✅ Step 4 - Open browser to the dashboard
start "" http://localhost:8080/dashboard/dashboard.html

exit
