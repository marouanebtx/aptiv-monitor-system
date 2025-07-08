document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("filter-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const dateFrom = new Date(document.getElementById("date-from").value);
    const dateTo = new Date(document.getElementById("date-to").value);
    const group = document.getElementById("group-select").value;
    const machineName = document
      .getElementById("machine-name")
      .value.trim()
      .toLowerCase();
    const groupBy = document.getElementById("group-by").value; // day, week, month

    fetch("../logs/downtime_logs.json")
      .then((res) => res.json())
      .then((logs) => {
        const filtered = logs.filter((log) => {
          const logDate = new Date(log.date);
          const inDateRange = logDate >= dateFrom && logDate <= dateTo;
          const inGroup = group === "ALL" || log.zone === group;
          const matchName =
            !machineName || log.name.toLowerCase().includes(machineName);

          // Shift filtering - check if the downtime occurred during the selected shift
          let inShift = true;
          if (selectedShift !== "ALL") {
            // Check if the downtime started or ended in the selected shift
            const startShift = log.start_shift || getShiftFromTime(log.start);
            const endShift = log.end_shift || getShiftFromTime(log.end);
            inShift =
              startShift === selectedShift || endShift === selectedShift;
          }

          return inDateRange && inGroup && matchName && inShift;
        });

        if (filtered.length === 0) {
          document.getElementById("paretoChart").style.display = "none";
          document.getElementById("no-data-msg").textContent =
            "❌ No data found for selected filters.";
          return;
        }

        document.getElementById("paretoChart").style.display = "block";
        document.getElementById("no-data-msg").textContent = "";

        const groupedData = {};

        filtered.forEach((log) => {
          const [h, m, s] = log.duration.split(":").map(Number);
          const seconds = h * 3600 + m * 60 + s;
          const logDate = new Date(log.date);

          let groupKey;
          switch (groupBy) {
            case "day":
              groupKey = logDate.toISOString().slice(0, 10); // e.g., 2025-07-02
              break;
            case "week":
              const firstDayOfWeek = new Date(logDate);
              firstDayOfWeek.setDate(logDate.getDate() - logDate.getDay()); // Sunday
              groupKey = firstDayOfWeek.toISOString().slice(0, 10); // e.g., 2025-06-29
              break;
            case "month":
              groupKey = `${logDate.getFullYear()}-${String(
                logDate.getMonth() + 1
              ).padStart(2, "0")}`; // e.g., 2025-07
              break;
          }

          groupedData[groupKey] = (groupedData[groupKey] || 0) + seconds;
        });

        const sortedMachines = Object.entries(machineDurations)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        const sortedGroups = Object.entries(groupedData).sort(
          (a, b) => new Date(a[0]) - new Date(b[0])
        );

        const labels = sortedGroups.map(([label]) => label);
        const data = sortedGroups.map(([, sec]) => (sec / 60).toFixed(2));

        showParetoChart(labels, data, selectedShift);
      });
  });
});

// Helper function to determine shift from timestamp (for older logs without shift info)
function getShiftFromTime(timestamp) {
  const date = new Date(timestamp);
  const hour = date.getHours();

  if (hour >= 6 && hour < 14) {
    return "MORNING";
  } else if (hour >= 14 && hour < 22) {
    return "AFTERNOON";
  } else {
    return "NIGHT";
  }
}

// Pareto Filter Logic with Group By Feature

let paretoChart;

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("filter-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const dateFrom = new Date(document.getElementById("date-from").value);
    const dateTo = new Date(document.getElementById("date-to").value);
    const group = document.getElementById("group-select").value;
    const machineName = document
      .getElementById("machine-name")
      .value.trim()
      .toLowerCase();
    const groupBy = document.getElementById("group-by").value;
    const selectedShift = document.getElementById("shift-select").value;

    fetch("../logs/downtime_logs.json")
      .then((res) => res.json())
      .then((logs) => {
        const filtered = logs.filter((log) => {
          const logDate = new Date(log.date);
          const inDateRange = logDate >= dateFrom && logDate <= dateTo;
          const inGroup = group === "ALL" || log.zone === group;
          const matchName =
            !machineName || log.name.toLowerCase().includes(machineName);

          let inShift = true;
          if (selectedShift !== "ALL") {
            const startShift = log.start_shift || getShiftFromTime(log.start);
            const endShift = log.end_shift || getShiftFromTime(log.end);
            inShift =
              startShift === selectedShift || endShift === selectedShift;
          }

          return inDateRange && inGroup && matchName && inShift;
        });

        if (filtered.length === 0) {
          document.getElementById("paretoChart").style.display = "none";
          document.getElementById("no-data-msg").textContent =
            "\u274C No data found for selected filters.";
          return;
        }

        document.getElementById("paretoChart").style.display = "block";
        document.getElementById("no-data-msg").textContent = "";

        const groupedData = {};

        filtered.forEach((log) => {
          const [h, m, s] = log.duration.split(":").map(Number);
          const seconds = h * 3600 + m * 60 + s;
          const logDate = new Date(log.date);

          let groupKey;
          switch (groupBy) {
            case "day":
              groupKey = logDate.toISOString().slice(0, 10);
              break;
            case "week":
              const firstDayOfWeek = new Date(logDate);
              firstDayOfWeek.setDate(logDate.getDate() - logDate.getDay());
              groupKey = firstDayOfWeek.toISOString().slice(0, 10);
              break;
            case "month":
              groupKey = `${logDate.getFullYear()}-${String(
                logDate.getMonth() + 1
              ).padStart(2, "0")}`;
              break;
          }

          groupedData[groupKey] = (groupedData[groupKey] || 0) + seconds;
        });

        const sortedGroups = Object.entries(groupedData).sort(
          (a, b) => new Date(a[0]) - new Date(b[0])
        );

        const labels = sortedGroups.map(([label]) => label);
        const data = sortedGroups.map(([, sec]) => (sec / 60).toFixed(2));

        showParetoChart(labels, data, selectedShift, groupBy);
      });
  });

  // ======== Select Date Preset =========
  document
    .getElementById("preset-range")
    .addEventListener("change", function () {
      const today = new Date();
      const startInput = document.getElementById("date-from");
      const endInput = document.getElementById("date-to");

      let startDate, endDate;

      switch (this.value) {
        case "today":
          startDate = new Date(today);
          endDate = new Date(today);
          break;
        case "lastWeek":
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 7);
          endDate = new Date(today);
          break;
        case "thisMonth":
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today);
          break;
        default:
          return;
      }

      startInput.value = startDate.toISOString().slice(0, 10);
      endInput.value = endDate.toISOString().slice(0, 10);
    });
});

// Helper to determine shift from time
function getShiftFromTime(timestamp) {
  const date = new Date(timestamp);
  const hour = date.getHours();

  if (hour >= 6 && hour < 14) return "MORNING";
  if (hour >= 14 && hour < 22) return "AFTERNOON";
  return "NIGHT";
}

// Draw Pareto Chart
function showParetoChart(labels, data, selectedShift, groupBy) {
  const ctx = document.getElementById("paretoChart").getContext("2d");
  if (paretoChart) paretoChart.destroy();

  const shiftNames = {
    MORNING: "Morning Shift (06:00-14:00)",
    AFTERNOON: "Afternoon Shift (14:00-22:00)",
    NIGHT: "Night Shift (22:00-06:00)",
    ALL: "All Shifts",
  };

  const chartTitle =
    selectedShift === "ALL"
      ? "Pareto Downtime (All Shifts)"
      : `Pareto Downtime - ${shiftNames[selectedShift]}`;

  paretoChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Downtime (minutes)",
          data: data,
          backgroundColor:
            selectedShift === "MORNING"
              ? "rgba(255, 193, 7, 0.6)"
              : selectedShift === "AFTERNOON"
              ? "rgba(40, 167, 69, 0.6)"
              : selectedShift === "NIGHT"
              ? "rgba(108, 117, 125, 0.6)"
              : "rgba(255, 99, 132, 0.6)",
          borderColor:
            selectedShift === "MORNING"
              ? "rgba(255, 193, 7, 1)"
              : selectedShift === "AFTERNOON"
              ? "rgba(40, 167, 69, 1)"
              : selectedShift === "NIGHT"
              ? "rgba(108, 117, 125, 1)"
              : "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: `${chartTitle} - Grouped by ${groupBy.toUpperCase()}`,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Minutes" },
        },
      },
    },
  });
}
