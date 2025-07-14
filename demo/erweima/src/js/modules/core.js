/**
 * 核心模块 - 配置管理和工具函数
 * 合并了原 config.js 和 utils.js 的功能
 */

// ============================
// 配置管理区域 (原 config.js)
// ============================

/**
 * 二维码默认选项
 */
export const defaultQROptions = {
    size: 300,
    foreground: '#000000',
    background: '#FFFFFF',
    cornerRadius: 0,
    logo: null,
    errorCorrectionLevel: 'H',
    margin: 1
};

/**
 * Logo处理相关配置
 */
export const logoConfig = {
    size: 0.2,          // Logo大小占二维码的比例
    margin: 0.1,        // Logo边距占Logo大小的比例
    borderRadius: 0.15, // Logo圆角占Logo大小的比例
    borderColor: '#fff',// Logo边框颜色
    borderWidth: 5,     // Logo边框宽度
    shadowBlur: 5,      // 阴影模糊半径
    shadowColor: 'rgba(0, 0, 0, 0.2)' // 阴影颜色
};

// ============================
// 工具函数区域 (原 utils.js)
// ============================

/**
 * 防抖函数 - 延迟执行函数，避免频繁调用
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 延迟时间（毫秒）
 * @returns {Function} - 包装后的函数
 */
export function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * 显示提示消息
 * @param {string} message - 提示消息
 * @param {string} type - 提示类型（success, error, info）
 */
export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }, 100);
}

/**
 * 显示错误信息
 * @param {string} message - 错误消息
 * @param {HTMLElement} container - 显示错误的容器
 */
export function showError(message, container) {
    if (container) {
        container.innerHTML = `<p class="error">${message}</p>`;
    } else {
        console.error(message);
    }
} 