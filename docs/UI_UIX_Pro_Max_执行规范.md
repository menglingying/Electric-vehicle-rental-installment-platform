# UI UIX Pro Max（以 Arco Design 为基线）的落地规范

本项目的“UI/UIX Pro Max”不引用某个未知的 npm 组件库；默认以 **Arco Design / ArcoDesign Pro（Vue）** 的设计体系作为“可复现、可验收”的视觉基线，确保实现效果与模板一致。

如你指的 “UI UIX Pro Max” 是某个具体产品/模板/包，请提供官网或 npm 包名；否则以本文约定为准。

使用方法（CLI/VS Code Copilot/Cursor 等）见：`docs/UI_UX_Pro_Max_使用指南.md`。

## 选型（已定）

- **PC 后台管理端模板**：ArcoDesign Pro（Vue）
  - 入口：`https://pro.arco.design/`
  - Vue 文档（含 Pro 最佳实践/布局/权限/路由菜单）：`https://arco.design/vue/docs/start`
- **H5 客户端组件体系**：Vant 4（Vue 3）
  - 入口：`https://vant-ui.github.io/vant/#/zh-CN`
  - 说明：Arco 更偏中后台/PC，移动端 H5 用 Vant 更省成本；视觉统一通过“设计 Token 映射”保证。

## 视觉一致性原则（必须遵守）

1. **禁止自由发挥的 CSS**：除非是布局适配（栅格/间距/断点），否则不新增“自定义色值/阴影/圆角/字体”。
2. **颜色/圆角/间距全部走 Token**：
   - 后台端：使用 Arco Design Token（Arco 自带主题与 token 能力）。
   - H5 端：将 Arco Token 映射到 Vant 主题变量（只改变量，不改组件内部样式）。
3. **页面只用模板组件拼装**：
   - 表格/筛选/详情/表单/结果页：优先用 ArcoDesign Pro 内置模式与 Arco 组件。
   - H5 列表/表单/弹窗/提交栏：优先用 Vant 组件。
4. **字体与字号统一**：后台用 Arco 默认排版体系；H5 用 Vant 默认排版体系 + token 约束字号层级（不引入第三套）。

## Token（建议默认值，可按品牌色调整）

- 主色 `Primary`：用于按钮/链接/高亮
- 成功 `Success`、警告 `Warning`、错误 `Danger`
- 圆角 `Radius`：统一 4/6/8（不混用奇怪值）
- 间距 `Spacing`：统一 4/8/12/16/24/32（移动端优先 8 的倍数）

落地时只允许在“主题配置文件/变量文件”里修改这些值，禁止在业务组件里写死。

## 验收方式（确保“画出来一样”）

- **以模板预览为对照**：后台以 ArcoDesign Pro 预览页为准；H5 以 Vant 官方组件表现为准。
- **截图对比**：挑 8 个关键页面做固定分辨率截图（登录、商品列表、商品详情、下单确认、订单列表、订单详情、还款记录、逾期/提醒列表），对齐间距/字号/按钮样式。
- **组件级复用**：同类页面只允许通过同一套“列表页/表单页/详情页”组件组合实现，避免风格漂移。
