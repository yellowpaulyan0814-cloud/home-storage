/**
 * 家庭收纳管理系统 — 柜子地图页面
 * 支持两种展示模式：
 *   1. type: 'photo' — 真实照片 + 可点击热区（百分比定位）
 *   2. type: 'svg'   — 纯 SVG 矢量绘制
 *
 * @module map
 * @version 2.0.0
 */

// ============================================================
// 页面渲染
// ============================================================

/**
 * 渲染柜子地图页面
 * @param {object} params - 路由参数
 *   params.room - 房间 ID（可选）
 *   params.cabinet - 柜子 ID（可选，全局唯一）
 *   params.level - 层编号（可选）
 *   params.query.highlight - 高亮物品 ID（可选）
 */
async function renderMapPage(params) {
    const app = $('#app');
    const roomId = params.room || null;
    // URL 路径中的柜子（直接导航到柜子内部）
    const cabinetId = params.cabinet || null;
    const levelId = params.level || null;
    // 从搜索"在地图中查看"传来的 query 参数
    const highlightItemId = params.query && params.query.highlight ? params.query.highlight : null;
    const queryCabinet = params.query && params.query.cabinet ? params.query.cabinet : null;
    const queryLevel = params.query && params.query.level ? params.query.level : null;

    // 判断是否从搜索跳转：有 room + queryCabinet，但无路径 cabinet
    const isSearchJump = !cabinetId && queryCabinet && highlightItemId;

    app.innerHTML = `
        <div class="page map-page">
            <div class="page-header map-header">
                <button class="btn-back" onclick="${getBackNavigation(roomId, cabinetId)}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>
                <h1>🗄️ 柜子地图</h1>
                <div style="width:32px"></div>
            </div>
            <div id="map-content" class="map-content"></div>
        </div>
    `;

    const mapContent = $('#map-content');

    try {
        if (cabinetId && roomId) {
            // 3级：直接导航到柜子详情
            await renderCabinetDetail(mapContent, roomId, cabinetId, levelId, highlightItemId);
        } else if (roomId) {
            // 2级：房间柜子布局（可能带搜索高亮）
            await renderRoomMap(mapContent, roomId, highlightItemId, queryCabinet, queryLevel);
        } else {
            // 1级：房间选择
            renderRoomSelector(mapContent);
        }
    } catch (e) {
        console.error('渲染地图失败:', e);
        mapContent.innerHTML = '<div class="map-error">加载失败，请刷新页面</div>';
    }
}

/**
 * 计算返回按钮的导航目标
 */
function getBackNavigation(roomId, cabinetId) {
    if (cabinetId && roomId) {
        return `router.navigate('/map/${roomId}')`;
    } else if (roomId) {
        return `router.navigate('/map')`;
    } else {
        return `router.navigate('/search')`;
    }
}

// ============================================================
// 1级：房间选择器
// ============================================================

function renderRoomSelector(container) {
    const rooms = getAllRooms();

    container.innerHTML = `
        <div class="room-grid">
            ${rooms.map(room => {
                const cabinets = getCabinetsByRoom(room.id);
                return `
                    <div class="room-card ${cabinets.length === 0 ? 'room-empty' : ''}"
                         onclick="${cabinets.length ? `router.navigate('/map/${room.id}')` : ''}">
                        <div class="room-card-icon">${room.icon}</div>
                        <div class="room-card-name">${room.name}</div>
                        <div class="room-card-count">
                            ${cabinets.length ? `${cabinets.length} 个柜子` : '暂无柜子'}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ============================================================
// 2级：房间柜子布局（照片 或 SVG）
// ============================================================

async function renderRoomMap(container, roomId, highlightItemId, queryCabinet, queryLevel) {
    const room = getRoomById(roomId);
    if (!room) {
        container.innerHTML = '<div class="map-error">房间不存在</div>';
        return;
    }

    const layout = getCabinetLayout(roomId);
    if (!layout) {
        container.innerHTML = '<div class="map-error">该房间暂无布局数据</div>';
        return;
    }

    // 获取每个柜子的物品数
    const cabinetCounts = {};
    const allCounts = await Promise.all(
        layout.cabinets.map(async (c) => {
            const items = await getItemsByCabinet(c.id);
            return { id: c.id, count: items.length, items };
        })
    );
    allCounts.forEach(c => { cabinetCounts[c.id] = c; });

    // 确定高亮柜子：优先使用 query 参数（从搜索跳转），其次从 highlightItemId 查找
    let highlightCabinet = queryCabinet || null;
    let highlightLevel = queryLevel || null;

    if (!highlightCabinet && highlightItemId) {
        for (const c of allCounts) {
            const found = c.items.find(it => it.id === highlightItemId);
            if (found) {
                highlightCabinet = c.id;
                highlightLevel = found.level;
                break;
            }
        }
    }

    // 查找高亮物品的名称（用于提示）
    let highlightItemName = null;
    if (highlightItemId) {
        for (const c of allCounts) {
            const found = c.items.find(it => it.id === highlightItemId);
            if (found) {
                highlightItemName = found.name;
                break;
            }
        }
    }

    // 根据布局类型渲染
    if (layout.type === 'photo') {
        renderPhotoMap(container, room, layout, cabinetCounts, highlightCabinet, highlightItemName, highlightLevel);
    } else {
        renderSVGMap(container, room, roomId, layout, cabinetCounts, highlightCabinet, highlightItemName, highlightLevel);
    }

    // 高亮柜子滚动
    if (highlightCabinet) {
        setTimeout(() => {
            const el = document.querySelector(`.cabinet-hotspot[data-cabinet="${highlightCabinet}"]`);
            if (!el) {
                const svgEl = document.querySelector(`.cabinet-group[data-cabinet="${highlightCabinet}"]`);
                if (svgEl) {
                    svgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    svgEl.classList.add('cabinet-pulse');
                    setTimeout(() => svgEl.classList.remove('cabinet-pulse'), 2000);
                }
                return;
            }
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('hotspot-pulse');
            setTimeout(() => el.classList.remove('hotspot-pulse'), 2000);
        }, 300);
    }
}

// ============================================================
// 2A：照片 + 热区模式
// ============================================================

function renderPhotoMap(container, room, layout, cabinetCounts, highlightCabinet, highlightItemName, highlightLevel) {
    const hlCabinet = highlightCabinet ? getCabinetById(highlightCabinet) : null;
    // 生成层级描述（L1→第一层, L2→第二层, ...）
    const levelDesc = highlightLevel ? formatLevel(highlightLevel) : '';

    container.innerHTML = `
        <div class="map-room-info">
            <h2>${room.icon} ${room.name}</h2>
            <p>共 ${layout.cabinets.length} 个柜子 · 悬停或点击柜门查看详情</p>
        </div>

        ${highlightCabinet && highlightItemName ? `
            <div class="search-jump-banner" onclick="router.navigate('/map/${room.id}/${highlightCabinet}')">
                <span class="banner-icon">📍</span>
                <span class="banner-text">
                    物品 <strong>"${escapeHtml(highlightItemName)}"</strong>
                    在 <strong>${escapeHtml(hlCabinet ? hlCabinet.code : highlightCabinet)} ${escapeHtml(hlCabinet ? hlCabinet.name : '')}</strong>
                    ${levelDesc ? `<strong> · ${escapeHtml(levelDesc)}</strong>` : ''}
                </span>
                <span class="banner-arrow">查看详情 ›</span>
            </div>
        ` : ''}

        <!-- 照片地图容器 -->
        <div class="photo-map-wrapper" id="photo-map-wrapper">
            <div class="photo-map-inner" style="padding-top:${(1 / layout.aspectRatio) * 100}%">
                <img src="${layout.photo}"
                     alt="${room.name}柜子照片"
                     class="photo-map-image"
                     id="photo-map-image"
                     onerror="this.parentElement.parentElement.innerHTML='<div class=\\'photo-fallback\\'><p>📷 照片未找到</p><p class=\\'photo-fallback-hint\\'>请将客厅照片保存为<br/><code>images/living-room.jpg</code></p></div>'"
                />
                <!-- 热区覆盖层 -->
                <div class="photo-hotspots" id="photo-hotspots">
                    ${layout.cabinets.map(c => {
                        const info = cabinetCounts[c.id] || { count: 0 };
                        const cabinet = getCabinetById(c.id);
                        const code = cabinet ? cabinet.code : c.id;
                        const name = cabinet ? cabinet.name : '';
                        const isHighlighted = highlightCabinet === c.id;

                        return `
                            <div class="cabinet-hotspot ${isHighlighted ? 'hotspot-highlighted' : ''}"
                                 data-cabinet="${c.id}"
                                 style="left:${c.x}%; top:${c.y}%; width:${c.w}%; height:${c.h}%;"
                                 onclick="onCabinetClick(event, '${room.id}', '${c.id}')"
                                 onmouseenter="onCabinetHover(event, '${c.id}', '${escapeHtml(code)}', '${escapeHtml(name)}', ${info.count})"
                                 onmouseleave="onCabinetLeave()">
                                <span class="hotspot-label">${escapeHtml(code)}</span>
                                ${info.count > 0 ? `<span class="hotspot-badge">${info.count > 99 ? '99+' : info.count}</span>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>

        ${(layout.decorations || []).length > 0 ? `
            <div class="photo-decorations">
                ${layout.decorations.map(d => {
                    if (d.type === 'text') {
                        return `<div class="photo-decoration-text" style="left:${d.x}%; top:${d.y}%; font-size:${d.fontSize || 14}px">${d.label}</div>`;
                    }
                    return '';
                }).join('')}
            </div>
        ` : ''}

        <!-- 柜子列表 -->
        ${renderCabinetList(room.id, layout, cabinetCounts)}

        <!-- 悬浮提示 -->
        <div id="cabinet-tooltip" class="cabinet-tooltip" style="display:none">
            <div class="tooltip-code"></div>
            <div class="tooltip-name"></div>
            <div class="tooltip-count"></div>
            <div class="tooltip-hint">点击查看详情</div>
        </div>
    `;

    // 照片加载完成后重新计算热区位置（处理响应式缩放）
    const photoImg = $('#photo-map-image');
    if (photoImg) {
        photoImg.addEventListener('load', () => {
            // 热区使用百分比定位，自动适配
        });
    }
}

// ============================================================
// 2B：纯 SVG 绘制模式
// ============================================================

function renderSVGMap(container, room, roomId, layout, cabinetCounts, highlightCabinet, highlightItemName, highlightLevel) {
    // 高亮柜子的详细信息
    const hlCabinet = highlightCabinet ? getCabinetById(highlightCabinet) : null;
    // 生成层级描述（L1→第一层, L2→第二层, ...）
    const levelDesc = highlightLevel ? formatLevel(highlightLevel) : '';

    container.innerHTML = `
        <div class="map-room-info">
            <h2>${room.icon} ${room.name}</h2>
            <p>共 ${layout.cabinets.length} 个柜子</p>
        </div>

        <!-- 搜索联动高亮提示横幅 -->
        ${highlightCabinet && highlightItemName ? `
            <div class="search-jump-banner" onclick="router.navigate('/map/${roomId}/${highlightCabinet}')">
                <span class="banner-icon">📍</span>
                <span class="banner-text">
                    物品 <strong>"${escapeHtml(highlightItemName)}"</strong>
                    在 <strong>${escapeHtml(hlCabinet ? hlCabinet.code : highlightCabinet)} ${escapeHtml(hlCabinet ? hlCabinet.name : '')}</strong>
                    ${levelDesc ? `<strong> · ${escapeHtml(levelDesc)}</strong>` : ''}
                </span>
                <span class="banner-arrow">查看详情 ›</span>
            </div>
        ` : ''}
        <div class="map-svg-container">
            <svg viewBox="${layout.viewBox}" class="cabinet-svg" id="cabinet-svg">
                ${(layout.decorations || []).map(d => renderDecoration(d)).join('')}

                ${layout.cabinets.map(c => {
                    const info = cabinetCounts[c.id] || { count: 0 };
                    const isHighlighted = highlightCabinet === c.id;
                    const cabinet = getCabinetById(c.id);
                    const code = cabinet ? cabinet.code : c.id;
                    const name = cabinet ? cabinet.name : '';

                    return `
                        <g class="cabinet-group ${isHighlighted ? 'cabinet-highlighted' : ''}"
                           data-cabinet="${c.id}"
                           onclick="onCabinetClick(event, '${roomId}', '${c.id}')"
                           onmouseenter="onCabinetHover(event, '${c.id}', '${escapeHtml(code)}', '${escapeHtml(name)}', ${info.count})"
                           onmouseleave="onCabinetLeave()">
                            ${c.groupLabel ? `<text x="${c.x + 5}" y="${c.y - 6}" class="group-label-text" font-size="11" fill="#aaa">${c.groupLabel}</text>` : ''}
                            <rect
                                x="${c.x}" y="${c.y}"
                                width="${c.w}" height="${c.h}"
                                rx="${c.rx || 6}"
                                class="cabinet-rect ${isHighlighted ? 'cabinet-highlighted' : ''}"
                            />
                            <text
                                x="${c.x + c.w / 2}"
                                y="${c.y + c.h / 2 + 5}"
                                text-anchor="middle"
                                class="cabinet-label-code"
                            >${escapeHtml(code)}</text>
                            ${c.h > 30 && name ? `<text
                                x="${c.x + c.w / 2}"
                                y="${c.y + c.h / 2 + 20}"
                                text-anchor="middle"
                                class="cabinet-label-name"
                            >${name.length > 6 ? name.substring(0, 6) + '…' : name}</text>` : ''}
                            ${info.count > 0 ? `
                                <circle cx="${c.x + c.w - 10}" cy="${c.y + 12}" r="10"
                                        class="cabinet-badge-bg"/>
                                <text x="${c.x + c.w - 10}" y="${c.y + 16}"
                                      text-anchor="middle"
                                      class="cabinet-badge-text"
                                >${info.count > 99 ? '99+' : info.count}</text>
                            ` : ''}
                        </g>
                    `;
                }).join('')}
            </svg>
        </div>

        ${renderCabinetList(roomId, layout, cabinetCounts)}

        <div id="cabinet-tooltip" class="cabinet-tooltip" style="display:none">
            <div class="tooltip-code"></div>
            <div class="tooltip-name"></div>
            <div class="tooltip-count"></div>
            <div class="tooltip-hint">点击查看详情</div>
        </div>
    `;
}

/**
 * 渲染 SVG 装饰元素
 */
function renderDecoration(d) {
    switch (d.type) {
        case 'rect':
            return `<rect x="${d.x}" y="${d.y}" width="${d.w}" height="${d.h}"
                          rx="${d.rx || 10}" class="decoration-rect"/>
                    <text x="${d.x + d.w / 2}" y="${d.y + d.h / 2 + 6}"
                          text-anchor="middle" class="decoration-text">${d.label || ''}</text>`;
        case 'text':
            return `<text x="${d.x}" y="${d.y}" text-anchor="middle"
                          class="decoration-label" fill="${d.color || '#aaa'}"
                          font-size="${d.fontSize || 14}">${d.label || ''}</text>`;
        default:
            return '';
    }
}

/**
 * 渲染柜子列表
 */
function renderCabinetList(roomId, layout, cabinetCounts) {
    return `
        <div class="cabinet-list">
            <h3>柜子列表</h3>
            ${layout.cabinets.map(c => {
                const info = cabinetCounts[c.id] || { count: 0 };
                const cabinet = getCabinetById(c.id);
                const code = cabinet ? cabinet.code : c.id;
                const name = cabinet ? cabinet.name : '';
                return `
                    <div class="cabinet-list-item"
                         onclick="router.navigate('/map/${roomId}/${c.id}')">
                        <div class="cabinet-list-code">${escapeHtml(code)}</div>
                        <div class="cabinet-list-name">${escapeHtml(name)}</div>
                        <div class="cabinet-list-count">${info.count} 件</div>
                        <div class="cabinet-list-arrow">›</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ============================================================
// 3级：柜子详情（显示各层物品）
// ============================================================

async function renderCabinetDetail(container, roomId, cabinetId, levelId, highlightItemId) {
    const room = getRoomById(roomId);
    const cabinet = getCabinetById(cabinetId);

    if (!room || !cabinet) {
        container.innerHTML = '<div class="map-error">柜子不存在</div>';
        return;
    }

    const allItems = await getItemsByCabinet(cabinetId);

    // 按层分组
    const itemsByLevel = {};
    cabinet.levels.forEach(l => { itemsByLevel[l] = []; });
    allItems.forEach(item => {
        if (!itemsByLevel[item.level]) {
            itemsByLevel[item.level] = [];
        }
        itemsByLevel[item.level].push(item);
    });

    container.innerHTML = `
        <div class="map-room-info">
            <div class="breadcrumb">
                <span class="breadcrumb-item" onclick="router.navigate('/map')">房间</span>
                <span class="breadcrumb-sep">›</span>
                <span class="breadcrumb-item" onclick="router.navigate('/map/${roomId}')">${room.icon} ${room.name}</span>
                <span class="breadcrumb-sep">›</span>
                <span class="breadcrumb-current">${escapeHtml(cabinet.code)} ${escapeHtml(cabinet.name)}</span>
            </div>
        </div>

        <div class="cabinet-detail-info">
            <div class="cabinet-detail-header">
                <h2>${escapeHtml(cabinet.code)}</h2>
                <p>${escapeHtml(cabinet.name)}</p>
            </div>
            <div class="cabinet-detail-stats">
                <div class="stat-item">
                    <div class="stat-value">${allItems.length}</div>
                    <div class="stat-label">物品总数</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${cabinet.levels.length}</div>
                    <div class="stat-label">层数</div>
                </div>
            </div>
        </div>

        <div class="cabinet-levels">
            ${cabinet.levels.map(l => {
                const items = itemsByLevel[l] || [];
                const isHighlightLevel = levelId === l;
                return `
                    <div class="level-section ${isHighlightLevel ? 'level-highlighted' : ''}"
                         id="level-${l}">
                        <div class="level-header">
                            <h3>${l}</h3>
                            <span class="level-count">${items.length} 件物品</span>
                        </div>
                        ${items.length === 0 ? `
                            <div class="level-empty">暂无物品</div>
                        ` : `
                            <div class="level-items">
                                ${items.map(item => {
                                    const isHighlightItem = highlightItemId === item.id;
                                    return `
                                        <div class="level-item ${isHighlightItem ? 'item-highlighted' : ''}"
                                             id="item-${item.id}"
                                             onclick="showItemDetail('${item.id}')">
                                            <div class="level-item-icon">📦</div>
                                            <div class="level-item-info">
                                                <div class="level-item-name">${escapeHtml(item.name)}</div>
                                                <div class="level-item-meta">
                                                    ${item.box ? `<span>📦 ${escapeHtml(item.box)}</span>` : ''}
                                                    <span>${formatDateTime(item.updateTime)}</span>
                                                </div>
                                            </div>
                                            <div class="level-item-arrow">›</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // 滚动到指定层
    if (levelId) {
        setTimeout(() => {
            const el = document.getElementById('level-' + levelId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('level-pulse');
                setTimeout(() => el.classList.remove('level-pulse'), 2000);
            }
        }, 300);
    }

    // 滚动到高亮物品
    if (highlightItemId) {
        setTimeout(() => {
            const el = document.getElementById('item-' + highlightItemId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('item-pulse');
                setTimeout(() => el.classList.remove('item-pulse'), 2500);
            }
        }, 500);
    }
}

// ============================================================
// 交互处理
// ============================================================

/**
 * 柜门/热区悬浮事件
 * @param {Event} event
 * @param {string} cabinetId - 全局唯一 ID
 * @param {string} code - 短代码
 * @param {string} name - 中文名
 * @param {number} itemCount - 物品数量
 */
function onCabinetHover(event, cabinetId, code, name, itemCount) {
    const tooltip = $('#cabinet-tooltip');
    if (!tooltip) return;

    tooltip.querySelector('.tooltip-code').textContent = code;
    tooltip.querySelector('.tooltip-name').textContent = name;
    tooltip.querySelector('.tooltip-count').textContent = `已有 ${itemCount} 件物品`;
    tooltip.style.display = 'block';

    // 跟随鼠标
    const x = event.clientX + 15;
    const y = event.clientY - 10;

    // 防止溢出屏幕右侧
    const maxX = window.innerWidth - 220;
    tooltip.style.left = Math.min(x, maxX) + 'px';
    tooltip.style.top = y + 'px';
}

function onCabinetLeave() {
    const tooltip = $('#cabinet-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

function onCabinetClick(event, roomId, cabinetId) {
    event.stopPropagation();
    router.navigate(`/map/${roomId}/${cabinetId}`);
}
