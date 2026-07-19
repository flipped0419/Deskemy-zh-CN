import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(process.argv[2] ?? ".");

function patchRequired(relativePath, pattern, replacement, label) {
  const filePath = path.join(root, relativePath);
  const source = fs.readFileSync(filePath, "utf8");
  if (!pattern.test(source)) {
    throw new Error(`构建修复未命中：${label}（${relativePath}）`);
  }
  fs.writeFileSync(filePath, source.replace(pattern, replacement), "utf8");
  console.log(`已应用构建修复：${label}`);
}

function findFile(directory, filename) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const found = findFile(fullPath, filename);
      if (found) return found;
    } else if (entry.name.toLowerCase() === filename.toLowerCase()) {
      return fullPath;
    }
  }
  return null;
}

async function ensureLibmpv() {
  const destination = path.join(root, "src-tauri", "vendor", "libmpv-2.dll");
  if (fs.existsSync(destination) && fs.statSync(destination).size > 1024 * 1024) {
    console.log(`已存在 libmpv：${destination}`);
    return;
  }

  const upstreamRef = process.env.UPSTREAM_REF || "v1.1.0";
  const tagEndpoint = `https://api.github.com/repos/NFRohan/Deskemy/releases/tags/${encodeURIComponent(upstreamRef)}`;
  const latestEndpoint = "https://api.github.com/repos/NFRohan/Deskemy/releases/latest";
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "Deskemy-zh-CN-build",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  let response = await fetch(tagEndpoint, { headers });
  if (!response.ok) {
    console.warn(`未找到 ${upstreamRef} 对应的 Release（HTTP ${response.status}），改用最新 Release。`);
    response = await fetch(latestEndpoint, { headers });
  }
  if (!response.ok) {
    throw new Error(`无法读取 Deskemy Release：HTTP ${response.status}`);
  }

  const release = await response.json();
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const zipAssets = assets.filter(
    (asset) => typeof asset?.name === "string" && /\.zip$/i.test(asset.name),
  );
  const asset =
    zipAssets.find((item) => /portable/i.test(item.name)) ||
    zipAssets.find((item) => /windows|win|x64/i.test(item.name)) ||
    zipAssets[0];

  if (!asset?.browser_download_url) {
    const names = assets.map((item) => item?.name).filter(Boolean).join(", ");
    throw new Error(`Deskemy Release 中未找到便携版 ZIP。现有附件：${names || "无"}`);
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "deskemy-libmpv-"));
  const archivePath = path.join(tempRoot, "portable.zip");
  const extractPath = path.join(tempRoot, "extracted");
  fs.mkdirSync(extractPath, { recursive: true });

  try {
    console.log(`下载官方运行库：${asset.name}`);
    const download = await fetch(asset.browser_download_url, {
      headers: { "User-Agent": "Deskemy-zh-CN-build" },
      redirect: "follow",
    });
    if (!download.ok) {
      throw new Error(`下载 ${asset.name} 失败：HTTP ${download.status}`);
    }
    fs.writeFileSync(archivePath, Buffer.from(await download.arrayBuffer()));

    const command = `Expand-Archive -LiteralPath '${archivePath.replaceAll("'", "''")}' -DestinationPath '${extractPath.replaceAll("'", "''")}' -Force`;
    const expanded = spawnSync("pwsh", ["-NoProfile", "-NonInteractive", "-Command", command], {
      stdio: "inherit",
    });
    if (expanded.error) throw expanded.error;
    if (expanded.status !== 0) {
      throw new Error(`解压官方便携版失败，退出码：${expanded.status}`);
    }

    const dll = findFile(extractPath, "libmpv-2.dll");
    if (!dll) {
      throw new Error(`官方便携版 ${asset.name} 中未找到 libmpv-2.dll`);
    }

    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(dll, destination);
    const size = fs.statSync(destination).size;
    if (size < 1024 * 1024) {
      throw new Error(`提取的 libmpv-2.dll 大小异常：${size} 字节`);
    }
    console.log(`已提取 libmpv-2.dll：${size} 字节`);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

patchRequired(
  "src/lib/updates.svelte.ts",
  /export async function checkForUpdate\(\): Promise<void> \{[\s\S]*?\r?\n\}\r?\n\r?\n(?=\/\*\* User-initiated\.)/,
  `export async function checkForUpdate(): Promise<void> {
  updates.handle = null;
  updates.available = null;
  updates.checking = false;
  updates.error = "中文版暂未启用应用内更新，请在项目 Releases 页面下载新版本。";
}

`,
  "禁用应用内更新检查",
);

patchRequired(
  "src/routes/course/[id]/+page.svelte",
  /  \$effect\(\(\) => \{\r?\n    load\(\$page\.params\.id\);\r?\n  \}\);/,
  `  $effect(() => {
    const courseId = $page.params.id;
    if (courseId) void load(courseId);
  });`,
  "处理课程路由参数可能为空",
);

// 当前依赖组合会把“let state = $state(...)”中的 $state 误判为旧式
// store 订阅。只重命名播放器内部变量，避免与 Svelte 5 rune 产生歧义。
{
  const relativePath = "src/routes/watch/[lectureId]/+page.svelte";
  const filePath = path.join(root, relativePath);
  let source = fs.readFileSync(filePath, "utf8");
  const oldDeclaration = "let state = $state<PlayerState>({";
  const newDeclaration = "let playerState = $state<PlayerState>({";

  if (source.includes(oldDeclaration)) {
    source = source.replace(oldDeclaration, newDeclaration);
    source = source.replaceAll("state.", "playerState.");
    source = source.replace(/\bstate\s*=/g, "playerState =");
    fs.writeFileSync(filePath, source, "utf8");
    console.log("已应用构建修复：重命名播放器内部 state 变量，避免与 $state rune 歧义");
  } else if (!source.includes(newDeclaration)) {
    throw new Error(`构建修复未命中：播放器 state 变量重命名（${relativePath}）`);
  }
}

await ensureLibmpv();
await import("./feedback-fixes.mjs");
await import("./feedback-round2.mjs");
await import("./localize-v1.2.mjs");
