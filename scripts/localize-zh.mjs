import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? ".");
const changedFiles = [];
const warnings = [];
const applied = [];

function count(text, needle) {
  if (needle instanceof RegExp) return [...text.matchAll(new RegExp(needle.source, needle.flags.includes("g") ? needle.flags : `${needle.flags}g`))].length;
  return text.split(needle).length - 1;
}

function patchFile(relativePath, replacements) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    warnings.push(`文件不存在：${relativePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  for (const item of replacements) {
    const [from, to, label = typeof from === "string" ? from : String(from)] = item;
    const found = count(content, from);
    if (found === 0) {
      warnings.push(`${relativePath}：未找到「${label}」`);
      continue;
    }

    if (from instanceof RegExp) {
      content = content.replace(from, to);
    } else {
      content = content.replaceAll(from, to);
    }
    applied.push(`${relativePath}：${label}（${found}）`);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    changedFiles.push(relativePath);
    console.log(`已汉化：${relativePath}`);
  }
}

patchFile("src/routes/+page.svelte", [
  ['{ value: "all", label: "All" }', '{ value: "all", label: "全部" }'],
  ['{ value: "recent", label: "Recently watched" }', '{ value: "recent", label: "最近观看" }'],
  ['{ value: "progress", label: "In progress" }', '{ value: "progress", label: "进行中" }'],
  ['{ value: "finished", label: "Finished" }', '{ value: "finished", label: "已完成" }'],
  ['{ value: "new", label: "Not started" }', '{ value: "new", label: "未开始" }'],
  ['{ value: "favorites", label: "Favorites" }', '{ value: "favorites", label: "收藏" }'],
  ['setCrumbs([{ label: "Library" }]);', 'setCrumbs([{ label: "课程库" }]);'],
  ['Your library is empty', '课程库为空'],
  [
    'Use <span class="text-primary">Add Folder</span> in the sidebar to import a downloaded\n        course. Deskemy will auto-structure it into sections and lectures.',
    '点击侧边栏中的 <span class="text-primary">添加文件夹</span> 导入下载好的课程。\n        Deskemy 会自动将课程整理为章节和课时。',
  ],
  ['Continue Watching', '继续观看'],
  ['Continue where you left off', '从上次停止的位置继续'],
  ['{heroPct}% Complete', '已完成 {heroPct}%'],
  ['{hero.completed_count} / {hero.lecture_count} lectures', '已完成 {hero.completed_count} / {hero.lecture_count} 节'],
  ['All Courses', '全部课程'],
  ['placeholder="Search courses…"', 'placeholder="搜索课程…"'],
  ['title="Filter by career track"', 'title="按学习路线筛选"'],
  ['<option value={null}>All tracks</option>', '<option value={null}>全部路线</option>'],
  ['<option value="recent">Recent</option>', '<option value="recent">最近观看</option>'],
  ['<option value="alpha">Alphabetical</option>', '<option value="alpha">按名称</option>'],
  ['<option value="progress">Progress</option>', '<option value="progress">按进度</option>'],
  ['<option value="duration">Longest</option>', '<option value="duration">时长最长</option>'],
  ['Clear', '清除'],
  ['No courses match your filters.', '没有符合筛选条件的课程。'],
]);

patchFile("src/lib/components/Sidebar.svelte", [
  ['{ href: "/", label: "Library", icon: Library }', '{ href: "/", label: "课程库", icon: Library }'],
  ['{ href: "/search", label: "Search", icon: Search }', '{ href: "/search", label: "搜索", icon: Search }'],
  ['{ href: "/tracks", label: "Career Tracks", icon: Route }', '{ href: "/tracks", label: "学习路线", icon: Route }'],
  ['{ href: "/favorites", label: "Favorites", icon: Star }', '{ href: "/favorites", label: "收藏", icon: Star }'],
  ['{ href: "/bookmarks", label: "Bookmarks", icon: Bookmark }', '{ href: "/bookmarks", label: "书签", icon: Bookmark }'],
  ['{ href: "/history", label: "History", icon: History }', '{ href: "/history", label: "观看历史", icon: History }'],
  ['{ href: "/stats", label: "Stats", icon: ChartColumn }', '{ href: "/stats", label: "学习统计", icon: ChartColumn }'],
  ['{ href: "/settings", label: "Settings", icon: Settings }', '{ href: "/settings", label: "设置", icon: Settings }'],
  ['title="Expand sidebar"', 'title="展开侧边栏"'],
  ['aria-label="Expand sidebar"', 'aria-label="展开侧边栏"'],
  ['title="Collapse sidebar"', 'title="收起侧边栏"'],
  ['aria-label="Collapse sidebar"', 'aria-label="收起侧边栏"'],
  ['title="Add Folder"', 'title="添加文件夹"'],
  ['`Probing ${scanProgress.done}/${scanProgress.total}`', '`正在分析 ${scanProgress.done}/${scanProgress.total}`'],
  ['"Scanning…"', '"正在扫描…"'],
  ['{#if !ui.sidebarCollapsed}Add Folder{/if}', '{#if !ui.sidebarCollapsed}添加文件夹{/if}'],
  ['Import course', '导入课程'],
  ['aria-label="Cancel"', 'aria-label="取消"'],
  [
    'Already in your library — re-importing keeps your progress, bookmarks and tags.',
    '该课程已在课程库中。重新导入会保留播放进度、书签和标签。',
  ],
  ['</b> sections', '</b> 个章节'],
  ['</b> lectures', '</b> 节课'],
  ['</b> resources', '</b> 个资料'],
  ['</b> subtitles', '</b> 个字幕'],
  ['Total runtime ·', '总时长 ·'],
  [' video{preview.unplayable === 1 ? "" : "s"} couldn\'t be opened — imported but flagged.', ' 个视频无法打开，仍会导入并标记异常。'],
  ['>Cancel\n', '>取消\n'],
  ['{preview.is_reimport ? "Re-import" : "Import"}', '{preview.is_reimport ? "重新导入" : "导入"}'],
]);

patchFile("src/lib/components/TopBar.svelte", [
  ['aria-label="Minimize"', 'aria-label="最小化"'],
  ['maximized ? "Restore" : "Maximize"', 'maximized ? "还原" : "最大化"'],
  ['aria-label="Close"', 'aria-label="关闭"'],
]);

patchFile("src/lib/components/CourseCard.svelte", [
  ['<CheckCheck size={12} /> Completed', '<CheckCheck size={12} /> 已完成'],
  ['{course.scan_status}', '{course.scan_status === "Importing" ? "正在导入" : course.scan_status === "Scanning" ? "正在扫描" : course.scan_status === "Missing" ? "文件缺失" : course.scan_status === "Error" ? "错误" : course.scan_status}'],
  ['{course.lecture_count} Lectures', '{course.lecture_count} 节课'],
  ['Not started', '未开始'],
]);

patchFile("src/routes/favorites/+page.svelte", [
  ['setCrumbs([{ label: "Favorites" }]);', 'setCrumbs([{ label: "收藏" }]);'],
  ['<Star size={18} /> Favorites', '<Star size={18} /> 收藏'],
  ['No favorites yet. Star a course from its page to pin it here.', '还没有收藏课程。在课程页面点击星标后，课程会显示在这里。'],
]);

patchFile("src/routes/bookmarks/+page.svelte", [
  ['setCrumbs([{ label: "Bookmarks" }]);', 'setCrumbs([{ label: "书签" }]);'],
  ['<Bookmark size={18} /> Bookmarks', '<Bookmark size={18} /> 书签'],
  ['<LoaderCircle size={18} class="animate-spin" /> Loading…', '<LoaderCircle size={18} class="animate-spin" /> 正在加载…'],
  ['No bookmarks yet. While watching a lecture, open the bookmark panel in the player to add one.', '还没有书签。播放课程时打开播放器中的书签面板即可添加。'],
  ['aria-label="Delete bookmark"', 'aria-label="删除书签"'],
  ['title="Delete bookmark"', 'title="删除书签"'],
]);

patchFile("src/routes/history/+page.svelte", [
  ['setCrumbs([{ label: "History" }]);', 'setCrumbs([{ label: "观看历史" }]);'],
  ['<History size={18} /> History', '<History size={18} /> 观看历史'],
  ['<LoaderCircle size={18} class="animate-spin" /> Loading…', '<LoaderCircle size={18} class="animate-spin" /> 正在加载…'],
  ['Nothing watched yet. Play a lecture and it\'ll show up here so you can pick up where you left off.', '还没有观看记录。开始播放课程后，可以从这里继续上次的进度。'],
  ['<CircleCheck size={14} /> Done', '<CircleCheck size={14} /> 已完成'],
  ['<Play size={13} fill="currentColor" /> Resume', '<Play size={13} fill="currentColor" /> 继续播放'],
]);

patchFile("src/lib/format.ts", [
  ['return `${h}h ${m}m`;', 'return `${h}小时 ${m}分钟`;'],
  ['return `${m}m`;', 'return `${m}分钟`;'],
  ['return `${s}s`;', 'return `${s}秒`;'],
  ['if (diffDays <= 0) return "Today";', 'if (diffDays <= 0) return "今天";'],
  ['if (diffDays === 1) return "Yesterday";', 'if (diffDays === 1) return "昨天";'],
  ['return d.toLocaleDateString(undefined, {', 'return d.toLocaleDateString("zh-CN", {'],
]);

patchFile("src/routes/search/+page.svelte", [
  ['setCrumbs([{ label: "Search" }]);', 'setCrumbs([{ label: "搜索" }]);'],
  ['course: { icon: BookOpen, label: "Course" }', 'course: { icon: BookOpen, label: "课程" }'],
  ['section: { icon: ListVideo, label: "Section" }', 'section: { icon: ListVideo, label: "章节" }'],
  ['lecture: { icon: Play, label: "Lecture" }', 'lecture: { icon: Play, label: "课时" }'],
  ['attachment: { icon: Paperclip, label: "Attachment" }', 'attachment: { icon: Paperclip, label: "资料" }'],
  ['<Search size={18} /> Search', '<Search size={18} /> 搜索'],
  ['placeholder="Search courses, sections, lectures…"', 'placeholder="搜索课程、章节和课时…"'],
  ['<Captions size={14} /> In lecture subtitles', '<Captions size={14} /> 字幕内容'],
  ['No matches for "{query.trim()}".', '没有找到与“{query.trim()}”匹配的内容。'],
  ['Search across your library — titles, resources, and spoken subtitle text.', '搜索课程库中的标题、资料和字幕文本。'],
]);

patchFile("src/routes/tracks/+page.svelte", [
  ['setCrumbs([{ label: "Career Tracks" }]);', 'setCrumbs([{ label: "学习路线" }]);'],
  ['<Route size={18} /> Career Tracks', '<Route size={18} /> 学习路线'],
  ['<Plus size={16} /> New track', '<Plus size={16} /> 新建路线'],
  ['<LoaderCircle size={18} class="animate-spin" /> Loading…', '<LoaderCircle size={18} class="animate-spin" /> 正在加载…'],
  ['No tracks yet. Group courses into an ordered learning path — like "Platform Engineering":\n        Linux → Docker → Kubernetes.', '还没有学习路线。你可以按学习顺序组织课程，例如“平台工程”：\n        Linux → Docker → Kubernetes。'],
  ['{t.course_count} course{t.course_count === 1 ? "" : "s"} · {t.completed_lectures} / {t.total_lectures}\n            lectures', '{t.course_count} 门课程 · 已完成 {t.completed_lectures} / {t.total_lectures} 节'],
  ['New career track', '新建学习路线'],
  ['aria-label="Close"', 'aria-label="关闭"'],
  ['>Name</label>', '>名称</label>'],
  ['placeholder="e.g. Platform Engineering"', 'placeholder="例如：高等数学强化"'],
  ['Description (optional)', '说明（可选）'],
  ['>Cancel\n', '>取消\n'],
  ['{/if} Create', '{/if} 创建'],
]);

patchFile("src/routes/tracks/[id]/+page.svelte", [
  ['{ label: "Career Tracks", href: "/tracks" }', '{ label: "学习路线", href: "/tracks" }'],
  ['else error = "Track not found.";', 'else error = "未找到学习路线。";'],
  ['<LoaderCircle size={18} class="animate-spin" /> Loading…', '<LoaderCircle size={18} class="animate-spin" /> 正在加载…'],
  ['error ?? "Track not found."', 'error ?? "未找到学习路线。"'],
  ['aria-label="Edit track" title="Edit track"', 'aria-label="编辑路线" title="编辑路线"'],
  ['aria-label="Delete track" title="Delete track"', 'aria-label="删除路线" title="删除路线"'],
  ['{percent}% · {totalDone} / {totalLect} lectures', '{percent}% · 已完成 {totalDone} / {totalLect} 节'],
  ['{track.courses.length} course{track.courses.length === 1 ? "" : "s"}', '{track.courses.length} 门课程'],
  ['<Plus size={15} /> Add courses', '<Plus size={15} /> 添加课程'],
  ['No courses in this track yet. Add courses to build the learning path — order matters.', '这条路线中还没有课程。添加课程并调整顺序来规划学习路径。'],
  ['aria-label="Move up"', 'aria-label="上移"'],
  ['aria-label="Move down"', 'aria-label="下移"'],
  ['title={done ? "Completed" : c.completed_lectures > 0 ? "In progress" : "Not started"}', 'title={done ? "已完成" : c.completed_lectures > 0 ? "进行中" : "未开始"}'],
  ['>Up next</span>', '>接下来学习</span>'],
  ['aria-label="Remove from track" title="Remove from track"', 'aria-label="从路线中移除" title="从路线中移除"'],
  ['<h3 class="text-headline-sm text-on-surface">Add courses</h3>', '<h3 class="text-headline-sm text-on-surface">添加课程</h3>'],
  ['aria-label="Close"', 'aria-label="关闭"'],
  ['placeholder="Filter courses…"', 'placeholder="筛选课程…"'],
  ['"No courses in your library yet."', '"课程库中还没有课程。"'],
  ['"Every matching course is already in this track."', '"所有符合条件的课程都已加入这条路线。"'],
  ['{c.lecture_count} lectures', '{c.lecture_count} 节课'],
  ['<h3 class="text-headline-sm text-on-surface">Edit track</h3>', '<h3 class="text-headline-sm text-on-surface">编辑路线</h3>'],
  ['>Name</label>', '>名称</label>'],
  ['Description (optional)', '说明（可选）'],
  ['>Cancel</button>', '>取消</button>'],
  ['{/if} Save', '{/if} 保存'],
  ['Delete "{track.name}"?', '删除“{track.name}”？'],
  ['This removes the track and its ordering only. Your courses, progress and bookmarks are untouched.', '只会删除这条路线及其排序，不会影响课程、播放进度和书签。'],
  ['>Delete track</button>', '>删除路线</button>'],
]);

patchFile("src/routes/course/[id]/+page.svelte", [
  ['groups.push({ title: "Course-wide", items: loose });', 'groups.push({ title: "全课程资料", items: loose });'],
  ['{ label: "Library", href: "/" }', '{ label: "课程库", href: "/" }'],
  ['title="Edit thumbnail"', 'title="编辑封面"'],
  ['aria-label="Edit thumbnail"', 'aria-label="编辑封面"'],
  ['No thumbnail', '暂无封面'],
  ['<Pencil size={16} /> Edit', '<Pencil size={16} /> 编辑'],
  ['aria-label="Toggle favorite"', 'aria-label="切换收藏状态"'],
  ['course.is_favorite ? "Unfavorite" : "Favorite"', 'course.is_favorite ? "取消收藏" : "收藏"'],
  ['aria-label="Remove from library"', 'aria-label="从课程库移除"'],
  ['title="Remove from library"', 'title="从课程库移除"'],
  ['aria-label={`Remove tag ${tag}`}', 'aria-label={`删除标签 ${tag}`}'],
  ['placeholder="+ tag"', 'placeholder="+ 标签"'],
  ['{done} / {total} lectures completed', '已完成 {done} / {total} 节'],
  ['{formatDuration(course.total_duration)} total', '总计 {formatDuration(course.total_duration)}'],
  ['{done > 0 ? "Resume Lecture" : "Start Course"}', '{done > 0 ? "继续学习" : "开始课程"}'],
  ['<ListVideo size={18} /> Course Curriculum', '<ListVideo size={18} /> 课程目录'],
  ['lecture.completed ? "Mark as not done" : "Mark as done"', 'lecture.completed ? "标记为未完成" : "标记为已完成"'],
  ['Next up', '接下来学习'],
  ['<TriangleAlert size={12} /> Corrupted', '<TriangleAlert size={12} /> 文件损坏'],
  ['<Paperclip size={18} /> Resources', '<Paperclip size={18} /> 课程资料'],
  ['title="Open with default app"', 'title="使用默认应用打开"'],
  ['aria-label="Course thumbnail"', 'aria-label="课程封面"'],
  ['<h3 class="text-headline-sm text-on-surface">Course thumbnail</h3>', '<h3 class="text-headline-sm text-on-surface">课程封面</h3>'],
  ['aria-label="Close"', 'aria-label="关闭"'],
  ['<Upload size={15} /> Upload image', '<Upload size={15} /> 上传图片'],
  ['<X size={15} /> Remove', '<X size={15} /> 移除'],
  ['Tip: copy any image and press Ctrl+V to paste it here.', '提示：复制任意图片后按 Ctrl+V，即可粘贴到这里。'],
  ['aria-label="Remove course"', 'aria-label="移除课程"'],
  ['<h3 class="text-headline-sm text-on-surface">Remove from library?</h3>', '<h3 class="text-headline-sm text-on-surface">从课程库中移除？</h3>'],
  [
    'will be removed from Deskemy, along with\n          its progress and bookmarks. Your video files on disk are not deleted — you can re-import the\n          folder later.',
    '将从 Deskemy 中移除，其播放进度和书签也会被删除。\n          磁盘中的视频文件不会被删除，之后仍可重新导入该文件夹。',
  ],
  ['Couldn\'t remove:', '无法移除：'],
  ['>Cancel\n', '>取消\n'],
  ['{/if} Remove', '{/if} 移除'],
  ['Course not found', '未找到课程'],
  ['It may have been removed from your library.', '它可能已从课程库中移除。'],
  ['Back to library', '返回课程库'],
]);

patchFile("src/routes/stats/+page.svelte", [
  ['setCrumbs([{ label: "Stats" }]);', 'setCrumbs([{ label: "学习统计" }]);'],
  ['label: ["S", "M", "T", "W", "T", "F", "S"][date.getDay()]', 'label: ["日", "一", "二", "三", "四", "五", "六"][date.getDay()]'],
  ['<ChartColumn size={18} /> Stats', '<ChartColumn size={18} /> 学习统计'],
  ['Couldn\'t load stats:', '无法加载统计数据：'],
  ['>Today</h3>', '>今天</h3>'],
  ['Daily goal', '每日目标'],
  ['{todayMin} / {goalMin} min', '{todayMin} / {goalMin} 分钟'],
  ['Current streak', '当前连续学习'],
  ['{stats.current_streak === 1 ? "day" : "days"}', '天'],
  ['Best: {stats.best_streak} days', '最佳：{stats.best_streak} 天'],
  ['Currently focused', '当前学习'],
  ['<Play size={14} fill="currentColor" /> Continue ·', '<Play size={14} fill="currentColor" /> 继续学习 ·'],
  ['Start a course to see it here.', '开始一门课程后会显示在这里。'],
  ['Learning overview', '学习概览'],
  ['Watch time', '观看时长'],
  ['{todayMin}m today', '今天 {todayMin} 分钟'],
  ['Lectures completed', '已完成课时'],
  ['Completed courses', '已完成课程'],
  ['Overall learning progress', '总体学习进度'],
  ['{stats.lectures_completed} / {stats.lectures_total} lectures completed', '已完成 {stats.lectures_completed} / {stats.lectures_total} 节'],
  ['>Activity</h3>', '>学习活动</h3>'],
  ['Watch activity', '观看活动'],
  ['{stats.active_days_month} active days this month', '本月活跃 {stats.active_days_month} 天'],
  ['<span>Less</span>', '<span>少</span>'],
  ['<span>More</span>', '<span>多</span>'],
  ['This week', '本周'],
  ['>Library</h3>', '>课程库</h3>'],
  ['In progress', '进行中'],
  ['Saved moments', '已保存书签'],
  ['Personal records', '个人记录'],
  ['Best streak (days)', '最长连续学习（天）'],
  ['Lectures (last 7 days)', '最近 7 天完成课时'],
]);

patchFile("src/routes/settings/+page.svelte", [
  ['{ value: "dark", label: "Dark" }', '{ value: "dark", label: "深色" }'],
  ['{ value: "light", label: "Light" }', '{ value: "light", label: "浅色" }'],
  ['{ value: "system", label: "System" }', '{ value: "system", label: "跟随系统" }'],
  ['setCrumbs([{ label: "Settings" }]);', 'setCrumbs([{ label: "设置" }]);'],
  ['<Settings size={18} /> Settings', '<Settings size={18} /> 设置'],
  ['>Appearance</h3>', '>外观</h3>'],
  ['>Theme</p>', '>主题</p>'],
  ['Follow the system or force light/dark.', '跟随系统，或强制使用浅色/深色主题。'],
  ['>Playback</h3>', '>播放</h3>'],
  ['Default playback speed', '默认播放速度'],
  ['Applied when a lecture opens.', '打开课时时自动应用。'],
  ['Autoplay next lecture', '自动播放下一节'],
  ['Advance automatically when one ends.', '当前课时结束后自动播放下一节。'],
  ['Daily goal', '每日目标'],
  ['Target watch time per day (Stats).', '每天的目标观看时长（用于学习统计）。'],
  ['<option value={m}>{m} min</option>', '<option value={m}>{m} 分钟</option>'],
  ['Library maintenance', '课程库维护'],
  ['Auto-rescan folders', '自动重新扫描文件夹'],
  [
    'Re-import a course when its folder changes on disk. May briefly pause the UI while it\n              re-scans; the course you\'re watching is never touched.',
    '检测到磁盘中的课程文件夹发生变化时自动重新导入。扫描期间界面可能短暂停顿，\n              正在播放的课程不会受到影响。',
  ],
  ['Check for missing files', '检查缺失文件'],
  ['Flag courses whose video files have moved or been deleted.', '标记视频文件已移动或删除的课程。'],
  ['>Check\n', '>检查\n'],
  ['Rebuild search index', '重建搜索索引'],
  ['Refresh full-text search from the current library.', '根据当前课程库刷新全文搜索索引。'],
  ['>Rebuild\n', '>重建\n'],
  ['Index subtitle text', '索引字幕文本'],
  ['Parse sidecar subtitles so Search can find spoken words.', '解析外挂字幕，使搜索能够查找字幕中的内容。'],
  ['>Index\n', '>建立索引\n'],
  ['>Data</h3>', '>数据</h3>'],
  ['Export backup', '导出备份'],
  [
    'Save your library — progress, bookmarks, tags, tracks, thumbnails — to one\n              <code>.zip</code>. Your video files aren\'t included. Handy for moving a portable copy\n              to a new release, or as a safety backup.',
    '将课程库、播放进度、书签、标签、学习路线和封面保存到一个 <code>.zip</code> 文件中。\n              备份不包含视频文件，可用于迁移便携版或保留安全副本。',
  ],
  ['>Export\n', '>导出\n'],
  ['Import backup', '导入备份'],
  [
    'Replace this library with a backup, then restart. It re-links to your videos where they\n              still exist — it can\'t restore progress onto a different download of a course.',
    '用备份替换当前课程库并重启。仍存在的视频会自动重新关联，\n              但无法将进度恢复到内容不同的课程副本上。',
  ],
  ['<Upload size={15} /> Import', '<Upload size={15} /> 导入'],
  ['>Storage</h3>', '>存储</h3>'],
  ['>Database</p>', '>数据库</p>'],
  ['Course metadata, progress, bookmarks and search indexes — videos are never stored here.\n              Compact reclaims space freed by removed courses or cleared indexes.', '这里保存课程元数据、进度、书签和搜索索引，不保存视频。\n              压缩数据库可回收删除课程或清理索引后释放的空间。'],
  ['>Compact\n', '>压缩\n'],
  ['Subtitle search index', '字幕搜索索引'],
  ['Indexed subtitle text — the main database growth. Clearing frees the most space;\n              re-index anytime with "Index subtitle text" above.', '已建立索引的字幕文本通常占据数据库的大部分空间。清除后可释放空间，\n              随时可以使用上方的“索引字幕文本”重新建立。'],
  ['`${storage.subtitle_cues.toLocaleString()} cues`', '`${storage.subtitle_cues.toLocaleString()} 条字幕`'],
  ['>Clear\n', '>清除\n'],
  ['Thumbnail cache', '封面缓存'],
  ['Cached course covers and resume frames (stored on disk, not in the database). Clean\n              deletes images no longer used by any course.', '缓存的课程封面和续播画面保存在磁盘中，不在数据库内。\n              清理操作会删除不再被任何课程使用的图片。'],
  ['>Clean\n', '>清理\n'],
  ['>Updates</h3>', '>更新</h3>'],
  ['Check for a newer release. Nothing downloads until you confirm.', '检查中文版的新版本。确认前不会下载任何内容。'],
  ['Update to {updates.available.version}', '更新到 {updates.available.version}'],
  ['>Check\n', '>检查\n'],
  ['<h3 class="text-headline-sm text-on-surface">Import backup?</h3>', '<h3 class="text-headline-sm text-on-surface">导入备份？</h3>'],
  ['This replaces your current library — progress, bookmarks, tags, everything — with the\n        backup, then restarts Deskemy. Your current data can\'t be recovered afterward unless you\n        exported it first.', '这会使用备份替换当前课程库及其中的进度、书签和标签，然后重启 Deskemy。\n        除非事先导出备份，否则替换后的当前数据无法恢复。'],
  ['>Cancel\n', '>取消\n'],
  ['{/if} Import &amp; restart', '{/if} 导入并重启'],
  ['"Backup saved."', '"备份已保存。"'],
  ['"You\'re on the latest version."', '"当前已是最新版本。"'],
  ['`Deskemy ${updates.available.version} is available.`', '`Deskemy 中文版 ${updates.available.version} 已发布。`'],
  ['"No sidecar subtitle files found."', '"未找到外挂字幕文件。"'],
  ['"Cache already clean."', '"缓存已是干净状态。"'],
  ['"Subtitle index already empty."', '"字幕索引已经为空。"'],
]);

patchFile("src/routes/+layout.svelte", [
  ['void checkForUpdate();', '// 中文构建暂不在启动时自动检查更新。'],
  ['Deskemy {updates.available.version} is available.', 'Deskemy 中文版 {updates.available.version} 已发布。'],
  ['{/if} Update', '{/if} 更新'],
  ['aria-label="Dismiss update notice"', 'aria-label="关闭更新提示"'],
]);

patchFile("src/lib/updates.svelte.ts", [
  ['import { check, type Update } from "@tauri-apps/plugin-updater";', 'import type { Update } from "@tauri-apps/plugin-updater";'],
  ['const RELEASES_URL = "https://github.com/NFRohan/Deskemy/releases/latest";', 'const RELEASES_URL = "https://github.com/flipped0419/Deskemy-zh-CN/releases/latest";'],
  [
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
}`,
`export async function checkForUpdate(): Promise<void> {
  updates.handle = null;
  updates.available = null;
  updates.checking = false;
  updates.error = "中文版暂未启用应用内更新，请在项目 Releases 页面下载新版本。";
}`,
    '禁用原版应用内更新',
  ],
]);

patchFile("src/routes/watch/[lectureId]/+page.svelte", [
  ['group: "Playback"', 'group: "播放"'],
  ['["Space / K", "Play / pause"]', '["Space / K", "播放 / 暂停"]'],
  ['["J / L", "Back / forward 10s"]', '["J / L", "后退 / 前进 10 秒"]'],
  ['["← / →", "Back / forward 5s"]', '["← / →", "后退 / 前进 5 秒"]'],
  ['["↑ / ↓", "Volume up / down"]', '["↑ / ↓", "增大 / 减小音量"]'],
  ['["M", "Mute"]', '["M", "静音"]'],
  ['["C", "Toggle subtitles"]', '["C", "开关字幕"]'],
  ['["< / >", "Speed down / up"]', '["< / >", "降低 / 提高速度"]'],
  ['["0 – 9", "Jump to 0–90%"]', '["0 – 9", "跳转到 0–90%"]'],
  ['["Home / End", "Start / end"]', '["Home / End", "开头 / 结尾"]'],
  ['group: "Navigation"', 'group: "导航"'],
  ['["N / ⇧N", "Next / previous lecture"]', '["N / ⇧N", "下一节 / 上一节"]'],
  ['["F", "Fullscreen"]', '["F", "全屏"]'],
  ['["Esc", "Exit / back"]', '["Esc", "退出 / 返回"]'],
  ['group: "Panels"', 'group: "面板"'],
  ['["P", "Course content"]', '["P", "课程目录"]'],
  ['["R", "Resources"]', '["R", "课程资料"]'],
  ['["B", "Bookmark here"]', '["B", "在此添加书签"]'],
  ['["?", "This cheat sheet"]', '["?", "显示快捷键"]'],
  ['groups.push({ title: "Section resources", items: sectionLevel });', 'groups.push({ title: "章节资料", items: sectionLevel });'],
  ['{ label: "Library", href: "/" }', '{ label: "课程库", href: "/" }'],
  ['parts.push(`Track ${t.id}`);', 'parts.push(`轨道 ${t.id}`);'],
  ['sleepMode === "minutes" ? `${Math.max(1, Math.ceil(sleepLeft / 60))}m` : ""', 'sleepMode === "minutes" ? `${Math.max(1, Math.ceil(sleepLeft / 60))}分` : ""'],
  ['libmpv is required to play videos', '播放视频需要 libmpv'],
  [
    'Deskemy plays through <code>libmpv-2.dll</code>, mpv\'s shared library. The mpv\n      <span class="text-on-surface">player</span> alone usually doesn\'t include it — download the\n      <span class="text-primary">libmpv</span> build from mpv.io\'s Windows downloads and extract\n      <code>libmpv-2.dll</code>.',
    'Deskemy 通过 mpv 的共享库 <code>libmpv-2.dll</code> 播放视频。普通 mpv\n      <span class="text-on-surface">播放器</span>通常不包含该文件，请从 mpv.io 的 Windows 下载页获取\n      <span class="text-primary">libmpv</span> 版本并解压出 <code>libmpv-2.dll</code>。',
  ],
  [
    'Then put that DLL next to <code>Deskemy.exe</code>, anywhere on your PATH, or set\n      <code>DESKEMY_LIBMPV</code> to its full path — and reopen this lecture.',
    '然后将该 DLL 放到 <code>Deskemy.exe</code> 旁、系统 PATH 中，或将\n      <code>DESKEMY_LIBMPV</code> 设置为它的完整路径，再重新打开本课时。',
  ],
  ['<ArrowLeft size={16} /> Back to library', '<ArrowLeft size={16} /> 返回课程库'],
  ['Subtitles off', '关闭字幕'],
  ['`Chapter ${c.index + 1}`', '`第 ${c.index + 1} 章`'],
  ['placeholder="Label (optional)"', 'placeholder="书签名称（可选）"'],
  ['<BookmarkPlus size={15} /> Add at {formatClock(state.position)}', '<BookmarkPlus size={15} /> 在 {formatClock(state.position)} 添加'],
  ['No bookmarks yet.', '还没有书签。'],
  ['b.label ?? "Bookmark"', 'b.label ?? "书签"'],
  ['aria-label="Delete bookmark"', 'aria-label="删除书签"'],
  ['title="Delete bookmark"', 'title="删除书签"'],
  ['<Keyboard size={floating ? 18 : 16} /> Keyboard shortcuts', '<Keyboard size={floating ? 18 : 16} /> 键盘快捷键'],
  ['aria-label="Keyboard shortcuts"', 'aria-label="键盘快捷键"'],
  ['aria-label="Close"', 'aria-label="关闭"'],
  ['aria-label="Sleep timer"', 'aria-label="睡眠定时"'],
  ['<Moon size={18} /> Sleep timer', '<Moon size={18} /> 睡眠定时'],
  ['Turn off', '关闭定时'],
  ['Pausing in <span', '将在 <span'],
  ['</span>.', '</span> 后暂停。'],
  ['Pausing at the end of this lecture.', '将在本课时结束时暂停。'],
  ['{m}m', '{m} 分'],
  ['placeholder="Custom minutes"', 'placeholder="自定义分钟数"'],
  ['>Set\n', '>设置\n'],
  ['<span>End of lecture</span>', '<span>本课时结束时</span>'],
  ['aria-label="Back to course"', 'aria-label="返回课程"'],
  ['title="Back to course (Esc)"', 'title="返回课程（Esc）"'],
  ['aria-label="Previous lecture"', 'aria-label="上一节"'],
  ['state.paused ? "Play" : "Pause"', 'state.paused ? "播放" : "暂停"'],
  ['aria-label="Next lecture"', 'aria-label="下一节"'],
  ['state.muted ? "Unmute" : "Mute"', 'state.muted ? "取消静音" : "静音"'],
  ['aria-label="Volume"', 'aria-label="音量"'],
  ['Now playing', '正在播放'],
  ['title={`Up next: ${upNext.title}`}', 'title={`接下来：${upNext.title}`}'],
  ['>Up next</span>', '>接下来</span>'],
  ['title="Bookmarks"', 'title="书签"'],
  ['aria-label="Bookmarks"', 'aria-label="书签"'],
  ['title="Chapters"', 'title="章节"'],
  ['aria-label="Chapters"', 'aria-label="章节"'],
  ['title="Audio track"', 'title="音轨"'],
  ['aria-label="Audio track"', 'aria-label="音轨"'],
  ['title="Subtitles"', 'title="字幕"'],
  ['aria-label="Subtitles"', 'aria-label="字幕"'],
  ['`Sleep in ${sleepBadge}`', '`将在 ${sleepBadge} 后暂停`'],
  ['"Sleep at end of lecture"', '"将在课时结束时暂停"'],
  ['"Sleep timer"', '"睡眠定时"'],
  ['aria-label="Playback speed"', 'aria-label="播放速度"'],
  ['title="Keyboard shortcuts (?)"', 'title="键盘快捷键（?）"'],
  ['title="Course content (P) · Resources (R)"', 'title="课程目录（P）· 课程资料（R）"'],
  ['aria-label="Course content"', 'aria-label="课程目录"'],
  ['aria-label="Toggle immersive"', 'aria-label="切换沉浸模式"'],
  ['>Content\n', '>目录\n'],
  ['Resources{#if sectionResourceCount}', '资料{#if sectionResourceCount}'],
  ['aria-label="Close panel"', 'aria-label="关闭面板"'],
  ['Resources in <span', '当前章节：<span'],
  ['No resources in this section.', '本章节没有课程资料。'],
  ['title="Open with default app"', 'title="使用默认应用打开"'],
  ['<div class="p-4 text-body-sm text-on-surface-variant">Loading…</div>', '<div class="p-4 text-body-sm text-on-surface-variant">正在加载…</div>'],
]);

// 仅修改打包配置；保留应用 identifier，以便继续使用官方版已有的课程库和进度。
const tauriPath = path.join(root, "src-tauri/tauri.conf.json");
if (fs.existsSync(tauriPath)) {
  const config = JSON.parse(fs.readFileSync(tauriPath, "utf8"));
  config.app.windows[0].title = "Deskemy 中文版";
  config.bundle.shortDescription = "用于管理和播放本地网课的离线播放器。";
  config.bundle.longDescription = "Deskemy 中文版可将本地网课文件夹整理为课程库，并提供续播、章节、字幕、书签、搜索、学习路线和学习统计等功能。所有课程文件均保留在本机。";
  config.bundle.createUpdaterArtifacts = false;
  if (config.plugins?.updater?.endpoints) {
    config.plugins.updater.endpoints = [
      "https://github.com/flipped0419/Deskemy-zh-CN/releases/latest/download/latest.json",
    ];
  }
  fs.writeFileSync(tauriPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  changedFiles.push("src-tauri/tauri.conf.json");
  applied.push("src-tauri/tauri.conf.json：调整中文构建说明并禁用更新产物签名");
}

// 生成供人工核对的剩余英文候选，不阻止构建。
const candidatePatterns = [
  /(?:aria-label|title|placeholder)="([A-Za-z][^"]*)"/g,
  />\s*([A-Za-z][A-Za-z0-9 ,.'’!?/()&:+—–-]{2,})\s*</g,
  /label:\s*"([A-Za-z][^"]*)"/g,
];
const remaining = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(svelte|ts)$/.test(entry.name)) {
      const rel = path.relative(root, full).replaceAll("\\", "/");
      const text = fs.readFileSync(full, "utf8");
      for (const re of candidatePatterns) {
        for (const match of text.matchAll(re)) {
          const phrase = match[1].trim();
          if (phrase && !/^(Deskemy|Ctrl|Space|Home|End|PATH|DLL|libmpv|HTML|PDF)$/i.test(phrase)) {
            remaining.push(`${rel}：${phrase}`);
          }
        }
      }
    }
  }
}
walk(path.join(root, "src"));

const report = [
  "# Deskemy 简体中文构建报告",
  "",
  `- 已修改文件：${new Set(changedFiles).size}`,
  `- 已应用替换：${applied.length}`,
  `- 未命中规则：${warnings.length}`,
  `- 剩余英文候选：${new Set(remaining).size}`,
  "",
  "## 未命中规则",
  "",
  ...(warnings.length ? warnings.map((x) => `- ${x}`) : ["- 无"]),
  "",
  "## 剩余英文候选",
  "",
  ...(remaining.length ? [...new Set(remaining)].sort().map((x) => `- ${x}`) : ["- 无"]),
  "",
  "## 已修改文件",
  "",
  ...[...new Set(changedFiles)].sort().map((x) => `- ${x}`),
  "",
].join("\n");
fs.writeFileSync(path.join(root, "LOCALIZATION_REPORT.md"), report, "utf8");

console.log(`汉化完成：修改 ${new Set(changedFiles).size} 个文件，应用 ${applied.length} 条替换。`);
if (warnings.length) console.warn(`有 ${warnings.length} 条规则未命中，详见 LOCALIZATION_REPORT.md。`);
