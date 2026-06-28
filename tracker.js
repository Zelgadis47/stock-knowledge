// ============================================================
// 知识库 · 全功能引擎 v3.0
// ============================================================
// 模块: 进度追踪 | 笔记 | 标签 | 标注 | 阅读统计 | 收藏 | 间隔复习
// localStorage 存储，不上传任何服务器

const KG = (function() {
  const K = {
    PROGRESS: 'kg_progress_v3',    // { "id": { status, startedAt, updatedAt } }
    NOTES: 'kg_notes_v3',          // { "id": [ { content, createdAt } ] }
    TAGS: 'kg_tags_v3',            // { "id": ["tag1","tag2"] }
    ALL_TAGS: 'kg_all_tags_v3',    // ["tag1","tag2"]
    ANNOTATIONS: 'kg_annotations_v3', // { "id": [ { text, note, selector, createdAt } ] }
    STATS: 'kg_stats_v3',          // { "id": { visits, totalTimeMs, lastVisitAt } }
    BOOKMARKS: 'kg_bookmarks_v3',  // { "id": true }
    SRS: 'kg_srs_v3',              // { "id": { lastReviewAt, nextReviewAt, interval } }
    HISTORY: 'kg_history_v3',      // [ { id, title, timestamp } ]
  };

  function get(key) { return JSON.parse(localStorage.getItem(key) || '{}'); }
  function set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function getArr(key) { return JSON.parse(localStorage.getItem(key) || '[]'); }
  function setArr(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  return {
    // ==================== PROGRESS ====================
    getProgress() { return get(K.PROGRESS); },
    setStatus(id, status) {
      const p = get(K.PROGRESS);
      if (!p[id]) p[id] = {};
      p[id].status = status;
      p[id].updatedAt = Date.now();
      if (!p[id].startedAt) p[id].startedAt = Date.now();
      set(K.PROGRESS, p);
    },
    getStatus(id) {
      const p = get(K.PROGRESS);
      return p[id] ? p[id].status : null;
    },
    getProgressStats() {
      const p = get(K.PROGRESS);
      let reading = 0, done = 0;
      Object.values(p).forEach(v => {
        if (v.status === 'reading') reading++;
        if (v.status === 'completed') done++;
      });
      return { reading, done, total: Object.keys(p).length };
    },

    // ==================== NOTES ====================
    getNotes(id) { return get(K.NOTES)[id] || []; },
    addNote(id, content) {
      if (!content.trim()) return;
      const n = get(K.NOTES);
      if (!n[id]) n[id] = [];
      n[id].push({ content: content.trim(), createdAt: Date.now() });
      set(K.NOTES, n);
    },
    deleteNote(id, idx) {
      const n = get(K.NOTES);
      if (n[id] && n[id][idx]) {
        n[id].splice(idx, 1);
        if (n[id].length === 0) delete n[id];
        set(K.NOTES, n);
      }
    },
    getAllNotes() {
      const n = get(K.NOTES);
      let count = 0;
      Object.keys(n).forEach(k => { count += n[k].length; });
      return { items: n, count };
    },

    // ==================== TAGS ====================
    getTags(id) { return get(K.TAGS)[id] || []; },
    setTags(id, tags) {
      const t = get(K.TAGS);
      t[id] = tags;
      set(K.TAGS, t);
      // Update master tag list
      const all = new Set();
      Object.values(get(K.TAGS)).forEach(tagList => tagList.forEach(t => all.add(t)));
      setArr(K.ALL_TAGS, Array.from(all).sort());
    },
    getAllTags() { return getArr(K.ALL_TAGS); },
    getItemsByTag(tag) {
      const t = get(K.TAGS);
      const result = [];
      Object.keys(t).forEach(id => {
        if (t[id].includes(tag)) result.push(id);
      });
      return result;
    },
    getRelatedItems(id, maxCount) {
      maxCount = maxCount || 5;
      const myTags = this.getTags(id);
      if (myTags.length === 0) return [];
      const all = get(K.TAGS);
      const scored = [];
      Object.keys(all).forEach(otherId => {
        if (otherId === id) return;
        const otherTags = all[otherId];
        const overlap = myTags.filter(t => otherTags.includes(t)).length;
        if (overlap > 0) scored.push({ id: otherId, score: overlap });
      });
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, maxCount).map(s => s.id);
    },

    // ==================== ANNOTATIONS ====================
    getAnnotations(id) { return get(K.ANNOTATIONS)[id] || []; },
    addAnnotation(id, text, note, selector) {
      const a = get(K.ANNOTATIONS);
      if (!a[id]) a[id] = [];
      a[id].push({ text, note: note || '', selector: selector || '', createdAt: Date.now() });
      set(K.ANNOTATIONS, a);
    },
    deleteAnnotation(id, idx) {
      const a = get(K.ANNOTATIONS);
      if (a[id] && a[id][idx]) {
        a[id].splice(idx, 1);
        if (a[id].length === 0) delete a[id];
        set(K.ANNOTATIONS, a);
      }
    },
    getAllAnnotations() {
      const a = get(K.ANNOTATIONS);
      let count = 0;
      Object.keys(a).forEach(k => { count += a[k].length; });
      return { items: a, count };
    },

    // ==================== READING STATS ====================
    logVisit(id) {
      const s = get(K.STATS);
      if (!s[id]) s[id] = { visits: 0, totalTimeMs: 0, lastVisitAt: null };
      s[id].visits++;
      s[id].lastVisitAt = Date.now();
      set(K.STATS, s);
    },
    logTime(id, ms) {
      const s = get(K.STATS);
      if (!s[id]) s[id] = { visits: 0, totalTimeMs: 0, lastVisitAt: null };
      s[id].totalTimeMs += ms;
      set(K.STATS, s);
    },
    getStats(id) { return get(K.STATS)[id] || { visits: 0, totalTimeMs: 0, lastVisitAt: null }; },
    getAllStats() { return get(K.STATS); },

    // ==================== BOOKMARKS ====================
    toggleBookmark(id) {
      const b = get(K.BOOKMARKS);
      if (b[id]) { delete b[id]; } else { b[id] = true; }
      set(K.BOOKMARKS, b);
      return !!b[id];
    },
    isBookmarked(id) { return !!get(K.BOOKMARKS)[id]; },
    getBookmarks() { return Object.keys(get(K.BOOKMARKS)); },

    // ==================== SPACED REPETITION ====================
    recordReview(id) {
      const s = get(K.SRS);
      if (!s[id]) s[id] = { lastReviewAt: null, nextReviewAt: null, interval: 1 };
      const old = s[id];
      // Double interval (capped at 90 days)
      old.interval = Math.min(old.interval * 2, 90);
      old.lastReviewAt = Date.now();
      old.nextReviewAt = Date.now() + old.interval * 86400000;
      set(K.SRS, s);
    },
    getDueItems() {
      const s = get(K.SRS);
      const now = Date.now();
      const due = [];
      Object.keys(s).forEach(id => {
        if (s[id].nextReviewAt && s[id].nextReviewAt <= now) due.push(id);
      });
      return due;
    },
    getNextReview(id) {
      const s = get(K.SRS);
      return s[id] ? s[id].nextReviewAt : null;
    },
    initFirstReview(id) {
      // Called on first visit only if not already in SRS
      const s = get(K.SRS);
      if (!s[id]) {
        s[id] = { lastReviewAt: Date.now(), nextReviewAt: Date.now() + 86400000, interval: 1 };
        set(K.SRS, s);
      }
    },
    getSRSStats() {
      const s = get(K.SRS);
      const now = Date.now();
      let due = 0, upcoming = 0;
      Object.values(s).forEach(v => {
        if (v.nextReviewAt && v.nextReviewAt <= now) due++;
        else if (v.nextReviewAt) upcoming++;
      });
      return { total: Object.keys(s).length, due, upcoming };
    },

    // ==================== HISTORY ====================
    logVisitHistory(id, title) {
      const h = getArr(K.HISTORY);
      h.unshift({ id, title, timestamp: Date.now() });
      if (h.length > 200) h.length = 200;
      setArr(K.HISTORY, h);
    },
    getHistory(limit) {
      limit = limit || 50;
      return getArr(K.HISTORY).slice(0, limit);
    },

    // ==================== EXPORT / IMPORT ====================
    exportAll() {
      const data = {};
      Object.keys(K).forEach(k => {
        const val = localStorage.getItem(K[k]);
        if (val) data[k.replace('_v3','')] = JSON.parse(val);
      });
      return data;
    },
    importAll(data) {
      Object.keys(data).forEach(key => {
        const k = 'kg_' + key + '_v3';
        set(k, data[key]);
      });
    },
    downloadBackup() {
      const data = this.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'knowledge-backup-' + new Date().toISOString().slice(0,10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };
})();

// ==================== UTILITY HELPERS ====================

function KG_timeAgo(ts) {
  if (!ts) return '未知';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return mins + '分钟前';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + '小时前';
  const days = Math.floor(hours / 24);
  if (days < 30) return days + '天前';
  return Math.floor(days / 30) + '个月前';
}

function KG_formatDate(ts) {
  if (!ts) return '--';
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function KG_escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== STATUS BAR SNIPPET (for manual pages) ====================
// Each manual page calls KG_initStatusBar(bookId, bookTitle) on load
function KG_initStatusBar(id, title) {
  KG.logVisit(id);
  KG.logVisitHistory(id, title);
  KG.initFirstReview(id);

  // Build status bar HTML
  const status = KG.getStatus(id);
  const isBookmarked = KG.isBookmarked(id);
  const stats = KG.getStats(id);
  const noteCount = KG.getNotes(id).length;

  var bar = document.createElement('div');
  bar.id = 'kg-status-bar';
  bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#161b22;border-top:1px solid #30363d;padding:10px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:0.82rem;color:#e6edf3;backdrop-filter:blur(8px);';

  var statusIcon = status === 'completed' ? '✅' : status === 'reading' ? '📖' : '⚪';
  var statusText = status === 'completed' ? '已完成' : status === 'reading' ? '阅读中' : '未开始';

  bar.innerHTML =
    '<span style="font-weight:600;color:#58a6ff;">' + KG_escapeHtml(title) + '</span>' +
    '<span style="color:#8b949e;">|</span>' +
    '<span>' + statusIcon + ' ' + statusText + '</span>' +
    '<span style="color:#8b949e;">|</span>' +
    '<span>👁️ ' + stats.visits + '次</span>' +
    '<span style="color:#8b949e;">|</span>' +
    '<span>📝 ' + noteCount + '条笔记</span>' +
    '<span style="margin-left:auto;display:flex;gap:8px;">' +
      '<button onclick="KG_toggleRead(\'' + id + '\')" style="padding:4px 12px;border-radius:6px;border:1px solid #30363d;background:#21262d;color:#e6edf3;cursor:pointer;font-size:0.78rem;">' + (status === 'completed' ? '↩ 重读' : '✅ 读完') + '</button>' +
      '<button onclick="KG_showNoteDialog(\'' + id + '\')" style="padding:4px 12px;border-radius:6px;border:1px solid #30363d;background:#21262d;color:#e6edf3;cursor:pointer;font-size:0.78rem;">✏️ 笔记</button>' +
      '<button onclick="KG_toggleBm(\'' + id + '\')" style="padding:4px 12px;border-radius:6px;border:1px solid #30363d;background:#21262d;color:#e6edf3;cursor:pointer;font-size:0.78rem;">' + (isBookmarked ? '🔖' : '🏷️') + '</button>' +
      '<a href="index.html" style="padding:4px 12px;border-radius:6px;border:1px solid #30363d;background:#21262d;color:#e6edf3;text-decoration:none;font-size:0.78rem;">← 返回</a>' +
    '</span>';

  // Add some bottom padding to page body
  document.body.style.paddingBottom = '60px';
  document.body.appendChild(bar);

  // Track reading time
  var startTime = Date.now();
  window.addEventListener('beforeunload', function() {
    KG.logTime(id, Date.now() - startTime);
  });
}

function KG_toggleRead(id) {
  var status = KG.getStatus(id);
  KG.setStatus(id, status === 'completed' ? 'reading' : 'completed');
  location.reload();
}

function KG_showNoteDialog(id) {
  var existing = document.getElementById('kg-note-dialog');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'kg-note-dialog';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;justify-content:center;align-items:center;';

  var notes = KG.getNotes(id);
  var notesHtml = notes.map(function(n, i) {
    return '<div style="padding:10px;margin-bottom:8px;background:#21262d;border-radius:8px;border:1px solid #30363d;">' +
      '<p style="margin:0 0 4px;color:#e6edf3;">' + KG_escapeHtml(n.content) + '</p>' +
      '<div style="display:flex;justify-content:space-between;font-size:0.72rem;color:#8b949e;">' +
        '<span>' + KG_formatDate(n.createdAt) + '</span>' +
        '<button onclick="KG_deleteNote(\'' + id + '\',' + i + ')" style="background:none;border:none;color:#f85149;cursor:pointer;font-size:0.72rem;">删除</button>' +
      '</div></div>';
  }).join('') || '<p style="color:#8b949e;text-align:center;">暂无笔记</p>';

  overlay.innerHTML =
    '<div style="background:#161b22;border:1px solid #30363d;border-radius:12px;padding:24px;width:90%;max-width:480px;max-height:80vh;overflow-y:auto;">' +
      '<h3 style="margin:0 0 12px;color:#e6edf3;">✏️ 笔记</h3>' +
      '<div id="kg-notes-list" style="margin-bottom:14px;">' + notesHtml + '</div>' +
      '<textarea id="kg-note-input" placeholder="写点什么..." style="width:100%;padding:10px;border-radius:8px;border:1px solid #30363d;background:#0d1117;color:#e6edf3;font-size:0.85rem;resize:vertical;min-height:80px;box-sizing:border-box;"></textarea>' +
      '<div style="display:flex;gap:8px;margin-top:10px;justify-content:flex-end;">' +
        '<button onclick="KG_saveNote(\'' + id + '\')" style="padding:8px 20px;border-radius:8px;border:none;background:#238636;color:white;cursor:pointer;font-size:0.85rem;">保存</button>' +
        '<button onclick="document.getElementById(\'kg-note-dialog\').remove()" style="padding:8px 20px;border-radius:8px;border:1px solid #30363d;background:#21262d;color:#e6edf3;cursor:pointer;font-size:0.85rem;">关闭</button>' +
      '</div></div>';

  document.body.appendChild(overlay);
}

function KG_saveNote(id) {
  var input = document.getElementById('kg-note-input');
  if (input && input.value.trim()) {
    KG.addNote(id, input.value);
    KG_showNoteDialog(id); // refresh
  }
}

function KG_deleteNote(id, idx) {
  KG.deleteNote(id, idx);
  KG_showNoteDialog(id); // refresh
}

function KG_toggleBm(id) {
  KG.toggleBookmark(id);
  location.reload();
}

// Annotation: text selection handler
function KG_initAnnotation(id) {
  document.addEventListener('mouseup', function(e) {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.toString().trim().length < 5) return;
    // Check if click is in the status bar or dialog
    var target = e.target;
    while (target) {
      if (target.id === 'kg-status-bar' || target.id === 'kg-note-dialog') return;
      target = target.parentElement;
    }

    var text = sel.toString().trim();
    var range = sel.getRangeAt(0);
    var selector = ''; // simplified: just the text

    // Show annotation popup
    var rect = range.getBoundingClientRect();
    var existing = document.getElementById('kg-anno-popup');
    if (existing) existing.remove();

    var popup = document.createElement('div');
    popup.id = 'kg-anno-popup';
    popup.style.cssText = 'position:fixed;top:' + (rect.top - 50) + 'px;left:' + Math.max(10, rect.left) + 'px;z-index:10001;background:#1c2333;border:1px solid #30363d;border-radius:8px;padding:10px 14px;box-shadow:0 4px 16px rgba(0,0,0,0.4);display:flex;gap:6px;align-items:center;';
    popup.innerHTML =
      '<span style="color:#e6edf3;font-size:0.78rem;white-space:nowrap;">标注此段？</span>' +
      '<button onclick="KG_doAnnotate(\'' + id + '\',\'' + KG_escapeHtml(text).replace(/'/g,"\\'") + '\')" style="padding:4px 10px;border-radius:6px;border:none;background:#238636;color:white;cursor:pointer;font-size:0.75rem;">✓ 标注</button>' +
      '<button onclick="this.parentElement.remove()" style="padding:4px 10px;border-radius:6px;border:1px solid #30363d;background:#21262d;color:#e6edf3;cursor:pointer;font-size:0.75rem;">✕</button>';

    document.body.appendChild(popup);
    setTimeout(function() { if (popup.parentElement) popup.remove(); }, 5000);
  });
}

function KG_doAnnotate(id, text) {
  KG.addAnnotation(id, text, '', '');
  var popup = document.getElementById('kg-anno-popup');
  if (popup) popup.remove();
  window.getSelection().removeAllRanges();
  // Visual feedback
  var flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#238636;color:white;padding:12px 24px;border-radius:10px;z-index:10002;font-size:0.9rem;';
  flash.textContent = '✅ 已标注';
  document.body.appendChild(flash);
  setTimeout(function() { flash.remove(); }, 1200);
}
