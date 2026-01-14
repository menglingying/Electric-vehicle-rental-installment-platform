# UI UX Pro Max 怎么用（配合本项目 Arco + Vant）

官网：`https://ui-ux-pro-max-skill.nextlevelbuilder.io/`  
GitHub：`https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`

## 先澄清：它不是“前端模板/组件库”

UI UX Pro Max 是一个给 AI 编程助手用的 **Skill/Prompt 工作流**（设计智能数据库 + 搜索脚本），用来帮你选风格/配色/字体/布局/UX 规范，再让 AI 按你的技术栈把页面“写出来”。

本项目的 UI 组件落地仍然以：
- PC 后台：`ArcoDesign Pro（Vue）`
- H5 客户端：`Vant 4（Vue 3）`

为基线；UI UX Pro Max 只负责“设计建议 + 生成实现指令”，不替代 Arco/Vant。

## 方式 A：用 CLI 一键装到你的工程（推荐）

1) 先确认你机器有 Node.js（带 npm）
- 打开终端运行：`node -v`、`npm -v`

2) 全局安装 CLI
- `npm install -g uipro-cli`

3) 在你的项目目录初始化（按你用的 AI 助手选择）
- Claude Code：`uipro init --ai claude`
- Cursor：`uipro init --ai cursor`
- Windsurf：`uipro init --ai windsurf`
- GitHub Copilot（VS Code Copilot Chat）：`uipro init --ai copilot`
- 全都装：`uipro init --ai all`

4) 在对应助手里触发
- Cursor / Windsurf / Kiro / Copilot：在聊天里输入：`/ui-ux-pro-max <你的需求>`
- Claude Code：正常描述 UI/UX 需求即可触发（按其说明）

## 方式 B：手动安装（不想装 CLI 时）

从仓库把对应文件夹拷到你的项目里（README 里有表格），例如：
- Claude Code：`.claude/skills/ui-ux-pro-max/`
- Cursor：`.cursor/commands/ui-ux-pro-max.md` + `.shared/ui-ux-pro-max/`
- Windsurf：`.windsurf/workflows/ui-ux-pro-max.md` + `.shared/ui-ux-pro-max/`
- Copilot：`.github/prompts/ui-ux-pro-max.prompt.md` + `.shared/ui-ux-pro-max/`

## 本地“搜索脚本”怎么跑（可选，但很实用）

它提供了一个 Python 搜索脚本，能按关键词查风格/配色/字体/UX 规范。

1) 安装 Python 3.x
- Windows（官方推荐）：`winget install Python.Python.3.12`
- 验证：`python --version`（或 `python3 --version`）

2) 运行搜索（示例）
- `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "fintech dashboard" --domain style`
- `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "installment payment" --domain color`
- `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "mobile checkout" --domain ux`

提示：不同 AI 助手的目录不一样；你用哪种安装方式，就把路径改成对应的脚本位置。

## 针对“电动车租赁分期平台”的推荐用法（可直接复制给 AI）

### 1) 先定风格 + Token（保证“画出来一样”）

在 AI 里发这段（按你实际情况改字即可）：

“我要做一个电动车租赁分期平台：PC 后台用 Vue3 + ArcoDesign Pro，H5 用 Vue3 + Vant 4。请基于 UI UX Pro Max 给我 1 套统一的视觉方案（风格、主色/辅色、字体、圆角、间距），并输出：
1) Arco 主题/Token 配置建议；
2) Vant 主题变量映射建议；
3) 适配金融分期场景的表格/表单/订单状态色彩规则；
要求：不用 Tailwind 代码，页面用 Arco/Vant 组件实现。”

### 2) 再按页面逐个生成（后台 / H5 分开）

后台（ArcoDesign Pro）页面建议从这些开始：
- 登录
- 商品管理：列表/新增编辑/详情
- 订单管理：列表/详情/审核
- 还款管理：计划/记录/对账
- 逾期管理：分层列表（0-3/3-10/10-30/30+）

H5（Vant）页面建议从这些开始：
- 商品列表/详情
- 下单与分期方案选择
- 订单列表/详情
- 还款计划/还款记录

每次让 AI 输出时都加一句：  
“按 `docs/UI_UIX_Pro_Max_执行规范.md` 的视觉一致性原则落地，禁止写死自定义色值/阴影/圆角。”

