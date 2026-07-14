/**
 * 家庭收纳管理系统 — 配置文件
 * 定义房间、柜子、层数等所有静态数据
 * 修改柜子/房间：只需修改此文件即可
 *
 * 命名规则：
 *   id = 房间前缀-柜子代码（全局唯一，如 K-KL01）
 *   code = 短代码（用于显示，如 KL01）
 *   room = 所属房间 ID
 *
 * @module config
 * @version 2.0.0
 */

// ============================================================
// 房间定义
// ============================================================

const ROOMS = {
    Y: { id: 'Y', name: '阳台', icon: '☀️', order: 1 },
    K: { id: 'K', name: '客厅', icon: '🛋️', order: 2 },
    C: { id: 'C', name: '餐厅', icon: '🍽️', order: 3 },
    M: { id: 'M', name: '主卧', icon: '🛏️', order: 4 },
    S: { id: 'S', name: '次卧', icon: '🛌', order: 5 },
    H: { id: 'H', name: '厨房', icon: '🍳', order: 6 },
    W: { id: 'W', name: '卫生间', icon: '🚿', order: 7 },
    F: { id: 'F', name: '冰箱房', icon: '❄️', order: 8 }
};

// ============================================================
// 柜子定义
// id:   全局唯一标识（房间前缀 + 柜子代码）
// code: 短代码（显示用）
// room: 所属房间
// name: 中文名称
// levels: 层数列表
// group: 分组标签（下拉菜单分组用）
// ============================================================

const CABINETS = {
    // ======================== 阳台 ========================
    'Y-Y01': { id: 'Y-Y01', code: 'Y01', room: 'Y', name: '阳台上柜', levels: ['L1'],                 group: '阳台' },
    'Y-Y02': { id: 'Y-Y02', code: 'Y02', room: 'Y', name: '阳台下柜', levels: ['L1','L2'],             group: '阳台' },

    // ======================== 客厅 ========================
    // -- 左侧 --
    'K-KL01': { id: 'K-KL01', code: 'KL01', room: 'K', name: '客厅左柜①', levels: ['L1'],             group: '左侧柜' },
    'K-KL02': { id: 'K-KL02', code: 'KL02', room: 'K', name: '客厅左柜②', levels: ['L1','L2','L3','L4','L5','L6'], group: '左侧柜' },
    // -- 上排（电视上方）--
    'K-KU01': { id: 'K-KU01', code: 'KU01', room: 'K', name: '电视上柜①', levels: ['L1','L2'], group: '上柜' },
    'K-KU02': { id: 'K-KU02', code: 'KU02', room: 'K', name: '电视上柜②', levels: ['L1','L2'], group: '上柜' },
    'K-KU03': { id: 'K-KU03', code: 'KU03', room: 'K', name: '电视上柜③', levels: ['L1','L2'], group: '上柜' },
    'K-KU04': { id: 'K-KU04', code: 'KU04', room: 'K', name: '电视上柜④', levels: ['L1','L2'], group: '上柜' },
    'K-KU05': { id: 'K-KU05', code: 'KU05', room: 'K', name: '电视上柜⑤', levels: ['L1','L2'], group: '上柜' },
    // -- 下排（电视下方）--
    'K-KD01': { id: 'K-KD01', code: 'KD01', room: 'K', name: '电视下柜①', levels: ['L1'],             group: '下柜' },
    'K-KD02': { id: 'K-KD02', code: 'KD02', room: 'K', name: '电视下柜②', levels: ['L1'],             group: '下柜' },
    'K-KD03': { id: 'K-KD03', code: 'KD03', room: 'K', name: '电视下柜③', levels: ['L1'],             group: '下柜' },
    'K-KD04': { id: 'K-KD04', code: 'KD04', room: 'K', name: '电视下柜④', levels: ['L1'],             group: '下柜' },
    // -- 中间开放格 --
    'K-KK01': { id: 'K-KK01', code: 'KK01', room: 'K', name: '开放格（上）', levels: ['L1','L2','L3'], group: '开放格' },
    'K-KK02': { id: 'K-KK02', code: 'KK02', room: 'K', name: '开放格（下）', levels: ['L1'],             group: '开放格' },
    // -- 右侧 --
    'K-KR01': { id: 'K-KR01', code: 'KR01', room: 'K', name: '客厅右柜①', levels: ['L1','L2','L3','L4','L5','L6'], group: '右侧柜' },
    'K-KR02': { id: 'K-KR02', code: 'KR02', room: 'K', name: '客厅右柜②', levels: ['L1','L2','L3','L4','L5','L6'], group: '右侧柜' },
    'K-KR03': { id: 'K-KR03', code: 'KR03', room: 'K', name: '客厅右柜③', levels: ['L1','L2','L3','L4','L5','L6'], group: '右侧柜' },
    'K-KR04': { id: 'K-KR04', code: 'KR04', room: 'K', name: '客厅右柜④', levels: ['L1','L2','L3','L4','L5','L6'], group: '右侧柜' },

    // ======================== 餐厅 - 餐边柜 ========================
    'C-CU01': { id: 'C-CU01', code: 'CU01', room: 'C', name: '餐边吊柜①', levels: ['L1','L2'],         group: '餐边柜' },
    'C-CU02': { id: 'C-CU02', code: 'CU02', room: 'C', name: '餐边吊柜②', levels: ['L1','L2'],         group: '餐边柜' },
    'C-CD01': { id: 'C-CD01', code: 'CD01', room: 'C', name: '餐边底柜①', levels: ['L1','L2','L3'],   group: '餐边柜' },
    'C-CD02': { id: 'C-CD02', code: 'CD02', room: 'C', name: '餐边底柜②', levels: ['L1','L2','L3'],   group: '餐边柜' },

    // ======================== 餐厅 - 鞋柜 ========================
    'C-XU01': { id: 'C-XU01', code: 'XU01', room: 'C', name: '鞋柜上柜①', levels: ['L1','L2','L3'],   group: '鞋柜' },
    'C-XU02': { id: 'C-XU02', code: 'XU02', room: 'C', name: '鞋柜上柜②', levels: ['L1','L2','L3'],   group: '鞋柜' },
    'C-XU03': { id: 'C-XU03', code: 'XU03', room: 'C', name: '鞋柜上柜③', levels: ['L1','L2','L3','L4'], group: '鞋柜' },
    'C-XM01': { id: 'C-XM01', code: 'XM01', room: 'C', name: '鞋柜抽屉①', levels: ['L1'],             group: '鞋柜' },
    'C-XM02': { id: 'C-XM02', code: 'XM02', room: 'C', name: '鞋柜抽屉②', levels: ['L1'],             group: '鞋柜' },
    'C-XM03': { id: 'C-XM03', code: 'XM03', room: 'C', name: '鞋柜抽屉③', levels: ['L1'],             group: '鞋柜' },
    'C-XD01': { id: 'C-XD01', code: 'XD01', room: 'C', name: '鞋柜下柜①', levels: ['L1','L2','L3'],   group: '鞋柜' },
    'C-XD02': { id: 'C-XD02', code: 'XD02', room: 'C', name: '鞋柜下柜②', levels: ['L1','L2','L3'],   group: '鞋柜' },
    'C-XD03': { id: 'C-XD03', code: 'XD03', room: 'C', name: '鞋柜下柜③', levels: ['L1','L2','L3'],   group: '鞋柜' },

    // ======================== 主卧 ========================
    'M-MU01': { id: 'M-MU01', code: 'MU01', room: 'M', name: '主卧上柜①', levels: ['L1','L2'],         group: '衣柜' },
    'M-MU02': { id: 'M-MU02', code: 'MU02', room: 'M', name: '主卧上柜②', levels: ['L1','L2','L3'],   group: '衣柜' },
    'M-MD01': { id: 'M-MD01', code: 'MD01', room: 'M', name: '主卧下柜①', levels: ['L1'],             group: '衣柜' },
    'M-MD02': { id: 'M-MD02', code: 'MD02', room: 'M', name: '主卧下柜②', levels: ['L1'],             group: '衣柜' },
    'M-MD03': { id: 'M-MD03', code: 'MD03', room: 'M', name: '主卧下柜③', levels: ['L1'],             group: '衣柜' },

    // ======================== 次卧 ========================
    'S-SU01': { id: 'S-SU01', code: 'SU01', room: 'S', name: '次卧上柜①', levels: ['L1','L2','L3'],   group: '衣柜' },
    'S-SU02': { id: 'S-SU02', code: 'SU02', room: 'S', name: '次卧上柜②', levels: ['L1','L2'],         group: '衣柜' },
    'S-SD01': { id: 'S-SD01', code: 'SD01', room: 'S', name: '次卧下柜①', levels: ['L1'],             group: '衣柜' },
    'S-SD02': { id: 'S-SD02', code: 'SD02', room: 'S', name: '次卧下柜②', levels: ['L1'],             group: '衣柜' },
    'S-SD03': { id: 'S-SD03', code: 'SD03', room: 'S', name: '次卧下柜③', levels: ['L1'],             group: '衣柜' },

    // ======================== 厨房 - 水池柜(西侧) ========================
    'H-HS01': { id: 'H-HS01', code: 'HS01', room: 'H', name: 'HS01',      levels: ['L1'],             group: '水池柜·高柜' },
    'H-HS02': { id: 'H-HS02', code: 'HS02', room: 'H', name: '水池-高柜②',  levels: ['L1','L2','L3'],   group: '水池柜·底柜' },
    'H-HS03': { id: 'H-HS03', code: 'HS03', room: 'H', name: '水池-底柜③',  levels: ['L1','L2'],         group: '水池柜·底柜' },
    'H-HS04': { id: 'H-HS04', code: 'HS04', room: 'H', name: '水池-洗菜盆④', levels: ['L1'],  group: '水池柜·底柜' },
    'H-HS05': { id: 'H-HS05', code: 'HS05', room: 'H', name: '水池-底柜⑤',  levels: ['L1','L2'],         group: '水池柜·底柜' },
    'H-HS06': { id: 'H-HS06', code: 'HS06', room: 'H', name: '水池-底柜⑥',  levels: ['L1','L2'],         group: '水池柜·底柜' },
    'H-HS07': { id: 'H-HS07', code: 'HS07', room: 'H', name: '水池-吊柜⑦',  levels: ['L1','L2','L3'],   group: '水池柜·吊柜' },
    'H-HS08': { id: 'H-HS08', code: 'HS08', room: 'H', name: '水池-吊柜⑧',  levels: ['L1','L2'],         group: '水池柜·吊柜' },
    'H-HS09': { id: 'H-HS09', code: 'HS09', room: 'H', name: '水池-吊柜⑨',    levels: ['L1','L2'],         group: '水池柜·吊柜' },

    // ======================== 厨房 - 灶台柜(东侧) ========================
    'H-HT01': { id: 'H-HT01', code: 'HT01', room: 'H', name: '灶台-底柜①',  levels: ['L1','L2'],         group: '灶台柜·底柜' },
    'H-HT02': { id: 'H-HT02', code: 'HT02', room: 'H', name: '灶台-上抽屉②',    levels: ['L1','L2'],         group: '灶台柜·底柜' },
    'H-HT03': { id: 'H-HT03', code: 'HT03', room: 'H', name: '灶台-下抽屉③',    levels: ['L1'],             group: '灶台柜·底柜' },
    'H-HT04': { id: 'H-HT04', code: 'HT04', room: 'H', name: '灶台-底柜④',  levels: ['L1','L2'],         group: '灶台柜·底柜' },
    'H-HT05': { id: 'H-HT05', code: 'HT05', room: 'H', name: '灶台-底柜⑤',  levels: ['L1'],             group: '灶台柜·底柜' },
    'H-HT06': { id: 'H-HT06', code: 'HT06', room: 'H', name: '灶台-抽烟机⑥',    levels: [],                 group: '灶台柜·吊柜' },
    'H-HT09': { id: 'H-HT09', code: 'HT09', room: 'H', name: '灶台-吊柜左⑨',    levels: ['L1','L2'],         group: '灶台柜·吊柜' },
    'H-HT10': { id: 'H-HT10', code: 'HT10', room: 'H', name: '灶台-吊柜右⑩',    levels: ['L1','L2'],         group: '灶台柜·吊柜' },
    'H-HT07': { id: 'H-HT07', code: 'HT07', room: 'H', name: '灶台-吊柜⑦',  levels: ['L1','L2','L3'],   group: '灶台柜·吊柜' },    'H-HT08': { id: 'H-HT08', code: 'HT08', room: 'H', name: '灶台-吊柜⑧',  levels: ['L1','L2'],         group: '灶台柜·吊柜' },

    // ======================== 卫生间 ========================
    'W-WU01': { id: 'W-WU01', code: 'WU01', room: 'W', name: '卫生间吊柜',   levels: ['L1','L2'],         group: '卫生间' },
    'W-WJ01': { id: 'W-WJ01', code: 'WJ01', room: 'W', name: '镜箱·左柜',    levels: ['L1','L2'],         group: '卫生间' },
    'W-WJ02': { id: 'W-WJ02', code: 'WJ02', room: 'W', name: '镜箱·开放格',  levels: ['L1','L2','L3'],   group: '卫生间' },
    'W-WD01': { id: 'W-WD01', code: 'WD01', room: 'W', name: '水池柜',       levels: ['L1'],             group: '卫生间' },

    // ======================== 冰箱房 ========================
    'F-FU01': { id: 'F-FU01', code: 'FU01', room: 'F', name: '冰箱房吊柜',   levels: ['L1'],             group: '冰箱房' },
    'F-FK01': { id: 'F-FK01', code: 'FK01', room: 'F', name: '开放格',       levels: ['L1','L2','L3','L4','L5','L6'], group: '冰箱房' },
};

// ============================================================
// 柜子布局定义（用于柜子地图页面）
// 支持两种模式：
//   type: 'svg'   — 纯 SVG 绘制
//   type: 'photo' — 照片+可点击热区（百分比坐标 0-100）
// ============================================================

const CABINET_LAYOUTS = {

    // ========================
    // 客厅电视墙 — SVG 矢量图
    //   左侧并排：KL01(1层,KL02的1/5,下方空调位) + KL02(6层高柜)
    //   所有高柜(KL01/KL02/KR01-KR04)等宽65
    //   中上：KU01-KU05 5个上柜
    //   中间：电视区域 + KK01(3层开放格) — 加高
    //   中下：KK02(1层, 横跨) — 变矮 → KD01-KD04
    //   右侧：KR01-KR04 4扇高柜
    // ========================
    K: {
        type: 'svg',
        viewBox: '0 0 1000 700',
        cabinets: [
            // -- 左侧并排：KL01(1:5, 等宽65) + KL02(6层) --
            { id: 'K-KL01', x: 15, y: 20, w: 65, h: 132, rx: 6, groupLabel: '左侧' },
            { id: 'K-KL02', x: 85, y: 20, w: 65, h: 607, rx: 6 },

            // -- 中上：KU01-KU05 电视上柜 --
            { id: 'K-KU01', x: 165, y: 20, w: 102, h: 132, rx: 6, groupLabel: '上柜' },
            { id: 'K-KU02', x: 272, y: 20, w: 102, h: 132, rx: 6 },
            { id: 'K-KU03', x: 379, y: 20, w: 102, h: 132, rx: 6 },
            { id: 'K-KU04', x: 486, y: 20, w: 102, h: 132, rx: 6 },
            { id: 'K-KU05', x: 593, y: 20, w: 102, h: 132, rx: 6 },

            // -- 中间：电视区域 + KK01 开放格 (加高) --
            { id: 'K-KK01', x: 595, y: 157, w: 100, h: 330, rx: 6, groupLabel: '开放格' },

            // -- KK02 横跨电视+KK01等宽 (变矮) --
            { id: 'K-KK02', x: 165, y: 492, w: 530, h: 65, rx: 6, groupLabel: '开放格' },

            // -- KD01-KD04 电视下柜 --
            { id: 'K-KD01', x: 165, y: 562, w: 126, h: 65, rx: 6, groupLabel: '下柜' },
            { id: 'K-KD02', x: 296, y: 562, w: 126, h: 65, rx: 6 },
            { id: 'K-KD03', x: 427, y: 562, w: 126, h: 65, rx: 6 },
            { id: 'K-KD04', x: 558, y: 562, w: 137, h: 65, rx: 6 },

            // -- 右侧：KR01-KR04 4扇高柜 --
            { id: 'K-KR01', x: 720, y: 20, w: 65, h: 607, rx: 6, groupLabel: '右侧' },
            { id: 'K-KR02', x: 790, y: 20, w: 65, h: 607, rx: 6 },
            { id: 'K-KR03', x: 860, y: 20, w: 65, h: 607, rx: 6 },
            { id: 'K-KR04', x: 930, y: 20, w: 65, h: 607, rx: 6 }
        ],
        decorations: [
            // 电视区域 (加高)
            { type: 'rect', x: 195, y: 192, w: 380, h: 280, rx: 10, label: '📺 电视区域' },
            // KL01下方空调位
            { type: 'text', x: 47, y: 200, label: '⬇', fontSize: 14, color: '#ccc' },
            { type: 'text', x: 47, y: 360, label: '空', fontSize: 12, color: '#ddd' },
            { type: 'text', x: 47, y: 380, label: '调', fontSize: 12, color: '#ddd' },
            { type: 'text', x: 47, y: 400, label: '位', fontSize: 12, color: '#ddd' }
        ]
    },

    // ========================
    // 餐厅 — 餐边柜(左) + 鞋柜(右), 等宽
    // 餐边柜: 上2 + 下2
    // 鞋柜:   上3(XU) → 开放格(装饰) → 抽屉3(XM) → 下3(XD)
    // ========================
    C: {
        type: 'svg',
        viewBox: '0 0 1000 560',
        cabinets: [
            // ---- 餐边柜 (左半) ----
            // 上排变矮, 与鞋柜XU对齐
            { id: 'C-CU01', x: 25,  y: 20,  w: 210, h: 130, rx: 6, groupLabel: '餐边柜' },
            { id: 'C-CU02', x: 250, y: 20,  w: 210, h: 130, rx: 6 },
            // 下排, 与鞋柜XD对齐
            { id: 'C-CD01', x: 25,  y: 245, w: 210, h: 295, rx: 6 },
            { id: 'C-CD02', x: 250, y: 245, w: 210, h: 295, rx: 6 },

            // ---- 鞋柜 (右半) ----
            // 上排 (XU01-XU03)
            { id: 'C-XU01', x: 505, y: 20,  w: 145, h: 130, rx: 6, groupLabel: '鞋柜' },
            { id: 'C-XU02', x: 660, y: 20,  w: 145, h: 130, rx: 6 },
            { id: 'C-XU03', x: 815, y: 20,  w: 145, h: 130, rx: 6 },
            // 抽屉 (XM01-XM03)
            { id: 'C-XM01', x: 505, y: 245, w: 145, h: 50,  rx: 6 },
            { id: 'C-XM02', x: 660, y: 245, w: 145, h: 50,  rx: 6 },
            { id: 'C-XM03', x: 815, y: 245, w: 145, h: 50,  rx: 6 },
            // 下排 (XD01-XD03, 变矮)
            { id: 'C-XD01', x: 505, y: 300, w: 145, h: 240, rx: 6 },
            { id: 'C-XD02', x: 660, y: 300, w: 145, h: 240, rx: 6 },
            { id: 'C-XD03', x: 815, y: 300, w: 145, h: 240, rx: 6 }
        ],
        decorations: [
            { type: 'text', x: 250, y: 552, label: '餐边柜', fontSize: 13 },
            { type: 'text', x: 740, y: 552, label: '鞋柜',   fontSize: 13 },
            // 餐边柜开放格 (与鞋柜等高对齐)
            { type: 'rect', x: 25,  y: 155, w: 435, h: 85, rx: 3, label: '开放格' },
            // 鞋柜开放格
            { type: 'rect', x: 505, y: 155, w: 455, h: 85, rx: 3, label: '开放格' }
        ]
    },

    // ========================
    // 主卧 — 两列等宽, viewBox 600x500 一屏显示
    //   左列 MU01:MD01 = 2:1
    //   右列 MU02:MD02 = 7:1, MD02=MD03
    // ========================
    M: {
        type: 'svg',
        viewBox: '0 0 600 500',
        cabinets: [
            // 左列 (2:1) → 240+120=360
            { id: 'M-MU01', x: 30, y: 25,  w: 255, h: 240, rx: 6 },
            { id: 'M-MD01', x: 30, y: 275, w: 255, h: 125, rx: 6 },
            // 右列 (7:1:1) → 280+40+40=360
            { id: 'M-MU02', x: 315, y: 25,  w: 255, h: 280, rx: 6 },
            { id: 'M-MD02', x: 315, y: 315, w: 255, h: 40,  rx: 6 },
            { id: 'M-MD03', x: 315, y: 360, w: 255, h: 40,  rx: 6 }
        ],
        decorations: [
            { type: 'text', x: 300, y: 493, label: '主卧衣柜', fontSize: 13 }
        ]
    },

    // ========================
    // 次卧 — 两列等宽, viewBox 600x500 一屏显示
    //   左列 MU01:MD01 = 7:1, MD01=MD02
    //   右列 MU02:MD03 = 2:1
    // ========================
    S: {
        type: 'svg',
        viewBox: '0 0 600 500',
        cabinets: [
            // 左列 (7:1:1) → 280+40+40=360
            { id: 'S-SU01', x: 30,  y: 25,  w: 255, h: 280, rx: 6 },
            { id: 'S-SD01', x: 30,  y: 315, w: 255, h: 40,  rx: 6 },
            { id: 'S-SD02', x: 30,  y: 360, w: 255, h: 40,  rx: 6 },
            // 右列 (2:1) → 240+120=360
            { id: 'S-SU02', x: 315, y: 25,  w: 255, h: 240, rx: 6 },
            { id: 'S-SD03', x: 315, y: 280, w: 255, h: 120, rx: 6 }
        ],
        decorations: [
            { type: 'text', x: 300, y: 493, label: '次卧衣柜', fontSize: 13 }
        ]
    },

    // ========================
    // ========================
    // ========================
    // ========================
    // ========================
    // ========================
    // ========================
    // ========================
    // ========================
    // ========================
    // ========================
    // ========================
    // ========================
    // ========================
    // ========================
    // 厨房 — 水池柜(上) + 灶台柜(下)
    // HT02/HT03=HT07宽, HT04=HT08宽, HT01/HT06收窄, 上下对齐
    // ========================
    H: {
        type: 'svg',
        viewBox: '0 0 640 610',
        cabinets: [
            // ======== 水池柜 (上半) ========
            { id: 'H-HS02', x: 15,  y: 8,   w: 110, h: 80,  rx: 6 },
            { id: 'H-HS01', x: 15,  y: 140, w: 110, h: 21,  rx: 6 },
            { id: 'H-HS07', x: 135, y: 8,   w: 140, h: 80, rx: 6 },
            { id: 'H-HS08', x: 280, y: 8,   w: 140, h: 80, rx: 6 },
            { id: 'H-HS09', x: 383, y: 92,  w: 41,  h: 43, rx: 6 },
            { id: 'H-HS03', x: 135, y: 140, w: 65,  h: 150, rx: 6 },
            { id: 'H-HS04', x: 205, y: 140, w: 135, h: 150, rx: 6 },
            { id: 'H-HS05', x: 345, y: 140, w: 120, h: 150, rx: 6 },
            { id: 'H-HS06', x: 470, y: 140, w: 120, h: 150, rx: 6 },

            // ======== 灶台柜 (下半, 上下对齐) ========
            // 底柜: HT05→墙→HT04(55)→HT02/03(120)→HT01(160)
            { id: 'H-HT05', x: 15,  y: 450, w: 200, h: 150, rx: 6 },
            { id: 'H-HT04', x: 235, y: 450, w: 55,  h: 150, rx: 6 },
            { id: 'H-HT02', x: 295, y: 450, w: 120, h: 70,  rx: 6 },
            { id: 'H-HT03', x: 295, y: 524, w: 120, h: 76,  rx: 6 },
            { id: 'H-HT01', x: 420, y: 450, w: 160, h: 150, rx: 6 },
            // 吊柜: HT08(55)→HT07(120)→HT09(左40)+HT06(抽烟机70)+HT10(右40)
            { id: 'H-HT08', x: 235, y: 320, w: 55,  h: 80, rx: 6 },
            { id: 'H-HT07', x: 295, y: 320, w: 120, h: 80, rx: 6 },
            { id: 'H-HT09', x: 420, y: 320, w: 40,  h: 80, rx: 6 },
            { id: 'H-HT10', x: 535, y: 320, w: 40,  h: 80, rx: 6 }
        ],
        decorations: [
            // 洗碗机
            { type: 'rect', x: 17,  y: 165, w: 106, h: 123, rx: 6, label: '' },
            { type: 'text', x: 70,  y: 230, label: '洗碗机', fontSize: 11, color: '#777' },
            // 烤箱
            { type: 'rect', x: 17,  y: 92,  w: 106, h: 44,  rx: 6, label: '' },
            { type: 'text', x: 70,  y: 118, label: '烤箱', fontSize: 11, color: '#777' },
            // 洗菜池
            { type: 'text', x: 255, y: 155, label: '洗菜池', fontSize: 11, color: '#666' },
            // 垛子
            { type: 'rect', x: 424, y: 8,   w: 12, h: 80, rx: 2, label: '' },
            { type: 'text', x: 428, y: 48,  label: '垛', fontSize: 9, color: '#ccc' },
            // 抽烟机
            { type: 'text', x: 490, y: 360, label: '抽烟机', fontSize: 11, color: '#777' },
            // 灶台
            { type: 'text', x: 480, y: 467, label: '灶台', fontSize: 11, color: '#666' },
            // 抽屉
            { type: 'text', x: 340, y: 488, label: '抽屉', fontSize: 9, color: '#999' },
            { type: 'text', x: 340, y: 560, label: '抽屉', fontSize: 9, color: '#999' },
            // 墙
            { type: 'rect', x: 220, y: 320, w: 10, h: 280, rx: 2, label: '' },
            { type: 'text', x: 223, y: 330, label: '墙', fontSize: 8, color: '#ccc' },
            // 分隔文字
            { type: 'text', x: 320, y: 308, label: '— 水池柜 —', fontSize: 12, color: '#ddd' },
            { type: 'text', x: 450, y: 630, label: '— 灶台柜 —', fontSize: 12, color: '#ddd' }
        ]
    },

    // ========================
    // 阳台 — 上下2个对开门, 1:3, viewBox 600x480 一屏显示
    // ========================
    Y: {
        type: 'svg',
        viewBox: '0 0 600 480',
        cabinets: [
            // 上柜 1份: h=100
            { id: 'Y-Y01', x: 35, y: 25,  w: 530, h: 100, rx: 6 },
            // 下柜 3份: h=300
            { id: 'Y-Y02', x: 35, y: 140, w: 530, h: 300, rx: 6 }
        ],
        decorations: [
            { type: 'text', x: 300, y: 80,  label: '│', fontSize: 20, color: '#ccc' },
            { type: 'text', x: 300, y: 295, label: '│', fontSize: 20, color: '#ccc' },
            { type: 'text', x: 300, y: 468, label: '阳台柜', fontSize: 13 }
        ]
    },

    // ========================
    // 卫生间 — 镜箱+水池(左) | 吊柜+洗衣机(右), 同底边
    // 镜箱居中于水池柜上方, 镜箱:开放格≈2:1, 比水池窄
    // ========================
    W: {
        type: 'svg',
        viewBox: '0 0 700 500',
        cabinets: [
            // 镜箱 (左, 居中于水池柜, 2:1)
            { id: 'W-WJ01', x: 60, y: 20,  w: 118, h: 130, rx: 6, groupLabel: '镜箱' },
            { id: 'W-WJ02', x: 182, y: 20,  w: 60,  h: 130, rx: 6 },
            // 水池柜 (比镜箱宽, 与洗衣机底对齐)
            { id: 'W-WD01', x: 20, y: 170, w: 260, h: 200, rx: 6, groupLabel: '水池' },
            // 吊柜 (右, 下方洗衣机)
            { id: 'W-WU01', x: 300, y: 20,  w: 260, h: 140, rx: 6, groupLabel: '吊柜' }
        ],
        decorations: [
            { type: 'text', x: 119, y: 90,  label: '镜箱·左', fontSize: 11, color: '#999' },
            { type: 'text', x: 212, y: 90,  label: '开放格', fontSize: 11, color: '#999' },
            { type: 'text', x: 150, y: 275, label: '水池柜', fontSize: 12, color: '#999' },
            { type: 'text', x: 430, y: 95,  label: '吊柜', fontSize: 12, color: '#999' },
            // 洗衣机 (吊柜下方, 与水池柜底对齐 y=370)
            { type: 'rect', x: 302, y: 170, w: 256, h: 200, rx: 8, label: '' },
            { type: 'text', x: 430, y: 265, label: '洗衣机', fontSize: 13, color: '#999' },
            { type: 'text', x: 430, y: 290, label: '(不储物)', fontSize: 11, color: '#ccc' },
            { type: 'text', x: 350, y: 490, label: '卫生间', fontSize: 13, color: '#ccc' }
        ]
    },

    // ========================
    // 冰箱房 — 吊柜 + 冰箱(固定) + 窄开放格6层
    // ========================
    F: {
        type: 'svg',
        viewBox: '0 0 600 520',
        cabinets: [
            { id: 'F-FU01', x: 30, y: 20,  w: 440, h: 120, rx: 6 },
            { id: 'F-FK01', x: 480, y: 20,  w: 90,  h: 460, rx: 6 }
        ],
        decorations: [
            { type: 'text', x: 250, y: 85,  label: '吊柜', fontSize: 12, color: '#999' },
            { type: 'rect', x: 32,  y: 155, w: 436, h: 325, rx: 8, label: '' },
            { type: 'text', x: 250, y: 310, label: '冰箱', fontSize: 14, color: '#999' },
            { type: 'text', x: 250, y: 335, label: '(不储物)', fontSize: 11, color: '#ccc' },
            { type: 'text', x: 525, y: 250, label: '开', fontSize: 10, color: '#999' },
            { type: 'text', x: 525, y: 268, label: '放', fontSize: 10, color: '#999' },
            { type: 'text', x: 525, y: 286, label: '格', fontSize: 10, color: '#999' },
            { type: 'text', x: 300, y: 510, label: '冰箱房', fontSize: 13, color: '#ccc' }
        ]
    }
};

// ============================================================
// 辅助函数
// ============================================================

/**
 * 根据房间 ID 获取房间信息
 * @param {string} roomId
 * @returns {object|null}
 */
function getRoomById(roomId) {
    return ROOMS[roomId] || null;
}

/**
 * 获取所有房间列表（按 order 排序）
 * @returns {Array}
 */
function getAllRooms() {
    return Object.values(ROOMS).sort((a, b) => a.order - b.order);
}

/**
 * 根据房间 ID 获取该房间所有柜子
 * @param {string} roomId
 * @returns {Array}
 */
function getCabinetsByRoom(roomId) {
    return Object.values(CABINETS).filter(c => c.room === roomId);
}

/**
 * 根据柜子 ID 获取柜子信息
 * @param {string} cabinetId — 全局唯一 ID（如 K-KL01）
 * @returns {object|null}
 */
function getCabinetById(cabinetId) {
    return CABINETS[cabinetId] || null;
}

/**
 * 根据房间 ID 获取该房间柜子布局
 * @param {string} roomId
 * @returns {object|null}
 */
function getCabinetLayout(roomId) {
    return CABINET_LAYOUTS[roomId] || null;
}

/**
 * 获取所有柜子列表
 * @returns {Array}
 */
function getAllCabinets() {
    return Object.values(CABINETS);
}

/**
 * 获取柜子的层数列表
 * @param {string} cabinetId
 * @returns {Array}
 */
function getCabinetLevels(cabinetId) {
    const cabinet = CABINETS[cabinetId];
    return cabinet ? cabinet.levels : ['L1', 'L2', 'L3', 'L4'];
}

/**
 * 获取柜子的显示名称（code + name）
 * @param {string} cabinetId
 * @returns {string}
 */
function getCabinetDisplayName(cabinetId) {
    const cabinet = CABINETS[cabinetId];
    if (!cabinet) return cabinetId;
    return `${cabinet.code} - ${cabinet.name}`;
}

// ============================================================
// 应用版本号
// ============================================================
const APP_VERSION = '2.0.0';
const APP_NAME = '家庭收纳管理系统';
const APP_NAME_EN = 'Home Storage Manager';
