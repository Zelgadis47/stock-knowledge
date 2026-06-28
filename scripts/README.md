# deploy-check.py 使用说明

## 前置条件
Python 3.6+

## 每次发布前运行
```powershell
$env:PYTHONIOENCODING="utf-8"
python our-knowledge/scripts/deploy-check.py
```

## 检查内容
| 检查项 | 意义 |
|--------|------|
| 文件完整性 | index.html + tracker.js 都存在 |
| UTF-8 编码 | 中文字符正确，无双编码/GBK误写损坏 |
| 无 JS 变量冲突 | 无 `var KG = ...` 与 `const KG` 冲突 |
| KG_BOOKS 数据 | 26本书完整无缺 |
| window.onload | 页面初始化入口存在 |
| ECharts 加载顺序 | tracker.js 在 echarts CDN 之前 + defer |
| Git 编码配置 | commitEncoding 和 logOutputEncoding 为 utf-8 |

## 所有检查通过后
```powershell
git add -A
git commit -m "描述本次更改"
git push origin main
```
