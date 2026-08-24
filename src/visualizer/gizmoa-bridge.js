/**
 * Gizmoa College Schedule Maker Bridge
 * Facilitates direct transfer of parsed BatStateU schedule data to gizmoa.com
 */

class GizmoaBridge {
  /**
   * Converts subjects to Gizmoa importable format and opens Gizmoa
   */
  static openInGizmoa(subjects = []) {
    const gizmoaUrl = "https://gizmoa.com/college-schedule-maker/";

    // We prepare a clean summary in clipboard as well
    let summaryText = "BatStateU Classes for Gizmoa:\n";
    subjects.forEach((s) => {
      (s.schedules || []).forEach((slot) => {
        summaryText += `• ${s.code} (${s.title}): ${slot.day} ${slot.startTime}-${slot.endTime} (${slot.room})\n`;
      });
    });

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
    }

    // Open Gizmoa tab
    window.open(gizmoaUrl, "_blank");
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = GizmoaBridge;
}
