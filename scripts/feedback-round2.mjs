import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? ".");

function patchText(relativePath, replacements) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`第二轮反馈修复找不到文件：${relativePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  let source = raw.replaceAll("\r\n", "\n");
  const original = source;

  for (const [from, to, label = typeof from === "string" ? from : String(from)] of replacements) {
    if (from instanceof RegExp) {
      from.lastIndex = 0;
      if (!from.test(source)) {
        if (!source.includes(to)) console.warn(`第二轮反馈修复未命中：${relativePath}：${label}`);
        continue;
      }
      from.lastIndex = 0;
      source = source.replace(from, to);
    } else {
      if (!source.includes(from)) {
        if (!source.includes(to)) console.warn(`第二轮反馈修复未命中：${relativePath}：${label}`);
        continue;
      }
      source = source.replaceAll(from, to);
    }
  }

  if (source !== original) {
    fs.writeFileSync(filePath, source.replaceAll("\n", eol), "utf8");
    console.log(`已应用第二轮反馈修复：${relativePath}`);
  }
}

patchText("src/routes/+page.svelte", [
  [
    /Use <span class="text-primary">Add Folder<\/span> in the sidebar to import a downloaded\s+course\. Deskemy will auto-structure it into sections and lectures\./,
    '点击侧边栏中的 <span class="text-primary">添加文件夹</span> 导入下载好的课程。Deskemy 会自动将课程整理为章节和课时。',
    "空课程库说明",
  ],
]);

patchText("src/lib/components/Sidebar.svelte", [
  [
    />\s*Cancel\s*<\/button>/,
    ">\n          取消\n        </button>",
    "导入预览取消按钮",
  ],
]);

patchText("src/routes/settings/+page.svelte", [
  ["Indexed subtitle text — the main database growth.", "已索引的字幕文本通常占用数据库的大部分空间。"],
  ["Clearing frees the most space;", "清除后可释放最多空间；"],
  ['re-index anytime with "索引字幕文本" above.', "随时可以使用上方的“索引字幕文本”重新建立。"],
  ['re-index anytime with "Index subtitle text" above.', "随时可以使用上方的“索引字幕文本”重新建立。"],
]);

patchText("src/routes/course/[id]/+page.svelte", [
  [
    /function flat\(c: CourseDetail\): Lecture\[\] \{\n\s*return c\.sections\.flatMap\(\(s\) => s\.lectures\);\n\s*\}/,
    `function flat(c: CourseDetail): Lecture[] {
    return c.sections.flatMap((s) => s.lectures);
  }

  function displaySectionTitle(section: Section, index: number): string {
    const normalized = section.title.trim().toLowerCase();
    if (index === 0 && (normalized === "introduction" || normalized === "intro")) return "01";
    return section.title;
  }`,
    "增加课程详情页根目录章节编号显示",
  ],
  [
    "{#each course.sections as section (section.id)}",
    "{#each course.sections as section, sectionIndex (section.id)}",
    "取得课程章节序号",
  ],
  [
    '<span class="text-headline-sm text-on-surface truncate">{section.title}</span>',
    '<span class="text-headline-sm text-on-surface truncate">{displaySectionTitle(section, sectionIndex)}</span>',
    "课程详情页根目录章节显示为 01",
  ],
]);

patchText("src/routes/watch/[lectureId]/+page.svelte", [
  [
    /(const panelItem\s*=\s*\n\s*"[^"]+";)/,
    `$1

  function displaySectionTitle(section: { id: string; title: string } | null): string {
    if (!section) return "";
    const normalized = section.title.trim().toLowerCase();
    const index = course?.sections.findIndex((item) => item.id === section.id) ?? -1;
    if (index === 0 && (normalized === "introduction" || normalized === "intro")) return "01";
    return section.title;
  }`,
    "增加播放器根目录章节编号显示",
  ],
  [
    />\s*Content\s*<\/button>/,
    ">\n                课程目录\n              </button>",
    "播放器侧栏课程目录标签",
  ],
  ["{currentSection.title}", "{displaySectionTitle(currentSection)}"],
  ["{section.title}", "{displaySectionTitle(section)}"],
]);
