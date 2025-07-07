// Logo管理器类
class LogoManager {
    constructor(options = {}) {
        console.log('[LogoManager] 初始化配置:', options);
        
        this.options = {
            size: options.size || 0.2,          // Logo大小占二维码的比例
            margin: options.margin || 0.1,       // Logo边距占Logo大小的比例
            borderRadius: options.borderRadius || 0.15, // Logo圆角占Logo大小的比例
            borderColor: options.borderColor || 'white', // Logo边框颜色
            borderWidth: options.borderWidth || 5,      // Logo边框宽度
            shadowBlur: options.shadowBlur || 5,        // 阴影模糊半径
            shadowColor: options.shadowColor || 'rgba(0, 0, 0, 0.2)' // 阴影颜色
        };
    }

    // 预加载Logo图片
    async _preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error('Logo加载失败: ' + (e.message || '未知错误')));
            img.src = src;
        });
    }

    // 生成唯一ID
    _generateUniqueId() {
        return 'qr-' + Math.random().toString(36).substr(2, 9);
    }

    // 创建阴影滤镜
    _createShadowFilter(defs, uniqueId) {
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', `shadow-${uniqueId}`);
        filter.innerHTML = `
            <feGaussianBlur in="SourceAlpha" stdDeviation="${this.options.shadowBlur}"/>
            <feOffset dx="0" dy="0" result="offsetblur"/>
            <feFlood flood-color="${this.options.shadowColor}"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        `;
        defs.appendChild(filter);
        return filter;
    }

    // 创建Logo的圆形裁剪路径
    _createLogoClipPath(defs, uniqueId, centerX, centerY, radius) {
        const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        clipPath.setAttribute('id', `logo-clip-${uniqueId}`);
        
        const clipCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        clipCircle.setAttribute('cx', centerX);
        clipCircle.setAttribute('cy', centerY);
        clipCircle.setAttribute('r', radius);
        
        clipPath.appendChild(clipCircle);
        defs.appendChild(clipPath);
        return clipPath;
    }

    // 创建Logo背景圆形
    _createLogoBackground(centerX, centerY, radius, uniqueId) {
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('class', 'logo-background');
        bgCircle.setAttribute('cx', centerX);
        bgCircle.setAttribute('cy', centerY);
        bgCircle.setAttribute('r', radius + this.options.borderWidth);
        bgCircle.setAttribute('fill', 'white');
        bgCircle.setAttribute('filter', `url(#shadow-${uniqueId})`);
        return bgCircle;
    }

    // 创建Logo图片元素
    _createLogoImage(x, y, size, logoUrl, uniqueId) {
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('class', 'logo-image');
        image.setAttribute('x', x);
        image.setAttribute('y', y);
        // 确保尺寸是数字，而不是字符串
        image.setAttribute('width', String(size));
        image.setAttribute('height', String(size));
        image.setAttribute('href', logoUrl);
        image.setAttribute('clip-path', `url(#logo-clip-${uniqueId})`);
        return image;
    }

    // 添加Logo到SVG
    async addLogoToSvg(svgElement, logoUrl, width, height) {
        try {
            console.log('[LogoManager] 开始添加Logo:', { width, height, logoUrl });
            
            // 确保width和height是数字
            width = Number(width);
            height = Number(height);
            
            if (isNaN(width) || isNaN(height)) {
                throw new Error('无效的SVG尺寸');
            }
            
            // 预加载Logo图片
            await this._preloadImage(logoUrl);
            
            // 生成唯一ID
            const uniqueId = this._generateUniqueId();
            
            // 计算Logo尺寸和位置
            const logoSize = Math.min(width, height) * this.options.size;
            const logoX = (width - logoSize) / 2;
            const logoY = (height - logoSize) / 2;
            const centerX = logoX + logoSize / 2;
            const centerY = logoY + logoSize / 2;
            
            console.log('[LogoManager] Logo尺寸计算:', { 
                width, height, 
                logoSize, 
                logoX, logoY, 
                centerX, centerY 
            });
            
            // 创建defs元素
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svgElement.insertBefore(defs, svgElement.firstChild);
            
            // 创建阴影滤镜
            this._createShadowFilter(defs, uniqueId);
            
            // 创建Logo的圆形裁剪路径
            this._createLogoClipPath(defs, uniqueId, centerX, centerY, logoSize / 2);
            
            // 创建Logo背景圆形
            const bgCircle = this._createLogoBackground(centerX, centerY, logoSize / 2, uniqueId);
            
            // 创建Logo图片元素
            const image = this._createLogoImage(logoX, logoY, logoSize, logoUrl, uniqueId);
            
            // 添加元素到SVG
            svgElement.appendChild(bgCircle);
            svgElement.appendChild(image);
            
            console.log('[LogoManager] Logo添加成功');
            return svgElement;
        } catch (error) {
            console.error('[LogoManager] 添加Logo失败:', error);
            throw new Error('添加Logo失败: ' + error.message);
        }
    }
}

// 导出LogoManager类
window.LogoManager = LogoManager; 