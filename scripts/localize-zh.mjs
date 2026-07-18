import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? ".");
const report = [];

function replace(file, rules) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) {
    report.push(`缺少文件: ${file}`);
    return;
  }
  let s = fs.readFileSync(p, "utf8");
  for (const [a, b] of rules) {
    const n = s.split(a).length - 1;
    if (n) {
      s = s.replaceAll(a, b);
      report.push(`${file}: ${a} -> ${b} (${n})`);
    }
  }
  fs.writeFileSync(p, s, "utf8");
}

replace("src/lib/components/Sidebar.svelte", [
  ["Library", "课程库"],
  ["Search", "搜索"],
  ["Career Tracks", "学习路线"],
  ["Favorites", "收藏"],
  ["Bookmarks", "书签"],
  ["History", "观看历史"],
  ["Stats", "学习统计"],
  ["Settings", "设置"],
  ["Add Folder", "添加文件夹"],
]);

replace("src/routes/+page.svelte", [
  ["Continue Watching", "继续观看"],
  ["All Courses", "全部课程"],
  ["Search courses…", "搜索课程…"],
  ["Your library is empty", "课程库为空"],
]);

replace("src/routes/settings/+page.svelte", [
  ["Settings", "设置"],
  ["Appearance", "外观"],
  ["Playback", "播放"],
  ["Theme", "主题"],
  ["Default playback speed", "默认播放速度"],
  ["Daily goal", "每日目标"],
]);

fs.writeFileSync(path.join(root, "LOCALIZATION_REPORT.md"), `# 汉化报告\n\n${report.join("\n")}`, "utf8");
console.log(`完成汉化，处理 ${report.length} 项。`);
