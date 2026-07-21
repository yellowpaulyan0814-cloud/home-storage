/**
 * 家庭收纳管理系统 — 设置页面
 * 数据导入/导出、清空数据、统计信息、版本信息
 *
 * @module settings
 * @version 1.0.0
 */

// ============================================================
// 页面渲染
// ============================================================

/**
 * 渲染设置页面
 */
async function renderSettingsPage() {
    const app = $('#app');

    app.innerHTML = `
        <div class="page settings-page">
            <div class="page-header">
                <h1>⚙️ 设置</h1>
            </div>

            <div id="settings-content" class="settings-content">
                <div class="settings-loading">加载中...</div>
            </div>
        </div>
    `;

    const content = $('#settings-content');

    try {
        const stats = await getStats();
        renderSettingsContent(content, stats);
    } catch (e) {
        console.error('加载统计数据失败:', e);
        content.innerHTML = '<div class="settings-error">加载失败，请刷新页面</div>';
    }
}

/**
 * 渲染设置页面内容
 */
function renderSettingsContent(container, stats) {
    const rooms = getAllRooms();

    container.innerHTML = `
        <!-- 数据统计 -->
        <div class="settings-section">
            <h2 class="settings-section-title">📊 数据统计</h2>
            <div class="stats-grid">
                <div class="stat-card stat-total">
                    <div class="stat-card-value">${stats.total}</div>
                    <div class="stat-card-label">总物品数</div>
                </div>
                ${rooms.map(room => {
                    const count = stats.byRoom[room.id] || 0;
                    return `
                        <div class="stat-card">
                            <div class="stat-card-icon">${room.icon}</div>
                            <div class="stat-card-value">${count}</div>
                            <div class="stat-card-label">${room.name}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <!-- 最近更新 -->
        ${stats.recentUpdated.length > 0 ? `
            <div class="settings-section">
                <h2 class="settings-section-title">🕐 最近更新</h2>
                <div class="recent-list">
                    ${stats.recentUpdated.map(item => {
                        const room = getRoomById(item.room);
                        const cabinet = getCabinetById(item.cabinet);
                        return `
                            <div class="recent-item" onclick="showItemDetail('${item.id}')">
                                <span class="recent-name">${escapeHtml(item.name)}</span>
                                <span class="recent-location">${room ? room.name : ''} · ${cabinet ? cabinet.code + ' ' + cabinet.name : ''} · ${item.level}</span>
                                <span class="recent-time">${formatDateTime(item.updateTime)}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        ` : ''}

        <!-- 数据管理 -->
        <div class="settings-section">
            <h2 class="settings-section-title">💾 数据管理</h2>

            <div class="settings-action">
                <div class="settings-action-info">
                    <div class="settings-action-title">导出数据</div>
                    <div class="settings-action-desc">导出为 JSON（完整备份）或 CSV（Excel 可编辑）</div>
                </div>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-primary" id="btn-export-json">📥 JSON</button>
                    <button class="btn btn-secondary" id="btn-export-csv">📊 CSV</button>
                </div>
            </div>

            <div class="settings-action">
                <div class="settings-action-info">
                    <div class="settings-action-title">导入数据</div>
                    <div class="settings-action-desc">支持 JSON 或 CSV 文件（CSV 表头：物品名称,数量,房间,柜子编号,柜子名称,层数,收纳盒,备注）</div>
                </div>
                <button class="btn btn-secondary" id="btn-import">
                    📤 导入文件
                </button>
                <input type="file" id="import-file-input" accept=".json,.csv" style="display:none" />
            </div>

        <!-- 云同步 -->
        <div class="settings-section">
            <h2 class="settings-section-title">☁️ 多设备实时共享</h2>
            <p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:12px">
                全家自动同步，增删改即时生效。无需任何设置。
            </p>
            <div class="settings-action">
                <button class="btn btn-primary" id="btn-cloud-sync">🔄 立即同步</button>
                <button class="btn btn-secondary" id="btn-cloud-test">🔍 检查云端</button>
            </div>
            <div id="cloud-status" style="font-size:12px;color:var(--color-text-secondary);margin-top:4px"></div>
        </div>

            <div class="settings-action settings-action-danger">
                <div class="settings-action-info">
                    <div class="settings-action-title">删除全部数据</div>
                    <div class="settings-action-desc">⚠️ 永久删除所有物品数据，此操作不可恢复</div>
                </div>
                <button class="btn btn-danger" id="btn-clear-all">
                    🗑️ 清空数据
                </button>
            </div>
        </div>

        <!-- 关于 -->
        <div class="settings-section">
            <h2 class="settings-section-title">ℹ️ 关于</h2>
            <div class="about-info">
                <div class="about-row">
                    <span class="about-label">软件名称</span>
                    <span class="about-value">${APP_NAME}</span>
                </div>
                <div class="about-row">
                    <span class="about-label">版本</span>
                    <span class="about-value">v${APP_VERSION}</span>
                </div>
                <div class="about-row">
                    <span class="about-label">数据存储</span>
                    <span class="about-value">IndexedDB（浏览器本地）</span>
                </div>
                <div class="about-row">
                    <span class="about-label">运行方式</span>
                    <span class="about-value">完全离线 · 双击即用</span>
                </div>
            </div>
        </div>
    `;

    // 绑定事件
    bindSettingsEvents();
}

/**
 * 绑定设置页面事件
 */
function bindSettingsEvents() {
    // 导出 JSON
    const btnExportJSON = $('#btn-export-json');
    if (btnExportJSON) btnExportJSON.addEventListener('click', async () => {
        try {
            const json = await exportData();
            const ds = new Date().toISOString().slice(0,10).replace(/-/g,'');
            downloadFile(json, `家庭收纳备份-${ds}.json`, 'application/json');
            showToast('JSON 导出成功', 'success');
        } catch (e) { showToast('导出失败', 'error'); }
    });

    // 导出 CSV
    const btnExportCSV = $('#btn-export-csv');
    if (btnExportCSV) btnExportCSV.addEventListener('click', async () => {
        try {
            const csv = await exportCSV();
            const ds = new Date().toISOString().slice(0,10).replace(/-/g,'');
            // BOM for Excel UTF-8 recognition
            const bom = '﻿';
            downloadFile(bom + csv, `家庭收纳物品-${ds}.csv`, 'text/csv;charset=utf-8');
            showToast('CSV 导出成功（可用 Excel 编辑后导入）', 'success');
        } catch (e) { showToast('导出失败', 'error'); }
    });

    // 导入
    const btnImport = $('#btn-import');
    const fileInput = $('#import-file-input');
    if (btnImport && fileInput) {
        btnImport.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async function () {
            const file = this.files[0];
            if (!file) return;
            try {
                const content = await readFileAsText(file);
                const result = await importData(content, file.name);
                showToast(`导入完成：新增 ${result.added} 件，跳过 ${result.skipped} 件`, 'success', 4000);
                const stats = await getStats();
                renderSettingsContent($('#settings-content'), stats);
            } catch (e) { showToast('导入失败：' + e.message, 'error', 4000); }
            fileInput.value = '';
        });
    }

    // ---- 云同步 (GitHub Gist, Token已内置) ----
    const btnCloudTest = $('#btn-cloud-test');
    const btnCloudSync = $('#btn-cloud-sync');
    const cloudStatus  = $('#cloud-status');

    function setCloudStatus(msg, ok) {
        if (cloudStatus) {
            cloudStatus.textContent = msg;
            cloudStatus.style.color = ok ? 'var(--color-success)' : 'var(--color-danger)';
        }
    }

    if (btnCloudTest) btnCloudTest.addEventListener('click', async () => {
        setCloudStatus('查询中...', true);
        try {
            const result = await cloudTest();
            setCloudStatus(result.message, result.ok);
        } catch (e) { setCloudStatus(e.message, false); }
    });

    if (btnCloudSync) btnCloudSync.addEventListener('click', async () => {
        setCloudStatus('同步中...', true);
        try {
            const result = await cloudSync();
            setCloudStatus(result.message, true);
            showToast(result.message, 'success');
            const stats = await getStats();
            renderSettingsContent($('#settings-content'), stats);
        } catch (e) {
            setCloudStatus(e.message, false);
            showToast('同步失败: ' + e.message, 'error');
        }
    });

    // 清空数据
    const btnClear = $('#btn-clear-all');
    if (btnClear) {
        btnClear.addEventListener('click', async function () {
            const confirmed = await confirmDialog(
                '此操作将永久删除所有物品数据，且不可恢复。\n\n建议先导出备份再进行此操作。',
                '⚠️ 确认清空全部数据'
            );
            if (!confirmed) return;

            // 二次确认
            const doubleConfirm = await confirmDialog(
                '再次确认：真的要删除全部数据吗？',
                '⚠️⚠️ 最终确认'
            );
            if (!doubleConfirm) return;

            try {
                await clearAllData();
                showToast('所有数据已清空', 'success');
                // 刷新统计
                const stats = await getStats();
                const container = $('#settings-content');
                renderSettingsContent(container, stats);
            } catch (e) {
                console.error('清空失败:', e);
                showToast('清空失败，请重试', 'error');
            }
        });
    }
}
