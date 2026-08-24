# BatStateU Schedule Generator & Timetable Maker (Chrome Extension)

A lightweight Manifest V3 Chrome Extension that automatically extracts encoded subjects from the Batangas State University (BatStateU) student portal and generates a clean, Gizmoa-inspired weekly schedule timetable with a single click.

---

## About This Project

I am a Computer Science student at Batangas State University. Every semester, I would manually type our encoded subjects, times, and room locations into Gizmoa's schedule maker just to make an image of our weekly class schedule.

I wanted to automate this repetitive workflow, so I built this side-project utility. This project was created with AI assistance (vibe-coded using AI tools) as a practical tool for fellow BatStateU students to save time during enrollment and class schedule updates.

---

## Features

- **1-Click Extraction:** Injects a "Generate Timetable" button directly into the portal's "Encoded Subjects" modal.
- **Gizmoa-Style Minimalist Aesthetic:** Features clean 30-minute interval grid lines, high-contrast typography, and soft pastel subject colors.
- **Multi-Day Color Synchronization:** Classes meeting multiple times a week (such as Monday Lab + Tuesday Lecture) automatically share the exact same color.
- **Clear Information Hierarchy:**
  - Course Code & Title: Bold black text positioned in the center.
  - Instructor Name: Clean Title Case in italic dark charcoal text.
  - Time Range & Room: Pinned at the bottom in bold black text with proper spacing.
- **High-Resolution PNG Download:** 2x Retina scale export for sharp, readable desktop prints.
- **Mobile Lockscreen Wallpaper Mode (9:16):** Exports phone-friendly wallpapers with top clearance for the lock screen clock and compact vertical spacing.
- **Add to Google / Apple Calendar (.ics):** Generates `.ics` calendar files with 18-week recurring schedules and 15-minute reminders before each class.
- **100% Client-Side Privacy:** Zero server dependencies. No student credentials, grades, or personal information leave your browser.

---

## How to Install and Use

### Step 1: Download or Clone the Repository

Clone this repository or download the ZIP from GitHub and extract it to a folder on your computer:

```bash
git clone https://github.com/NeoTato/batstateu-schedule-generator-chrome-extension.git
```

### Step 2: Load the Extension in Chrome / Edge / Brave

1. Open your browser and navigate to `chrome://extensions` (or `edge://extensions` in Microsoft Edge).
2. Toggle on **"Developer mode"** in the top-right corner.
3. Click the **"Load unpacked"** button in the top-left.
4. Select the extracted `batstateu-schedule-generator-chrome-extension` folder.
5. The **"BatStateU Schedule Generator & Timetable Maker"** extension will appear in your browser.

### Step 3: Use on the BatStateU Portal

1. Log into your **BatStateU Student Portal**.
2. Click on **"Subjects"** to open the **"Encoded Subjects"** modal popup.
3. You will see a button: **"Generate Timetable"** next to the List View / Table View tabs.
4. Click it to view your generated timetable, customize your title, download HD images, or export to your calendar.

---

## Testing Locally (Without logging into the portal)

To test the extension offline without logging into the live portal:
1. Open `src/test/sample-portal.html` in your browser.
2. Click the **"Generate Timetable"** button in the modal to test the full flow.

---

## Project Structure

```
batstateu-schedule-generator-chrome-extension/
├── manifest.json                  # Manifest V3 extension configuration
├── src/
│   ├── content/
│   │   ├── scraper.js             # Parses portal subjects, multi-day schedules, rooms, & instructors
│   │   ├── injector.js            # Injects the "Generate Timetable" button into the portal modal
│   │   └── styles.css             # Extension injection UI styles
│   ├── visualizer/
│   │   ├── timetable-viewer.html  # Interactive schedule viewer
│   │   ├── timetable-viewer.css   # Clean Gizmoa-style styling
│   │   ├── timetable-core.js      # Grid layout engine, color palette allocator, time math
│   │   ├── image-exporter.js      # HD Canvas 2D exporter (Desktop & Phone 9:16)
│   │   └── calendar-exporter.js   # iCalendar (.ics) RFC-5545 generator
│   ├── assets/
│   │   └── icons/                 # Extension icons (16x16, 48x48, 128x128)
│   └── test/
│       └── sample-portal.html     # Mock BatStateU portal page for instant testing
├── test/
│   └── test_parser.js             # Automated unit tests for scraping and calculations
├── .gitignore                     # Git ignore rules
└── README.md                      # Project documentation
```
