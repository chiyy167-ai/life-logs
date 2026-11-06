# Life Logs

本地优先的日记 / 生活记录 PWA。数据存在浏览器 IndexedDB，可用访问密码防止随手翻看；支持照片 / 视频 / 文档、自动天气、日历与时间线回忆，以及 zip 导出导入备份。

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

产物在 `dist/`。

## 部署到 GitHub / GitLab Pages

1. 推送本仓库到远端。
2. 开启 Pages，发布 `dist` 目录（或使用 CI 构建后发布）。
3. 本项目使用相对路径 `base: './'` + `HashRouter`，适合子路径托管，刷新不会 404。

### GitHub Actions 示例

在仓库添加 `.github/workflows/pages.yml`（若使用 GitHub）：

```yaml
name: Deploy Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

仓库 Settings → Pages → Source 选 GitHub Actions。

## 手机安装（PWA）

### Android（Chrome）

1. 打开已部署的站点 URL。
2. 菜单 →「安装应用」或「添加到主屏幕」。

### iPhone / iPad（Safari）

1. 用 Safari 打开站点（不要用内置浏览器壳）。
2. 分享 →「添加到主屏幕」。
3. 从主屏幕图标打开，即可全屏使用。

## 使用提示

- **密码**：仅本机会话解锁；忘记密码只能清空站点数据后重设。
- **备份**：设置页定期「导出备份」。iOS 可能清理长期不用的网站数据。
- **换机**：新设备安装 PWA → 设置 → 导入 zip（会覆盖当前数据）。
- **天气**：首次写「今天」会尝试定位；也可在设置填写默认城市（Open-Meteo，无需 key）。

## 技术栈

Vite · React · TypeScript · Dexie (IndexedDB) · vite-plugin-pwa · JSZip · Open-Meteo
