/**
 * 家庭收纳管理系统 — 工具函数
 * 通用辅助函数，不依赖业务逻辑
 *
 * @module utils
 * @version 1.0.0
 */

// ============================================================
// DOM 操作
// ============================================================

/**
 * 简化的 DOM 选择器
 * @param {string} selector - CSS 选择器
 * @param {Element} [parent=document] - 父元素
 * @returns {Element|null}
 */
function $(selector, parent) {
    return (parent || document).querySelector(selector);
}

/**
 * 简化的 DOM 全选选择器
 * @param {string} selector - CSS 选择器
 * @param {Element} [parent=document] - 父元素
 * @returns {NodeList}
 */
function $$(selector, parent) {
    return (parent || document).querySelectorAll(selector);
}

/**
 * 创建元素并设置属性
 * @param {string} tag - HTML 标签名
 * @param {object} [attrs={}] - 属性对象
 * @param {string|Node|Array} [children] - 子元素
 * @returns {Element}
 */
function createElement(tag, attrs, children) {
    const el = document.createElement(tag);
    if (attrs) {
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dk, dv]) => {
                    el.dataset[dk] = dv;
                });
            } else if (key.startsWith('on')) {
                el.addEventListener(key.substring(2).toLowerCase(), value);
            } else {
                el.setAttribute(key, value);
            }
        });
    }
    if (children !== undefined && children !== null) {
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (child != null) el.appendChild(
                    typeof child === 'string' ? document.createTextNode(child) : child
                );
            });
        } else if (typeof children === 'string' || typeof children === 'number') {
            el.textContent = String(children);
        } else {
            el.appendChild(children);
        }
    }
    return el;
}

// ============================================================
// 日期时间
// ============================================================

/**
 * 格式化日期时间为可读字符串
 * @param {string|Date} date - ISO 日期字符串或 Date 对象
 * @returns {string} 格式：2026-07-13 14:30
 */
function formatDateTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 获取当前 ISO 时间字符串
 * @returns {string}
 */
function nowISO() {
    return new Date().toISOString();
}

// ============================================================
// ID 生成
// ============================================================

/**
 * 生成唯一 ID（UUID v4 简化版）
 * @returns {string}
 */
function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ============================================================
// 搜索 / 模糊匹配
// ============================================================

/**
 * 模糊搜索匹配
 * 判断 query 中的每个字符是否按顺序出现在 target 中
 * 类似 Sublime Text / VSCode 的模糊匹配
 *
 * @param {string} query - 用户输入的搜索词
 * @param {string} target - 被搜索的目标字符串
 * @returns {number} 匹配得分，0 表示不匹配，越高越好
 */
function fuzzyMatch(query, target) {
    if (!query || !target) return 0;

    const q = query.toLowerCase().trim();
    const t = target.toLowerCase().trim();

    // 完全匹配得分最高
    if (t === q) return 100;

    // 包含子串匹配
    if (t.includes(q)) return 80 + q.length / t.length * 20;

    // 逐个字符按序匹配
    let qi = 0;
    let consecutiveBonus = 0;
    let maxConsecutive = 0;
    let prevMatchIndex = -2;

    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t[ti] === q[qi]) {
            qi++;
            if (ti === prevMatchIndex + 1) {
                consecutiveBonus++;
                maxConsecutive = Math.max(maxConsecutive, consecutiveBonus);
            } else {
                consecutiveBonus = 1;
            }
            prevMatchIndex = ti;
        }
    }

    // 所有字符都匹配才算命中
    if (qi < q.length) return 0;

    // 得分：基础分 + 连续匹配加分 + 匹配位置靠前加分
    const positionBonus = Math.max(0, 10 - target.indexOf(q[0]));
    return 50 + maxConsecutive * 3 + positionBonus;
}

/**
 * 在物品数组中执行模糊搜索
 * @param {string} query - 搜索词
 * @param {Array} items - 物品数组
 * @returns {Array} 匹配的物品（已排序，含得分）
 */
function searchItems(query, items) {
    if (!query || !query.trim()) return [];

    const results = [];
    for (const item of items) {
        // 搜索多个字段：名称、收纳盒、备注
        const nameScore = fuzzyMatch(query, item.name);
        const boxScore = item.box ? fuzzyMatch(query, item.box) : 0;
        const remarkScore = item.remark ? fuzzyMatch(query, item.remark) : 0;

        const score = Math.max(nameScore, boxScore, remarkScore);
        if (score > 0) {
            results.push({ item, score });
        }
    }

    // 按得分降序排列
    results.sort((a, b) => b.score - a.score);
    return results;
}

// ============================================================
// 防抖
// ============================================================

/**
 * HTML 转义，防止 XSS
 * @param {string} str
 * @returns {string}
 */
/**
 * 将层级编号转为中文描述
 * @param {string} level - 如 L1, L2, L3...
 * @returns {string} 如 第一层, 第二层...
 */
function formatLevel(level) {
    const map = { L1: '第一层', L2: '第二层', L3: '第三层', L4: '第四层', L5: '第五层', L6: '第六层' };
    return map[level] || level;
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * 防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟毫秒数
 * @returns {Function}
 */
function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// ============================================================
// 确认对话框
// ============================================================

/**
 * 显示自定义确认对话框
 * @param {string} message - 提示消息
 * @param {string} [title='确认操作'] - 标题
 * @returns {Promise<boolean>} 用户是否确认
 */
function confirmDialog(message, title) {
    return new Promise((resolve) => {
        // 移除已有对话框
        const existing = $('#confirm-dialog-overlay');
        if (existing) existing.remove();

        const overlay = createElement('div', {
            id: 'confirm-dialog-overlay',
            className: 'dialog-overlay'
        });

        const dialog = createElement('div', { className: 'dialog' }, [
            createElement('div', { className: 'dialog-header' }, [
                createElement('h3', {}, title || '确认操作'),
                createElement('p', { className: 'dialog-message' }, message)
            ]),
            createElement('div', { className: 'dialog-footer' }, [
                createElement('button', {
                    className: 'btn btn-secondary',
                    onClick: () => { overlay.remove(); resolve(false); }
                }, '取消'),
                createElement('button', {
                    className: 'btn btn-danger',
                    onClick: () => { overlay.remove(); resolve(true); }
                }, '确认')
            ])
        ]);

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        });
    });
}

// ============================================================
// Toast 提示
// ============================================================

/**
 * 显示 Toast 提示
 * @param {string} message - 提示文字
 * @param {string} [type='info'] - 类型：info / success / error
 * @param {number} [duration=2000] - 显示时长（毫秒）
 */
function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 2000;

    const existing = $('.toast');
    if (existing) existing.remove();

    const toast = createElement('div', {
        className: `toast toast-${type}`
    }, message);

    document.body.appendChild(toast);

    // 动画进入
    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });

    // 自动消失
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================================
// 文件下载
// ============================================================

/**
 * 触发浏览器下载文件
 * @param {string} content - 文件内容
 * @param {string} filename - 文件名
 * @param {string} [mimeType='application/json'] - MIME 类型
 */
function downloadFile(content, filename, mimeType) {
    mimeType = mimeType || 'application/json';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = createElement('a', {
        href: url,
        download: filename
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 读取用户选择的文件内容
 * @param {File} file - 文件对象
 * @returns {Promise<string>} 文件内容
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

// ============================================================
// URL hash 解析
// ============================================================

/**
 * 解析 URL hash 为路径和查询参数
 * 例如：#/map/K/K09/L2?highlight=xxx
 * → { path: '/map/K/K09/L2', parts: ['map', 'K', 'K09', 'L2'], query: { highlight: 'xxx' } }
 *
 * @returns {object}
 */
function parseHash() {
    const raw = location.hash.slice(1) || '/';
    const [pathStr, queryStr] = raw.split('?');
    const parts = pathStr.split('/').filter(Boolean);
    const query = {};
    if (queryStr) {
        queryStr.split('&').forEach(pair => {
            const [k, v] = pair.split('=');
            query[decodeURIComponent(k)] = decodeURIComponent(v || '');
        });
    }
    return {
        path: '/' + (parts.join('/') || ''),
        parts,
        query
    };
}

/**
 * 构建 hash URL
 * @param {string} path - 路径（如 '/map/K/K09'）
 * @param {object} [query] - 查询参数
 * @returns {string}
 */
function buildHash(path, query) {
    let url = '#' + path;
    if (query && Object.keys(query).length > 0) {
        const qs = Object.entries(query)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
        url += '?' + qs;
    }
    return url;
}

// ============================================================
// 剪贴板操作
// ============================================================

/**
 * 复制文本到剪贴板
 * @param {string} text
 * @returns {Promise<boolean>}
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        // 降级方案
        const textarea = createElement('textarea', { style: 'position:fixed;opacity:0;' });
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
    }
}
