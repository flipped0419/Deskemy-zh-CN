import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(process.argv[2] ?? ".");

function patchText(relativePath, replacements) {
  const filePath = path.join(root, relativePath);
  const raw = fs.readFileSync(filePath, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  let source = raw.replaceAll("\r\n", "\n");
  const original = source;

  for (const [from, to, label = typeof from === "string" ? from : String(from)] of replacements) {
    if (from instanceof RegExp) {
      if (!from.test(source)) {
        console.warn(`反馈修复未命中：${relativePath}：${label}`);
        continue;
      }
      source = source.replace(from, to);
    } else {
      if (!source.includes(from)) {
        if (!source.includes(to)) console.warn(`反馈修复未命中：${relativePath}：${label}`);
        continue;
      }
      source = source.replaceAll(from, to);
    }
  }

  if (source !== original) {
    fs.writeFileSync(filePath, source.replaceAll("\n", eol), "utf8");
    console.log(`已补充汉化：${relativePath}`);
  }
}

function ensureVulkanLoader() {
  const destination = path.join(root, "src-tauri", "vendor", "vulkan-1.dll");
  if (fs.existsSync(destination) && fs.statSync(destination).size > 100 * 1024) {
    console.log(`已存在 Vulkan Loader：${destination}`);
    return;
  }

  const windowsDir = process.env.WINDIR || "C:\\Windows";
  const candidates = [
    path.join(windowsDir, "System32", "vulkan-1.dll"),
    process.env.VULKAN_SDK ? path.join(process.env.VULKAN_SDK, "Bin", "vulkan-1.dll") : null,
  ].filter(Boolean);
  let source = candidates.find((candidate) => fs.existsSync(candidate)) || null;

  if (!source) {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "deskemy-vulkan-"));
    try {
      const created = spawnSync("dotnet", ["new", "classlib", "--force"], {
        cwd: tempRoot,
        stdio: "inherit",
      });
      if (created.error) throw created.error;
      if (created.status !== 0) throw new Error(`创建 NuGet 临时项目失败：${created.status}`);

      const added = spawnSync(
        "dotnet",
        ["add", "package", "Silk.NET.Vulkan.Loader.Native", "--version", "2025.9.12"],
        { cwd: tempRoot, stdio: "inherit" },
      );
      if (added.error) throw added.error;
      if (added.status !== 0) throw new Error(`下载 Vulkan Loader 失败：${added.status}`);

      const packageRoot = path.join(
        os.homedir(),
        ".nuget",
        "packages",
        "silk.net.vulkan.loader.native",
        "2025.9.12",
      );
      const x64Candidates = [
        path.join(packageRoot, "runtimes", "win-x64", "native", "vulkan-1.dll"),
        path.join(packageRoot, "build", "native", "bin", "x64", "vulkan-1.dll"),
      ];
      source = x64Candidates.find((candidate) => fs.existsSync(candidate)) || null;
      if (!source) throw new Error("NuGet 包中未找到 x64 vulkan-1.dll");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  const size = fs.statSync(destination).size;
  if (size < 100 * 1024) throw new Error(`vulkan-1.dll 大小异常：${size} 字节`);
  console.log(`已准备 Vulkan Loader：${size} 字节`);
}

function patchEmbeddedVulkanLoader() {
  const relativePath = "src-tauri/src/mpv/mod.rs";
  const filePath = path.join(root, relativePath);
  let source = fs.readFileSync(filePath, "utf8");

  if (!source.includes("static VULKAN_PRELOADED")) {
    const marker = "static FNS: OnceLock<Option<Fns>> = OnceLock::new();";
    if (!source.includes(marker)) throw new Error(`构建修复未命中：嵌入 Vulkan Loader（${relativePath}）`);
    const helper = `${marker}\n\n#[cfg(target_os = \"windows\")]\nstatic VULKAN_PRELOADED: OnceLock<()> = OnceLock::new();\n\n#[cfg(target_os = \"windows\")]\nfn preload_vulkan_loader() {\n    VULKAN_PRELOADED.get_or_init(|| {\n        unsafe {\n            if let Ok(loader) = libloading::Library::new(\"vulkan-1.dll\") {\n                std::mem::forget(loader);\n                return;\n            }\n        }\n\n        const EMBEDDED_VULKAN_LOADER: &[u8] =\n            include_bytes!(\"../../vendor/vulkan-1.dll\");\n        let directory = std::env::temp_dir().join(\"Deskemy-runtime\");\n        if std::fs::create_dir_all(&directory).is_err() {\n            return;\n        }\n        let loader_path = directory.join(\"vulkan-1.dll\");\n        let needs_write = std::fs::metadata(&loader_path)\n            .map(|metadata| metadata.len() != EMBEDDED_VULKAN_LOADER.len() as u64)\n            .unwrap_or(true);\n        if needs_write && std::fs::write(&loader_path, EMBEDDED_VULKAN_LOADER).is_err() {\n            return;\n        }\n        unsafe {\n            if let Ok(loader) = libloading::Library::new(&loader_path) {\n                std::mem::forget(loader);\n            }\n        }\n    });\n}`;
    source = source.replace(marker, helper);
  }

  const loadMarker = "unsafe fn load() -> Result<Fns> {";
  if (!source.includes("preload_vulkan_loader();")) {
    if (!source.includes(loadMarker)) throw new Error(`构建修复未命中：预加载 Vulkan Loader（${relativePath}）`);
    source = source.replace(
      loadMarker,
      `${loadMarker}\n    #[cfg(target_os = \"windows\")]\n    preload_vulkan_loader();`,
    );
  }

  fs.writeFileSync(filePath, source, "utf8");
  console.log("已嵌入并预加载 Vulkan Loader，避免部分 Windows 设备无法载入 libmpv");
}

patchText("src/routes/tracks/+page.svelte", [
  [
    'No tracks yet. Group courses into an ordered learning path — like "Platform Engineering":\n        Linux → Docker → Kubernetes.',
    '还没有学习路线。你可以按学习顺序组织课程，例如“平台工程”：\n        Linux → Docker → Kubernetes。',
  ],
  [
    '{t.course_count} course{t.course_count === 1 ? "" : "s"} · {t.completed_lectures} / {t.total_lectures}\n            lectures',
    '{t.course_count} 门课程 · 已完成 {t.completed_lectures} / {t.total_lectures} 节',
  ],
  ["New career track", "新建学习路线"],
  [">Cancel\n", ">取消\n"],
  ["{/if} Create", "{/if} 创建"],
]);

patchText("src/routes/settings/+page.svelte", [
  ["Follow the system or force light/dark.", "跟随系统外观，或固定使用浅色/深色模式。"],
  ["Applied when a lecture opens.", "打开课时时自动应用。"],
  ["Advance automatically when one ends.", "当前课时结束后自动播放下一节。"],
  ["Target watch time per day (Stats).", "每日目标观看时长（显示在学习统计中）。"],
  ["{m} min", "{m} 分钟"],
  [
    "Re-import a course when its folder changes on disk. May briefly pause the UI while it\n              re-scans; the course you're watching is never touched.",
    "课程文件夹发生变化时自动重新导入。重新扫描期间界面可能短暂停顿，\n              当前正在播放的课程不会受到影响。",
  ],
  ["Flag courses whose video files have moved or been deleted.", "标记视频文件已移动或被删除的课程。"],
  ["Refresh full-text search from the current library.", "根据当前课程库重建全文搜索索引。"],
  ["Parse sidecar subtitles so Search can find spoken words.", "解析外挂字幕，使搜索能够查找字幕内容。"],
  [
    "Save your library — progress, bookmarks, tags, tracks, thumbnails — to one\n              <code>.zip</code>. Your video files aren't included. Handy for moving a portable copy\n              to a new release, or as a safety backup.",
    "将课程库、播放进度、书签、标签、学习路线和封面保存到一个\n              <code>.zip</code> 文件中。备份不包含视频文件，可用于迁移便携版或保留安全副本。",
  ],
  [
    "Replace this library with a backup, then restart. It re-links to your videos where they\n              still exist — it can't restore progress onto a different download of a course.",
    "使用备份替换当前课程库并重启。仍存在的视频会自动重新关联，\n              但无法把进度恢复到内容不同的课程副本。",
  ],
  [
    "Course metadata, progress, bookmarks and search indexes — videos are never stored here.\n              Compact reclaims space freed by removed courses or cleared indexes.",
    "这里保存课程元数据、播放进度、书签和搜索索引，不保存视频文件。\n              压缩数据库可以回收删除课程或清理索引后释放的空间。",
  ],
  [
    'Indexed subtitle text — the main database growth. Clearing frees the most space;\n              re-index anytime with "Index subtitle text" above.',
    "已索引的字幕文本通常占用数据库的大部分空间。清除后可释放空间，\n              随时可以使用上方的“索引字幕文本”重新建立。",
  ],
  [
    "Cached course covers and resume frames (stored on disk, not in the database). Clean\n              deletes images no longer used by any course.",
    "缓存的课程封面和续播画面保存在磁盘中，不在数据库内。\n              清理操作会删除不再被任何课程使用的图片。",
  ],
  ["Check for a newer release. Nothing downloads until you confirm.", "检查中文版的新版本，确认前不会下载任何内容。"],
  [
    "This replaces your current library — progress, bookmarks, tags, everything — with the\n        backup, then restarts Deskemy. Your current data can't be recovered afterward unless you\n        exported it first.",
    "这会使用备份替换当前课程库及其中的播放进度、书签和标签，然后重启 Deskemy。\n        除非事先导出备份，否则当前数据在替换后无法恢复。",
  ],
  ["/>{/if} Check", "/>{/if} 检查"],
  ["/>{/if} Rebuild", "/>{/if} 重建"],
  ["/>{/if} Index", "/>{/if} 建立索引"],
  ["/>{/if} Export", "/>{/if} 导出"],
  ['<Upload size={15} /> Import', '<Upload size={15} /> 导入'],
  ["/>{/if} Compact", "/>{/if} 压缩"],
  ["/>{/if} Clear", "/>{/if} 清除"],
  ["/>{/if} Clean", "/>{/if} 清理"],
  ["Update to {updates.available.version}", "更新到 {updates.available.version}"],
  [">Cancel\n", ">取消\n"],
  ["{/if} Import &amp; restart", "{/if} 导入并重启"],
  ['"Backup saved."', '"备份已保存。"'],
  ['"You\'re on the latest version."', '"当前已是最新版本。"'],
  [/`All files present across \$\{plural\(r\.courses_checked, "course"\)\}\.`/, '`已检查 ${r.courses_checked} 门课程，所有文件均存在。`'],
  [/`Reindexed \$\{plural\(await api\.reindexSearch\(\), "item"\)\}\.`/, '`已重建 ${await api.reindexSearch()} 项搜索索引。`'],
  [/`Database compacted — now \$\{fmtBytes\(bytes\)\}\.`/, '`数据库已压缩，当前大小为 ${fmtBytes(bytes)}。`'],
]);

patchText("src/routes/watch/[lectureId]/+page.svelte", [
  ["libmpv is required to play videos", "播放器组件未能加载"],
  [
    "Deskemy plays through <code>libmpv-2.dll</code>, mpv's shared library. The mpv\n      <span class=\"text-on-surface\">player</span> alone usually doesn't include it — download the\n      <span class=\"text-primary\">libmpv</span> build from mpv.io's Windows downloads and extract\n      <code>libmpv-2.dll</code>.",
    "Deskemy 已随程序附带 <code>libmpv-2.dll</code>。如果仍看到此提示，通常是播放器的\n      依赖组件未能加载。新版会自动附带所需的 Vulkan 加载器。",
  ],
  [
    "Then put that DLL next to <code>Deskemy.exe</code>, anywhere on your PATH, or set\n      <code>DESKEMY_LIBMPV</code> to its full path — and reopen this lecture.",
    "请重新安装新版，或完整解压便携版后运行；不要只复制 <code>Deskemy.exe</code>。\n      如果问题仍然存在，请更新显卡驱动后重新打开本课时。",
  ],
]);

ensureVulkanLoader();
patchEmbeddedVulkanLoader();
