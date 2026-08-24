/**
 * High-Resolution Canvas Image Exporter
 * Renders crisp, retina-ready Gizmoa-style schedule images with:
 * - Bold Black Course Title
 * - Clean Title Case Instructor Name (without Prof. addressor)
 * - Bottom-pinned Bold Black Time & Room Location
 */

class ScheduleImageExporter {
  static formatInstructorName(name) {
    if (!name || name === 'TBA') return 'TBA';
    if (name === name.toUpperCase()) {
      return name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    }
    return name.replace(/^Prof\.\s*/i, '');
  }

  /**
   * Generates and downloads the desktop schedule image (PNG)
   */
  static exportDesktopPNG(timetableCore, titleText = 'BatStateU Class Schedule') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const days = timetableCore.getDisplayDays();
    const intervals = timetableCore.getTimeIntervals();

    const colWidth = 185;
    const rowHeight = 33; // Height per 30-minute interval

    const gridLeft = 85;
    const gridTop = 90;
    const gridWidth = days.length * colWidth;
    const gridHeight = (intervals.length - 1) * rowHeight;

    const baseWidth = gridLeft + gridWidth + 35;
    const baseHeight = gridTop + gridHeight + 40;

    const scale = 2; // 2x Retina scale for crystal-clear export
    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    // 1. Header Title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(titleText, baseWidth / 2, 40);

    // 2. Day Column Headers
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';

    days.forEach((day, index) => {
      const colX = gridLeft + index * colWidth;
      ctx.fillText(day, colX + colWidth / 2, gridTop - 12);
    });

    const startHour = timetableCore.startHour;
    const endHour = timetableCore.endHour;
    const totalMinutes = (endHour - startHour) * 60;

    // 3. Draw Time Axis and Horizontal Grid Lines
    intervals.forEach(interval => {
      const offsetMin = interval.minutes - (startHour * 60);
      const y = gridTop + (offsetMin / totalMinutes) * gridHeight;

      // Time label on left
      ctx.font = interval.isHour ? 'bold 11px sans-serif' : '10px sans-serif';
      ctx.fillStyle = interval.isHour ? '#000000' : '#475569';
      ctx.textAlign = 'right';
      ctx.fillText(interval.label, gridLeft - 8, y + 4);

      // Grid line
      ctx.strokeStyle = interval.isHour ? '#000000' : '#cbd5e1';
      ctx.lineWidth = interval.isHour ? 1.5 : 0.8;
      ctx.beginPath();
      ctx.moveTo(gridLeft, y);
      ctx.lineTo(gridLeft + gridWidth, y);
      ctx.stroke();
    });

    // 4. Draw Vertical Column Dividers
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    for (let c = 0; c <= days.length; c++) {
      const x = gridLeft + c * colWidth;
      ctx.beginPath();
      ctx.moveTo(x, gridTop);
      ctx.lineTo(x, gridTop + gridHeight);
      ctx.stroke();
    }

    // 5. Draw Class Blocks
    const slots = timetableCore.getProcessedSlots();

    slots.forEach(slot => {
      const x = gridLeft + slot.dayIndex * colWidth + 1.5;
      const y = gridTop + (slot.topPercent / 100) * gridHeight + 1;
      const w = colWidth - 3;
      const h = (slot.heightPercent / 100) * gridHeight - 2;

      // Card Fill
      ctx.fillStyle = slot.color.bg;
      ctx.fillRect(x, y, w, h);

      // Card Border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);

      const paddingX = x + w / 2;
      ctx.textAlign = 'center';

      // --- BOTTOM SECTION (Time + Room) ---
      const hasTime = h > 50;
      const hasRoom = h > 70;
      const bottomHeight = (hasRoom ? 15 : 0) + (hasTime ? 15 : 0) + 6;

      ctx.fillStyle = '#000000';
      ctx.textBaseline = 'alphabetic';
      let bottomY = y + h - 8;
      if (hasRoom) {
        ctx.font = 'bold 11.5px sans-serif';
        ctx.fillText(slot.room, paddingX, bottomY);
        bottomY -= 14;
      }
      if (hasTime) {
        ctx.font = 'bold 11.5px sans-serif';
        ctx.fillText(`${slot.startTime} - ${slot.endTime}`, paddingX, bottomY);
      }

      // --- MIDDLE CENTERED SECTION (Title + Instructor) ---
      const availableTopHeight = h - (hasTime ? bottomHeight : 0);
      const fullTitle = `${slot.code} - ${slot.title}`;
      const titleLines = ScheduleImageExporter.wrapText(ctx, fullTitle, w - 10);
      
      const middleLines = [];
      titleLines.slice(0, 2).forEach(tl => {
        middleLines.push({ text: tl, font: 'bold 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fill: '#000000' });
      });

      if (h > 55 && slot.instructor && slot.instructor !== 'TBA') {
        const formattedProf = ScheduleImageExporter.formatInstructorName(slot.instructor);
        middleLines.push({ text: formattedProf, font: 'italic 10.5px sans-serif', fill: '#334155' });
      }

      const middleLineHeight = 14;
      const totalMiddleTextHeight = middleLines.length * middleLineHeight;
      let middleStartY = y + (availableTopHeight - totalMiddleTextHeight) / 2 + (middleLineHeight / 2);

      ctx.textBaseline = 'middle';
      middleLines.forEach(item => {
        ctx.font = item.font;
        ctx.fillStyle = item.fill;
        ctx.fillText(item.text, paddingX, middleStartY);
        middleStartY += middleLineHeight;
      });
    });

    // Download PNG
    const filename = `${titleText.replace(/[^a-zA-Z0-9_-]/g, '_')}_schedule.png`;
    ScheduleImageExporter.downloadCanvas(canvas, filename);
  }

  /**
   * Generates and downloads the 9:16 Phone Wallpaper schedule image (Compact, Readable, with Full Title)
   */
  static exportPhoneWallpaperPNG(timetableCore, titleText = 'BatStateU Schedule') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const scale = 2;
    const baseWidth = 1080;
    const baseHeight = 1920; // 9:16 standard phone lockscreen

    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;
    ctx.scale(scale, scale);

    // Clean white crisp background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    // Title placed below the lockscreen clock area
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(titleText, baseWidth / 2, 430);

    const days = timetableCore.getDisplayDays();
    const intervals = timetableCore.getTimeIntervals();

    // Compact vertical spacing on phone
    const rowHeight = 44; // Compact height per 30-minute interval
    const gridLeft = 85;
    const gridTop = 465;
    const gridWidth = baseWidth - gridLeft - 35;
    const gridHeight = (intervals.length - 1) * rowHeight;
    const colWidth = gridWidth / days.length;

    const startHour = timetableCore.startHour;
    const endHour = timetableCore.endHour;
    const totalMinutes = (endHour - startHour) * 60;

    // Day Headers
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';

    const shortDays = { 'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun' };
    days.forEach((day, index) => {
      const colX = gridLeft + index * colWidth;
      ctx.fillText(shortDays[day] || day, colX + colWidth / 2, gridTop - 12);
    });

    // Time lines
    intervals.forEach(interval => {
      const offsetMin = interval.minutes - (startHour * 60);
      const y = gridTop + (offsetMin / totalMinutes) * gridHeight;

      if (interval.isHour) {
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'right';
        ctx.fillText(interval.label, gridLeft - 8, y + 4);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(gridLeft, y);
        ctx.lineTo(gridLeft + gridWidth, y);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gridLeft, y);
        ctx.lineTo(gridLeft + gridWidth, y);
        ctx.stroke();
      }
    });

    // Column Dividers
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    for (let c = 0; c <= days.length; c++) {
      const x = gridLeft + c * colWidth;
      ctx.beginPath();
      ctx.moveTo(x, gridTop);
      ctx.lineTo(x, gridTop + gridHeight);
      ctx.stroke();
    }

    // Class Blocks (Full Title, Prof in Middle + Time & Room at Bottom)
    const slots = timetableCore.getProcessedSlots();
    slots.forEach(slot => {
      const x = gridLeft + slot.dayIndex * colWidth + 1.5;
      const y = gridTop + (slot.topPercent / 100) * gridHeight + 1;
      const w = colWidth - 3;
      const h = (slot.heightPercent / 100) * gridHeight - 2;

      ctx.fillStyle = slot.color.bg;
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);

      const paddingX = x + w / 2;
      ctx.textAlign = 'center';

      // --- Bottom Section (Time + Room) ---
      const hasTime = h > 45;
      const hasRoom = h > 65;
      const bottomHeight = (hasRoom ? 15 : 0) + (hasTime ? 15 : 0) + 6;

      ctx.fillStyle = '#000000';
      ctx.textBaseline = 'alphabetic';
      let bottomY = y + h - 7;
      if (hasRoom) {
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(slot.room, paddingX, bottomY);
        bottomY -= 14;
      }
      if (hasTime) {
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`${slot.startTime} - ${slot.endTime}`, paddingX, bottomY);
      }

      // --- Middle Centered Subject Code, Title & Prof ---
      const availableTopHeight = h - (hasTime ? bottomHeight : 0);
      const fullTitle = `${slot.code} - ${slot.title}`;
      const titleLines = ScheduleImageExporter.wrapText(ctx, fullTitle, w - 8);
      
      const middleLines = [];
      titleLines.slice(0, 2).forEach(tl => {
        middleLines.push({ text: tl, font: 'bold 11.5px sans-serif', fill: '#000000' });
      });

      if (h > 65 && slot.instructor && slot.instructor !== 'TBA') {
        const formattedProf = ScheduleImageExporter.formatInstructorName(slot.instructor);
        middleLines.push({ text: formattedProf, font: 'italic 10px sans-serif', fill: '#334155' });
      }

      const middleLineHeight = 14;
      const totalMiddleTextHeight = middleLines.length * middleLineHeight;
      let middleStartY = y + (availableTopHeight - totalMiddleTextHeight) / 2 + (middleLineHeight / 2);

      ctx.textBaseline = 'middle';
      middleLines.forEach(item => {
        ctx.font = item.font;
        ctx.fillStyle = item.fill;
        ctx.fillText(item.text, paddingX, middleStartY);
        middleStartY += middleLineHeight;
      });
    });

    // Download PNG
    const filename = `${titleText.replace(/[^a-zA-Z0-9_-]/g, '_')}_wallpaper.png`;
    ScheduleImageExporter.downloadCanvas(canvas, filename);
  }

  static downloadCanvas(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScheduleImageExporter;
}
