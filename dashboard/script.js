let allMachines = [];
let machinesByZone = {};
let currentZone = "ALL";
let totalDowntimeSeconds = 0;
let currentShift = null;
let shiftStartTime = null;
let shiftDowntimeSeconds = 0;

// Shift configuration
const SHIFTS = {
  MORNING: { start: 6, end: 14, name: "Shift 1" },
  AFTERNOON: { start: 14, end: 22, name: "Shift 2" },
  NIGHT: { start: 22, end: 6, name: "Shift 3" },
};

function getCurrentShift() {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 6 && hour < 14) {
    return "MORNING";
  } else if (hour >= 14 && hour < 22) {
    return "AFTERNOON";
  } else {
    return "NIGHT";
  }
}

function getShiftStartTime(shiftType) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (shiftType) {
    case "MORNING":
      return new Date(today.getTime() + 6 * 60 * 60 * 1000); // 06:00 today
    case "AFTERNOON":
      return new Date(today.getTime() + 14 * 60 * 60 * 1000); // 14:00 today
    case "NIGHT":
      // Night shift starts at 22:00 today or yesterday depending on current time
      if (now.getHours() >= 22) {
        return new Date(today.getTime() + 22 * 60 * 60 * 1000); // 22:00 today
      } else {
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return new Date(yesterday.getTime() + 22 * 60 * 60 * 1000); // 22:00 yesterday
      }
  }
}

function checkShiftChange() {
  const newShift = getCurrentShift();

  if (currentShift !== newShift) {
    // Shift has changed - reset shift downtime
    console.log(`Shift changed from ${currentShift} to ${newShift}`);
    currentShift = newShift;
    shiftStartTime = getShiftStartTime(newShift);
    shiftDowntimeSeconds = 0;

    // Recalculate shift downtime for machines that are currently offline
    calculateShiftDowntime();
  }
}

function calculateShiftDowntime() {
  const now = new Date();
  shiftDowntimeSeconds = 0;

  allMachines.forEach((machine) => {
    if (machine.status === "offline" && machine.downtimeStart) {
      const downtimeStart = new Date(machine.downtimeStart);

      // Calculate downtime only within current shift
      const relevantStart =
        downtimeStart > shiftStartTime ? downtimeStart : shiftStartTime;
      const diffSeconds = Math.floor((now - relevantStart) / 1000);

      if (diffSeconds > 0) {
        shiftDowntimeSeconds += diffSeconds;
      }
    }
  });
}

async function fetchStatus() {
  try {
    const res = await fetch("status.json?ts=" + new Date().getTime());
    const data = await res.json();

    allMachines = data;
    machinesByZone = {};
    let globalLastCheck = "";
    totalDowntimeSeconds = 0;
    const now = new Date();

    // Initialize shift tracking if not already set
    if (!currentShift) {
      currentShift = getCurrentShift();
      shiftStartTime = getShiftStartTime(currentShift);
    }

    // Check for shift changes
    checkShiftChange();

    data.forEach((machine) => {
      const zone = machine.zone || "Unknown";
      if (!machinesByZone[zone]) machinesByZone[zone] = [];
      machinesByZone[zone].push(machine);

      globalLastCheck = machine.lastChecked;

      // Calculate total downtime (all time)
      if (machine.status === "offline" && machine.downtimeStart) {
        const start = new Date(machine.downtimeStart);
        const diffSeconds = Math.floor((now - start) / 1000);
        totalDowntimeSeconds += diffSeconds;
      }
    });

    // Calculate shift-specific downtime
    calculateShiftDowntime();

    const timeOnly = globalLastCheck.split(" ")[1]; // splits "2025-07-02 23:32:49" → ["2025-07-02", "23:32:49"]
    document.getElementById("last-checked").textContent = "Time: " + timeOnly;

    updateDashboard(currentZone);
    updateSummary();
  } catch (err) {
    document.getElementById("dashboard-content").innerHTML =
      "<p style='color:red;'>❌ Cannot load status.json</p>";
    // Keep updating time even when connection fails
    updateCurrentTime();
  }
}

function updateCurrentTime() {
  const now = new Date();
  const timeString = now.toTimeString().split(" ")[0]; // Gets HH:MM:SS format
  document.getElementById("last-checked").textContent = "Time: " + timeString;
}

function updateDashboard(selectedZone) {
  currentZone = selectedZone;
  const dashboard = document.getElementById("dashboard-content");
  dashboard.innerHTML = "";

  let machinesToShow =
    selectedZone === "ALL" ? allMachines : machinesByZone[selectedZone] || [];

  const searchTerm = document.getElementById("search-box").value.toLowerCase();
  machinesToShow = machinesToShow.filter((m) =>
    m.name.toLowerCase().includes(searchTerm)
  );

  if (machinesToShow.length === 0) {
    dashboard.innerHTML = `<p>No machines found in ${selectedZone}</p>`;
    return;
  }

  const section = document.createElement("div");
  section.className = "zone-section";

  machinesToShow.forEach((machine) => {
    const card = document.createElement("div");
    card.className = `machine-card ${machine.status}`;

    card.innerHTML = `
      <div class="machine-name">${machine.name}</div>
      <div class="machine-zone">Zone: ${machine.zone}</div>
      <div class="status">${machine.status.toUpperCase()}</div>
    `;

    section.appendChild(card);
  });

  dashboard.appendChild(section);
}

function updateSummary() {
  const total = allMachines.length;
  const online = allMachines.filter((m) => m.status === "online").length;
  const offline = total - online;

  function formatDuration(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  const summary = document.getElementById("summary-box");
  const shiftName = SHIFTS[currentShift]?.name || "Unknown Shift";

  summary.innerHTML = `
    <div class="summary-stats">
      <span class="sum-total">Total: ${total}</span>
      <span class="sum-con">Connected: ${online}</span>
      <span class="sum-dis">Disconnected: ${offline}</span>
      <span class="sum-down">Shift Downtime: ${formatDuration(
        shiftDowntimeSeconds
      )}</span>
      <span class="current-shift">${shiftName}</span>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("search-box").addEventListener("input", () => {
    updateDashboard(currentZone);
  });

  document
    .getElementById("zone-select")
    .addEventListener("change", function () {
      currentZone = this.value;
      updateDashboard(currentZone);
    });

  fetchStatus();
  setInterval(fetchStatus, 5000);

  // Update current time every second, independent of fetch status
  setInterval(updateCurrentTime, 1000);
});
