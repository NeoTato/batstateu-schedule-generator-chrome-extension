/**
 * iCalendar (.ics) RFC-5545 Generator
 * Exports weekly class schedules with recurring events and 15-minute reminders for Google Calendar and Apple Calendar.
 */

class CalendarExporter {
  static exportICS(subjects = [], sectionName = "BatStateU Classes") {
    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Batangas State University//Schedule Generator//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${sectionName} Class Schedule`,
      "X-WR-TIMEZONE:Asia/Manila",
    ];

    // Calculate nearest upcoming Monday as base start date
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
    const distanceToMonday = (8 - dayOfWeek) % 7;
    const baseMonday = new Date(now);
    baseMonday.setDate(now.getDate() + distanceToMonday);

    const dayOffsets = {
      Monday: 0,
      Tuesday: 1,
      Wednesday: 2,
      Thursday: 3,
      Friday: 4,
      Saturday: 5,
      Sunday: 6,
    };

    subjects.forEach((subj, subjIdx) => {
      (subj.schedules || []).forEach((slot, slotIdx) => {
        if (!slot.day || slot.startMinutes === null || slot.endMinutes === null)
          return;

        const offsetDays = dayOffsets[slot.day] || 0;
        const eventDate = new Date(baseMonday);
        eventDate.setDate(baseMonday.getDate() + offsetDays);

        const startH = Math.floor(slot.startMinutes / 60);
        const startM = slot.startMinutes % 60;
        const endH = Math.floor(slot.endMinutes / 60);
        const endM = slot.endMinutes % 60;

        const dtStart = CalendarExporter.formatICSDate(
          eventDate,
          startH,
          startM,
        );
        const dtEnd = CalendarExporter.formatICSDate(eventDate, endH, endM);

        const location = slot.isOnline
          ? "Online Class (Google Meet / Zoom / Portal)"
          : `Room ${slot.room}, BatStateU ${subj.campus || "Campus"}`;

        const description = `Subject: ${subj.code} - ${subj.title}\\nInstructor: ${subj.instructor || "TBA"}\\nSection: ${subj.section || "N/A"}\\nUnits: ${subj.units || 3}`;

        const uid = `bsu_${Date.now()}_${subjIdx}_${slotIdx}@batstate-u.edu.ph`;

        icsContent.push(
          "BEGIN:VEVENT",
          `UID:${uid}`,
          `SUMMARY:${subj.code} - ${subj.title}`,
          `DESCRIPTION:${description}`,
          `LOCATION:${location}`,
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          "RRULE:FREQ=WEEKLY;COUNT=18", // 18 weeks in a college semester
          "STATUS:CONFIRMED",
          "BEGIN:VALARM",
          "TRIGGER:-PT15M", // 15-minute notification before class
          "ACTION:DISPLAY",
          `DESCRIPTION:Reminder: ${subj.code} class starts in 15 minutes!`,
          "END:VALARM",
          "END:VEVENT",
        );
      });
    });

    icsContent.push("END:VCALENDAR");

    const blob = new Blob([icsContent.join("\r\n")], {
      type: "text/calendar;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${sectionName.replace(/[^a-zA-Z0-9_-]/g, "_")}_schedule.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static formatICSDate(date, hours, minutes) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    return `${y}${m}${d}T${hh}${mm}00`;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = CalendarExporter;
}
