/**
 * Core Timetable Engine
 * Handles schedule math, grid coordinates, pastel color generation, and conflict detection.
 */

class TimetableCore {
  constructor(subjects = [], options = {}) {
    this.subjects = subjects;
    this.options = Object.assign(
      {
        theme: "gizmoa-pastel", // 'gizmoa-pastel', 'batstateu-red', 'dark-mode', 'nord'
        startHour: 7, // 7:00 AM
        endHour: 18, // 6:00 PM (18:00)
        intervalMinutes: 30, // 30 min intervals
        showWeekends: false,
      },
      options,
    );

    this.colorMap = new Map();
    this.initColorPalette();
    this.calculateDynamicTimeBounds();
  }

  /**
   * Defined color palettes
   */
  static get PALETTES() {
    return {
      "gizmoa-pastel": [
        { bg: "#d98282", text: "#111827", border: "#b95d5d" }, // Coral Red (like CSE 402)
        { bg: "#c2f0c2", text: "#111827", border: "#92db92" }, // Mint Green (like CS 413)
        { bg: "#ffe58f", text: "#111827", border: "#d9b743" }, // Warm Yellow (like CS 412)
        { bg: "#b8d98d", text: "#111827", border: "#8cb854" }, // Olive / Sage Green (like CS 415)
        { bg: "#9ecfd4", text: "#111827", border: "#67aab1" }, // Soft Teal/Cyan (like CS 414)
        { bg: "#c59ed4", text: "#111827", border: "#9b6cb0" }, // Soft Purple/Lavender (like CS 411)
        { bg: "#ffc6a5", text: "#111827", border: "#e6976a" }, // Soft Peach
        { bg: "#b3d4fc", text: "#111827", border: "#78aae6" }, // Sky Blue
        { bg: "#fcd34d", text: "#111827", border: "#d97706" }, // Sunflower
        { bg: "#f472b6", text: "#111827", border: "#db2777" }, // Rose
      ],
      "batstateu-red": [
        { bg: "#fee2e2", text: "#7f1d1d", border: "#f87171" }, // Red tint
        { bg: "#fef3c7", text: "#78350f", border: "#fcd34d" }, // Gold tint
        { bg: "#e0e7ff", text: "#312e81", border: "#818cf8" }, // Indigo tint
        { bg: "#d1fae5", text: "#064e3b", border: "#34d399" }, // Emerald tint
        { bg: "#ffedd5", text: "#7c2d12", border: "#fb923c" }, // Orange tint
        { bg: "#f3e8ff", text: "#581c87", border: "#c084fc" }, // Violet tint
      ],
      "dark-mode": [
        { bg: "#374151", text: "#f9fafb", border: "#4b5563" },
        { bg: "#1e3a8a", text: "#dbeafe", border: "#2563eb" },
        { bg: "#064e3b", text: "#d1fae5", border: "#059669" },
        { bg: "#78350f", text: "#fef3c7", border: "#d97706" },
        { bg: "#581c87", text: "#f3e8ff", border: "#9333ea" },
        { bg: "#831843", text: "#fce7f3", border: "#db2777" },
      ],
    };
  }

  /**
   * Assigns consistent colors to unique subjects
   */
  initColorPalette() {
    const palette =
      TimetableCore.PALETTES[this.options.theme] ||
      TimetableCore.PALETTES["gizmoa-pastel"];
    const uniqueCodes = [...new Set(this.subjects.map((s) => s.code))];

    uniqueCodes.forEach((code, index) => {
      const colorScheme = palette[index % palette.length];
      this.colorMap.set(code, colorScheme);
    });
  }

  /**
   * Calculates the earliest start time and latest end time across all subjects
   */
  calculateDynamicTimeBounds() {
    let minMinutes = 7 * 60; // Default 7:00 AM
    let maxMinutes = 18 * 60; // Default 6:00 PM

    let hasSaturday = false;
    let hasSunday = false;

    this.subjects.forEach((subj) => {
      (subj.schedules || []).forEach((slot) => {
        if (slot.startMinutes !== null && slot.startMinutes < minMinutes) {
          minMinutes = Math.floor(slot.startMinutes / 60) * 60;
        }
        if (slot.endMinutes !== null && slot.endMinutes > maxMinutes) {
          maxMinutes = Math.ceil(slot.endMinutes / 60) * 60;
        }

        if (slot.day === "Saturday") hasSaturday = true;
        if (slot.day === "Sunday") hasSunday = true;
      });
    });

    this.startHour = Math.floor(minMinutes / 60);
    this.endHour = Math.ceil(maxMinutes / 60);
    this.hasSaturday = hasSaturday || this.options.showWeekends;
    this.hasSunday = hasSunday || this.options.showWeekends;
  }

  /**
   * Returns list of days to display in the grid
   */
  getDisplayDays() {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    if (this.hasSaturday) days.push("Saturday");
    if (this.hasSunday) days.push("Sunday");
    return days;
  }

  /**
   * Returns array of time intervals (e.g. 7:00 AM, 7:30 AM, ...)
   */
  getTimeIntervals() {
    const intervals = [];
    const totalMinutes = (this.endHour - this.startHour) * 60;
    const steps = totalMinutes / this.options.intervalMinutes;

    for (let i = 0; i <= steps; i++) {
      const currentMin = this.startHour * 60 + i * this.options.intervalMinutes;
      const hours = Math.floor(currentMin / 60);
      const mins = currentMin % 60;
      const period = hours >= 12 ? "PM" : "AM";
      let displayHour = hours % 12;
      if (displayHour === 0) displayHour = 12;
      const displayMin = mins < 10 ? `0${mins}` : mins;

      intervals.push({
        minutes: currentMin,
        label: `${displayHour}:${displayMin}${period}`,
        isHour: mins === 0,
      });
    }

    return intervals;
  }

  /**
   * Computes grid layout positions for each scheduled class slot
   */
  getProcessedSlots() {
    const processedSlots = [];
    const days = this.getDisplayDays();

    this.subjects.forEach((subj) => {
      const color = this.colorMap.get(subj.code) || {
        bg: "#e2e8f0",
        text: "#0f172a",
        border: "#94a3b8",
      };

      (subj.schedules || []).forEach((slot) => {
        if (
          !days.includes(slot.day) ||
          slot.startMinutes === null ||
          slot.endMinutes === null
        ) {
          return;
        }

        const dayIndex = days.indexOf(slot.day);
        const startOffset = slot.startMinutes - this.startHour * 60;
        const duration = slot.endMinutes - slot.startMinutes;

        // Position percentage within the grid
        const totalDayMinutes = (this.endHour - this.startHour) * 60;
        const topPercent = (startOffset / totalDayMinutes) * 100;
        const heightPercent = (duration / totalDayMinutes) * 100;

        processedSlots.push({
          subjectId: subj.id,
          code: subj.code,
          title: subj.title,
          instructor: subj.instructor,
          section: subj.section,
          campus: subj.campus,
          day: slot.day,
          dayIndex: dayIndex,
          startTime: slot.startTime,
          endTime: slot.endTime,
          startMinutes: slot.startMinutes,
          endMinutes: slot.endMinutes,
          room: slot.room,
          isOnline: slot.isOnline,
          color: color,
          topPercent: topPercent,
          heightPercent: heightPercent,
        });
      });
    });

    // Check conflicts
    this.detectConflicts(processedSlots);

    return processedSlots;
  }

  /**
   * Flags overlapping time slots on the same day
   */
  detectConflicts(slots) {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = slots[i];
        const b = slots[j];

        if (a.day === b.day) {
          if (a.startMinutes < b.endMinutes && a.endMinutes > b.startMinutes) {
            a.hasConflict = true;
            b.hasConflict = true;
          }
        }
      }
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = TimetableCore;
}
