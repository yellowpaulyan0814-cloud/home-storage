/**
 * 家庭收纳管理系统 — 云同步模块（Supabase 版）
 * 免费 PostgreSQL 后端，浏览器原生 REST API，国内可用
 *
 * @module cloud
 * @version 4.0.0
 */

// ============================================================
// 配置管理
// ============================================================

function getCloudConfig() {
    try {
        const raw = localStorage.getItem('cloud_config');
        return raw ? JSON.parse(raw) : { url: '', key: '' };
    } catch (e) {
        return { url: '', key: '' };
    }
}

function saveCloudConfig(config) {
    localStorage.setItem('cloud_config', JSON.stringify(config));
}

function isCloudConfigured() {
    const cfg = getCloudConfig();
    return !!(cfg.url && cfg.key);
}

function _headers() {
    const cfg = getCloudConfig();
    return {
        'apikey': cfg.key,
        'Authorization': `Bearer ${cfg.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
}

function _restUrl() {
    const cfg = getCloudConfig();
    return `${cfg.url}/rest/v1/home_storage`;
}

// ============================================================
// 数据操作
// ============================================================

async function cloudRead() {
    const cfg = getCloudConfig();
    if (!cfg.url || !cfg.key) throw new Error('未配置 Supabase');

    const resp = await fetch(`${_restUrl()}?select=items&id=eq.1`, {
        headers: { ..._headers(), 'Accept': 'application/json' }
    });

    if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) throw new Error('URL 或 Key 错误');
        return []; // 表可能还不存在
    }

    const data = await resp.json();
    if (!data.length) return [];
    return data[0].items || [];
}

async function cloudWrite(items) {
    const cfg = getCloudConfig();
    if (!cfg.url || !cfg.key) throw new Error('未配置 Supabase');

    const body = JSON.stringify({
        id: 1,
        items: items,
        updated_at: nowISO()
    });

    // Upsert: insert if not exists, update if exists
    const resp = await fetch(`${_restUrl()}?id=eq.1`, {
        method: 'PATCH',
        headers: _headers(),
        body: body
    });

    if (!resp.ok) {
        // 可能记录还不存在，尝试插入
        const insertResp = await fetch(_restUrl(), {
            method: 'POST',
            headers: { ..._headers(), 'Prefer': 'return=minimal' },
            body: body
        });
        if (!insertResp.ok) {
            if (insertResp.status === 401) throw new Error('Key 无效');
            throw new Error(`上传失败 (${insertResp.status})`);
        }
    }
}

async function cloudTest() {
    try {
        const items = await cloudRead();
        return { ok: true, itemCount: items.length, message: `连接成功！云端有 ${items.length} 件物品` };
    } catch (e) {
        return { ok: false, itemCount: 0, message: e.message };
    }
}

// ============================================================
// 同步逻辑
// ============================================================

async function cloudSync() {
    if (!isCloudConfigured()) throw new Error('请先配置 Supabase');

    await _ensureTable(); // 确保表和初始数据存在

    const cloudItems = await cloudRead();
    const localItems = await getAllItems();

    const merged = {};
    for (const item of localItems) merged[item.id] = item;
    for (const item of cloudItems) {
        if (!merged[item.id] || new Date(item.updateTime) > new Date(merged[item.id].updateTime)) {
            merged[item.id] = item;
        }
    }

    const mergedList = Object.values(merged);
    let downloaded = 0;

    for (const item of mergedList) {
        const local = await getItem(item.id);
        if (!local || new Date(item.updateTime) > new Date(local.updateTime)) {
            await _putItemDirect(item);
            downloaded++;
        }
    }

    await cloudWrite(mergedList);
    return {
        uploaded: mergedList.length,
        downloaded,
        message: `同步完成！云端共 ${mergedList.length} 件（更新 ${downloaded} 件）`
    };
}

async function _ensureTable() {
    // 尝试创建初始数据记录
    try {
        const items = await cloudRead();
        if (items.length === 0) {
            await cloudWrite([]);
        }
    } catch (e) { /* 静默 */ }
}

async function cloudPushAfterChange() {
    if (!isCloudConfigured()) return;
    try {
        await cloudWrite(await getAllItems());
    } catch (e) {
        console.warn('自动同步失败:', e.message);
    }
}

async function cloudPullBeforeSearch() {
    if (!isCloudConfigured()) return;
    try {
        const cloudItems = await cloudRead();
        if (!cloudItems.length) return;
        const locals = await getAllItems();
        const map = {};
        for (const it of locals) map[it.id] = it;
        for (const it of cloudItems) {
            if (!map[it.id] || new Date(it.updateTime) > new Date(map[it.id].updateTime)) {
                await _putItemDirect(it);
            }
        }
    } catch (e) {
        console.warn('同步失败:', e.message);
    }
}

async function cloudPullOnStartup() {
    return cloudPullBeforeSearch();
}

function _putItemDirect(item) {
    return new Promise((resolve, reject) => {
        openDB().then(db => {
            const tx = db.transaction(['items'], 'readwrite');
            const store = tx.objectStore('items');
            store.put(item);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    });
}
