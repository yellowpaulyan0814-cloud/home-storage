/**
 * 家庭收纳管理系统 — 搜索页面（首页）
 * 核心功能：巨幅搜索框 + 实时模糊搜索
 *
 * @module search
 * @version 1.0.0
 */

// ============================================================
// 页面渲染
// ============================================================

/**
 * 渲染搜索页面
 * @param {object} [params] - 路由参数（含初始搜索词）
 */
async function renderSearchPage(params) {
    const app = $('#app');
    const initialQuery = params && params.query && params.query.q ? params.query.q : '';

    app.innerHTML = `
        <div class="page search-page">
            <div class="search-hero">
                <div class="home-title">🏠 我的家</div>
                <h1 class="search-title">🔍 查找物品</h1>
                <p class="search-subtitle">输入物品名称，立即找到它在哪个柜子里</p>
                <div class="search-input-wrapper">
                    <span class="search-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="M21 21l-4.35-4.35"/>
                        </svg>
                    </span>
                    <input
                        type="text"
                        id="search-input"
                        class="search-input"
                        placeholder="输入物品名称，例如：电池、剪刀、螺丝刀……"
                        autocomplete="off"
                        value="${escapeHtml(initialQuery)}"
                    />
                    <button id="search-clear" class="search-clear ${initialQuery ? 'visible' : ''}" title="清除">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div id="search-results" class="search-results"></div>
            <div id="search-empty" class="search-empty">
                <div class="empty-icon">📦</div>
                <p>输入关键词开始搜索</p>
                <p class="empty-hint">支持模糊搜索，如输入"电"可找到"电池"、"电线"、"电钻"</p>
            </div>
        </div>
    `;

    // 绑定事件
    const searchInput = $('#search-input');
    const searchClear = $('#search-clear');
    const searchResults = $('#search-results');
    const searchEmpty = $('#search-empty');

    // 实时搜索（防抖 150ms）
    const doSearch = debounce(async (query) => {
        if (!query || !query.trim()) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('has-results');
            searchEmpty.style.display = '';
            searchClear.classList.remove('visible');
            return;
        }

        searchClear.classList.add('visible');

        try {
            // 搜索前先拉取云端最新数据
            await cloudPullBeforeSearch();
            const results = await searchItemsFromDB(query);

            if (results.length === 0) {
                searchResults.innerHTML = `
                    <div class="search-no-results">
                        <div class="empty-icon">🔍</div>
                        <p>未找到"${escapeHtml(query)}"相关物品</p>
                        <button class="btn btn-primary" onclick="router.navigate('/add')">
                            ＋ 添加物品
                        </button>
                    </div>
                `;
                searchResults.classList.add('has-results');
                searchEmpty.style.display = 'none';
                return;
            }

            searchResults.innerHTML = results.map(({ item, score }) => {
                const room = getRoomById(item.room);
                const cabinet = getCabinetById(item.cabinet);
                const roomName = room ? room.name : item.room;
                const cabinetName = cabinet ? `${cabinet.code} ${cabinet.name}` : item.cabinet;
                const location = `${roomName} · ${cabinetName} · ${item.level}`;

                return `
                    <div class="search-result-item"
                         data-id="${item.id}"
                         onclick="showItemDetail('${item.id}')">
                        <div class="result-name">${highlightMatch(item.name, searchInput.value)}${(item.quantity || 1) > 1 ? ` <span style="color:#999;font-size:13px">×${item.quantity}</span>` : ''}</div>
                        <div class="result-location">
                            <span class="result-room">${escapeHtml(roomName)}</span>
                            <span class="result-arrow">→</span>
                            <span class="result-cabinet">${escapeHtml(cabinetName)}</span>
                            <span class="result-arrow">→</span>
                            <span class="result-level">${escapeHtml(item.level)}</span>
                            ${item.box ? `<span class="result-tag">📦 ${escapeHtml(item.box)}</span>` : ''}
                        </div>
                        <div class="result-time">${formatDateTime(item.updateTime)}</div>
                    </div>
                `;
            }).join('');

            searchResults.classList.add('has-results');
            searchEmpty.style.display = 'none';

        } catch (e) {
            console.error('搜索出错:', e);
            showToast('搜索出错，请重试', 'error');
        }
    }, 150);

    // 输入事件
    searchInput.addEventListener('input', function () {
        doSearch(this.value);
    });

    // 清除按钮
    searchClear.addEventListener('click', function () {
        searchInput.value = '';
        searchInput.focus();
        doSearch('');
    });

    // 初始查询（从 URL 参数）
    if (initialQuery) {
        doSearch(initialQuery);
    }

    // 自动聚焦
    setTimeout(() => searchInput.focus(), 100);
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 高亮匹配的文字
 * 对搜索词中每个字符在目标字符串中的位置进行高亮
 *
 * @param {string} text - 原始文本
 * @param {string} query - 搜索词
 * @returns {string} 带高亮标记的 HTML
 */
function highlightMatch(text, query) {
    if (!query || !query.trim()) return escapeHtml(text);

    const escaped = escapeHtml(text);
    const q = query.toLowerCase().trim();
    const t = text.toLowerCase();

    // 尝试找到 query 在 text 中的最佳匹配区间
    let bestStart = -1;
    let bestEnd = -1;

    // 优先找连续子串匹配
    const idx = t.indexOf(q);
    if (idx >= 0) {
        bestStart = idx;
        bestEnd = idx + q.length;
    } else {
        // 模糊匹配：找首尾字符位置
        const firstIdx = t.indexOf(q[0]);
        const lastIdx = t.lastIndexOf(q[q.length - 1]);
        if (firstIdx >= 0 && lastIdx >= firstIdx) {
            bestStart = firstIdx;
            bestEnd = lastIdx + 1;
        }
    }

    if (bestStart >= 0 && bestEnd > bestStart) {
        return (
            escaped.substring(0, bestStart) +
            '<mark class="highlight">' +
            escaped.substring(bestStart, bestEnd) +
            '</mark>' +
            escaped.substring(bestEnd)
        );
    }

    return escaped;
}

// escapeHtml 定义在 utils.js 中
