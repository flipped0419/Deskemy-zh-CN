# Deskemy 中文版应用内更新配置

中文版更新使用 `flipped0419/Deskemy-zh-CN` 仓库的 GitHub Releases，与官方英文版 `NFRohan/Deskemy` 的更新源和签名密钥完全分开。

## 安全模型

Tauri updater 强制校验更新签名，无法关闭。需要长期保管一组独立密钥：

- 公钥：写入中文版应用，用于验证安装包；可以公开。
- 私钥：仅用于发布时签名；绝不能提交到仓库或发送给其他人。

私钥一旦丢失，已经安装了该公钥版本的用户将无法继续接收后续应用内更新。

## 1. 在 Windows 上生成密钥

在 PowerShell 中执行：

```powershell
New-Item -ItemType Directory -Force "$HOME\.tauri" | Out-Null
npx --yes @tauri-apps/cli@2.10.1 signer generate -w "$HOME\.tauri\deskemy-zh.key"
```

建议设置一个非空密码并妥善记录。通常会生成：

```text
%USERPROFILE%\.tauri\deskemy-zh.key
%USERPROFILE%\.tauri\deskemy-zh.key.pub
```

查看内容：

```powershell
Get-Content "$HOME\.tauri\deskemy-zh.key" -Raw
Get-Content "$HOME\.tauri\deskemy-zh.key.pub" -Raw
```

至少额外离线备份一次私钥和密码。

## 2. 配置 GitHub

打开：

```text
Deskemy-zh-CN → Settings → Secrets and variables → Actions
```

在 **Secrets** 中添加：

- `TAURI_SIGNING_PRIVATE_KEY`：`deskemy-zh.key` 的完整内容。
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`：生成密钥时设置的密码。

在 **Variables** 中添加：

- `TAURI_UPDATER_PUBLIC_KEY`：`deskemy-zh.key.pub` 的完整内容。

不要把私钥放入 Variables、仓库文件、Issue、Actions 日志或聊天截图中。

## 3. 发布第一版可更新安装包

进入：

```text
Actions → 发布 Deskemy 中文版更新 → Run workflow
```

首次建议填写：

```text
upstream_ref: v1.1.0
version: 1.1.1
draft: true
```

工作流会：

1. 获取官方源码并执行中文化；
2. 将应用更新端点指向本翻译仓库；
3. 写入中文版公钥；
4. 生成 NSIS 安装包及 `.sig` 签名；
5. 生成 `latest.json`；
6. 创建本仓库的草稿 Release。

草稿 Release 不会被应用更新器发现。下载并安装测试后，再在 GitHub Release 页面点击 **Publish release**。

## 4. 首次迁移限制

此前构建的 `1.1.0` 中文版关闭了应用内更新，并且没有内置中文版公钥。因此：

- `1.1.1` 必须由用户手动下载安装一次；
- 从安装了 `1.1.1` 开始，后续 `1.1.2`、`1.1.3` 等版本才能通过应用内更新安装。

每次发布的 `version` 都必须严格高于用户当前安装版本，并且不得覆盖已经发布的版本号。

## 更新来源提示

启用更新的构建会在设置页明确显示：

> 检查由 Deskemy 中文翻译仓库发布的新版本，不会从官方英文版仓库下载。

Release 更新说明和 `latest.json` 也会注明：

```text
更新来源：flipped0419/Deskemy-zh-CN 中文翻译仓库，不是 NFRohan/Deskemy 官方英文版仓库。
```
