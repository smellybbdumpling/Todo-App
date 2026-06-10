# Todo App

一个轻量、可直接部署的待办事项应用，使用原生 HTML、CSS 和 JavaScript 构建。

## 功能特性

- 新增、编辑、完成和删除待办事项
- 支持为任务添加可选备注
- 默认仅展示任务标题，需要时再查看详情
- 支持全部、进行中、已完成三种状态筛选
- 支持按标题和备注搜索，并高亮匹配内容
- 支持一键清除已完成任务
- 使用 `localStorage` 在浏览器本地保存数据
- 适配桌面端和移动端
- 顶部日期时间卡片带有动态时钟和玻璃质感交互效果

## 项目结构

```text
.
├── index.html    # 静态页面入口
├── styles.css    # 页面布局、响应式样式和视觉效果
├── app.js        # 状态管理、渲染逻辑和交互行为
├── README.md     # 项目说明
└── .gitignore    # Git 忽略规则
```

## 本地运行

可以直接用浏览器打开 `index.html`。

也可以使用任意静态服务器预览，例如：

```powershell
python -m http.server 5500
```

然后访问：

```text
http://localhost:5500
```

## 部署

本项目没有构建步骤，可以作为静态站点部署。

### Vercel

- Framework Preset 选择 `Other`
- Build Command 留空
- 如果仓库根目录就是本项目，Output Directory 留空

### GitHub Pages

可以从仓库根目录发布；如果仓库中还有其他项目，也可以将这些文件放入 `/docs` 目录后从 `/docs` 发布。

## 数据存储

待办数据保存在当前浏览器的 `localStorage` 中。数据只存在于当前设备和当前浏览器，不会同步到服务器。
