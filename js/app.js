/**
 * 家庭收纳管理系统 — 应用主入口
 * 负责初始化数据库、注册路由、管理导航栏、启动应用
 *
 * @module app
 * @version 1.0.0
 */

// ============================================================
// 应用初始化
// ============================================================

/**
 * 启动应用
 * 1. 初始化 IndexedDB
 * 2. 注册所有路由
 * 3. 渲染导航栏
 * 4. 启动路由监听
 */
async function initApp() {
    try {
        // 初始化数据库
        await openDB();
        console.log('✅ 数据库已就绪');
    } catch (e) {
        console.error('❌ 数据库初始化失败:', e);
        showToast('数据库初始化失败，请刷新页面', 'error', 5000);
        return;
    }

    // 渲染导航栏
    renderNavBar();

    // 注册路由
    registerRoutes();

    // 启动路由
    router.start();

    // 从云端拉取最新数据
    setTimeout(() => cloudPullOnStartup(), 1000);

    console.log(`🏠 ${APP_NAME} v${APP_VERSION} 已启动`);
}

// ============================================================
// 导航栏
// ============================================================

/**
 * 渲染底部导航栏
 */
function renderNavBar() {
    // 移除旧导航栏
    const existing = $('#nav-bar');
    if (existing) existing.remove();

    const navItems = [
        { path: '/search',   icon: '🔍', label: '搜索',   page: 'search' },
        { path: '/add',      icon: '➕', label: '新增',   page: 'add' },
        { path: '/map',      icon: '🗄️', label: '地图',   page: 'map' },
        { path: '/settings', icon: '⚙️', label: '设置',   page: 'settings' }
    ];

    const nav = createElement('nav', { id: 'nav-bar' });

    navItems.forEach(item => {
        const btn = createElement('button', {
            className: 'nav-item',
            dataset: { page: item.page },
            onClick: () => router.navigate(item.path)
        }, [
            createElement('span', { className: 'nav-icon' }, item.icon),
            createElement('span', { className: 'nav-label' }, item.label)
        ]);
        nav.appendChild(btn);
    });

    document.body.appendChild(nav);

    // 监听路由变化以更新导航栏高亮
    router.onChange((route) => {
        updateNavActive(route);
    });
}

/**
 * 更新导航栏激活状态
 */
function updateNavActive(route) {
    if (!route) return;

    const params = route.params || {};
    const pattern = route.pattern || '';

    // 根据路由模式判断当前页面
    let currentPage = 'search';

    if (pattern.startsWith('/map')) {
        currentPage = 'map';
    } else if (pattern.startsWith('/add')) {
        currentPage = 'add';
    } else if (pattern.startsWith('/settings')) {
        currentPage = 'settings';
    } else if (pattern.startsWith('/search') || pattern === '/') {
        currentPage = 'search';
    }

    // 更新导航按钮状态
    $$('.nav-item').forEach(btn => {
        if (btn.dataset.page === currentPage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ============================================================
// 路由注册
// ============================================================

/**
 * 注册所有页面路由
 */
function registerRoutes() {
    // 首页（搜索）
    router.on('/search', (params) => {
        renderSearchPage(params);
    });

    // 兼容旧版：根路径 = 搜索
    router.on('/', () => {
        renderSearchPage({});
    });

    // 新增物品
    router.on('/add', () => {
        renderAddPage({});
    });

    // 编辑物品
    router.on('/add/:id', (params) => {
        renderAddPage(params);
    });

    // 柜子地图 - 房间选择
    router.on('/map', () => {
        renderMapPage({});
    });

    // 柜子地图 - 房间柜子布局
    router.on('/map/:room', (params) => {
        renderMapPage(params);
    });

    // 柜子地图 - 柜子详情（含层级）
    router.on('/map/:room/:cabinet', (params) => {
        renderMapPage(params);
    });

    // 柜子地图 - 柜子详情 + 指定层
    router.on('/map/:room/:cabinet/:level', (params) => {
        renderMapPage(params);
    });

    // 设置
    router.on('/settings', () => {
        renderSettingsPage();
    });
}

// ============================================================
// 全局错误处理
// ============================================================

window.addEventListener('error', function (e) {
    console.error('全局错误:', e.error);
});

window.addEventListener('unhandledrejection', function (e) {
    console.error('未处理的 Promise 拒绝:', e.reason);
});

// ============================================================
// 启动
// ============================================================

// 等 DOM 加载完成后启动
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
