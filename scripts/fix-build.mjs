import fs from "node:fs";
import path from "node:path";

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
