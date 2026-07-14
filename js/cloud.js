/**
 * 家庭收纳管理系统 — 云同步模块（Gitee API 版）
 * 用你自己的码云仓库做数据中转，无需额外注册任何云服务
 *
 * @module cloud
 * @version 5.0.0
 */

const GITEE_API = 'https://gitee.com/api/v5';
const SYNC_FILE = 'data/home-storage-sync.json';

// ============================================================
// 配置管理
// ============================================================

function getCloudConfig() {
    try {
        const raw = localStorage.getItem('cloud_config');
        return raw ? JSON.parse(raw) : { owner: 'yellowpaulyan', repo: 'home-storage', token: '' };
    } catch (e) {
        return { owner: 'yellowpaulyan', repo: 'home-storage', token: '' };
    }
}

function saveCloudConfig(config) {
    localStorage.setItem('cloud_config', JSON.stringify(config));
}

function isCloudConfigured() {
    const cfg = getCloudConfig();
    return !!(cfg.owner && cfg.repo && cfg.token);
}

function _syncUrl() {
    const cfg = getCloudConfig();
    return `${GITEE_API}/repos/${cfg.owner}/${cfg.repo}/contents/${SYNC_FILE}`;
}

function _authHeader() {
    // 不需要 token 也能读公开仓库
    const cfg = getCloudConfig();
    return cfg.token ? { 'Authorization': `Bearer ${cfg.token}` } : {};
}

// ============================================================
// 数据操作
// ============================================================

async function cloudRead() {
    const cfg = getCloudConfig();
    if (!cfg.owner || !cfg.repo) throw new Error('未配置仓库');

    const resp = await fetch(_syncUrl(), { headers: _authHeader() });

    if (resp.status === 404) return []; // 文件还不存在
    if (!resp.ok) throw new Error(`读取失败 (${resp.status})`);

    const data = await resp.json();
    // Gitee API 返回 base64 编码的内容
    if (data.content) {
        const decoded = atob(data.content.replace(/\n/g, ''));
        const parsed = JSON.parse(decoded);
        return parsed.items || [];
    }
    return [];
}

async function cloudWrite(items) {
    const cfg = getCloudConfig();
    if (!cfg.token) throw new Error('请设置 Gitee 令牌');

    const content = JSON.stringify({ items, updatedAt: nowISO(), version: APP_VERSION }, null, 2);
    const encoded = btoa(unescape(encodeURIComponent(content)));

    // 先获取当前文件 sha（更新时需要）
    let sha = '';
    try {
        const resp = await fetch(_syncUrl(), { headers: _authHeader() });
        if (resp.ok) {
            const data = await resp.json();
            sha = data.sha || '';
        }
    } catch (e) { /* 文件不存在，sha 为空 */ }

    const body = JSON.stringify({
        content: encoded,
        message: `家庭收纳自动同步 - ${new Date().toLocaleString('zh-CN')}`,
        ...(sha ? { sha } : {})
    });

    const resp = await fetch(_syncUrl(), {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${cfg.token}`,
            'Content-Type': 'application/json'
        },
        body
    });

    if (!resp.ok) {
        if (resp.status === 401) throw new Error('令牌无效，请重新设置');
        throw new Error(`上传失败 (${resp.status})`);
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
    if (!isCloudConfigured()) throw new Error('请先设置令牌');

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
    return { uploaded: mergedList.length, downloaded, message: `同步完成！云端 ${mergedList.length} 件（更新 ${downloaded} 件）` };
}

async function cloudPushAfterChange() {
    if (!isCloudConfigured()) return;
    try { await cloudWrite(await getAllItems()); } catch (e) { console.warn('自动同步失败:', e.message); }
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
    } catch (e) { console.warn('同步失败:', e.message); }
}

async function cloudPullOnStartup() { return cloudPullBeforeSearch(); }

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
