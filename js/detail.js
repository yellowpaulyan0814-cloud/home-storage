/**
 * 家庭收纳管理系统 — 物品详情弹窗
 * 从搜索结果或柜子地图中点击物品时显示
 * 支持查看详情、编辑、删除、在地图中定位
 *
 * @module detail
 * @version 1.0.0
 */

// ============================================================
// 详情弹窗
// ============================================================

/**
 * 显示物品详情弹窗
 * @param {string} itemId - 物品 ID
 */
async function showItemDetail(itemId) {
    try {
        const item = await getItem(itemId);
        if (!item) {
            showToast('物品不存在', 'error');
            return;
        }

        const room = getRoomById(item.room);
        const cabinet = getCabinetById(item.cabinet);
        const roomName = room ? `${room.icon} ${room.name}` : item.room;
        const cabinetName = cabinet ? `${cabinet.code} ${cabinet.name}` : item.cabinet;

        const overlay = createElement('div', {
            id: 'detail-overlay',
            className: 'detail-overlay'
        });

        const panel = createElement('div', { className: 'detail-panel' }, [
            // 头部
            createElement('div', { className: 'detail-header' }, [
                createElement('div', { className: 'detail-header-left' }, [
                    createElement('h2', { className: 'detail-name' }, item.name),
                    createElement('div', { className: 'detail-id' }, item.id.substring(0, 8)),
                ]),
                createElement('button', {
                    className: 'detail-close',
                    onClick: () => overlay.remove()
                }, '✕')
            ]),

            // 位置信息
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

            // 备注
            item.remark ? createElement('div', { className: 'detail-section' }, [
                createElement('h3', { className: 'detail-section-title' }, '📝 备注'),
                createElement('p', { className: 'detail-remark' }, escapeHtml(item.remark))
            ]) : null,

            // 时间信息
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

            // 操作按钮
            createElement('div', { className: 'detail-actions' }, [
                createElement('button', {
                    className: 'btn btn-primary btn-detail-action',
                    onClick: () => {
                        overlay.remove();
                        // 跳转到完整房间地图，通过 query 参数传递目标柜子和物品
                        router.navigate(`/map/${item.room}`, {
                            cabinet: item.cabinet,
                            level: item.level,
                            highlight: item.id
                        });
                    }
                }, '🗺️ 在地图中查看'),
                createElement('button', {
                    className: 'btn btn-secondary btn-detail-action',
                    onClick: () => {
                        overlay.remove();
                        router.navigate(`/add/${item.id}`);
                    }
                }, '✏️ 编辑'),
                createElement('button', {
                    className: 'btn btn-danger btn-detail-action',
                    onClick: async () => {
                        const confirmed = await confirmDialog(
                            `确定要删除"${item.name}"吗？此操作不可恢复。`,
                            '删除物品'
                        );
                        if (confirmed) {
                            try {
                                await deleteItem(item.id);
                                overlay.remove();
                                showToast(`已删除"${item.name}"`, 'success');
                                // 如果当前在搜索页，重新搜索
                                const searchInput = $('#search-input');
                                if (searchInput && searchInput.value) {
                                    searchInput.dispatchEvent(new Event('input'));
                                }
                                // 如果在地图页，刷新
                                if (location.hash.includes('/map/')) {
                                    const hashInfo = parseHash();
                                    router.replace('/' + hashInfo.parts.join('/'));
                                }
                            } catch (e) {
                                showToast('删除失败', 'error');
                            }
                        }
                    }
                }, '🗑️ 删除')
            ])
        ]);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        // 点击遮罩关闭
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        // ESC 关闭
        const escHandler = function (e) {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // 动画进入
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
            panel.classList.add('visible');
        });

    } catch (e) {
        console.error('加载物品详情失败:', e);
        showToast('加载失败，请重试', 'error');
    }
}
