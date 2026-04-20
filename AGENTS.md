# Repository Guidelines

## 项目结构与模块组织
`server.js` 是唯一的后端入口，负责启动本地 HTTP 服务并分发静态文件。`public/` 目录存放前端界面：`index.html` 负责页面结构，`styles.css` 负责样式与主题，`app.js` 负责 JSON 格式化、时间转换和 `localStorage` 持久化等浏览器逻辑。根目录下的 `toolsdemo.jpg` 仅用于文档展示。目前仓库中还没有独立的 `src/` 或 `tests/` 目录。

## 构建、测试与开发命令
本项目没有构建流程，也没有第三方依赖。

- `npm start`：启动本地服务，监听 `http://127.0.0.1:3000`
- `node server.js`：直接运行服务脚本，适合排查启动问题

启动后请在浏览器中打开页面，并手动验证本次修改涉及的工具页签。

## 代码风格与命名约定
提交代码时请遵循当前仓库已有风格：

- JavaScript、HTML、CSS 统一使用 2 空格缩进
- JavaScript 优先使用双引号
- 变量和函数使用 `camelCase`，例如 `renderFormattedJsonTree`
- DOM 节点变量使用带 `El` 后缀的描述性命名，例如 `jsonInputEl`
- 保持职责清晰：服务逻辑放在 `server.js`，交互逻辑放在 `public/app.js`，样式放在 `public/styles.css`

当前未配置格式化或 lint 工具，修改时应尽量贴近周边代码，避免无关重排。

## 测试说明
项目目前没有自动化测试。每次修改后，至少执行一次 `npm start`，并在浏览器中手动验证相关流程，重点包括：

- JSON 格式化与字符串解析
- 时间与时间戳互转
- URL 编码与解码
- `localStorage` 的输入恢复、历史记录与收藏功能

如果后续补充自动化测试，建议新增 `tests/` 目录，并按功能命名测试文件。

## 提交与合并请求规范
当前 Git 历史非常简洁，只有 `init` 这类基础提交。后续提交信息建议保持简短、使用祈使语气，并直接描述改动，例如 `add timestamp validation` 或 `refine json history rendering`。

提交 Pull Request 时建议包含：

- 变更摘要
- 手动验证步骤
- 涉及界面调整时附上截图或录屏
- 如有任务单或 issue，附上关联链接

请尽量保持 PR 范围收敛，便于快速审阅与验证。
