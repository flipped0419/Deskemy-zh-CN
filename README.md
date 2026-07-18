# Deskemy 简体中文构建

本仓库基于 [NFRohan/Deskemy](https://github.com/NFRohan/Deskemy) 官方源码，自动构建 Windows 简体中文版。

> 本项目不是官方中文版本，也不隶属于 Deskemy 上游项目。应用内更新只来自 `flipped0419/Deskemy-zh-CN`，不会从官方英文版仓库下载。

## 维护与翻译说明

本仓库目前主要由 **ChatGPT 协助维护**，包括翻译规则、兼容补丁、GitHub Actions、发布流程和维护文档。

项目采用自动化优先的方式：

- 界面文本主要由 ChatGPT 翻译并通过构建脚本应用；
- 不进行逐句、逐页面的专业人工校对；
- 只有发现明显误译、语义错误、界面错位，或收到具体用户反馈时，才进行人工核对和修正；
- 自动构建和检查不能保证所有文字都自然准确。

发现明显翻译错误时，欢迎提交 Issue，并尽量附上截图、所在页面和原英文含义。

## 下载与安装

正式版本请从本仓库 **Releases** 页面下载。

常见附件：

- `*-setup.exe`：Windows 安装版；
- `*_zh-CN_portable.zip`：便携版；
- `*.nsis.zip` 与 `.sig`：应用内更新使用，不需要手动解压；
- `latest.json`：应用内更新清单；
- `LOCALIZATION_REPORT.md`：剩余英文候选报告。

安装中文版时可能需要先卸载旧版 Deskemy。**不要勾选清除应用数据**，即可继续使用原英文版或旧中文版的课程库、播放进度、书签和设置。重要数据仍建议提前使用应用内导出备份功能保存。

## 已验证状态

截至 2026-07-18：

- Windows 10 Enterprise LTSC x64 虚拟机：安装版可正常安装和播放视频；
- Windows 11 真机：从旧英文版安装 `1.1.1` 中文版，不清除数据时会自动继承课程库和进度，无需导入备份；
- Windows 11 真机：`1.1.1 → 1.1.2` 应用内更新成功，下载、签名校验、自动安装、自动重启和数据保留均正常；
- GitHub 网络不稳定或 Release 刚发布时，检查更新偶尔可能出现 `error sending request for url`，稍后重试通常可以恢复；
- 便携版尚未完成充分的长期实际使用测试。

## 工作原理

本仓库不长期维护完整的上游源码副本，而是在 GitHub Actions 中：

1. 检出指定版本的官方源码；
2. 应用汉化规则和兼容补丁；
3. 执行 Svelte 类型与语法检查；
4. 使用 Tauri 构建 Windows NSIS 安装包；
5. 制作带 `.portable` 标记的便携版；
6. 正式发布时生成签名更新包、`latest.json` 和 GitHub Release。

这种方式能减少与上游的长期分叉，但翻译规则依赖上游文件路径和英文原文。上游更新后，部分替换可能失效，需要重新检查。

## 工作流

### 构建 Deskemy 中文版

用于日常验证和生成测试产物：

```text
Actions → 构建 Deskemy 中文版 → Run workflow
```

可指定官方标签、分支或提交，例如 `v1.1.0`。普通测试构建不会启用应用内更新。

### 发布 Deskemy 中文版更新

用于创建带签名的正式中文版 Release：

```text
Actions → 发布 Deskemy 中文版更新 → Run workflow
```

需要填写：

- `upstream_ref`：官方源码版本；
- `version`：严格递增的中文版 SemVer；
- `release_notes`：更新说明；
- `draft`：建议先生成草稿，测试后再发布。

非草稿发布会标记为 Latest Release，确保应用中的 `/releases/latest/download/latest.json` 指向最新中文版。

完整签名配置见 [UPDATER_SETUP.md](UPDATER_SETUP.md)。

## 应用内更新

中文版 updater 与官方英文版完全独立：

- 更新源：本仓库最新 Release；
- 更新包：`*.nsis.zip`；
- 签名：`*.nsis.zip.sig`；
- Tauri 模式：`createUpdaterArtifacts = "v1Compatible"`；
- Windows 安装模式：`passive`；
- 更新来源会在应用界面和 Release 说明中明确标注。

签名私钥绝不能提交到仓库、Issue、Actions 日志或聊天记录。私钥丢失后，已经安装当前公钥版本的用户将无法继续接收后续应用内更新。

便携版不会自动覆盖自身；发现新版本后应手动下载新的便携版 ZIP。

## 关键维护文件

- `scripts/localize-zh.mjs`：主要界面翻译和打包信息；
- `scripts/fix-build.mjs`：构建兼容、运行库准备和播放器兼容补丁；
- `scripts/feedback-fixes.mjs`：第一轮实际运行反馈修复；
- `scripts/feedback-round2.mjs`：第二轮界面反馈修复；
- `scripts/enable-updater.mjs`：正式发布时恢复 updater、写入版本、公钥和中文仓库端点；
- `.github/workflows/build-zh.yml`：普通测试构建；
- `.github/workflows/release-zh.yml`：签名并发布正式更新；
- `UPDATER_SETUP.md`：更新密钥和发布说明。

维护时应避免无上下文的全局英文替换，优先按文件、组件和完整文案精确处理，以免误伤变量名或程序逻辑。

## 上游升级建议

支持新的官方版本时，建议依次：

1. 使用普通构建工作流指定新的 `upstream_ref`；
2. 检查汉化报告、Svelte 日志和 Tauri 日志；
3. 安装测试启动、数据继承、课程导入、视频播放、字幕、书签和备份；
4. 修正明显翻译错误及失效规则；
5. 创建草稿 Release；
6. 检查 `latest.json` 的版本、签名和 `.nsis.zip` 地址；
7. 使用旧版实际完成一次应用内更新；
8. 确认新版成为 Latest Release。

不要覆盖已经发布的版本号，也不要重新生成另一套 updater 密钥。

## 已知限制

- Rust 后端直接返回的少量错误信息可能仍是英文；
- 媒体文件自带的音轨、字幕语言和章节标题不会翻译；
- 根目录视频会被上游放入 `Introduction` 兜底章节。中文版只在界面中把这个固定名称显示为“导言”，不修改数据库、文件名或目录结构，也不会与实际 `01` 文件夹合并；
- `LOCALIZATION_REPORT.md` 是启发式扫描结果，可能误报或漏报；
- 自动化构建成功不等于全部功能和翻译都经过人工验证；
- 访问 GitHub 受限或网络不稳定时，检查和下载更新可能暂时失败。

## 上游与许可证

Deskemy 由 Nayeem Fardin（NFRohan）开发并以 MIT 许可证发布。

本仓库仅包含汉化、兼容补丁和自动构建脚本；构建产物继续保留上游项目的许可证和版权信息。