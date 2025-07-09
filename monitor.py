# =========================================
# APTIV Machine Connectivity Monitor System
# =========================================

import json
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from ping3 import ping
import os

# =======================
# Configuration
# =======================
machines = [
    {"name": "MC01", "ip": "10.210.148.11", "zone": "G1"},
    {"name": "MC02", "ip": "10.210.148.10", "zone": "G1"},
    {"name": "MC03", "ip": "10.210.148.9", "zone": "G1"},
    {"name": "MC04", "ip": "192.168.1.10", "zone": "G1"},
    {"name": "MC05", "ip": "192.168.1.11", "zone": "G1"},
    {"name": "MC06", "ip": "192.168.1.12", "zone": "G1"},
    {"name": "MC07", "ip": "192.168.1.13", "zone": "G1"}
]

status_file = r"dashboard\status.json"
txt_log_file = r"logs\cutting_machine_log.txt"
json_log_file = r"logs\downtime_logs.json"

downtime_status = {}  # IP: start_time

# =======================
# Shift Management
# =======================
def get_current_shift():
    """Get the current shift based on time"""
    now = datetime.now()
    hour = now.hour
    
    if 6 <= hour < 14:
        return "MORNING"
    elif 14 <= hour < 22:
        return "AFTERNOON"
    else:
        return "NIGHT"

def get_shift_name(shift_code):
    """Convert shift code to readable name"""
    shift_names = {
        "MORNING": "Morning Shift (06:00-14:00)",
        "AFTERNOON": "Afternoon Shift (14:00-22:00)",
        "NIGHT": "Night Shift (22:00-06:00)"
    }
    return shift_names.get(shift_code, shift_code)

# =======================
# Ping
# =======================
def check_machine(machine):
    ip = machine["ip"]
    name = machine["name"]
    zone = machine["zone"]
    result = ping(ip, timeout=1)
    now = datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    status = "online" if result else "offline"
    current_shift = get_current_shift()

    # If machine goes offline
    if status == "offline":
        if ip not in downtime_status:
            downtime_status[ip] = now
            print(f"[{now_str}] 🔴 {name} ({ip}) in {zone} went OFFLINE during {get_shift_name(current_shift)}")

    # If machine comes back online
    else:
        if ip in downtime_status:
            start = downtime_status[ip]
            end = now
            duration = str(end - start).split(".")[0]
            date = now.strftime("%Y-%m-%d")
            
            # Determine shift when downtime started and ended
            start_shift = get_current_shift_at_time(start)
            end_shift = current_shift

            # Log to TXT
            log_line = f"{zone} | {name} | IP: {ip} | Downtime: {start} - {end} | Duration: {duration} | Date: {date} | Start Shift: {get_shift_name(start_shift)} | End Shift: {get_shift_name(end_shift)}"
            with open(txt_log_file, "a") as f:
                f.write(log_line + "\n")

            # Log to JSON
            json_entry = {
                "name": name,
                "ip": ip,
                "zone": zone,
                "start": start.strftime("%Y-%m-%d %H:%M:%S"),
                "end": end.strftime("%Y-%m-%d %H:%M:%S"),
                "duration": duration,
                "date": date,
                "start_shift": start_shift,
                "end_shift": end_shift,
                "shift_name_start": get_shift_name(start_shift),
                "shift_name_end": get_shift_name(end_shift)
            }

            if os.path.exists(json_log_file):
                with open(json_log_file, "r") as f:
                    logs = json.load(f)
            else:
                logs = []

            logs.append(json_entry)

            with open(json_log_file, "w") as f:
                json.dump(logs, f, indent=2)

            print(f"[{now_str}] 🟢 {name} ({ip}) in {zone} is back ONLINE after {duration} (Started: {get_shift_name(start_shift)}, Ended: {get_shift_name(end_shift)})")
            del downtime_status[ip]

    return {
        "name": name,
        "ip": ip,
        "zone": zone,
        "status": status,
        "lastChecked": now_str,
        "downtimeStart": downtime_status[ip].strftime("%Y-%m-%d %H:%M:%S") if ip in downtime_status else None,
        "currentShift": current_shift,
        "shiftName": get_shift_name(current_shift)
    }

def get_current_shift_at_time(timestamp):
    """Get the shift for a specific timestamp"""
    hour = timestamp.hour
    
    if 6 <= hour < 14:
        return "MORNING"
    elif 14 <= hour < 22:
        return "AFTERNOON"
    else:
        return "NIGHT"

# =======================
# Main Loop
# =======================
print("🔄 Starting APTIV Monitor with Shift Tracking... (Ctrl+C to stop)")
print(f"Current Shift: {get_shift_name(get_current_shift())}")

# Create logs directory if it doesn't exist
os.makedirs("logs", exist_ok=True)

while True:
    with ThreadPoolExecutor(max_workers=len(machines)) as executor:
        results = list(executor.map(check_machine, machines))

    with open(status_file, "w") as f:
        json.dump(results, f, indent=2)

    time.sleep(2)