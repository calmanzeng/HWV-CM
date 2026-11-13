# 交接：hwv-cm-prototype → React + Vite（TypeScript）

> 给写代码的模型看：照这份把设计稿做成真页面。设计稿就是源码——每屏一个 HTML，样式在 tokens.css 等样式表里。先读源文件，截图只用来对照，别凭截图猜数值。

## 做什么

- 设计目录：`C:\Users\Administrator\.dsh\bot\workspace\HWV-CM\design\hwv-cm-prototype`（11 屏，web 1280×800）
- 做到：`C:\Users\Administrator\.dsh\bot\workspace\HWV-CM`（目录里已经有别的东西，不是 Node 项目：先看清结构，前端放进它里面新的子目录）
- 框架：React + Vite（TypeScript）
- 生成时间：2026-11-13 14:01（UTC+8）

## 屏幕和路由

| 屏 | 设计文件 | 建议路由 | 截图（handoff/shots/） | 跳到 |
| --- | --- | --- | --- | --- |
| 首页 · HWV-CM | home.html | `/` | home-1.jpg、home-2.jpg、home-mobile.jpg | profile、relationship、event-consent、follow-up、about |
| 我的档案 · HWV-CM | profile.html | `/profile` | profile-1.jpg、profile-2.jpg、profile-mobile.jpg | home、relationship、event-consent、follow-up、about |
| 关系 · HWV-CM | relationship.html | `/relationship` | relationship-1.jpg、relationship-2.jpg、relationship-3.jpg、relationship-mobile.jpg | home、profile、event-consent、follow-up、about |
| 事件分析 · HWV-CM | event.html | `/event` | event-1.jpg、event-2.jpg、event-3.jpg、event-mobile.jpg | home、profile、relationship、event-consent、follow-up、about、safety、event-map |
| 核对假设 · HWV-CM | event-map.html | `/event-map` | event-map-1.jpg、event-map-2.jpg、event-map-mobile.jpg | home、profile、relationship、event-consent、follow-up、about、safety、event |
| 事件整理结果 · HWV-CM | report.html | `/report` | report-1.jpg、report-2.jpg、report-3.jpg、report-mobile.jpg | home、profile、relationship、event-consent、follow-up、about、safety、event-map |
| 安全支持 · HWV-CM | safety.html | `/safety` | safety-1.jpg、safety-2.jpg、safety-mobile.jpg | home、profile、relationship、event-consent、follow-up、about |
| 约定与复盘 · HWV-CM | follow-up.html | `/follow-up` | follow-up-1.jpg、follow-up-2.jpg、follow-up-3.jpg、follow-up-mobile.jpg | home、profile、relationship、event-consent、about、report、safety |
| 关于与数据 · HWV-CM | about.html | `/about` | about-1.jpg、about-2.jpg、about-mobile.jpg | home、profile、relationship、event-consent、follow-up、safety |
| 开始前说明 · HWV-CM | event-consent.html | `/event-consent` | event-consent-1.jpg、event-consent-2.jpg、event-consent-mobile.jpg | home、profile、relationship、follow-up、about、safety |
| 安全自评 · HWV-CM | event-safety-check.html | `/event-safety-check` | event-safety-check-1.jpg、event-safety-check-2.jpg、event-safety-check-mobile.jpg | home、profile、relationship、event-consent、follow-up、about、safety、event |

## 设计变量

`tokens.css` 里 42 个变量（颜色 0 个：）。

- 把 tokens.css 原样放进项目的全局样式（如 `src/styles/tokens.css`）并在入口引入；组件样式里一律用 `var(--…)`，别写死色值、字号。
- 别的样式表：`app.css`（公共样式，拆进对应组件或全局样式）

## 几屏共用的部分（做成组件）

- `.brand`：11 屏都有（home、profile、relationship、event、event-map、report、safety、follow-up、about、event-consent、event-safety-check）→ `Brand` 组件
- `.breadcrumb`：11 屏都有（home、profile、relationship、event、event-map、report、safety、follow-up、about、event-consent、event-safety-check）→ `Breadcrumb` 组件
- `.button`：11 屏都有（home、profile、relationship、event、event-map、report、safety、follow-up、about、event-consent、event-safety-check）→ `Button` 组件
- `.card`：11 屏都有（home、profile、relationship、event、event-map、report、safety、follow-up、about、event-consent、event-safety-check）→ `Card` 组件
- `.content`：11 屏都有（home、profile、relationship、event、event-map、report、safety、follow-up、about、event-consent、event-safety-check）→ `Content` 组件
- `.eyebrow`：11 屏都有（home、profile、relationship、event、event-map、report、safety、follow-up、about、event-consent、event-safety-check）→ `Eyebrow` 组件
- `.link`：11 屏都有（home、profile、relationship、event、event-map、report、safety、follow-up、about、event-consent、event-safety-check）→ `Link` 组件
- `.local-note`：11 屏都有（home、profile、relationship、event、event-map、report、safety、follow-up、about、event-consent、event-safety-check）→ `LocalNote` 组件
- `.local-status`：11 屏都有（home、profile、relationship、event、event-map、report、safety、follow-up、about、event-consent、event-safety-check）→ `LocalStatus` 组件
- `.main-area`：11 屏都有（home、profile、relationship、event、event-map、report、safety、follow-up、about、event-consent、event-safety-check）→ `MainArea` 组件
- `.nav-label`：11 屏都有（home、profile、relationship、event、event-map、report、safety、follow-up、about、event-consent、event-safety-check）→ `NavLabel` 组件
- `.nav-link`：11 屏都有（home、profile、relationship、event、event-map、report、safety、follow-up、about、event-consent、event-safety-check）→ `NavLink` 组件
- `.nav-list`：11 屏都有（home、profile、relationship、event、event-map、report、safety、follow-up、about、event-consent、event-safety-check）→ `NavList` 组件
- `.prototype-banner`：11 屏都有（home、profile、relationship、event、event-map、report、safety、follow-up、about、event-consent、event-safety-check）→ `PrototypeBanner` 组件

## 交互和状态

- profile.html：1 个输入控件（做成受控组件、加校验和出错状态）
- relationship.html：4 个输入控件（做成受控组件、加校验和出错状态）
- event.html：9 个输入控件（做成受控组件、加校验和出错状态）
- follow-up.html：10 个输入控件（做成受控组件、加校验和出错状态）
- event-consent.html：1 个输入控件（做成受控组件、加校验和出错状态）
- 悬停 / 聚焦 / 按下的样式 16 处：照搬，别丢。

## 图片和字体

- 没有单独的图片、字体文件（图形都写在 HTML / SVG 里）。

## 做法和验收

1. 搭骨架：这个目录里已经有东西，但没认出前端框架（可能是后端、monorepo 根目录或别的语言的仓库）：先看清它的结构和用途再定放哪——适合直接加页面就加；不适合就在里面另建一个前端（monorepo 放进 apps/ 之类的子包，别的放进新的子目录，比如在里面跑 `npm create vite@latest web -- --template react-ts`），用 React + Vite（TypeScript） 搭，别打乱现有代码；把 tokens.css（和公共样式表）搬进去。
2. 一屏一个页面，路由照上面的表；先抽几屏共用的组件，再拼页面。
3. 结构、文案、数字、图标照设计稿的 HTML 搬；class 名可以改成项目的习惯，样式值（间距、字号、颜色、圆角、阴影）一律用设计变量。
4. 每做完一屏：把开发服务器跑起来，调 `compare_design`（screen 填设计文件名，url 填这一屏在开发服务器上的地址），照差异图把不一样的地方改掉，直到差异在 3% 以内，或者剩下的差别说得出理由（比如真实数据、系统字体）。
5. 全部做完：每屏再对一遍；告诉用户做了哪些页面、怎么跑起来（命令和地址）、还有哪里和设计稿不一样。

别做：改设计（配色、文案、布局）、加设计稿里没有的功能、引入新的 UI 组件库（项目已经在用的除外）。
