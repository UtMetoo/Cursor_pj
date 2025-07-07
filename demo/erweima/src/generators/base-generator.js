// 基础二维码生成器类
class BaseQRCodeGenerator {
    constructor(options = {}) {
        console.log('[BaseQRCodeGenerator] Initializing with options:', options);
        this.options = {
            width: options.size || 300,
            height: options.size || 300,
            margin: options.margin || 1,
            errorCorrectionLevel: this._getErrorCorrectionLevel(options.errorCorrectionLevel),
            foreground: options.foreground || '#000000',
            background: options.background || '#ffffff',
            logo: options.logo || null
        };
        
        // 检查ZXing库是否可用
        if (typeof ZXing === 'undefined') {
            throw new Error('ZXing库未加载，请检查依赖');
        }
        
        // 创建ZXing写入器
        this.writer = new ZXing.BrowserQRCodeSvgWriter();
        
        // 创建Logo管理器（如果可用）
        try {
            if (typeof LogoManager !== 'undefined') {
                this.logoManager = new LogoManager(options);
                console.log('[BaseQRCodeGenerator] LogoManager 已加载');
            } else {
                console.warn('[BaseQRCodeGenerator] LogoManager 未定义，将使用内置的Logo处理');
                this.logoManager = null;
            }
        } catch (error) {
            console.warn('[BaseQRCodeGenerator] 创建LogoManager失败:', error);
            this.logoManager = null;
        }
    }

    _getErrorCorrectionLevel(level) {
        const levels = {
            'L': ZXing.QRCodeDecoderErrorCorrectionLevel.L,
            'M': ZXing.QRCodeDecoderErrorCorrectionLevel.M,
            'Q': ZXing.QRCodeDecoderErrorCorrectionLevel.Q,
            'H': ZXing.QRCodeDecoderErrorCorrectionLevel.H
        };
        return levels[level || 'M'] || levels['M'];
    }

    async generate(content) {
        if (!content) {
            throw new Error('内容不能为空');
        }

        try {
            console.log('[BaseQRCodeGenerator] Generating QR code for content:', content);
            
            const hints = new Map();
            hints.set(ZXing.EncodeHintType.ERROR_CORRECTION, this.options.errorCorrectionLevel);
            hints.set(ZXing.EncodeHintType.MARGIN, this.options.margin);
            
            // 生成SVG二维码
            const svgElement = this.writer.write(
                content,
                this.options.width,
                this.options.height,
                hints
            );

            // 添加自定义样式
            if (this.options.cornerRadius) {
                const rect = svgElement.querySelector('rect');
                if (rect) {
                    rect.setAttribute('rx', this.options.cornerRadius);
                    rect.setAttribute('ry', this.options.cornerRadius);
                }
            }

            // 设置颜色
            const rect = svgElement.querySelector('rect');
            if (rect) {
                rect.setAttribute('fill', this.options.background);
            }

            const paths = svgElement.querySelectorAll('path');
            paths.forEach(path => {
                path.setAttribute('fill', this.options.foreground);
            });

            // 如果有Logo，添加Logo
            if (this.options.logo) {
                // 确保SVG元素有正确的宽高属性
                const width = parseInt(svgElement.getAttribute('width')) || this.options.width;
                const height = parseInt(svgElement.getAttribute('height')) || this.options.height;
                
                console.log('[BaseQRCodeGenerator] 添加Logo前的SVG尺寸:', {
                    width: width,
                    height: height,
                    attrWidth: svgElement.getAttribute('width'),
                    attrHeight: svgElement.getAttribute('height')
                });
                
                if (this.logoManager) {
                    // 使用LogoManager添加Logo
                    await this.logoManager.addLogoToSvg(
                        svgElement,
                        this.options.logo,
                        width,
                        height
                    );
                } else {
                    // 使用内置方法添加Logo
                    await this._addLogoToSvg(svgElement, width, height);
                }
            }

            // 验证SVG生成
            console.log('[BaseQRCodeGenerator] Generated SVG:', {
                width: svgElement.getAttribute('width'),
                height: svgElement.getAttribute('height'),
                viewBox: svgElement.getAttribute('viewBox')
            });

            return svgElement;
        } catch (error) {
            console.error('[BaseQRCodeGenerator] Error:', error);
            throw new Error(`生成二维码失败: ${error.message}`);
        }
    }

    // 内置的Logo添加方法（当LogoManager不可用时使用）
    async _addLogoToSvg(svgElement, width, height) {
        try {
            // 预加载Logo图片
            await this._preloadImage(this.options.logo);
            
            // 生成唯一ID
            const uniqueId = 'qr-' + Math.random().toString(36).substr(2, 9);
            
            // 确保width和height是数字
            width = Number(width);
            height = Number(height);
            
            if (isNaN(width) || isNaN(height)) {
                throw new Error('无效的SVG尺寸');
            }
            
            // 计算Logo尺寸和位置
            const logoSize = Math.min(width, height) * 0.2; // 使用20%的尺寸
            const logoX = (width - logoSize) / 2;
            const logoY = (height - logoSize) / 2;
            const centerX = logoX + logoSize / 2;
            const centerY = logoY + logoSize / 2;
            
            console.log('[BaseQRCodeGenerator] 内置Logo处理 - 尺寸计算:', {
                width, height, logoSize, logoX, logoY, centerX, centerY
            });

            // 创建defs元素
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            
            // 创建阴影滤镜
            const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
            filter.setAttribute('id', `shadow-${uniqueId}`);
            filter.innerHTML = `
                <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                <feOffset dx="0" dy="0" result="offsetblur"/>
                <feFlood flood-color="rgba(0,0,0,0.2)"/>
                <feComposite in2="offsetblur" operator="in"/>
                <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            `;
            defs.appendChild(filter);

            // 创建Logo的圆形裁剪路径
            const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
            clipPath.setAttribute('id', `logo-clip-${uniqueId}`);
            const clipCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            clipCircle.setAttribute('cx', centerX);
            clipCircle.setAttribute('cy', centerY);
            clipCircle.setAttribute('r', logoSize / 2);
            clipPath.appendChild(clipCircle);
            defs.appendChild(clipPath);

            // 添加defs到SVG
            svgElement.insertBefore(defs, svgElement.firstChild);

            // 创建白色圆形背景
            const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            bgCircle.setAttribute('class', 'logo-background');
            bgCircle.setAttribute('cx', centerX);
            bgCircle.setAttribute('cy', centerY);
            bgCircle.setAttribute('r', (logoSize / 2) + 5);
            bgCircle.setAttribute('fill', 'white');
            bgCircle.setAttribute('filter', `url(#shadow-${uniqueId})`);

            // 创建Logo图片元素
            const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            image.setAttribute('class', 'logo-image');
            image.setAttribute('x', logoX);
            image.setAttribute('y', logoY);
            image.setAttribute('width', String(logoSize));
            image.setAttribute('height', String(logoSize));
            image.setAttribute('href', this.options.logo);
            image.setAttribute('clip-path', `url(#logo-clip-${uniqueId})`);

            // 添加元素到SVG
            svgElement.appendChild(bgCircle);
            svgElement.appendChild(image);

            return svgElement;
        } catch (error) {
            console.error('[BaseQRCodeGenerator] Error adding logo:', error);
            throw new Error('添加Logo失败: ' + error.message);
        }
    }

    async _preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error('Logo加载失败: ' + (e.message || '未知错误')));
            img.src = src;
        });
    }

    _handleError(error) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = `生成二维码时出错: ${error.message}`;
            errorElement.style.display = 'block';
        }
    }
}

// 导出基础生成器类
window.BaseQRCodeGenerator = BaseQRCodeGenerator; 