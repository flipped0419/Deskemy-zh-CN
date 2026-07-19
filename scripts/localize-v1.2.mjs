import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? ".");

function patchText(relativePath, replacements) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    console.warn(`v1.2 汉化跳过不存在文件：${relativePath}`);
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  let source = raw.replaceAll("\r\n", "\n");
  const original = source;

  for (const [from, to, label = typeof from === "string" ? from : String(from)] of replacements) {
    if (from instanceof RegExp) {
      from.lastIndex = 0;
      if (!from.test(source)) {
        if (!source.includes(to)) console.warn(`v1.2 汉化未命中：${relativePath}：${label}`);
        continue;
      }
      from.lastIndex = 0;
      source = source.replace(from, to);
    } else {
      if (!source.includes(from)) {
        if (!source.includes(to)) console.warn(`v1.2 汉化未命中：${relativePath}：${label}`);
        continue;
      }
      source = source.replaceAll(from, to);
    }
  }

  if (source !== original) {
    fs.writeFileSync(filePath, source.replaceAll("\n", eol), "utf8");
    console.log(`已应用 v1.2 汉化：${relativePath}`);
  }
}

// v1.2.0：新增全屏控制栏自动隐藏和导入标题清理设置。
patchText("src/routes/settings/+page.svelte", [
  ["Auto-hide controls in fullscreen", "全屏时自动隐藏控制栏"],
  [
    /Hide the control bar and cursor after a few seconds of no mouse movement while\s+fullscreen \(VLC-style\)\. Off keeps them always visible\./,
    "全屏播放时，鼠标静止数秒后隐藏控制栏和光标；移动鼠标后重新显示。关闭后将始终显示。",
    "全屏自动隐藏说明",
  ],
  ["Clean up lecture titles", "清理课时标题"],
  [
    /Strip leading numbers and file extensions on import \(e\.g\. "01\. Intro\.mp4" → "Intro"\)\.\s+Off keeps the raw file and folder names\. Applies to new imports\./,
    "导入时移除开头编号和文件扩展名（例如“01. Intro.mp4”→“Intro”）。关闭后保留原始文件名和文件夹名，适用于新导入和重新扫描。",
    "课时标题清理说明",
  ],
]);

// v1.2.0：课程文件夹移动或重命名后，可重新定位并保留进度等数据。
patchText("src/routes/course/[id]/+page.svelte", [
  ["This course's folder can't be found", "找不到该课程文件夹"],
  [
    /Moved or renamed the folder\? Point Deskemy at its new location — your progress,\s+bookmarks and tags are all kept\./,
    "如果文件夹已移动或重命名，请为 Deskemy 指定新位置；播放进度、书签和标签都会保留。",
    "课程文件夹重新定位说明",
  ],
  ["{/if} Locate folder", "{/if} 定位文件夹"],
]);

// 重新定位时可能直接显示后端错误，因此一并翻译新增错误信息。
patchText("src-tauri/src/commands/mod.rs", [
  [
    'format!("folder not found: {new_folder}")',
    'format!("找不到文件夹：{new_folder}")',
    "找不到目标文件夹",
  ],
  ['"course not found".into()', '"未找到课程".into()', "重新定位时未找到课程"],
  [
    /"That folder doesn't contain this course's files\. Pick the folder the \\\n\s*course was moved or renamed to\."/,
    '"该文件夹不包含此课程的文件。请选择课程移动或重命名后的实际文件夹。"',
    "目标文件夹不是原课程",
  ],
]);

// v1.2.0：书签改为暂停播放并打开居中的编辑弹窗。
patchText("src/routes/watch/[lectureId]/+page.svelte", [
  ['aria-label="Add bookmark"', 'aria-label="添加书签"'],
  ["<BookmarkPlus size={18} /> Add bookmark", "<BookmarkPlus size={18} /> 添加书签"],
  [
    />\s*Cancel\s*<\/button>/,
    ">\n                取消\n              </button>",
    "书签弹窗取消按钮",
  ],
  ["<BookmarkPlus size={15} /> Save", "<BookmarkPlus size={15} /> 保存"],
  ["Saved bookmarks", "已保存的书签"],
  ['title="Bookmark this moment"', 'title="为当前时刻添加书签"'],
  ['aria-label="Bookmark this moment"', 'aria-label="为当前时刻添加书签"'],
]);
