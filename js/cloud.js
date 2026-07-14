/**
 * 家庭收纳管理系统 — 云同步模块（GitHub Gist 版）
 * 托管+数据都在 GitHub，一个平台全搞定
 */
const GIST_API = 'https://api.github.com/gists';
const GIST_ID = '51e0a995c957ca06fe2daf2f2c526fe8';
const GIST_FILE = 'home-storage-data.json';

function getCloudConfig() {
    try {
        const raw = localStorage.getItem('cloud_config');
        return raw ? JSON.parse(raw) : { token: '' };
    } catch (e) { return { token: '' }; }
}
function saveCloudConfig(c) { localStorage.setItem('cloud_config', JSON.stringify(c)); }
function isCloudConfigured() { return !!getCloudConfig().token; }

function _auth() { const t = getCloudConfig().token; return t ? {'Authorization':'Bearer '+t} : {}; }

async function cloudRead() {
    const resp = await fetch(`${GIST_API}/${GIST_ID}`, { headers: _auth() });
    if (!resp.ok) throw new Error('读取失败 ('+resp.status+')');
    const gist = await resp.json();
    const file = gist.files && gist.files[GIST_FILE];
    if (!file || !file.content) return [];
    try { const d = JSON.parse(file.content); return d.items || []; } catch(e) { return []; }
}

async function cloudWrite(items) {
    const t = getCloudConfig().token;
    if (!t) throw new Error('未设置令牌');
    const content = JSON.stringify({items, updatedAt: new Date().toISOString(), version: '2.0.0'});
    const resp = await fetch(`${GIST_API}/${GIST_ID}`, {
        method: 'PATCH',
        headers: {'Authorization':'Bearer '+t, 'Content-Type':'application/json'},
        body: JSON.stringify({files: {[GIST_FILE]: {content}}})
    });
    if (!resp.ok) { if (resp.status===401) throw new Error('令牌无效'); throw new Error('上传失败 ('+resp.status+')'); }
}

async function cloudTest() {
    try { const items = await cloudRead(); return {ok:true, itemCount:items.length, message:'连接成功！云端有 '+items.length+' 件物品'}; }
    catch(e) { return {ok:false, itemCount:0, message:e.message}; }
}

async function cloudSync() {
    if (!isCloudConfigured()) throw new Error('请先设置令牌');
    const cloudItems = await cloudRead(), localItems = await getAllItems();
    const merged = {};
    for (const it of localItems) merged[it.id] = it;
    for (const it of cloudItems) { if (!merged[it.id] || new Date(it.updateTime) > new Date(merged[it.id].updateTime)) merged[it.id] = it; }
    const list = Object.values(merged);
    let dl = 0;
    for (const it of list) { const loc = await getItem(it.id); if (!loc || new Date(it.updateTime) > new Date(loc.updateTime)) { await _putItemDirect(it); dl++; } }
    await cloudWrite(list);
    return {uploaded:list.length, downloaded:dl, message:'同步完成！云端 '+list.length+' 件（更新 '+dl+' 件）'};
}

async function cloudPushAfterChange() { if (!isCloudConfigured()) return; try { await cloudWrite(await getAllItems()); } catch(e) { console.warn('自动同步失败:', e.message); } }

async function cloudPullBeforeSearch() {
    if (!isCloudConfigured()) return;
    try {
        const cloudItems = await cloudRead(); if (!cloudItems.length) return;
        const locals = await getAllItems(), map = {};
        for (const it of locals) map[it.id] = it;
        for (const it of cloudItems) { if (!map[it.id] || new Date(it.updateTime) > new Date(map[it.id].updateTime)) await _putItemDirect(it); }
    } catch(e) { console.warn('同步失败:', e.message); }
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
