import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const stickersDir = path.resolve('public', 'stickers');

async function main() {
  if (!fs.existsSync(stickersDir)) {
    console.error(`[stickers:webp] Directory not found: ${stickersDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(stickersDir).filter(f => f.toLowerCase().endsWith('.png'));
  if (!files.length) {
    console.log('[stickers:webp] No PNG stickers found to convert.');
    return;
  }

  console.log(`[stickers:webp] Converting ${files.length} PNG(s) → WebP...`);
  let ok = 0, fail = 0;
  for (const file of files) {
    const src = path.join(stickersDir, file);
    const out = src.replace(/\.png$/i, '.webp');
    try {
      const img = sharp(src, { sequentialRead: true });
      await img.webp({ quality: 82, effort: 5 }).toFile(out);
      console.log(`✓ ${path.basename(out)}`);
      ok++;
    } catch (e) {
      console.error(`✗ Failed ${file}:`, e.message);
      fail++;
    }
  }
  console.log(`[stickers:webp] Done. Success: ${ok}, Failed: ${fail}`);
}

main().catch(err => {
  console.error('[stickers:webp] Fatal error:', err);
  process.exit(1);
});

