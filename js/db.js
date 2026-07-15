/**
 * 家庭收纳管理系统 — 数据库层
 * 基于 IndexedDB 的本地持久化存储
 * 所有数据库操作通过此模块进行，外部不直接操作 IndexedDB
 *
 * @module db
 * @version 1.0.0
 */

const DB_NAME = 'HomeStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'items';

let dbInstance = null;

/**
 * 打开/初始化数据库
 * 如果数据库不存在则自动创建
 *
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            return resolve(dbInstance);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // 数据库首次创建或版本升级时触发
        request.onupgradeneeded = function (event) {
            const db = event.target.result;

            // 如果 object store 不存在则创建
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

                // 创建索引，加速搜索
                store.createIndex('name', 'name', { unique: false });
                store.createIndex('room', 'room', { unique: false });
                store.createIndex('cabinet', 'cabinet', { unique: false });
                store.createIndex('cabinetLevel', ['cabinet', 'level'], { unique: false });
                store.createIndex('createTime', 'createTime', { unique: false });
                store.createIndex('updateTime', 'updateTime', { unique: false });
            }
        };

        request.onsuccess = function (event) {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onerror = function (event) {
            console.error('数据库打开失败:', event.target.error);
            reject(event.target.error);
        };

        // 数据库被用户清除或版本不兼容
        request.onblocked = function () {
            console.warn('数据库被阻塞，请关闭其他标签页后刷新');
            reject(new Error('数据库被阻塞'));
        };
    });
}

/**
 * 获取事务
 * @param {IDBDatabase} db
 * @param {string} [mode='readonly']
 * @returns {IDBObjectStore}
 */
function getStore(db, mode) {
    mode = mode || 'readonly';
    const transaction = db.transaction([STORE_NAME], mode);
    return transaction.objectStore(STORE_NAME);
}

// ============================================================
// CRUD 操作
// ============================================================

/**
 * 新增物品
 * @param {object} data - { name, room, cabinet, level, quantity?, box?, remark? }
 * @returns {Promise<object>} 完整的物品对象（含自动生成的字段）
 */
async function addItem(data) {
    const db = await openDB();
    const now = nowISO();

    const item = {
        id: generateId(),
        name: data.name.trim(),
        room: data.room,
        cabinet: data.cabinet,
        level: data.level,
        quantity: Math.max(1, parseInt(data.quantity) || 1),
        box: (data.box || '').trim(),
        remark: (data.remark || '').trim(),
        createTime: now,
        updateTime: now
    };

    return new Promise((resolve, reject) => {
        const store = getStore(db, 'readwrite');
        const request = store.add(item);

        request.onsuccess = function () {
            resolve(item);
            setTimeout(() => cloudPushAfterChange(), 0);
        };

        request.onerror = function (event) {
            console.error('添加物品失败:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * 根据 ID 获取单个物品
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function getItem(id) {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const store = getStore(db);
        const request = store.get(id);

        request.onsuccess = function () {
            resolve(request.result || null);
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

/**
 * 更新物品
 * @param {string} id - 物品 ID
 * @param {object} data - 要更新的字段（不含 id/createTime）
 * @returns {Promise<object>} 更新后的完整物品
 */
async function updateItem(id, data) {
    const db = await openDB();

    // 先获取原物品
    const existing = await getItem(id);
    if (!existing) {
        throw new Error('物品不存在: ' + id);
    }

    const updated = {
        ...existing,
        name: data.name !== undefined ? data.name.trim() : existing.name,
        room: data.room !== undefined ? data.room : existing.room,
        cabinet: data.cabinet !== undefined ? data.cabinet : existing.cabinet,
        level: data.level !== undefined ? data.level : existing.level,
        quantity: data.quantity !== undefined ? Math.max(1, parseInt(data.quantity) || 1) : (existing.quantity || 1),
        box: data.box !== undefined ? data.box.trim() : existing.box,
        remark: data.remark !== undefined ? data.remark.trim() : existing.remark,
        updateTime: nowISO()
    };

    return new Promise((resolve, reject) => {
        const store = getStore(db, 'readwrite');
        const request = store.put(updated);

        request.onsuccess = function () {
            resolve(updated);
            setTimeout(() => cloudPushAfterChange(), 0);
        };

        request.onerror = function (event) {
            console.error('更新物品失败:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * 删除物品（或减少数量）
 * @param {string} id
 * @param {number} [deleteQty] 要删除的数量，不传则全部删除
 * @returns {Promise<object>} { deleted: true } 或 { remaining: N }
 */
async function deleteItem(id, deleteQty) {
    const existing = await getItem(id);
    if (!existing) throw new Error('物品不存在: ' + id);

    const currentQty = existing.quantity || 1;
    const dq = deleteQty || currentQty;

    if (dq >= currentQty) {
        // 全部删除
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const store = getStore(db, 'readwrite');
            const request = store.delete(id);
            request.onsuccess = () => { resolve({ deleted: true }); setTimeout(() => cloudPushAfterChange(), 0); };
            request.onerror = (e) => reject(e.target.error);
        });
    } else {
        // 部分删除，减少数量
        await updateItem(id, { quantity: currentQty - dq });
        return { remaining: currentQty - dq };
    }
}

/**
 * 移动物品到另一个柜子
 * @param {string} id - 原物品ID
 * @param {string} targetRoom - 目标房间
 * @param {string} targetCabinet - 目标柜子
 * @param {string} targetLevel - 目标层
 * @param {number} [moveQty] - 移动数量，不传则全部移动
 * @returns {Promise<object>} 新物品（如果是部分移动）或更新后的原物品
 */
async function moveItem(id, targetRoom, targetCabinet, targetLevel, moveQty) {
    const existing = await getItem(id);
    if (!existing) throw new Error('物品不存在: ' + id);

    const currentQty = existing.quantity || 1;
    const mq = Math.min(moveQty || currentQty, currentQty);

    // 检查目标位置是否已有同名物品
    const allItems = await getAllItems();
    const sameItem = allItems.find(it =>
        it.id !== id &&
        it.name === existing.name &&
        it.room === targetRoom &&
        it.cabinet === targetCabinet &&
        it.level === targetLevel
    );

    if (mq >= currentQty) {
        // 全部移动
        if (sameItem) {
            // 合并到已有物品
            await updateItem(sameItem.id, { quantity: (sameItem.quantity || 1) + mq });
            await deleteItem(id);
            return sameItem;
        } else {
            return await updateItem(id, { room: targetRoom, cabinet: targetCabinet, level: targetLevel });
        }
    } else {
        // 部分移动
        await updateItem(id, { quantity: currentQty - mq });
        if (sameItem) {
            // 合并到已有物品
            await updateItem(sameItem.id, { quantity: (sameItem.quantity || 1) + mq });
            return sameItem;
        } else {
            return await addItem({
                name: existing.name, room: targetRoom, cabinet: targetCabinet, level: targetLevel,
                quantity: mq, box: existing.box, remark: existing.remark
            });
        }
    }
}

// ============================================================
// 查询操作
// ============================================================

/**
 * 获取所有物品
 * @returns {Promise<Array>}
 */
async function getAllItems() {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const store = getStore(db);
        const request = store.getAll();

        request.onsuccess = function () {
            const items = request.result || [];
            // 按更新时间倒序排列
            items.sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime));
            resolve(items);
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

/**
 * 搜索物品（模糊搜索）
 * 先获取全部物品，在内存中执行模糊匹配
 * 数据量小（家庭场景通常几百条）时性能完全足够
 *
 * @param {string} query - 搜索关键词
 * @returns {Promise<Array>} 匹配结果数组 [{item, score}]
 */
async function searchItemsFromDB(query) {
    if (!query || !query.trim()) {
        return [];
    }

    const allItems = await getAllItems();
    return searchItems(query, allItems);
}

/**
 * 获取指定柜子指定层的所有物品
 * @param {string} cabinet - 柜子编号
 * @param {string} level - 层编号
 * @returns {Promise<Array>}
 */
async function getItemsByCabinetLevel(cabinet, level) {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const store = getStore(db);
        const index = store.index('cabinetLevel');
        const range = IDBKeyRange.only([cabinet, level]);
        const request = index.getAll(range);

        request.onsuccess = function () {
            const items = request.result || [];
            items.sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime));
            resolve(items);
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

/**
 * 获取指定柜子的所有物品（所有层）
 * @param {string} cabinet - 柜子编号
 * @returns {Promise<Array>}
 */
async function getItemsByCabinet(cabinet) {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const store = getStore(db);
        const index = store.index('cabinet');
        const request = index.getAll(cabinet);

        request.onsuccess = function () {
            const items = request.result || [];
            items.sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime));
            resolve(items);
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

/**
 * 获取指定房间的所有物品
 * @param {string} room - 房间 ID
 * @returns {Promise<Array>}
 */
async function getItemsByRoom(room) {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const store = getStore(db);
        const index = store.index('room');
        const request = index.getAll(room);

        request.onsuccess = function () {
            const items = request.result || [];
            items.sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime));
            resolve(items);
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

// ============================================================
// 导入导出
// ============================================================

/**
 * 导出所有数据为 JSON 字符串
 * @returns {Promise<string>}
 */
async function exportData() {
    const items = await getAllItems();
    const exportObj = {
        version: APP_VERSION,
        appName: APP_NAME,
        exportTime: nowISO(),
        totalItems: items.length,
        items: items
    };
    return JSON.stringify(exportObj, null, 2);
}

/**
 * 导入数据
 * 注意：不会覆盖已有数据，只追加新数据（根据 ID 判断）
 *
 * @param {string} jsonStr - JSON 字符串
 * @returns {Promise<object>} { added: number, skipped: number, total: number }
 */
async function importData(jsonStr) {
    let data;
    try {
        data = JSON.parse(jsonStr);
    } catch (e) {
        throw new Error('JSON 格式无效，请检查文件内容');
    }

    if (!data.items || !Array.isArray(data.items)) {
        throw new Error('数据格式不正确：缺少 items 数组');
    }

    const db = await openDB();
    let added = 0;
    let skipped = 0;

    for (const item of data.items) {
        if (!item.id || !item.name || !item.room || !item.cabinet) {
            skipped++;
            continue;
        }

        // 检查是否已存在
        const existing = await getItem(item.id);
        if (existing) {
            skipped++;
            continue;
        }

        // 确保时间字段和数量字段存在
        const now = nowISO();
        const newItem = {
            ...item,
            quantity: item.quantity || 1,
            createTime: item.createTime || now,
            updateTime: item.updateTime || now
        };

        await new Promise((resolve, reject) => {
            const store = getStore(db, 'readwrite');
            const request = store.put(newItem);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });

        added++;
    }

    return { added, skipped, total: data.items.length };
}

// ============================================================
// 数据管理
// ============================================================

/**
 * 删除全部数据
 * @returns {Promise<void>}
 */
async function clearAllData() {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const store = getStore(db, 'readwrite');
        const request = store.clear();

        request.onsuccess = function () {
            resolve();
            setTimeout(() => cloudPushAfterChange(), 0);
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

// ============================================================
// 统计
// ============================================================

/**
 * 获取数据统计信息
 * @returns {Promise<object>}
 */
async function getStats() {
    const allItems = await getAllItems();

    const stats = {
        total: allItems.length,
        byRoom: {},      // { Y: 5, K: 30, ... }
        byCabinet: {},   // { K01: 8, K02: 3, ... }
        recentUpdated: [] // 最近更新的 5 条
    };

    // 按房间统计
    for (const roomId of Object.keys(ROOMS)) {
        stats.byRoom[roomId] = 0;
    }

    for (const item of allItems) {
        // 房间统计
        if (stats.byRoom[item.room] !== undefined) {
            stats.byRoom[item.room]++;
        } else {
            stats.byRoom[item.room] = 1;
        }

        // 柜子统计
        if (!stats.byCabinet[item.cabinet]) {
            stats.byCabinet[item.cabinet] = 0;
        }
        stats.byCabinet[item.cabinet]++;
    }

    // 最近更新
    stats.recentUpdated = allItems.slice(0, 5);

    return stats;
}
