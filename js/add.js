/**
 * 家庭收纳管理系统 — 新增/编辑物品页面
 * 支持两种柜子选择方式：
 *   1. 列表选择：通过下拉菜单逐级选择
 *   2. 地图选择：显示房间柜子 SVG，直接点击柜门
 *
 * @module add
 * @version 2.0.0
 */

// ============================================================
// 页面渲染
// ============================================================

async function renderAddPage(params) {
    const app = $('#app');
    const isEdit = !!(params && params.id);
    let existingItem = null;

    if (isEdit) {
        try {
            existingItem = await getItem(params.id);
            if (!existingItem) {
                showToast('物品不存在', 'error');
                router.navigate('/search');
                return;
            }
        } catch (e) {
            showToast('加载物品失败', 'error');
            router.navigate('/search');
            return;
        }
    }

    const rooms = getAllRooms();
    const selectedRoom = existingItem ? existingItem.room : (params && params.room) || 'K';
    // 默认柜子选择模式
    const defaultMode = existingItem ? 'list' : 'list';

    app.innerHTML = `
        <div class="page add-page">
            <div class="page-header">
                <button class="btn-back" onclick="history.back()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>
                <h1>${isEdit ? '✏️ 编辑物品' : '➕ 新增物品'}</h1>
                <div style="width:32px"></div>
            </div>

            <form id="item-form" class="item-form" autocomplete="off">
                <!-- 物品名称（必填） -->
                <div class="form-group">
                    <label class="form-label" for="item-name">
                        物品名称 <span class="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="item-name"
                        class="form-input"
                        placeholder="例如：电池、创可贴、螺丝刀……"
                        value="${existingItem ? escapeHtml(existingItem.name) : ''}"
                        required
                        autofocus
                    />
                </div>

                <!-- 数量 -->
                <div class="form-group">
                    <label class="form-label" for="item-quantity">数量</label>
                    <div class="quantity-input-row">
                        <button type="button" class="qty-btn" id="qty-minus">−</button>
                        <input type="number" id="item-quantity" class="form-input qty-input"
                               value="${existingItem ? (existingItem.quantity || 1) : 1}"
                               min="1" max="999" />
                        <button type="button" class="qty-btn" id="qty-plus">+</button>
                    </div>
                </div>

                <!-- 房间选择 -->
                <div class="form-group">
                    <label class="form-label" for="item-room">
                        房间 <span class="required">*</span>
                        ${isEdit ? '<span style="font-size:11px;color:#999">（只读，移动请用📦移动功能）</span>' : ''}
                    </label>
                    <select id="item-room" class="form-select" required ${isEdit ? 'disabled' : ''}>
                        <option value="">请选择房间</option>
                        ${rooms.map(r => `
                            <option value="${r.id}" ${selectedRoom === r.id ? 'selected' : ''}>
                                ${r.icon} ${r.name}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <!-- 柜子选择方式切换（编辑模式不显示） -->
                <div class="form-group" id="cabinet-mode-group" ${isEdit ? 'style="display:none"' : ''}>
                    <label class="form-label">柜子选择方式</label>
                    <div class="mode-toggle">
                        <button type="button" class="mode-btn mode-active" data-mode="list" id="mode-list-btn">
                            📋 列表选择
                        </button>
                        <button type="button" class="mode-btn" data-mode="map" id="mode-map-btn">
                            🗄️ 地图点选
                        </button>
                    </div>
                </div>

                <!-- 列表模式：柜子下拉 -->
                <div class="form-group" id="cabinet-list-group">
                    <label class="form-label" for="item-cabinet">
                        柜子 <span class="required">*</span>
                    </label>
                    <select id="item-cabinet" class="form-select" required ${isEdit ? 'disabled' : ''}>
                        <option value="">请先选择房间</option>
                    </select>
                </div>

                <!-- 地图模式：柜子 SVG -->
                <div class="form-group" id="cabinet-map-group" style="display:none;">
                    <label class="form-label">
                        点击柜门选择 <span class="required">*</span>
                        <span id="map-selected-label" class="map-selected-label"></span>
                    </label>
                    <div id="cabinet-mini-map" class="cabinet-mini-map">
                        <div class="mini-map-placeholder">请先选择房间</div>
                    </div>
                    <!-- 隐藏的柜子值 -->
                    <input type="hidden" id="item-cabinet-map" value="" />
                </div>

                <!-- 层数选择 -->
                <div class="form-group">
                    <label class="form-label" for="item-level">
                        层数 <span class="required">*</span>
                    </label>
                    <select id="item-level" class="form-select" required ${isEdit ? 'disabled' : ''}>
                        <option value="">请先选择柜子</option>
                    </select>
                </div>

                <!-- 收纳盒（可选） -->
                <div class="form-group">
                    <label class="form-label" for="item-box">收纳盒</label>
                    <input type="text" id="item-box" class="form-input"
                        placeholder="例如：药箱、工具箱、透明盒A……"
                        value="${existingItem ? escapeHtml(existingItem.box || '') : ''}" />
                </div>

                <!-- 备注（可选） -->
                <div class="form-group">
                    <label class="form-label" for="item-remark">备注</label>
                    <textarea id="item-remark" class="form-textarea" rows="2"
                        placeholder="补充说明（可选）">${existingItem ? escapeHtml(existingItem.remark || '') : ''}</textarea>
                </div>

                <!-- 按钮 -->
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary btn-lg btn-full">
                        ${isEdit ? '💾 保存修改' : '✅ 确认添加'}
                    </button>
                    <button type="button" class="btn btn-secondary btn-lg btn-full"
                        onclick="${isEdit ? 'history.back()' : "router.navigate('/search')"}">取消</button>
                </div>

                ${isEdit ? `
                    <div class="form-meta">
                        <span>创建于：${formatDateTime(existingItem.createTime)}</span>
                        <span>更新于：${formatDateTime(existingItem.updateTime)}</span>
                    </div>
                ` : ''}
            </form>
        </div>
    `;

    // ============================================================
    // 绑定事件
    // ============================================================

    // ---- 数量按钮 ----
    const qtyInput = $('#item-quantity');
    $('#qty-minus').addEventListener('click', () => {
        const v = parseInt(qtyInput.value) || 1;
        if (v > 1) qtyInput.value = v - 1;
    });
    $('#qty-plus').addEventListener('click', () => {
        const v = parseInt(qtyInput.value) || 1;
        if (v < 999) qtyInput.value = v + 1;
    });

    const roomSelect = $('#item-room');
    const cabinetSelect = $('#item-cabinet');
    const levelSelect = $('#item-level');
    const modeListBtn = $('#mode-list-btn');
    const modeMapBtn = $('#mode-map-btn');
    const cabinetListGroup = $('#cabinet-list-group');
    const cabinetMapGroup = $('#cabinet-map-group');
    const cabinetMapInput = $('#item-cabinet-map');
    const miniMap = $('#cabinet-mini-map');
    const mapSelectedLabel = $('#map-selected-label');

    let currentMode = defaultMode; // 'list' | 'map'

    // ---- 模式切换 ----
    function setMode(mode) {
        currentMode = mode;
        if (mode === 'list') {
            modeListBtn.classList.add('mode-active');
            modeMapBtn.classList.remove('mode-active');
            cabinetListGroup.style.display = '';
            cabinetMapGroup.style.display = 'none';
            // 同步地图选中的值到下拉
            if (cabinetMapInput.value) {
                cabinetSelect.value = cabinetMapInput.value;
            }
        } else {
            modeMapBtn.classList.add('mode-active');
            modeListBtn.classList.remove('mode-active');
            cabinetListGroup.style.display = 'none';
            cabinetMapGroup.style.display = '';
            // 同步下拉选中的值到地图
            if (cabinetSelect.value) {
                cabinetMapInput.value = cabinetSelect.value;
            }
            // 刷新地图
            refreshMiniMap(roomSelect.value, cabinetMapInput.value);
        }
    }

    modeListBtn.addEventListener('click', () => setMode('list'));
    modeMapBtn.addEventListener('click', () => setMode('map'));

    // ---- 地图中选择柜子后的回调 ----
    window._onMiniMapCabinetClick = function (cabinetId) {
        const cabinet = getCabinetById(cabinetId);
        cabinetMapInput.value = cabinetId;
        cabinetSelect.value = cabinetId;

        // 更新选中标签
        if (cabinet) {
            mapSelectedLabel.textContent = `✅ 已选：${cabinet.code} ${cabinet.name}`;
            mapSelectedLabel.className = 'map-selected-label selected';
        }

        // 更新层数下拉
        updateLevelSelect(cabinetId, levelSelect, null);

        // 刷新地图高亮
        refreshMiniMap(roomSelect.value, cabinetId);
    };

    // ---- 房间变更 ----
    roomSelect.addEventListener('change', function () {
        const roomId = this.value;
        updateCabinetSelect(roomId, cabinetSelect, levelSelect, null);
        cabinetMapInput.value = '';
        mapSelectedLabel.textContent = '';
        mapSelectedLabel.className = 'map-selected-label';
        if (currentMode === 'map') {
            refreshMiniMap(roomId, null);
        }
    });

    // ---- 柜子下拉变更 ----
    cabinetSelect.addEventListener('change', function () {
        updateLevelSelect(this.value, levelSelect, null);
        if (currentMode === 'map') {
            cabinetMapInput.value = this.value;
            mapSelectedLabel.textContent = '';
            mapSelectedLabel.className = 'map-selected-label';
            if (this.value) {
                const cabinet = getCabinetById(this.value);
                if (cabinet) {
                    mapSelectedLabel.textContent = `✅ 已选：${cabinet.code} ${cabinet.name}`;
                    mapSelectedLabel.className = 'map-selected-label selected';
                }
            }
            refreshMiniMap(roomSelect.value, this.value);
        }
    });

    // ---- 初始加载 ----
    if (selectedRoom) {
        updateCabinetSelect(selectedRoom, cabinetSelect, levelSelect,
            existingItem ? existingItem.cabinet : null);
        if (existingItem) {
            updateLevelSelect(existingItem.cabinet, levelSelect, existingItem.level);
            cabinetMapInput.value = existingItem.cabinet;
        }
    }

    // 初始模式
    if (isEdit && existingItem) {
        // 编辑模式默认列表
        setMode('list');
    }

    // ---- 表单提交 ----
    const form = $('#item-form');
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = $('#item-name').value.trim();
        const room = roomSelect.value;
        // 根据当前模式取柜子值
        const cabinet = currentMode === 'map' ? cabinetMapInput.value : cabinetSelect.value;
        const level = levelSelect.value;
        const quantity = parseInt($('#item-quantity').value) || 1;
        const box = $('#item-box').value.trim();
        const remark = $('#item-remark').value.trim();

        if (!name) { showToast('请输入物品名称', 'error'); $('#item-name').focus(); return; }
        if (!room) { showToast('请选择房间', 'error'); return; }
        if (!cabinet) { showToast('请选择柜子', 'error'); return; }
        if (!level) { showToast('请选择层数', 'error'); return; }

        try {
            if (isEdit) {
                // 编辑模式：只更新名称、数量、收纳盒、备注，位置不变
                await updateItem(existingItem.id, { name, quantity, box, remark });
                showToast('物品已更新', 'success');
                history.back();
            } else {
                await addItem({ name, room, cabinet, level, quantity, box, remark });
                showToast('物品已添加', 'success');
                // 清空名称和可选字段，保留房间和柜子方便连续录入
                $('#item-name').value = '';
                $('#item-box').value = '';
                $('#item-remark').value = '';
                $('#item-name').focus();
                // 地图模式保留高亮
                if (currentMode === 'map') {
                    refreshMiniMap(room, cabinet);
                }
            }
        } catch (err) {
            console.error('保存失败:', err);
            showToast('保存失败，请重试', 'error');
        }
    });
}

// ============================================================
// 迷你地图渲染（新增页面的柜子选择器）
// ============================================================

/**
 * 刷新迷你地图
 * @param {string} roomId - 房间 ID
 * @param {string} [selectedCabinetId] - 当前选中的柜子 ID
 */
function refreshMiniMap(roomId, selectedCabinetId) {
    const miniMap = $('#cabinet-mini-map');
    if (!miniMap) return;

    if (!roomId) {
        miniMap.innerHTML = '<div class="mini-map-placeholder">请先选择房间</div>';
        return;
    }

    const layout = getCabinetLayout(roomId);
    if (!layout || layout.cabinets.length === 0) {
        miniMap.innerHTML = '<div class="mini-map-placeholder">该房间暂无柜子</div>';
        return;
    }

    // 如果是 SVG 布局，直接渲染 SVG
    if (layout.type === 'svg') {
        // 计算自适应 viewBox 偏移，让柜子区域填满
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        layout.cabinets.forEach(c => {
            if (c.x < minX) minX = c.x;
            if (c.y < minY) minY = c.y;
            if (c.x + c.w > maxX) maxX = c.x + c.w;
            if (c.y + c.h > maxY) maxY = c.y + c.h;
        });
        const padX = 15, padY = 15;
        const vbX = minX - padX;
        const vbY = minY - padY;
        const vbW = (maxX - minX) + padX * 2;
        const vbH = (maxY - minY) + padY * 2;

        miniMap.innerHTML = `
            <svg viewBox="${vbX} ${vbY} ${vbW} ${vbH}" class="mini-map-svg" id="mini-map-svg">
                ${(layout.decorations || []).map(d => renderMiniDecoration(d)).join('')}
                ${layout.cabinets.map(c => {
                    const cabinet = getCabinetById(c.id);
                    const code = cabinet ? cabinet.code : c.id;
                    const name = cabinet ? cabinet.name : '';
                    const isSelected = selectedCabinetId === c.id;
                    return `
                        <g class="mini-cabinet-group ${isSelected ? 'mini-cabinet-selected' : ''}"
                           data-cabinet="${c.id}"
                           onclick="window._onMiniMapCabinetClick('${c.id}')">
                            <rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}"
                                  rx="${c.rx || 6}" class="mini-cabinet-rect" />
                            <text x="${c.x + c.w/2}" y="${c.y + c.h/2 + 5}"
                                  text-anchor="middle" class="mini-cabinet-code">${escapeHtml(code)}</text>
                            ${c.w > 50 && c.h > 35 && name ? `
                                <text x="${c.x + c.w/2}" y="${c.y + c.h/2 + 20}"
                                      text-anchor="middle" class="mini-cabinet-name">${name.length > 5 ? name.substring(0,5)+'…' : name}</text>
                            ` : ''}
                        </g>
                    `;
                }).join('')}
            </svg>
        `;
    } else if (layout.type === 'photo') {
        // 照片模式用简化热区
        miniMap.innerHTML = `
            <div class="mini-photo-map" style="padding-top:${(1/(layout.aspectRatio||1.5))*100}%">
                <div class="mini-photo-hotspots">
                    ${layout.cabinets.map(c => {
                        const cabinet = getCabinetById(c.id);
                        const code = cabinet ? cabinet.code : c.id;
                        const isSelected = selectedCabinetId === c.id;
                        return `
                            <div class="mini-hotspot ${isSelected ? 'mini-hotspot-selected' : ''}"
                                 style="left:${c.x}%;top:${c.y}%;width:${c.w}%;height:${c.h}%;"
                                 onclick="window._onMiniMapCabinetClick('${c.id}')">
                                <span class="mini-hotspot-label">${escapeHtml(code)}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
}

function renderMiniDecoration(d) {
    if (d.type === 'rect') {
        return `<rect x="${d.x}" y="${d.y}" width="${d.w}" height="${d.h}"
                      rx="${d.rx || 10}" class="decoration-rect"/>
                <text x="${d.x + d.w/2}" y="${d.y + d.h/2 + 6}"
                      text-anchor="middle" class="decoration-text">${d.label || ''}</text>`;
    }
    return '';
}

// ============================================================
// 级联下拉更新函数
// ============================================================

function updateCabinetSelect(roomId, cabinetSelect, levelSelect, selectedCabinet) {
    cabinetSelect.innerHTML = '<option value="">请选择柜子</option>';
    levelSelect.innerHTML = '<option value="">请先选择柜子</option>';

    if (!roomId) return;

    const cabinets = getCabinetsByRoom(roomId);
    const groups = {};
    cabinets.forEach(c => {
        const g = c.group || '其他';
        if (!groups[g]) groups[g] = [];
        groups[g].push(c);
    });

    Object.entries(groups).forEach(([groupName, groupCabinets]) => {
        if (Object.keys(groups).length > 1) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = groupName;
            groupCabinets.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = `${c.code} - ${c.name}`;
                if (selectedCabinet === c.id) opt.selected = true;
                optgroup.appendChild(opt);
            });
            cabinetSelect.appendChild(optgroup);
        } else {
            groupCabinets.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = `${c.code} - ${c.name}`;
                if (selectedCabinet === c.id) opt.selected = true;
                cabinetSelect.appendChild(opt);
            });
        }
    });
}

function updateLevelSelect(cabinetId, levelSelect, selectedLevel) {
    levelSelect.innerHTML = '<option value="">请选择层数</option>';
    if (!cabinetId) return;

    const levels = getCabinetLevels(cabinetId);
    levels.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l;
        opt.textContent = `${l}（${formatLevel(l)}）`;
        if (selectedLevel === l) opt.selected = true;
        levelSelect.appendChild(opt);
    });
}
