import { Buffer } from "node:buffer";
import { copyFile, mkdir, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const defaultSourceUrl = "https://findy-code.io/skills-share/_Gqif01yZSWTw";
const defaultOutputPath = "public/images/findy-skill-score-current.png";
const defaultFallbackPath = "public/images/findy-skill-score-2026-08-14.png";

const sourceUrl = process.env.FINDY_SCORE_URL ?? defaultSourceUrl;
const outputPath = path.resolve(process.env.FINDY_SCORE_OUTPUT ?? defaultOutputPath);
const fallbackPath = path.resolve(process.env.FINDY_SCORE_FALLBACK ?? defaultFallbackPath);
const temporaryPath = `${outputPath}.tmp`;

function inspectPng(buffer, filePath) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature)) {
    throw new Error(`${filePath} はPNG画像ではありません。`);
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);

  if (buffer.length < 8_000 || width < 500 || width > 900 || height < 180 || height > 400) {
    throw new Error(`${filePath} の画像寸法または容量が想定範囲外です（${width}x${height}, ${buffer.length} bytes）。`);
  }

  return { width, height, bytes: buffer.length };
}

async function validatePng(filePath) {
  return inspectPng(await readFile(filePath), filePath);
}

async function preserveKnownGoodImage(reason) {
  await rm(temporaryPath, { force: true });

  try {
    const current = await validatePng(outputPath);
    console.warn(`[findy-score] 撮影に失敗したため、既存の正常画像を維持します: ${reason}`);
    console.log(`[findy-score] 維持した画像: ${current.width}x${current.height}`);
    return;
  } catch {
    const fallback = await validatePng(fallbackPath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await copyFile(fallbackPath, outputPath);
    console.warn(`[findy-score] 撮影に失敗したため、フォールバック画像を使用します: ${reason}`);
    console.log(`[findy-score] フォールバック画像: ${fallback.width}x${fallback.height}`);
  }
}

async function capture() {
  let browser;

  try {
    if (process.env.FINDY_FORCE_CAPTURE_FAILURE === "1") {
      throw new Error("障害時フォールバックの検証用エラー");
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 1,
      locale: "ja-JP",
      timezoneId: "Asia/Tokyo",
    });
    const page = await context.newPage();

    await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });

    const heading = page.getByRole("heading", { name: "スキル偏差値ver.3", exact: true });
    await heading.waitFor({ state: "visible", timeout: 45_000 });

    const card = heading.locator("xpath=../..");
    await card.waitFor({ state: "visible", timeout: 10_000 });
    await page.evaluate(() => document.fonts.ready);

    const text = (await card.innerText()).replace(/\s+/g, " ").trim();
    const box = await card.boundingBox();

    if (!box || box.width < 500 || box.width > 900 || box.height < 180 || box.height > 400) {
      throw new Error("Findyカードの表示範囲が想定と一致しません。DOM変更の可能性があります。");
    }

    if (!text.includes("スキル偏差値ver.3") || !/\b\d{1,3}(?:\.\d+)?\b/.test(text)) {
      throw new Error("Findyカード内に見出しとスコアを確認できませんでした。");
    }

    await mkdir(path.dirname(outputPath), { recursive: true });
    await card.screenshot({ path: temporaryPath, type: "png", animations: "disabled" });

    const captured = await validatePng(temporaryPath);
    await rm(outputPath, { force: true });
    await rename(temporaryPath, outputPath);

    console.log(`[findy-score] 撮影成功: ${captured.width}x${captured.height}, ${captured.bytes} bytes`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await preserveKnownGoodImage(message);
  } finally {
    await browser?.close();
  }
}

const validateIndex = process.argv.indexOf("--validate");

if (validateIndex >= 0) {
  const requestedPath = process.argv[validateIndex + 1];
  if (!requestedPath) {
    throw new Error("--validate の後に画像パスを指定してください。");
  }
  const validated = await validatePng(path.resolve(requestedPath));
  console.log(`[findy-score] 検証成功: ${validated.width}x${validated.height}, ${validated.bytes} bytes`);
} else {
  await capture();
}
