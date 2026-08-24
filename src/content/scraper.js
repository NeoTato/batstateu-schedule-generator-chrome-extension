/**
 * BatStateU Schedule Scraper
 * Extracts subject codes, titles, instructors, section, and multi-day meeting times
 * from the Batangas State University Student Portal "Encoded Subjects" modal.
 */

class BsuScheduleScraper {
  /**
   * Parses time string into minutes from midnight (0 - 1440)
   * @param {string} timeStr - e.g. "01:00 PM", "8:30AM", "10:00 AM"
   * @returns {number|null}
   */
  static parseTimeToMinutes(timeStr) {
    if (!timeStr) return null;
    const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;

    let [_, hours, mins, period] = match;
    let h = parseInt(hours, 10);
    const m = parseInt(mins, 10);

    if (period.toUpperCase() === "PM" && h !== 12) h += 12;
    if (period.toUpperCase() === "AM" && h === 12) h = 0;

    return h * 60 + m;
  }

  /**
   * Formats minutes from midnight to readable string (e.g. 780 -> "1:00 PM")
   * @param {number} minutes
   * @returns {string}
   */
  static formatMinutesToTime(minutes) {
    let h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const period = h >= 12 ? "PM" : "AM";
    let displayH = h % 12;
    if (displayH === 0) displayH = 12;
    const displayM = m < 10 ? `0${m}` : m;
    return `${displayH}:${displayM} ${period}`;
  }

  /**
   * Scrapes all subjects from the DOM (e.g., active modal on BatStateU Portal)
   * @param {Document|Element} rootElement
   * @returns {Array<Object>}
   */
  static scrapeFromDOM(rootElement = document) {
    const subjects = [];
    // Target .media-body elements inside modal or page
    let subjectCards = rootElement.querySelectorAll(".media-body");

    // Fallback: If no .media-body found, try searching inside modal-dialog or card containers
    if (subjectCards.length === 0) {
      subjectCards = rootElement.querySelectorAll(
        '.modal-body .media, .modal-body [class*="subject"]',
      );
    }

    subjectCards.forEach((card, index) => {
      // 1. Extract Subject Code, Title, and Units
      const headerEl = card.querySelector("h5, h4, .subject-title");
      let code = "";
      let title = "";
      let units = null;

      if (headerEl) {
        const strongs = headerEl.querySelectorAll("strong");
        if (strongs.length >= 2) {
          code = strongs[0].innerText.trim();
          title = strongs[1].innerText.trim();
        } else if (strongs.length === 1) {
          code = strongs[0].innerText.trim();
          // Remaining text might be title
          title = headerEl.innerText
            .replace(code, "")
            .replace(/^[\s-]+/, "")
            .trim();
        }

        // Fallback regex parsing if strong tags are absent or combined
        if (!code || !title) {
          const headerText = headerEl.innerText.trim();
          const match = headerText.match(
            /^(.*?)\s*-\s*(.*?)(?:\s*\((\d+)\s*units?\))?$/i,
          );
          if (match) {
            code = match[1].trim();
            title = match[2].trim();
            if (match[3]) units = parseInt(match[3], 10);
          } else {
            code = headerText;
          }
        }

        // Extract units: e.g. "(3 units)"
        if (!units) {
          const unitsMatch = headerEl.innerText.match(/\((\d+)\s*units?\)/i);
          if (unitsMatch) {
            units = parseInt(unitsMatch[1], 10);
          }
        }
      }

      // Clean title from trailing (3 units) if present
      if (title) {
        title = title.replace(/\s*\(\d+\s*units?\)/i, "").trim();
      }

      // 2. Section & Campus (e.g. "CS-4102 / ALANGILAN")
      let section = "";
      let campus = "";
      const paragraphs = Array.from(card.querySelectorAll(":scope > p, p"));

      for (const p of paragraphs) {
        const text = p.innerText.trim();
        if (
          text.includes("/") &&
          !text.includes("AM") &&
          !text.includes("PM") &&
          !p.classList.contains("mb-0")
        ) {
          const parts = text.split("/").map((s) => s.trim());
          section = parts[0] || "";
          campus = parts[1] || "";
          break;
        }
      }

      // 3. Instructor (often in p.mb-0 or following paragraph)
      let instructor = "TBA";
      const instructorEl = card.querySelector("p.mb-0");
      if (instructorEl && instructorEl.innerText.trim().length > 0) {
        instructor = instructorEl.innerText.trim();
      } else {
        // Find non-schedule, non-section paragraph
        for (const p of paragraphs) {
          const text = p.innerText.trim();
          if (
            text &&
            !text.includes("/") &&
            !text.includes("AM") &&
            !text.includes("PM") &&
            text !== section &&
            text !== campus
          ) {
            instructor = text;
            break;
          }
        }
      }

      // 4. Schedules (dl.dl-horizontal -> dt (Day), dd (Time / Room))
      const schedules = [];
      const dlElements = card.querySelectorAll("dl.dl-horizontal, dl");

      dlElements.forEach((dl) => {
        const dayEl = dl.querySelector("dt");
        const dayRaw = dayEl ? dayEl.innerText.trim() : "";
        const standardDay = BsuScheduleScraper.standardizeDay(dayRaw);
        if (!standardDay) return;

        const timeParagraphs = dl.querySelectorAll("dd p, dd");

        timeParagraphs.forEach((timeP) => {
          const rawTimeText = timeP.innerText.trim();
          if (!rawTimeText) return;

          // Parse: "01:00 PM-04:00 PM / OL" or "10:00 AM-12:00 PM / 101" or "07:00 AM-10:00 AM / LAB 3"
          const timeMatch = rawTimeText.match(
            /(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))(?:\s*\/\s*(.*))?/i,
          );

          if (timeMatch) {
            const startTimeStr = timeMatch[1].trim();
            const endTimeStr = timeMatch[2].trim();
            const roomRaw = timeMatch[3]?.trim() || "TBA";

            const startMin =
              BsuScheduleScraper.parseTimeToMinutes(startTimeStr);
            const endMin = BsuScheduleScraper.parseTimeToMinutes(endTimeStr);

            // Check if online: explicitly "OL", room contains "online", or all Friday classes
            const isOnline =
              roomRaw.toUpperCase() === "OL" ||
              roomRaw.toLowerCase().includes("online") ||
              standardDay === "Friday";

            schedules.push({
              day: standardDay,
              startTime: startTimeStr,
              endTime: endTimeStr,
              startMinutes: startMin,
              endMinutes: endMin,
              room: roomRaw,
              isOnline: isOnline,
            });
          }
        });
      });

      // Only push if subject code or title is present
      if (code || title) {
        subjects.push({
          id: `subj_${index}_${code.replace(/\s+/g, "_")}`,
          code: code || "UNKNOWN",
          title: title || code,
          units: units || 3,
          section: section || "BatStateU",
          campus: campus || "BatStateU",
          instructor: instructor,
          schedules: schedules,
        });
      }
    });

    return subjects;
  }

  /**
   * Normalizes day names into Monday - Sunday
   * @param {string} rawDay
   * @returns {string|null}
   */
  static standardizeDay(rawDay) {
    if (!rawDay) return null;
    const d = rawDay.toLowerCase().trim();
    if (d.startsWith("mon")) return "Monday";
    if (d.startsWith("tue")) return "Tuesday";
    if (d.startsWith("wed")) return "Wednesday";
    if (d.startsWith("thu")) return "Thursday";
    if (d.startsWith("fri")) return "Friday";
    if (d.startsWith("sat")) return "Saturday";
    if (d.startsWith("sun")) return "Sunday";
    return null;
  }
}

// Export for module or content script usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = BsuScheduleScraper;
}
