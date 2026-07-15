/**
 * 家庭收纳管理系统 — 物品详情弹窗
 * 支持查看、编辑数量、移动、删除（含部分删除）
 *
 * @module detail
 * @version 3.0.0
 */

async function showItemDetail(itemId) {
    try {
        const item = await getItem(itemId);
        if (!item) { showToast('物品不存在', 'error'); return; }

        const room = getRoomById(item.room);
        const cabinet = getCabinetById(item.cabinet);
        const roomName = room ? `${room.icon} ${room.name}` : item.room;
        const cabinetName = cabinet ? `${cabinet.code} ${cabinet.name}` : item.cabinet;
        const qty = item.quantity || 1;

        buildPanel(item, room, cabinet, roomName, cabinetName, qty);
    } catch (e) {
        console.error('加载物品详情失败:', e);
        showToast('加载失败，请重试', 'error');
    }
}

function buildPanel(item, room, cabinet, roomName, cabinetName, qty) {
    const overlay = createElement('div', { id: 'detail-overlay', className: 'detail-overlay' });

    const panel = createElement('div', { className: 'detail-panel' }, [
        createElement('div', { className: 'detail-header' }, [
            createElement('div', { className: 'detail-header-left' }, [
                createElement('h2', { className: 'detail-name' }, item.name),
                createElement('div', { className: 'detail-id' }, `×${qty} · ` + item.id.substring(0, 8)),
            ]),
            createElement('button', { className: 'detail-close', onClick: () => overlay.remove() }, '✕')
        ]),

        // ---- 数量（只读显示） ----
        createElement('div', { className: 'detail-section' }, [
            createElement('h3', { className: 'detail-section-title' }, '🔢 数量'),
            createElement('span', { style: 'font-size:24px;font-weight:700' }, String(qty)),
        ]),

        // ---- 位置信息 ----
        createElement('div', { className: 'detail-section' }, [
            createElement('h3', { className: 'detail-section-title' }, '📍 存放位置'),
            createElement('div', { className: 'detail-location-chain' }, [
                createElement('div', { className: 'location-step' }, [
                    createElement('span', { className: 'location-icon' }, room ? room.icon : '🏠'),
                    createElement('span', { className: 'location-text' }, roomName)
                ]),
                createElement('div', { className: 'location-arrow' }, '→'),
                createElement('div', { className: 'location-step' }, [
                    createElement('span', { className: 'location-icon' }, '🗄️'),
                    createElement('span', { className: 'location-text' }, cabinetName),
                    createElement('span', { className: 'location-code' }, cabinet ? cabinet.code : item.cabinet)
                ]),
                createElement('div', { className: 'location-arrow' }, '→'),
                createElement('div', { className: 'location-step' }, [
                    createElement('span', { className: 'location-icon' }, '📐'),
                    createElement('span', { className: 'location-text' }, item.level)
                ])
            ]),
            item.box ? createElement('div', { className: 'detail-box-tag' }, `📦 ${escapeHtml(item.box)}`) : null
        ]),

        item.remark ? createElement('div', { className: 'detail-section' }, [
            createElement('h3', { className: 'detail-section-title' }, '📝 备注'),
            createElement('p', { className: 'detail-remark' }, escapeHtml(item.remark))
        ]) : null,

        createElement('div', { className: 'detail-section detail-meta' }, [
            createElement('div', { className: 'detail-meta-item' }, [
                createElement('span', { className: 'meta-label' }, '创建时间'),
                createElement('span', { className: 'meta-value' }, formatDateTime(item.createTime))
            ]),
            createElement('div', { className: 'detail-meta-item' }, [
                createElement('span', { className: 'meta-label' }, '最后修改'),
                createElement('span', { className: 'meta-value' }, formatDateTime(item.updateTime))
            ])
        ]),

        // ---- 操作按钮 ----
        createElement('div', { className: 'detail-actions' }, [
            createElement('button', { className: 'btn btn-primary btn-detail-action',
                onClick: () => { overlay.remove(); router.navigate(`/map/${item.room}`, { cabinet: item.cabinet, level: item.level, highlight: item.id }); }
            }, '🗺️ 地图'),
            createElement('button', { className: 'btn btn-secondary btn-detail-action',
                onClick: () => { overlay.remove(); showMoveModal(item); }
            }, '📦 移动'),
            createElement('button', { className: 'btn btn-secondary btn-detail-action',
                onClick: () => { overlay.remove(); router.navigate(`/add/${item.id}`); }
            }, '✏️ 编辑'),
            createElement('button', { className: 'btn btn-danger btn-detail-action',
                onClick: async () => {
                    const cq = item.quantity || 1;
                    if (cq <= 1) {
                        const ok = await confirmDialog(`确定要删除"${item.name}"吗？数量为1，将全部删除。`, '删除物品');
                        if (!ok) return;
                        await deleteItem(item.id);
                        overlay.remove();
                        showToast(`已删除"${item.name}"`, 'success');
                    } else {
                        const delQty = await promptQuantity('删除数量', cq, `要删除多少个"${item.name}"？（当前共 ${cq} 个）`);
                        if (!delQty) return;
                        if (delQty >= cq) {
                            const ok = await confirmDialog(`将删除全部 ${cq} 个"${item.name}"，确认？`, '全部删除');
                            if (!ok) return;
                            await deleteItem(item.id);
                            overlay.remove();
                            showToast(`已删除"${item.name}"`, 'success');
                        } else {
                            await deleteItem(item.id, delQty);
                            overlay.remove();
                            showToast(`"${item.name}" 已减少 ${delQty} 个（剩余 ${cq - delQty}）`, 'success');
                        }
                    }
                    refreshAfterChange();
                }
            }, '🗑️ 删除')
        ])
    ]);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    const esc = e => { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); } };
    document.addEventListener('keydown', esc);

    requestAnimationFrame(() => { overlay.classList.add('visible'); panel.classList.add('visible'); });
}

// ============================================================
// 移动弹窗
// ============================================================

function showMoveModal(item) {
    const overlay = createElement('div', { id: 'move-overlay', className: 'dialog-overlay' });

    const dialog = createElement('div', { className: 'dialog' }, [
        createElement('h3', {}, `📦 移动 "${item.name}"`),
        createElement('p', { style: 'font-size:13px;color:#86868b;margin-bottom:12px' }, `当前位置：${_itemLocation(item)} · 当前数量：${item.quantity || 1}`),

        createElement('label', { style: 'font-size:13px;font-weight:500' }, '移动数量'),
        createElement('div', { className: 'quantity-input-row', style: 'margin-bottom:12px' }, [
            createElement('button', { className: 'qty-btn', id: 'move-qty-minus', onClick: () => { const i=$('#move-qty'); const v=parseInt(i.value)||1; if(v>1)i.value=v-1; } }, '−'),
            createElement('input', { type: 'number', id: 'move-qty', className: 'form-input qty-input', value: item.quantity || 1, min: 1, max: item.quantity || 1 }),
            createElement('button', { className: 'qty-btn', id: 'move-qty-plus',  onClick: () => { const i=$('#move-qty'); const v=parseInt(i.value)||1; if(v<(item.quantity||1))i.value=v+1; } }, '+'),
        ]),

        createElement('label', { style: 'font-size:13px;font-weight:500' }, '目标房间'),
        _makeSelect('move-room',
            getAllRooms().map(r => `<option value="${r.id}" ${r.id===item.room?'selected':''}>${r.icon} ${r.name}</option>`).join('')),

        // 柜子选择方式
        createElement('label', { style: 'font-size:13px;font-weight:500' }, '目标柜子'),
        createElement('div', { className: 'mode-toggle', style: 'margin-bottom:8px' }, [
            createElement('button', { className: 'mode-btn mode-active', id: 'mm-list-btn', onClick: () => { window._moveSetMode('list'); } }, '📋 列表'),
            createElement('button', { className: 'mode-btn', id: 'mm-map-btn', onClick: () => { window._moveSetMode('map'); } }, '🗄️ 点选'),
        ]),
        _makeSelect('move-cabinet', '<option value="">请选择</option>'),
        // 地图容器
        createElement('div', { id: 'move-mini-map', style: 'display:none;margin-bottom:8px' }, '<div class="mini-map-placeholder">请先选择房间</div>'),
        createElement('input', { type: 'hidden', id: 'move-cabinet-map', value: '' }),

        createElement('label', { style: 'font-size:13px;font-weight:500' }, '目标层'),
        _makeSelect('move-level', '<option value="">请选择</option>'),

        createElement('div', { className: 'dialog-footer' }, [
            createElement('button', { className: 'btn btn-secondary', onClick: () => overlay.remove() }, '取消'),
            createElement('button', { className: 'btn btn-primary', id: 'move-confirm', onClick: async () => {
                const mq = parseInt($('#move-qty').value) || 1;
                const maxQty = item.quantity || 1;
                const roomId = $('#move-room').value;
                const cabId  = ($('#move-cabinet-map').value || $('#move-cabinet').value);
                const level  = $('#move-level').value;
                if (!cabId || !level) { showToast('请选择目标位置', 'error'); return; }
                if (mq >= maxQty) {
                    const warn = maxQty <= 1
                        ? `"${item.name}" 只有1个，移动后将清空原位置。确认？`
                        : `将移动全部 ${mq} 个"${item.name}"，原位置将清空。确认？`;
                    const ok = await confirmDialog(warn, '移动确认');
                    if (!ok) return;
                }
                try {
                    await moveItem(item.id, roomId, cabId, level, mq);
                    overlay.remove();
                    showToast(`"${item.name}" 已移动`, 'success');
                    refreshAfterChange();
                } catch (e) { showToast('移动失败: ' + e.message, 'error'); }
            } }, '确认移动')
        ])
    ]);

    // 级联下拉 + 地图联动
    setTimeout(() => {
        const roomSel = $('#move-room');
        const cabSel  = $('#move-cabinet');
        const lvlSel  = $('#move-level');
        let moveMapMode = 'list';

        window._moveSetMode = function(mode) {
            moveMapMode = mode;
            const lb = $('#mm-list-btn'), mb = $('#mm-map-btn');
            const cg = $('#move-cabinet'), mg = $('#move-mini-map');
            if (mode === 'list') { lb.classList.add('mode-active'); mb.classList.remove('mode-active'); cg.style.display=''; mg.style.display='none'; }
            else { mb.classList.add('mode-active'); lb.classList.remove('mode-active'); cg.style.display='none'; mg.style.display=''; _refreshMoveMap(roomSel.value); }
        };

        window._onMoveMapClick = function(cabinetId) {
            const cab = getCabinetById(cabinetId);
            $('#move-cabinet-map').value = cabinetId;
            $('#move-cabinet').value = cabinetId;
            updateLevelSelect(cabinetId, $('#move-level'), null);
            _refreshMoveMap(roomSel.value);
        };

        function _refreshMoveMap(roomId) {
            const container = $('#move-mini-map');
            if (!container || moveMapMode !== 'map' || !roomId) return;
            container.innerHTML = '';
            const layout = getCabinetLayout(roomId);
            if (!layout || !layout.cabinets.length) { container.innerHTML = '<div class="mini-map-placeholder">该房间暂无柜子</div>'; return; }
            if (layout.type === 'svg') {
                let mx=Infinity,my=Infinity,Mx=-Infinity,My=-Infinity;
                layout.cabinets.forEach(c => { if(c.x<mx)mx=c.x; if(c.y<my)my=c.y; if(c.x+c.w>Mx)Mx=c.x+c.w; if(c.y+c.h>My)My=c.y+c.h; });
                const p=15, sel = $('#move-cabinet-map').value || $('#move-cabinet').value;
                container.innerHTML = `<svg viewBox="${mx-p} ${my-p} ${Mx-mx+2*p} ${My-my+2*p}" class="mini-map-svg">
                    ${layout.cabinets.map(c => {
                        const cb = getCabinetById(c.id);
                        const code = cb ? cb.code : c.id;
                        const name = cb ? cb.name : '';
                        const isSel = sel === c.id;
                        return `<g class="mini-cabinet-group ${isSel?'mini-cabinet-selected':''}" onclick="window._onMoveMapClick('${c.id}')">
                            <rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="${c.rx||6}" class="mini-cabinet-rect"/>
                            <text x="${c.x+c.w/2}" y="${c.y+c.h/2+5}" text-anchor="middle" class="mini-cabinet-code">${escapeHtml(code)}</text>
                        </g>`;
                    }).join('')}
                </svg>`;
            }
        }

        roomSel.addEventListener('change', () => {
            const rid = roomSel.value;
            updateCabinetSelect(rid, cabSel, lvlSel, null);
            $('#move-cabinet-map').value = '';
            if (moveMapMode === 'map') _refreshMoveMap(rid);
        });
        cabSel.addEventListener('change', () => { updateLevelSelect(cabSel.value, lvlSel, null); if(moveMapMode==='map'){ $('#move-cabinet-map').value=cabSel.value; _refreshMoveMap(roomSel.value); } });
        updateCabinetSelect(roomSel.value, cabSel, lvlSel, null);
    }, 100);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function _itemLocation(item) {
    const room = getRoomById(item.room);
    const cabinet = getCabinetById(item.cabinet);
    return `${room ? room.name : ''} · ${cabinet ? cabinet.code : item.cabinet} · ${item.level}`;
}

async function promptQuantity(title, max, msg) {
    return new Promise(resolve => {
        const overlay = createElement('div', { className: 'dialog-overlay' });
        const dialog = createElement('div', { className: 'dialog' }, [
            createElement('h3', {}, title),
            createElement('p', { style: 'font-size:13px;color:#86868b;margin:8px 0' }, msg),
            createElement('div', { className: 'quantity-input-row', style: 'margin-bottom:12px' }, [
                createElement('button', { className: 'qty-btn', onClick: () => { const i=$('#prompt-qty'); const v=parseInt(i.value)||1; if(v>1)i.value=v-1; } }, '−'),
                createElement('input', { type: 'number', id: 'prompt-qty', className: 'form-input qty-input', value: max, min: 1, max }),
                createElement('button', { className: 'qty-btn', onClick: () => { const i=$('#prompt-qty'); const v=parseInt(i.value)||1; if(v<max)i.value=v+1; } }, '+'),
            ]),
            createElement('div', { className: 'dialog-footer' }, [
                createElement('button', { className: 'btn btn-secondary', onClick: () => { overlay.remove(); resolve(null); } }, '取消'),
                createElement('button', { className: 'btn btn-danger', onClick: () => { const v=parseInt($('#prompt-qty').value)||1; overlay.remove(); resolve(v); } }, '确认')
            ])
        ]);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    });
}

function _makeSelect(id, optionsHtml) {
    const el = createElement('select', { id, className: 'form-select', style: 'margin-bottom:8px' });
    el.innerHTML = optionsHtml;
    return el;
}

function refreshAfterChange() {
    const si = $('#search-input');
    if (si && si.value) si.dispatchEvent(new Event('input'));
}
