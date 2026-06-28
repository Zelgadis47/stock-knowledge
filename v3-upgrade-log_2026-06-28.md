# 知识库 v3.0 全功能升级工单

**日期**: 2026-06-28 13:30
**状态**: ✅ 已部署
**访问地址**: https://zelgadis47.github.io/stock-knowledge/

---

## 升级内容

### 引擎 (tracker.js) — 全面重写
| 模块 | 功能 |
|------|------|
| 进度追踪 | status: reading/completed + startedAt/updatedAt |
| 笔记系统 | CRUD 笔记，支持删除 |
| 标签系统 | 标签CRUD + 双向关联（getRelatedItems） |
| 文本标注 | 选中文字→浮动按钮→标注入库 |
| 阅读统计 | 访问次数 + 总阅读时长（beforeunload 自动记录） |
| 收藏 | toggleBookmark + 收藏列表 |
| 间隔复习 (SRS) | 首次访问加入 → 逐次翻倍间隔(capped 90天) → 到期提醒 |
| 浏览历史 | 最近200条，自动去重 |
| 备份/恢复 | exportAll + importAll + downloadBackup |

### 主页面 (index.html) — 7个标签页
1. **📘 投资手册** — 分类展示（经典/游资/技术/衍生）+ 标签显示 + 进度条 + 搜索
2. **🏷️ 按标签** — 所有标签聚合卡片，点击跳转筛选
3. **🕸️ 知识图谱** — ECharts 力导向图，13本书+标签节点，点击节点弹出Modal
4. **📊 学习进度** — 7维度统计卡片 + 逐书进度条 + 最近浏览记录
5. **✏️ 标注库** — 所有标注按时间汇总，可删除
6. **🔄 复习** — 到期/已排期列表，点击「今日已复习」确认
7. **⚙️ 设置** — 导出/导入备份 + 重置数据

### 13本手册 — 统一注入
每本手册底部固定状态栏：
- 书名 + 状态(✅/📖/⚪) + 阅读次数 + 笔记数
- 按钮: 「读完」「✏️ 笔记」「← 返回」
- 文本选中标注功能
- beforeunload 自动计时

### 交互升级
- **Modal弹窗** — 点击卡片弹出详情，含标签/进度/笔记/相关推荐/阅读全文
- **搜索框** — 标题/描述/标签实时过滤
- **SRS提醒条** — 首页顶部自动显示到期复习数量

---

## 架构变化

```
our-knowledge/
├── index.html            ← 重写 7标签页 + Modal + 图谱
├── tracker.js            ← 新增 全功能引擎
├── candlestick_manual.html  ← 注入状态栏+标注
├── canslim_manual.html      ← 同上
├── chanlun_108_manual.html  ← 同上
├── gaoshou_yulu_manual.html ← 同上
├── intelligent_investor_manual.html ← 同上
├── linghu_chong_manual.html  ← 同上
├── lynch_one_up_manual.html  ← 同上
├── most_important_manual.html ← 同上
├── qiquan_3hour_manual.html  ← 同上
├── ruihexian_manual.html    ← 同上
├── stock_operator_manual.html ← 同上
├── yangjia_xinfa_manual.html ← 同上
├── zijinliu_manual.html     ← 同上
└── (其他静态资源不变)
```

## 注意事项
- 所有数据在浏览器 localStorage，清除缓存会丢失 → 建议定期「设置→导出备份」
- ECharts 从 CDN 加载，首次需要网络
- 旧版 v2 数据（kg_progress_v1/notes_v1等）不会自动迁移到 v3（key 不同）
- 未完成：令胡冲/赵老哥/龙飞虎/l林疯狂等新内容的手册创建

## 后续可迭代
- [ ] Fuse.js 全文模糊搜索
- [ ] 标注支持添加笔记
- [ ] 间隔复习导出到 Anki
- [ ] 移动端手势优化
