# MONA.EXE — 个人作品集

基于 Google Stitch 原型搭建的多页静态站，可部署到 Vercel（免费 `*.vercel.app` 域名）。

## 本地预览（三种方式，任选一种）

### 方式 A：双击启动（最简单）

在 Finder 里打开文件夹 `作品集`，**双击** `预览.command`  
（若提示无法打开：右键 → 打开 → 仍要打开）

会自动在浏览器打开首页。

### 方式 B：终端命令

```bash
cd "/Users/chenningxin/Documents/作品集"
npm run dev
```

**不要关终端窗口**，然后在浏览器地址栏输入（必须带 `/home/`）：

**http://127.0.0.1:4321/home/**

另开终端可执行 `npm run open` 自动打开浏览器。

### 方式 C：在 Cursor 里

1. 用 Cursor 打开文件夹：`/Users/chenningxin/Documents/作品集`（不是空窗口）
2. 终端执行 `npm run dev`
3. 浏览器访问 http://127.0.0.1:4321/home/

---

### 打不开？对照检查

| 现象 | 原因 | 解决办法 |
|------|------|----------|
| 空白 / 无法加载作品 | 直接双击了 `index.html` 用文件打开 | **不要**用文件打开，必须用上面的本地服务器 |
| 连接被拒绝 | 没运行 `npm run dev` 或终端已关 | 重新运行 `npm run dev` 或双击 `预览.command` |
| 样式是旧的紫色主题 | 预览的是 `site/` 而不是 `stitch/` | 双击 `预览.command`（会自动重启 4321）或执行 `npm run dev` |
| 404 | 地址少了 `/home/` | 用 **http://127.0.0.1:4321/home/** |
| `command not found: npm` | 未安装 Node | 安装 https://nodejs.org 后重试 |

## 页面结构

| 路径 | 说明 |
|------|------|
| `/home/` | 主页（Experiments 实验卡片网格） |
| `/gallery/` | 已废弃，自动跳转到 `/home/` |
| `/project-detail/?project=xxx` | 项目详情（iframe 内嵌 Vercel） |
| `/profile/` | 关于我 |

## 如何添加 / 修改作品（不用写代码）

编辑 **`site/data/projects.json`**：

- 每个作品填 `slug`、`title`、`tagline`、`type`（`tool` 或 `play`）
- **`demoUrl`**：填你的 Vercel 作品链接，详情页会自动 iframe 内嵌
- **`image`**：封面图链接（可继续用 Google 图或换成自己的截图 URL）
- **`featured: true`**：会出现在首页精选区

保存后刷新页面即可。

## 部署到 Vercel

1. 推送到 GitHub（见下方「首次提交」）
2. [vercel.com](https://vercel.com) → **Add Project** → 导入仓库
3. 确认设置（根目录 `vercel.json` 已写好）：
   - **Output Directory**：`stitch/Vibe Coding Lab`
   - **Build Command**：留空
4. **Deploy**

访问：`https://你的项目名.vercel.app/home/`

## 首次提交 / 推送到 GitHub

```bash
cd "/Users/chenningxin/Documents/作品集"
git add .
git commit -m "Initial commit: MONA.EXE portfolio"
git remote add origin https://github.com/Mona776/你的仓库名.git
git push -u origin main
```

## 目录说明

| 目录 | 说明 |
|------|------|
| `stitch/Vibe Coding Lab/` | **线上站点**（首页、About、详情、封面、视频） |
| `site/` | 旧版紫色主题（可删，已不再部署） |
| `scripts/` | 主题脚本、封面截图等开发工具 |
