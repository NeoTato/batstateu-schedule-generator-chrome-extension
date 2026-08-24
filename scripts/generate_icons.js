const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function createPNG(size) {
  // We will build an RGBA bitmap
  const width = size;
  const height = size;
  const buffer = Buffer.alloc(width * height * 4);

  const red = [185, 28, 28, 255]; // BatStateU Crimson Red (#B91C1C)
  const white = [255, 255, 255, 255]; // Clean White
  const darkRed = [153, 27, 27, 255]; // Darker Red border
  const transparent = [0, 0, 0, 0];

  const radius = Math.max(2, Math.floor(size * 0.2));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Rounded rect boundary
      const inX = x >= 1 && x < width - 1;
      const inY = y >= 1 && y < height - 1;

      // Top header bar (Red) vs Calendar body (White)
      const headerHeight = Math.floor(height * 0.35);

      if (inX && inY) {
        if (y < headerHeight) {
          // Header
          buffer[idx] = red[0];
          buffer[idx + 1] = red[1];
          buffer[idx + 2] = red[2];
          buffer[idx + 3] = red[3];
        } else {
          // Body (White background)
          buffer[idx] = 250;
          buffer[idx + 1] = 250;
          buffer[idx + 2] = 250;
          buffer[idx + 3] = 255;

          // Draw small grid cells (calendar schedule blocks)
          const cellMarginX = Math.floor(width * 0.18);
          const cellMarginY = Math.floor(height * 0.42);
          const cellW = Math.floor(width * 0.18);
          const cellH = Math.floor(height * 0.14);
          const gapX = Math.floor(width * 0.08);
          const gapY = Math.floor(height * 0.08);

          for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 3; c++) {
              const cx = cellMarginX + c * (cellW + gapX);
              const cy = cellMarginY + r * (cellH + gapY);
              if (x >= cx && x < cx + cellW && y >= cy && y < cy + cellH) {
                // Colored grid cells
                const colors = [
                  [239, 68, 68], // red
                  [59, 130, 246], // blue
                  [16, 185, 129], // green
                  [245, 158, 11], // amber
                  [139, 92, 246], // purple
                  [236, 72, 153], // pink
                ];
                const col = colors[(r * 3 + c) % colors.length];
                buffer[idx] = col[0];
                buffer[idx + 1] = col[1];
                buffer[idx + 2] = col[2];
                buffer[idx + 3] = 255;
              }
            }
          }
        }
      } else {
        // Border
        buffer[idx] = darkRed[0];
        buffer[idx + 1] = darkRed[1];
        buffer[idx + 2] = darkRed[2];
        buffer[idx + 3] = 255;
      }
    }
  }

  // Generate PNG chunk format
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 4 + 1)] = 0; // Filter type 0 (None)
    buffer.copy(
      rawData,
      y * (width * 4 + 1) + 1,
      y * width * 4,
      (y + 1) * width * 4,
    );
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk("IHDR", ihdr);
  const idatChunk = makeChunk("IDAT", deflated);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Simple CRC32 implementation
function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }

  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const iconsDir = path.join(__dirname, "..", "src", "assets", "icons");
fs.mkdirSync(iconsDir, { recursive: true });

[16, 48, 128].forEach((size) => {
  const pngBuf = createPNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), pngBuf);
  console.log(`Generated icon-${size}.png`);
});
