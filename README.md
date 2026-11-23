# Startmenu

[在线体验 / Live demo](https://bohese1379a.github.io/Startmenu/) · [English](#english)

## 中文

Startmenu 是 Bohese 的个人浏览器起始页，把搜索、待办和常用链接放在一页。项目使用原生 HTML、CSS 和 JavaScript，可以直接在浏览器中打开。

### 功能

- **搜索**支持 Bing、百度、Yandex 和 Google。按 `/` 可以快速聚焦搜索框。
- **待办**支持优先级、完成状态和筛选。任务保存在当前浏览器中。
- **主题**提供预设配色，也可以手选颜色或从壁纸取色。
- **粒子背景**可以调整数量、速度和鼠标吸附效果。

### 本地运行

通过仓库的 **Code → Download ZIP** 下载并解压，然后打开 `index.html`。如果想通过本机 HTTP 地址预览，在项目目录运行以下命令，需要 Python 3。

```sh
python -m http.server 8080 --bind 127.0.0.1
```

在浏览器打开 `http://127.0.0.1:8080/`。改完文件并保存后，刷新页面看效果。

### 从哪里开始改

| 文件 | 负责的内容 |
| --- | --- |
| [index.html](index.html) | 搜索框、待办面板和常用链接的页面结构 |
| [style.css](style.css) | 颜色、间距、布局和窄屏样式 |
| [script.js](script.js) | 搜索、待办操作和待办保存 |
| [theme.js](theme.js) | 主题切换、取色和偏好保存 |
| [canvasStar.js](canvasStar.js) | 粒子绘制、动画和背景设置 |

第一次改动可以从 `index.html` 的 `<footer>` 入手。修改链接文字或 `href`，保存后刷新，再到 `style.css` 找这个链接对应的类选择器。

### 线上发布

改动进入 `main` 后，由 GitHub Pages 发布。部署成功后刷新在线演示，即可查看新版本。[部署记录](https://github.com/Bohese1379A/Startmenu/deployments)

## English

Startmenu is Bohese’s personal browser start page. It brings search, to-dos, and frequently used links together on one page. It is built with plain HTML, CSS, and JavaScript and can be opened directly in a browser.

### Features

- **Search** supports Bing, Baidu, Yandex, and Google. Press `/` to focus the search field.
- **To-dos** support priorities, completion status, and filters. Tasks are saved in the current browser.
- **Themes** include preset palettes. You can also pick a color or sample one from a wallpaper.
- **Particle background** controls let you change the particle count, speed, and attraction to the pointer.

### Run locally

Choose **Code → Download ZIP** in the repository, extract the files, and open `index.html`. To preview over local HTTP, run the following command from the project directory. It requires Python 3.

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/` in your browser. After saving an edit, refresh the page to see the result.

### Where to start editing

| File | What it controls |
| --- | --- |
| [index.html](index.html) | Page structure for search, to-dos, and shortcuts |
| [style.css](style.css) | Colors, spacing, layout, and narrow-screen styles |
| [script.js](script.js) | Search, to-do interactions, and task storage |
| [theme.js](theme.js) | Theme switching, color sampling, and saved preferences |
| [canvasStar.js](canvasStar.js) | Particle drawing, animation, and background settings |

For a first edit, find `<footer>` in `index.html`. Change a link’s text or `href`, save and refresh, then find the link’s class selector in `style.css`.

### Deployment

GitHub Pages publishes changes from `main`. Once deployment succeeds, refresh the live demo to see the new version. [Deployment history](https://github.com/Bohese1379A/Startmenu/deployments)
