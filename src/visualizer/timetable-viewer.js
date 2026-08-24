/**
 * Timetable Viewer Controller
 * Binds UI controls, renders the timetable grid, and connects export handlers.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const titleInput = document.getElementById("title-input");
  const btnDownloadPng = document.getElementById("btn-download-png");
  const btnDownloadWallpaper = document.getElementById(
    "btn-download-wallpaper",
  );
  const btnExportIcs = document.getElementById("btn-export-ics");
  const btnClose = document.getElementById("btn-close-viewer");

  const summaryBody = document.getElementById("summary-table-body");
  const totalUnitsEl = document.getElementById("total-units");

  let currentScheduleData = null;
  let timetableCore = null;

  // 1. Load Data from Chrome Storage or LocalStorage
  currentScheduleData = await loadScheduleData();

  if (
    !currentScheduleData ||
    !currentScheduleData.subjects ||
    currentScheduleData.subjects.length === 0
  ) {
    // Fallback sample data if opened standalone
    currentScheduleData = getSampleFallbackData();
  }

  // Set default dynamic title based on the student's actual section and campus
  const sectionText = currentScheduleData.section
    ? `${currentScheduleData.section} `
    : "";
  const defaultTitle = `${sectionText}1st Semester Schedule`;
  titleInput.value = defaultTitle;

  // Render initial view
  render();

  // Event Listeners
  titleInput.addEventListener("input", () => {
    document.getElementById("display-title").innerText = titleInput.value;
  });

  btnDownloadPng.addEventListener("click", () => {
    if (!timetableCore) return;
    ScheduleImageExporter.exportDesktopPNG(timetableCore, titleInput.value);
  });

  btnDownloadWallpaper.addEventListener("click", () => {
    if (!timetableCore) return;
    ScheduleImageExporter.exportPhoneWallpaperPNG(
      timetableCore,
      titleInput.value,
    );
  });

  btnExportIcs.addEventListener("click", () => {
    if (!currentScheduleData) return;
    CalendarExporter.exportICS(
      currentScheduleData.subjects,
      currentScheduleData.section || "BatStateU",
    );
  });

  if (btnClose) {
    btnClose.addEventListener("click", () => {
      window.parent.postMessage({ type: "BSU_CLOSE_VIEWER" }, "*");
    });
  }

  function formatInstructorName(name) {
    if (!name || name === "TBA") return "TBA";
    // If all caps, convert to clean Title Case without any title prefix
    if (name === name.toUpperCase()) {
      return name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return name.replace(/^Prof\.\s*/i, "");
  }

  function render() {
    timetableCore = new TimetableCore(currentScheduleData.subjects, {
      theme: "gizmoa-pastel",
    });

    document.getElementById("display-title").innerText = titleInput.value;

    renderGrid(timetableCore);
    renderSummaryTable(currentScheduleData.subjects);
  }

  function renderGrid(core) {
    const days = core.getDisplayDays();
    const intervals = core.getTimeIntervals();
    const slots = core.getProcessedSlots();

    // 1. Header row
    const headerRow = document.getElementById("grid-header-row");
    headerRow.style.gridTemplateColumns = `90px repeat(${days.length}, 1fr)`;
    headerRow.innerHTML = `
      <div class="day-header-cell" style="background:#ffffff; font-size:12px;">Time</div>
      ${days
        .map(
          (d) => `
        <div class="day-header-cell">${d}</div>
      `,
        )
        .join("")}
    `;

    // 2. Content area
    const contentArea = document.getElementById("grid-content-area");
    contentArea.style.gridTemplateColumns = `90px repeat(${days.length}, 1fr)`;
    contentArea.innerHTML = "";

    // Time Axis
    const timeAxis = document.createElement("div");
    timeAxis.className = "time-axis-col";
    intervals.slice(0, -1).forEach((inv) => {
      const slotDiv = document.createElement("div");
      slotDiv.className = `time-axis-slot ${inv.isHour ? "hour-slot" : ""}`;
      slotDiv.innerText = inv.label;
      timeAxis.appendChild(slotDiv);
    });
    contentArea.appendChild(timeAxis);

    // Day Columns with background guidelines
    days.forEach((day, dIdx) => {
      const dayCol = document.createElement("div");
      dayCol.className = "day-column";

      // Background guidelines
      intervals.slice(0, -1).forEach((inv, iIdx) => {
        const line = document.createElement("div");
        line.className = `grid-guideline ${inv.isHour ? "hour-line" : ""}`;
        line.style.top = `${(iIdx / (intervals.length - 1)) * 100}%`;
        dayCol.appendChild(line);
      });

      // Insert class blocks for this day
      const daySlots = slots.filter((s) => s.dayIndex === dIdx);
      daySlots.forEach((slot) => {
        const block = document.createElement("div");
        block.className = "sched-block";
        block.style.top = `${slot.topPercent}%`;
        block.style.height = `${slot.heightPercent}%`;
        block.style.backgroundColor = slot.color.bg;
        block.style.color = "#000000";
        block.style.borderColor = "#000000";

        const formattedProf = formatInstructorName(slot.instructor);

        block.innerHTML = `
          <div class="sched-block-top">
            <div class="sched-block-code">${slot.code} - ${slot.title}</div>
            ${slot.instructor && slot.instructor !== "TBA" ? `<div class="sched-block-prof">${formattedProf}</div>` : ""}
          </div>
          <div class="sched-block-bottom">
            <div class="sched-block-time">${slot.startTime} - ${slot.endTime}</div>
            <div class="sched-block-room">${slot.room}</div>
          </div>
        `;

        dayCol.appendChild(block);
      });

      contentArea.appendChild(dayCol);
    });
  }

  function renderSummaryTable(subjects) {
    summaryBody.innerHTML = "";
    let totalUnits = 0;

    subjects.forEach((s) => {
      totalUnits += s.units || 0;
      const row = document.createElement("tr");

      const schedSummaries = (s.schedules || [])
        .map(
          (sc) =>
            `<strong>${sc.day}</strong>: ${sc.startTime} - ${sc.endTime} (${sc.room})`,
        )
        .join("<br>");

      const formattedProf = formatInstructorName(s.instructor);

      row.innerHTML = `
        <td><strong>${s.code}</strong></td>
        <td>${s.title}</td>
        <td>${s.units || 3}</td>
        <td>${formattedProf || "TBA"}</td>
        <td>${schedSummaries || "TBA"}</td>
      `;
      summaryBody.appendChild(row);
    });

    totalUnitsEl.innerText = totalUnits;
  }

  async function loadScheduleData() {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      try {
        const res = await chrome.storage.local.get("bsu_current_schedule");
        if (res && res.bsu_current_schedule) {
          return res.bsu_current_schedule;
        }
      } catch (err) {
        console.warn("Could not read from chrome.storage:", err);
      }
    }

    const local = localStorage.getItem("bsu_current_schedule");
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }

    return null;
  }

  function getSampleFallbackData() {
    return {
      section: "CS-4102",
      campus: "ALANGILAN",
      subjects: [
        {
          code: "CS 411",
          title: "CS Thesis 1",
          units: 3,
          instructor: "MELO, PRINCESS MARIE B.",
          section: "CS-4102",
          campus: "ALANGILAN",
          schedules: [
            {
              day: "Thursday",
              startTime: "01:00 PM",
              endTime: "04:00 PM",
              startMinutes: 780,
              endMinutes: 960,
              room: "OL",
              isOnline: true,
            },
          ],
        },
        {
          code: "CS 412",
          title: "Fundamentals of Data Science",
          units: 3,
          instructor: "MONTALBO, FRANCIS JESMAR P.",
          section: "CS-4102",
          campus: "ALANGILAN",
          schedules: [
            {
              day: "Monday",
              startTime: "01:00 PM",
              endTime: "04:00 PM",
              startMinutes: 780,
              endMinutes: 960,
              room: "LAB 2",
              isOnline: false,
            },
            {
              day: "Tuesday",
              startTime: "10:00 AM",
              endTime: "12:00 PM",
              startMinutes: 600,
              endMinutes: 720,
              room: "101",
              isOnline: false,
            },
          ],
        },
        {
          code: "CS 413",
          title: "Advanced Software Engineering",
          units: 3,
          instructor: "DELA CRUZ, MAURICE OLIVER Y.",
          section: "CS-4102",
          campus: "ALANGILAN",
          schedules: [
            {
              day: "Monday",
              startTime: "10:00 AM",
              endTime: "12:00 PM",
              startMinutes: 600,
              endMinutes: 720,
              room: "102",
              isOnline: false,
            },
            {
              day: "Tuesday",
              startTime: "01:00 PM",
              endTime: "04:00 PM",
              startMinutes: 780,
              endMinutes: 960,
              room: "LAB 2",
              isOnline: false,
            },
          ],
        },
        {
          code: "CS 414",
          title: "Artificial Intelligence",
          units: 3,
          instructor: "MONTALBO, FRANCIS JESMAR P.",
          section: "CS-4102",
          campus: "ALANGILAN",
          schedules: [
            {
              day: "Thursday",
              startTime: "08:00 AM",
              endTime: "10:00 AM",
              startMinutes: 480,
              endMinutes: 600,
              room: "OL",
              isOnline: true,
            },
            {
              day: "Friday",
              startTime: "01:00 PM",
              endTime: "04:00 PM",
              startMinutes: 780,
              endMinutes: 960,
              room: "LAB 2",
              isOnline: true,
            },
          ],
        },
        {
          code: "CSE 402",
          title: "CS Professional Elective 2",
          units: 3,
          instructor: "BAYYOU, DEMEKE G.",
          section: "CS-4102",
          campus: "ALANGILAN",
          schedules: [
            {
              day: "Tuesday",
              startTime: "07:00 AM",
              endTime: "10:00 AM",
              startMinutes: 420,
              endMinutes: 600,
              room: "LAB 3",
              isOnline: false,
            },
            {
              day: "Wednesday",
              startTime: "10:00 AM",
              endTime: "12:00 PM",
              startMinutes: 600,
              endMinutes: 720,
              room: "101",
              isOnline: false,
            },
            {
              day: "Friday",
              startTime: "01:00 PM",
              endTime: "04:00 PM",
              startMinutes: 780,
              endMinutes: 960,
              room: "OL",
              isOnline: true,
            },
          ],
        },
        {
          code: "CS 415",
          title: "Principles of Operating Systems",
          units: 3,
          instructor: "ESGUERRA, JOHN RICHARD M.",
          section: "CS-4102",
          campus: "ALANGILAN",
          schedules: [
            {
              day: "Wednesday",
              startTime: "08:30 AM",
              endTime: "10:00 AM",
              startMinutes: 510,
              endMinutes: 600,
              room: "101",
              isOnline: false,
            },
            {
              day: "Thursday",
              startTime: "10:00 AM",
              endTime: "11:30 AM",
              startMinutes: 600,
              endMinutes: 690,
              room: "OL",
              isOnline: true,
            },
          ],
        },
      ],
    };
  }
});
