import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? ".");
const version = (process.env.DESKEMY_ZH_VERSION ?? "").trim();
const publicKey = (process.env.TAURI_UPDATER_PUBLIC_KEY ?? "").trim();
const releaseRepo = "flipped0419/Deskemy-zh-CN";

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`DESKEMY_ZH_VERSION 不是有效的 SemVer：${version || "未设置"}`);
}
if (!publicKey) {
  throw new Error("未设置 TAURI_UPDATER_PUBLIC_KEY，不能生成可更新版本。");
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) throw new Error(`找不到文件：${relativePath}`);
  const raw = fs.readFileSync(filePath, "utf8");
  return {
    filePath,
    eol: raw.includes("\r\n") ? "\r\n" : "\n",
    text: raw.replaceAll("\r\n", "\n"),
  };
}

function write(file, text) {
  fs.writeFileSync(file.filePath, text.replaceAll("\n", file.eol), "utf8");
}

function replaceRequired(text, pattern, replacement, label) {
  if (pattern instanceof RegExp) {
    pattern.lastIndex = 0;
    if (!pattern.test(text)) throw new Error(`启用更新时未命中：${label}`);
    pattern.lastIndex = 0;
    return text.replace(pattern, replacement);
  }
  if (!text.includes(pattern)) throw new Error(`启用更新时未命中：${label}`);
  return text.replaceAll(pattern, replacement);
}

// 恢复 updater 插件调用，并确保便携版跳转到中文版 Releases。
{
  const file = read("src/lib/updates.svelte.ts");
  let text = file.text;
  text = replaceRequired(
    text,
    'import type { Update } from "@tauri-apps/plugin-updater";',
    'import { check, type Update } from "@tauri-apps/plugin-updater";',
    "恢复 updater 的 check 导入",
  );
  text = text.replace(
    /const RELEASES_URL = "[^"]+";/,
    `const RELEASES_URL = "https://github.com/${releaseRepo}/releases/latest";`,
  );
  text = replaceRequired(
    text,
    /export async function checkForUpdate\(\): Promise<void> \{[\s\S]*?\n\}\n\n(?=\/\*\* User-initiated\.)/,
    `export async function checkForUpdate(): Promise<void> {
  if (updates.checking) return;
  updates.checking = true;
  updates.error = null;
  try {
    const u = await check();
    if (u?.available) {
      updates.handle = u;
      updates.available = { version: u.version, notes: u.body ?? "" };
    } else {
      updates.handle = null;
      updates.available = null;
    }
  } catch (e: any) {
    updates.error = e?.message ?? String(e);
  } finally {
    updates.checking = false;
  }
}

`,
    "恢复应用内更新检查函数",
  );
  write(file, text);
}

// 恢复启动时检查更新。
{
  const file = read("src/routes/+layout.svelte");
  let text = file.text;
  text = replaceRequired(
    text,
    "// 中文构建暂不在启动时自动检查更新。",
    "void checkForUpdate();",
    "恢复启动时检查更新",
  );
  text = text.replace(
    "Deskemy 中文版 {updates.available.version} 已发布。",
    "Deskemy 中文版 {updates.available.version} 已由中文翻译仓库发布。",
  );
  write(file, text);
}

// 明确说明更新源，避免用户误认为来自官方英文版仓库。
{
  const file = read("src/routes/settings/+page.svelte");
  let text = file.text;
  text = replaceRequired(
    text,
    "检查中文版的新版本。确认前不会下载任何内容。",
    "检查由 Deskemy 中文翻译仓库发布的新版本，不会从官方英文版仓库下载。确认前不会下载任何内容。",
    "补充中文版更新来源说明",
  );
  write(file, text);
}

// 注入中文版版本、公钥和 GitHub Release 更新端点。
{
  const configPath = path.join(root, "src-tauri", "tauri.conf.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  config.version = version;
  config.bundle.createUpdaterArtifacts = true;
  config.plugins ??= {};
  config.plugins.updater ??= {};
  config.plugins.updater.pubkey = publicKey;
  config.plugins.updater.endpoints = [
    `https://github.com/${releaseRepo}/releases/latest/download/latest.json`,
  ];
  config.plugins.updater.windows = { installMode: "passive" };
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  const packagePath = path.join(root, "package.json");
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  pkg.version = version;
  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}

console.log(`已启用 Deskemy 中文版应用内更新：${version}`);
console.log(`更新源：https://github.com/${releaseRepo}/releases/latest/download/latest.json`);
