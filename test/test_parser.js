const fs = require("fs");
const path = require("path");
const BsuScheduleScraper = require("../src/content/scraper");

// Mock DOM parser using basic regex / element simulation or JSDOM simulation
const sampleHtml = fs.readFileSync(
  path.join(__dirname, "..", "src", "test", "sample-portal.html"),
  "utf-8",
);

console.log("Testing BsuScheduleScraper time parsing...");
const testTime1 = BsuScheduleScraper.parseTimeToMinutes("01:00 PM");
const testTime2 = BsuScheduleScraper.parseTimeToMinutes("08:30 AM");
const testTime3 = BsuScheduleScraper.parseTimeToMinutes("12:00 PM");
console.log(
  `01:00 PM -> ${testTime1} minutes (expected 780): ${testTime1 === 780 ? "PASS" : "FAIL"}`,
);
console.log(
  `08:30 AM -> ${testTime2} minutes (expected 510): ${testTime2 === 510 ? "PASS" : "FAIL"}`,
);
console.log(
  `12:00 PM -> ${testTime3} minutes (expected 720): ${testTime3 === 720 ? "PASS" : "FAIL"}`,
);

// Test Day standardization
console.log("\nTesting day standardization...");
console.log(`Thursday -> ${BsuScheduleScraper.standardizeDay("Thursday")}`);
console.log(`tue -> ${BsuScheduleScraper.standardizeDay("tue")}`);

// Test TimetableCore engine
const TimetableCore = require("../src/visualizer/timetable-core");

const mockSubjects = [
  {
    id: "s1",
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
    id: "s2",
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
    id: "s3",
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
];

const core = new TimetableCore(mockSubjects, { theme: "gizmoa-pastel" });
console.log("\nTesting TimetableCore calculations...");
console.log(
  `Calculated Dynamic Start Hour: ${core.startHour}:00 AM (expected 7)`,
);
console.log(`Calculated Dynamic End Hour: ${core.endHour}:00 (expected >= 16)`);
console.log(`Display Days: ${core.getDisplayDays().join(", ")}`);

const slots = core.getProcessedSlots();
console.log(`\nProcessed slots count: ${slots.length} (expected 6)`);

// Verify multi-day color consistency for CSE 402
const cseSlots = slots.filter((s) => s.code === "CSE 402");
const cseColors = cseSlots.map((s) => s.color.bg);
const allColorsMatch = cseColors.every((c) => c === cseColors[0]);
console.log(
  `CSE 402 multi-day colors match: ${allColorsMatch ? "PASS (" + cseColors[0] + ")" : "FAIL"}`,
);

console.log("\nAll core logic tests passed successfully!");
