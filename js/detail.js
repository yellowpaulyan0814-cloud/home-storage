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

        // ---- 数量区域 ----
        createElement('div', { className: 'detail-section' }, [
            createElement('h3', { className: 'detail-section-title' }, '🔢 数量'),
            createElement('div', { className: 'detail-qty-row' }, [
                createElement('button', { className: 'd-qty-btn', id: 'detail-qty-minus', onClick: () => changeQty(-1) }, '−'),
                createElement('span', { className: 'd-qty-val', id: 'detail-qty-val' }, String(qty)),
                createElement('button', { className: 'd-qty-btn', id: 'detail-qty-plus',  onClick: () => changeQty(1) }, '+'),
            ])
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
                    const currentQty = parseInt($('#detail-qty-val') ? $('#detail-qty-val').textContent : qty);
                    if (currentQty <= 1) {
                        const ok = await confirmDialog(`确定要删除"${item.name}"吗？数量为1，将全部删除。`, '删除物品');
                        if (!ok) return;
                        await deleteItem(item.id);
                        overlay.remove();
                        showToast(`已删除"${item.name}"`, 'success');
                    } else {
                        const delQty = await promptQuantity('删除数量', currentQty, `要删除多少个"${item.name}"？（当前共 ${currentQty} 个）`);
                        if (!delQty) return;
                        if (delQty >= currentQty) {
                            const ok = await confirmDialog(`将删除全部 ${currentQty} 个"${item.name}"，确认？`, '全部删除');
                            if (!ok) return;
                            await deleteItem(item.id);
                            overlay.remove();
                            showToast(`已删除"${item.name}"`, 'success');
                        } else {
                            await deleteItem(item.id, delQty);
                            overlay.remove();
                            showToast(`"${item.name}" 已减少 ${delQty} 个（剩余 ${currentQty - delQty}）`, 'success');
                        }
                    }
                    refreshAfterChange();
                }
            }, '🗑️ 删除')
        ])
    ]);

    // 数量修改函数（闭包）
    let currentQty = qty;
    window.changeQty = async function (delta) {
        currentQty = Math.max(1, currentQty + delta);
        const valEl = $('#detail-qty-val');
        if (valEl) valEl.textContent = currentQty;
        try {
            await updateItem(item.id, { quantity: currentQty });
        } catch (e) { showToast('更新失败', 'error'); }
    };

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
        createElement('select', { id: 'move-room', className: 'form-select', style: 'margin-bottom:8px' },
            getAllRooms().map(r => `<option value="${r.id}">${r.icon} ${r.name}</option>`).join('')),

        createElement('label', { style: 'font-size:13px;font-weight:500' }, '目标柜子'),
        createElement('select', { id: 'move-cabinet', className: 'form-select', style: 'margin-bottom:8px' }, '<option value="">请选择</option>'),

        createElement('label', { style: 'font-size:13px;font-weight:500' }, '目标层'),
        createElement('select', { id: 'move-level', className: 'form-select', style: 'margin-bottom:16px' }, '<option value="">请选择</option>'),

        createElement('div', { className: 'dialog-footer' }, [
            createElement('button', { className: 'btn btn-secondary', onClick: () => overlay.remove() }, '取消'),
            createElement('button', { className: 'btn btn-primary', id: 'move-confirm', onClick: async () => {
                const mq = parseInt($('#move-qty').value) || 1;
                const maxQty = item.quantity || 1;
                const roomId = $('#move-room').value;
                const cabId  = $('#move-cabinet').value;
                const level  = $('#move-level').value;
                if (!cabId || !level) { showToast('请选择目标位置', 'error'); return; }
                if (mq >= maxQty && maxQty <= 1) {
                    const ok = await confirmDialog(`"${item.name}" 只有1个，移动后将清空原位置。确认？`, '移动确认');
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

    // 级联下拉
    setTimeout(() => {
        const roomSel = $('#move-room');
        const cabSel  = $('#move-cabinet');
        const lvlSel  = $('#move-level');
        roomSel.addEventListener('change', () => { updateCabinetSelect(roomSel.value, cabSel, lvlSel, null); });
        cabSel.addEventListener('change',  () => { updateLevelSelect(cabSel.value, lvlSel, null); });
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

function refreshAfterChange() {
    const si = $('#search-input');
    if (si && si.value) si.dispatchEvent(new Event('input'));
}
