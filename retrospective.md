# 知识库项目 · 全链路事后分析 & 工作流优化提案

## 一、事故时间线重建

### 阶段1：v3.0 → v3.1 升级（commit 7404af8）
- **操作**：在 26 本手册 HTML 中注入 `KG_initStatusBar()`，合并 tracker.js
- **致命错误1**：**写入 index.html 时UTF-8双编码** → commit message 本身乱码，文件中文字符全部损坏
- **致命错误2**：**合并后的 inline script 中 `var KG = window.KG || {}` 与 tracker.js 的 `const KG` 不兼容** → 但此问题当时被编码乱码掩盖了

### 阶段2：用户发现乱码 → AI第一次修复
- **操作**：从 v3.0 commit `3d9aa9d` 恢复 index.html
- **隐患**：恢复的 v3.0 inline script 没有同步更新到 v3.1 的 API
- **隐患被掩盖**：因为 inline script 中 `var KG = window.KG` 试图重新声明 `const KG`，抛出 SyntaxError 导致脚本不执行

### 阶段3：用户反馈"空白无内容" → AI第二次修复
- **错误诊断**：认为是 ECharts CDN 阻塞（确实也是问题之一，但不是根本原因）
- **修复**：ECharts defer + guard → 修复了 CDN 问题，但页面仍空白

### 阶段4：用户再次反馈"没有可跳转的内容" → AI第三次修复
- **正确诊断**：发现 `var KG = window.KG || {}` 与 `const KG` 冲突
- **修复**：删除冲突行 → 页面正常

## 二、根本原因分析

### 技术根因

| 层 | 根因 | 直接后果 |
|---|------|---------|
| **编码** | Git on Windows 默认 GBK，提交时未指定 UTF-8 | 中文字符双编码损坏 |
| **JS架构** | `const` 在 tracker.js / `var` 在 index.html 混用 | SyntaxError → 整个内联脚本跳过 |
| **版本耦合** | index.html 和 tracker.js 各自独立维护函数定义 | 恢复 v3.0 HTML 后 API 与 v3.1 tracker.js 不匹配 |
| **部署** | 无自动化验证流程 | 代码推到 GitHub 但无人检查页面是否能跑 |

### 流程根因

| # | 问题 | 表现 |
|---|------|------|
| 1 | **无部署验证** | 每次 commit 推到 GitHub 后从没验证 Pages 是否正常工作 |
| 2 | **无本地预览** | 提交前从没双击 index.html 本地测试 |
| 3 | **Git commit message 不检查** | 连 commit message 都是乱码，没人注意 |
| 4 | **文件独立修改无交叉验证** | tracker.js 改了函数签名，但 index.html 不知道 |
| 5 | **恢复操作不验证兼容性** | 从旧 commit 恢复文件时，没检查与当前其他文件是否兼容 |

## 三、优化工作流方案

### 🔧 架构优化：将 index.html 的 inline script 外置

**现状问题**：index.html 内联 18KB 的 JS 代码（KG_BOOKS 数据 + UI 渲染函数 + 搜索等），与 tracker.js（localStorage 引擎）各自独立维护函数定义。

**方案**：将所有 JS 合并到 tracker.js 中，index.html 只保留 HTML 结构+CDN 引用

```
index.html 的新结构：
  <head>
    <meta charset="UTF-8">
  </head>
  <body>
    ... HTML 结构 ...
    <script src="tracker.js"></script>        ← 包含 数据 + 渲染 + 引擎
    <script src="echarts..." defer></script>
  </body>
```

**好处**：
- 单一 JS 文件 → 版本一致性，不会出现 API 不匹配
- 修改数据只需改一个文件
- inline script 没有任何对外部文件的隐式依赖

### 🔧 流程优化：本地预览 + 部署验证

**每次提交前的检查清单**：

```
□ 本地预览：双击 index.html 检查所有标签页
    - "投资手册"标签是否显示 26 本书
    - 搜索框能否过滤
    - "按标签"标签是否正常
    - "学习进度"标签是否显示
    - "设置"标签是否正常
□ 编码检查：确认浏览器无乱码
□ commit message 中文正常
□ Git push 后验证 Pages 可访问
```

### 🔧 Git 配置优化

```bash
# Windows Git 编码设置
git config --global i18n.commitEncoding utf-8
git config --global i18n.logOutputEncoding utf-8
```

### 🔧 最终方案：一键发布脚本

创建一个 `deploy.ps1`，在 push 前自动做完整性检查。

---

## 四、长期改进方向

### 版本声明
在 `tracker.js` 顶部加版本号，如果 index.html 引用的 API 版本不匹配则弹窗提示：

```js
KG_VERSION = "3.0.0";
```

### 跨文件兼容性检查
在 `tracker.js` 初始化时检查关键的 DOM 结构是否存在：

```js
window.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('tab-books')) {
    console.error('知识库：页面结构不完整，请确认 index.html 为最新版本');
  }
  if (typeof KG_BOOKS === 'undefined') {
    console.error('知识库：KG_BOOKS 数据未加载');
  }
});
```

### QA 自动化
将验证脚本（检查 KG_BOOKS 数据、渲染函数、编码）存入项目的 `scripts/` 目录，每次发布前跑一遍。
