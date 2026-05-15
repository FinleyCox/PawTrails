import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ── SVG定義 ──────────────────────────────────────────────────────────────────

// メインアイコン（背景グラデーション + 白い肉球）
const iconSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="#6AA882"/>
      <stop offset="100%" stop-color="#3D6B54"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#00000033"/>
    </filter>
  </defs>

  <!-- 背景 -->
  <rect width="1024" height="1024" rx="230" fill="url(#bg)"/>

  <!-- 内側のハイライト（光沢感） -->
  <rect x="80" y="80" width="860" height="400" rx="180" fill="white" opacity="0.06"/>

  <!-- 肉球メインパッド -->
  <ellipse cx="512" cy="598" rx="168" ry="144" fill="white" opacity="0.96" filter="url(#shadow)"/>

  <!-- 指先パッド 4個 -->
  <ellipse cx="322" cy="408" rx="72" ry="86" fill="white" opacity="0.96"/>
  <ellipse cx="452" cy="338" rx="72" ry="86" fill="white" opacity="0.96"/>
  <ellipse cx="576" cy="338" rx="72" ry="86" fill="white" opacity="0.96"/>
  <ellipse cx="706" cy="408" rx="72" ry="86" fill="white" opacity="0.96"/>
</svg>`;

// Android アダプティブアイコン前景（透明背景・緑の肉球）
const adaptiveSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <ellipse cx="512" cy="598" rx="168" ry="144" fill="white" opacity="0.97"/>
  <ellipse cx="322" cy="408" rx="72" ry="86" fill="white" opacity="0.97"/>
  <ellipse cx="452" cy="338" rx="72" ry="86" fill="white" opacity="0.97"/>
  <ellipse cx="576" cy="338" rx="72" ry="86" fill="white" opacity="0.97"/>
  <ellipse cx="706" cy="408" rx="72" ry="86" fill="white" opacity="0.97"/>
</svg>`;

// スプラッシュ（横長、余白多め）
const splashSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="#6AA882"/>
      <stop offset="100%" stop-color="#3D6B54"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <ellipse cx="512" cy="480" rx="130" ry="110" fill="white" opacity="0.95"/>
  <ellipse cx="360" cy="338" rx="55" ry="65" fill="white" opacity="0.95"/>
  <ellipse cx="460" cy="284" rx="55" ry="65" fill="white" opacity="0.95"/>
  <ellipse cx="564" cy="284" rx="55" ry="65" fill="white" opacity="0.95"/>
  <ellipse cx="664" cy="338" rx="55" ry="65" fill="white" opacity="0.95"/>
</svg>`;

// ── 生成 ──────────────────────────────────────────────────────────────────────

async function generate(svgStr, outPath, size) {
  const buf = Buffer.from(svgStr.trim());
  await sharp(buf, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✅ ${outPath.replace(root, ".")}  (${size}×${size})`);
}

async function main() {
  mkdirSync(`${root}/images`, { recursive: true });

  // ── assets/ (Expo が参照するファイルを上書き)
  await generate(iconSvg(1024), `${root}/assets/icon.png`, 1024);
  await generate(adaptiveSvg,   `${root}/assets/adaptive-icon.png`, 1024);
  await generate(splashSvg,     `${root}/assets/splash-icon.png`, 1024);

  // ── images/ (ストア提出用)
  await generate(iconSvg(1024), `${root}/images/app-store-icon-1024.png`, 1024);   // iOS App Store
  await generate(iconSvg(512),  `${root}/images/play-store-icon-512.png`, 512);    // Play Store

  // iOS 各サイズ
  for (const s of [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180]) {
    await generate(iconSvg(s * 4), `${root}/images/ios/icon-${s}.png`, s);
  }

  // Android 各サイズ
  const androidSizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [density, s] of Object.entries(androidSizes)) {
    await generate(iconSvg(s * 4), `${root}/images/android/ic_launcher_${density}.png`, s);
  }

  console.log("\n🎉 全アイコン生成完了！");
}

main().catch(console.error);
