const { execSync } = require("child_process");
const path = require("path");

try {
  const rootDir = path.join(__dirname, "..");
  console.log("Building batstateu-schedule-generator.zip...");
  execSync(
    'powershell -Command "Compress-Archive -Path manifest.json, src -DestinationPath batstateu-schedule-generator.zip -Force"',
    {
      cwd: rootDir,
      stdio: "inherit",
    },
  );
  console.log("Successfully packaged batstateu-schedule-generator.zip!");
} catch (err) {
  console.error("Packaging failed:", err);
}
