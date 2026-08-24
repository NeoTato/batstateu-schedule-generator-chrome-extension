# Chrome Web Store Listing & Publishing Metadata

## Listing Details

- **Extension Name:** BatStateU Schedule Generator & Timetable Maker
- **Short Description:** Automatically converts your BatStateU encoded subjects into a clean Gizmoa-style timetable, HD images, and calendar events.
- **Category:** Productivity / Education
- **Language:** English
- **Last Updated:** August 24, 2026

---

## Detailed Store Description

Generate clean, minimalistic weekly class schedules directly from the Batangas State University (BatStateU) student portal with a single click.

No more manual typing on schedule makers. When you open your "Encoded Subjects" modal in the university portal, this extension automatically formats your subjects, instructors, classrooms, and meeting times into a clean, color-coded weekly timetable.

### Key Features:
- **1-Click Auto Generation:** Injects a "Generate Timetable" button directly into the portal's subject list.
- **Gizmoa-Style Minimalist Aesthetic:** Features clean 30-minute grid lines, easy-to-read typography, and pastel color-coding.
- **Multi-Day Color Sync:** Classes that meet on multiple days (such as Monday Lab + Tuesday Lecture) share the same color for easy tracking.
- **High-Resolution PNG Download:** Crystal-clear 2x Retina scale export for desktop wallpaper or printing.
- **Phone Wallpaper Mode (9:16):** Export wallpapers designed specifically for smartphone lock screens, leaving room for the lock screen clock.
- **Add to Google / Apple Calendar (.ics):** Export your entire semester into your phone calendar with automatic 15-minute reminders before class.
- **100% Private & Client-Side:** No logins, passwords, or student data are ever sent to an external server.

---

## Permissions Justification

| Permission | Reason Required |
| :--- | :--- |
| `storage` | Used to temporarily save the parsed schedule locally in the browser so it can be rendered and exported in the timetable viewer. |
| `activeTab` | Used to interact with the student portal tab when the user clicks the extension action. |
| `host_permissions` (`*://*.batstate-u.edu.ph/*`) | Required to read the "Encoded Subjects" DOM modal on the Batangas State University portal domain. |

---

## Privacy Policy Summary

This extension operates **100% locally on the user's device**:
1. It does not collect, transmit, store, or sell any personal data, student credentials, or academic records.
2. All schedule scraping and image/calendar generation occurs entirely within the client's browser.
3. No tracking, analytics, or third-party advertising services are used.
