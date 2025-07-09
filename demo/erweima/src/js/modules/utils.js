/**
 * 工具函数模块
 * 包含防抖函数和其他通用工具函数
 */

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

/**
 * 将SVG渲染到Canvas并应用圆角效果
 * @param {SVGElement} svgElement - SVG元素
 * @param {Object} options - 渲染选项
 * @returns {Promise<HTMLCanvasElement>} - 渲染后的Canvas
 */
export async function renderSVGToCanvas(svgElement, options) {
    if (!svgElement) {
        throw new Error('没有可用的SVG元素');
    }

    const { size, bgColor, fgColor, cornerRadius } = options;
    
    // 创建一个深度克隆的SVG副本，避免修改原始SVG
    const svgClone = svgElement.cloneNode(true);
    
    // 确保SVG尺寸正确
    svgClone.setAttribute('width', size);
    svgClone.setAttribute('height', size);
    
    // 确保背景色正确
    const bgRect = svgClone.querySelector('rect');
    if (bgRect) {
        bgRect.setAttribute('fill', bgColor);
    }
    
    // 确保所有路径使用正确的前景色
    const paths = svgClone.querySelectorAll('path, polygon');
    paths.forEach(path => {
        path.setAttribute('fill', fgColor);
    });

    // 创建一个离屏Canvas用于渲染SVG
    const svgCanvas = document.createElement('canvas');
    svgCanvas.width = size;
    svgCanvas.height = size;
    const svgCtx = svgCanvas.getContext('2d');

    // 将SVG转换为XML字符串，确保包含所有命名空间
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // 创建图片对象
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // 处理可能的跨域问题

    // 等待图片加载完成
    await new Promise((resolve, reject) => {
        img.onload = () => {
            try {
                // 绘制到SVG Canvas
                svgCtx.drawImage(img, 0, 0, size, size);
                resolve();
            } catch (err) {
                reject(err);
            }
        };
        img.onerror = (err) => {
            reject(new Error('加载SVG图片失败'));
        };
        img.src = svgUrl;
    });

    // 释放SVG URL
    URL.revokeObjectURL(svgUrl);

    // 创建最终的Canvas，应用圆角效果
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = size;
    finalCanvas.height = size;
    const finalCtx = finalCanvas.getContext('2d');

    // 应用圆角效果
    if (cornerRadius > 0) {
        // 创建圆角路径
        finalCtx.beginPath();
        finalCtx.moveTo(cornerRadius, 0);
        finalCtx.lineTo(size - cornerRadius, 0);
        finalCtx.quadraticCurveTo(size, 0, size, cornerRadius);
        finalCtx.lineTo(size, size - cornerRadius);
        finalCtx.quadraticCurveTo(size, size, size - cornerRadius, size);
        finalCtx.lineTo(cornerRadius, size);
        finalCtx.quadraticCurveTo(0, size, 0, size - cornerRadius);
        finalCtx.lineTo(0, cornerRadius);
        finalCtx.quadraticCurveTo(0, 0, cornerRadius, 0);
        finalCtx.closePath();
        
        // 设置裁剪区域
        finalCtx.save();
        finalCtx.clip();
        
        // 绘制背景
        finalCtx.fillStyle = bgColor;
        finalCtx.fillRect(0, 0, size, size);
        
        // 绘制SVG内容
        finalCtx.drawImage(svgCanvas, 0, 0);
        
        // 恢复裁剪区域
        finalCtx.restore();
    } else {
        // 无圆角，直接绘制
        finalCtx.fillStyle = bgColor;
        finalCtx.fillRect(0, 0, size, size);
        finalCtx.drawImage(svgCanvas, 0, 0);
    }

    return finalCanvas;
} 