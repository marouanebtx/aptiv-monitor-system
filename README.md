# APTIV Machine Monitoring System

A real-time machine status system that pings multiple machines and displays their connection status with downtime tracking.

## Features

- Monitors machine status via ping
- Real-time dashboard with live updates every 5 seconds
- Filter by zone, machine name, and date range
- Pareto graph for downtime analysis
- Auto-logging of downtime to JSON and TXT files

## Project Structure

- `monitor.py`: Python script that runs the ping monitor
- `dashboard/`: Frontend files (HTML, CSS, JS)
- `logs/`: Log files (generated automatically)
- `start_dashboard.bat`: One-click starter for Windows
