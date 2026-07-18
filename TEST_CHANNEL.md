# Deskemy 中文版自动测试频道

本仓库使用 `.github/workflows/watch-upstream.yml` 自动跟踪 `NFRohan/Deskemy` 的上游正式版本。

## 工作方式

工作流每天在北京时间 09:30 检查一次上游 Latest Release。

检测到新的上游正式标签后，会自动：

1. 检出该上游版本；
2. 应用当前汉化规则和兼容补丁；
3. 执行 Svelte 前端检查；
4. 构建 Windows NSIS 安装版；
5. 制作带 `.portable` 标记的便携版；
6. 上传 `LOCALIZATION_REPORT.md`；
7. 创建 GitHub Prerelease，作为测试频道。

同一个上游标签对应固定测试标签：

```text
test-<上游标签>-zh-CN
```

例如：

```text
test-v1.2.0-zh-CN
```

只要该测试 Release 已存在，定时任务就不会重复构建。

当前初始基线是 `v1.1.0`，自动检查不会为该版本重复创建测试 Release。

## 与稳定版的隔离

自动测试构建：

- 使用 GitHub Prerelease；
- 不生成 `latest.json`；
- 不运行 `scripts/enable-updater.mjs`；
- 不启用中文版应用内更新；
- 不会成为稳定版 Latest Release；
- 不会通过现有 updater 推送给稳定版用户。

因此，测试频道只供主动下载安装测试，不会干扰已经安装的稳定版更新链路。

## 手动运行

进入：

```text
Actions → 跟踪上游正式版并发布测试构建 → Run workflow
```

`upstream_ref` 留空时使用上游最新正式 Release，也可以手动填写标签、分支或提交。

手动指定当前基线版本时不会应用自动基线跳过规则，但如果同名测试 Release 已存在，仍会跳过。

## 测试要求

测试版未经完整人工验证。安装前建议先在 Deskemy 中导出备份。

至少检查：

1. 安装和首次启动；
2. 原课程库、播放进度、书签和设置是否保留；
3. 新课程导入与重新扫描；
4. 视频播放、字幕、音轨和章节切换；
5. 搜索、学习路线和备份导入导出；
6. `LOCALIZATION_REPORT.md` 中的新英文和未命中规则；
7. 明显误译、按钮错位和运行时英文；
8. Svelte、Tauri、Rust、libmpv 与 Windows 兼容性。

自动构建成功只代表源码通过检查并生成安装包，不代表该版本可以直接作为稳定版发布。

## 构建失败

若自动构建失败，工作流会创建或更新：

```text
自动测试构建失败：<上游版本>
```

Issue 中包含对应 Actions 运行链接。

如果同一上游版本后续构建成功，对应失败 Issue 会自动关闭。

## 转为稳定版

测试通过并修复明显问题后：

1. 运行 `发布 Deskemy 中文版更新`；
2. 使用严格递增的中文版 SemVer；
3. 先创建草稿 Release；
4. 检查安装包、`.nsis.zip`、签名和 `latest.json`；
5. 从旧稳定版实际执行一次应用内更新；
6. 确认数据保留和功能正常；
7. 发布并确认新版为 Latest Release。

不要直接把自动测试 Prerelease 改成稳定更新源，因为测试构建没有启用中文版 updater，也没有生成签名更新清单。
