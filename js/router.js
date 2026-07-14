/**
 * 家庭收纳管理系统 — 路由模块
 * 基于 URL hash 的简单路由
 * 支持路径参数和查询参数
 *
 * @module router
 * @version 1.0.0
 */

/**
 * 路由类
 * 用法：
 *   const router = new Router();
 *   router.on('/search', () => showSearchPage());
 *   router.on('/map/:room/:cabinet?/:level?', (params) => showMapPage(params));
 *   router.start();
 */
class Router {
    constructor() {
        this.routes = [];
        this.currentRoute = null;
        this.onChangeCallbacks = [];
    }

    /**
     * 注册路由
     * 支持路径参数，如 /map/:room/:cabinet
     *
     * @param {string} pattern - 路由模式
     * @param {Function} handler - 处理函数，接收 params 对象
     * @returns {Router}
     */
    on(pattern, handler) {
        // 将模式转换为正则
        const paramNames = [];
        const regexStr = pattern
            .replace(/\//g, '\\/')
            .replace(/:(\w+)/g, (_, name) => {
                paramNames.push(name);
                return '([^/?#]+)';
            })
            .replace(/\?/g, '\\?');

        const regex = new RegExp('^' + regexStr + '$');

        this.routes.push({
            pattern,
            regex,
            paramNames,
            handler
        });

        return this;
    }

    /**
     * 注册路由变化监听器
     * @param {Function} callback
     */
    onChange(callback) {
        this.onChangeCallbacks.push(callback);
    }

    /**
     * 启动路由（监听 hashchange）
     */
    start() {
        window.addEventListener('hashchange', () => this._handleRoute());
        // 立即处理当前 hash
        this._handleRoute();
    }

    /**
     * 导航到指定路径
     * @param {string} path - 如 '/search' 或 '/map/K/K09'
     * @param {object} [query] - 查询参数
     */
    navigate(path, query) {
        const url = buildHash(path, query);
        location.hash = url;
    }

    /**
     * 替换当前路由（不产生历史记录）
     * @param {string} path
     * @param {object} [query]
     */
    replace(path, query) {
        const url = buildHash(path, query);
        history.replaceState(null, '', '#' + url.slice(1));
        this._handleRoute();
    }

    /**
     * 获取当前路由信息
     * @returns {object}
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * 处理路由变化
     * @private
     */
    _handleRoute() {
        const { path, query } = parseHash();

        // 默认路由为搜索页
        const targetPath = path === '/' ? '/search' : path;

        let matched = false;

        for (const route of this.routes) {
            const match = targetPath.match(route.regex);
            if (match) {
                // 构建参数对象
                const params = { query };
                route.paramNames.forEach((name, i) => {
                    params[name] = match[i + 1];
                });

                this.currentRoute = { pattern: route.pattern, params };

                // 调用处理函数
                try {
                    route.handler(params);
                } catch (e) {
                    console.error('路由处理出错:', e);
                }

                matched = true;

                // 触发回调
                this.onChangeCallbacks.forEach(cb => {
                    try { cb(this.currentRoute); } catch (e) { /* ignore */ }
                });

                break;
            }
        }

        if (!matched) {
            // 404 - 回退到搜索页
            console.warn('未匹配的路由:', targetPath);
            this.navigate('/search');
        }
    }
}

// ============================================================
// 创建全局路由实例
// ============================================================
const router = new Router();
