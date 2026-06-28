#!/usr/bin/env python3
"""
deploy-check.py — 发布前检查脚本
知识库项目：桀洛 & 嘉娜的知识库

检查清单：
1. 必需文件存在
2. 中文字符编码正常（无 UTF-8 双编码/GBK 误写）
3. JS 变量无冲突（const KG vs var KG）
4. KG_BOOKS 数据完整（26本）
5. window.onload 入口
6. ECharts defer + 加载顺序
7. Git 编码配置是否正确

用法：python deploy-check.py
"""

import os, re, sys
import io

# 强制 UTF-8 输出，绕过 Windows GBK 控制台编码问题
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except Exception:
        pass

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
INDEX_HTML = os.path.join(ROOT, 'index.html')
TRACKER_JS = os.path.join(ROOT, 'tracker.js')

errors = []

def check(name, body):
    try:
        result = body()
        if result is not None:
            print(f"  OK: {name}")
        else:
            print(f"  OK: {name}")
    except Exception as e:
        print(f"  FAIL: {name} — {e}")
        errors.append(name)

def read_utf8(path):
    with open(path, 'rb') as f:
        raw = f.read()
    return raw.decode('utf-8')

# ── 1. 文件存在 ──
print("=== 文件完整性 ===")
check("index.html 存在", lambda: open(INDEX_HTML, 'rb').close() or True)
check("tracker.js 存在", lambda: open(TRACKER_JS, 'rb').close() or True)

# ── 2. 编码检查 ──
print("\n=== 编码检查 ===")
HTML_GLOB = sorted(os.path.join(ROOT, f) for f in os.listdir(ROOT) if f.endswith('.html'))

def check_file_encoding(path):
    fname = os.path.basename(path)
    with open(path, 'rb') as f:
        raw = f.read()
    # Must be valid UTF-8
    try:
        content = raw.decode('utf-8')
    except UnicodeDecodeError:
        raise Exception(f"{fname} 不是有效 UTF-8 编码")
    real_cn = len(re.findall(r'[\u4e00-\u9fff]', content))
    if real_cn < 10:
        raise Exception(f"{fname} 中文字符仅 {real_cn} 个，疑似编码损坏")
    # Check title
    m = re.search(r'<title>(.*?)</title>', content)
    if m:
        title = m.group(1)
        if not re.search(r'[\u4e00-\u9fff]', title):
            raise Exception(f"{fname} 标题 '{title}' 无中文字符，可能乱码")
    return fname, real_cn

all_ok = True
total_cn = 0
for html_path in HTML_GLOB:
    try:
        fname, cn = check_file_encoding(html_path)
        total_cn += cn
        print(f"  OK: {fname} ({cn} 中文字符)")
    except Exception as e:
        print(f"  FAIL: {e}")
        errors.append(str(e))
        all_ok = False

if all_ok:
    print(f"  (全部 {len(HTML_GLOB)} 个 HTML 文件, 共 {total_cn} 中文字符)")

# ── 3. JS 变量冲突 ──
print("\n=== JS 架构检查 ===")
def check_kg_conflict():
    content = read_utf8(INDEX_HTML)
    if re.search(r'var\s+KG\s*=', content):
        raise Exception("index.html 中存在 'var KG = ...'，与 tracker.js 的 'const KG' 冲突 → 整段脚本 SyntaxError → 页面空白")
    return True

check("无 var KG 冲突", check_kg_conflict)

def check_const_kg():
    content = read_utf8(TRACKER_JS)
    if not re.search(r'const\s+KG\s*=', content):
        raise Exception("tracker.js 未使用 'const KG' 声明")
    return True

check("tracker.js const KG 声明", check_const_kg)

# ── 4. KG_BOOKS 数据 ──
print("\n=== 数据完整性 ===")
def count_books():
    content = read_utf8(INDEX_HTML)
    ids = re.findall(r"id:'([^']+)'", content)
    count = len(ids)
    if count != 26:
        raise Exception(f"预计 26 本书，实际 {count} 本")
    return count

book_count = count_books()
print(f"  (书本数: {book_count})")

# ── 5. window.onload ──
print("\n=== 入口检查 ===")
check("window.onload 存在", lambda: (
    re.search(r'window\.onload\s*=', read_utf8(INDEX_HTML))
    or (_ for _ in ()).throw(Exception("缺少 window.onload 入口"))
))

# ── 6. ECharts 顺序 ──
print("\n=== 依赖加载顺序 ===")
def check_echarts_order():
    content = read_utf8(INDEX_HTML)
    epos = content.find('echarts.min.js')
    if epos < 0:
        raise Exception("未找到 echarts CDN 引用")
    tpos = content.rfind('tracker.js', 0, epos)
    if tpos < 0:
        raise Exception("tracker.js 必须在 echarts 之前加载")
    # Check defer
    line_end = content.find('\n', epos)
    line = content[epos:line_end] if line_end > 0 else content[epos:]
    if 'defer' not in line:
        raise Exception("echarts 缺少 defer 属性")
    return True

check("ECharts 异步加载", check_echarts_order)

# ── 7. Git 编码配置 ──
print("\n=== Git 编码配置 ===")
import subprocess
result = subprocess.run(['git', 'config', '--global', 'i18n.commitEncoding'], 
                       capture_output=True, text=True, cwd=ROOT)
commit_enc = result.stdout.strip()
result2 = subprocess.run(['git', 'config', '--global', 'i18n.logOutputEncoding'], 
                        capture_output=True, text=True, cwd=ROOT)
log_enc = result2.stdout.strip()

if commit_enc == 'utf-8':
    print(f"  OK: commitEncoding = {commit_enc}")
else:
    print(f"  WARN: commitEncoding = '{commit_enc}'，建议设为 utf-8")
    print(f"    运行: git config --global i18n.commitEncoding utf-8")

if log_enc == 'utf-8':
    print(f"  OK: logOutputEncoding = {log_enc}")
else:
    print(f"  WARN: logOutputEncoding = '{log_enc}'，建议设为 utf-8")
    print(f"    运行: git config --global i18n.logOutputEncoding utf-8")

# ── 结果 ──
print(f"\n{'='*40}")
if not errors:
    print(f"✅ 全部检查通过！可以提交了。")
else:
    print(f"❌ {len(errors)} 项失败: {', '.join(errors)}")
    sys.exit(1)
