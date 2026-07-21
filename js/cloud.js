/**
 * 家庭收纳管理系统 — 云同步模块（微信云开发版）
 * 数据存储在微信云数据库，国内直连
 * @module cloud
 * @version 6.0.0
 */

const TCB_ENV = 'cloud1-d8ghte5s0d21e7f9c';
let _db = null;

async function _getDB() {
    if (_db) return _db;
    const app = cloudbase.init({ env: TCB_ENV });
    await app.auth({ persistence: 'local' }).anonymousAuthProvider().signIn();
    _db = app.database();
    return _db;
}

function getCloudConfig() { return {}; }
function saveCloudConfig(c) {}
function isCloudConfigured() { return true; }

async function cloudRead() {
    try {
        const db = await _getDB();
        const res = await db.collection('sync_data').doc('master').get();
        if (res.data && res.data.length) {
            return res.data[0].items || [];
        }
        return [];
    } catch (e) { return []; }
}

async function cloudWrite(items) {
    try {
        const db = await _getDB();
        const data = { items, updatedAt: nowISO(), version: APP_VERSION };
        await db.collection('sync_data').doc('master').set(data);
    } catch (e) {
        // 首次写入时记录不存在，需要创建
        try {
            const db = await _getDB();
            await db.collection('sync_data').add({ _id: 'master', items, updatedAt: nowISO(), version: APP_VERSION });
        } catch (e2) {
            console.warn('云同步写入失败:', e2.message);
        }
    }
}

async function cloudTest() {
    try {
        const items = await cloudRead();
        return { ok: true, itemCount: items.length, message: '连接成功！云端有 ' + items.length + ' 件物品' };
    } catch (e) { return { ok: false, itemCount: 0, message: e.message }; }
}

async function cloudSync() {
    const cloudItems = await cloudRead();
    const localItems = await getAllItems();
    const merged = {};
    for (const it of localItems) merged[it.id] = it;
    for (const it of cloudItems) {
        if (!merged[it.id] || new Date(it.updateTime) > new Date(merged[it.id].updateTime))
            merged[it.id] = it;
    }
    const list = Object.values(merged);
    let dl = 0;
    for (const it of list) {
        const loc = await getItem(it.id);
        if (!loc || new Date(it.updateTime) > new Date(loc.updateTime)) {
            await _putItemDirect(it); dl++;
        }
    }
    await cloudWrite(list);
    return { uploaded: list.length, downloaded: dl, message: '同步完成！云端 ' + list.length + ' 件（更新 ' + dl + ' 件）' };
}

async function cloudPushAfterChange() {
    try { await cloudWrite(await getAllItems()); } catch (e) { console.warn('自动同步失败:', e.message); }
}

async function cloudPullBeforeSearch() {
    try {
        const cloudItems = await cloudRead();
        if (!cloudItems.length) return;
        const locals = await getAllItems(), map = {};
        for (const it of locals) map[it.id] = it;
        for (const it of cloudItems) {
            if (!map[it.id] || new Date(it.updateTime) > new Date(map[it.id].updateTime))
                await _putItemDirect(it);
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
