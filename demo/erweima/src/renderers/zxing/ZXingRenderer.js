/**
 * ZXing渲染器类
 * 负责生成和渲染二维码
 */
class ZXingRenderer {
    // 静态缓存，避免重复创建writer对象
    static _writerCache = new Map();
    
    constructor(options = {}) {
        if (typeof options.size === 'number' && options.size <= 0) {
            throw new Error('无效的二维码大小');
        }

        this.svgBuilder = new SVGBuilder();
        this.colorManager = new ColorManager();
        this.moduleSize = 0;
        this.margin = options.margin || 0.5;
        this.size = options.size || 300;
        this.options = {
            ...options,
            errorCorrectionLevel: options.errorCorrectionLevel || 'H'
        };
        
        // 初始化样式
        this.setStyle(options);

        // 初始化ZXing编码器
        this.initializeEncoder();
    }

    /**
     * 初始化ZXing编码器（使用缓存优化）
     */
    initializeEncoder() {
        try {
            // 检查ZXing库是否存在
            if (typeof ZXing === 'undefined') {
                throw new Error('ZXing库未加载');
            }

            // 使用缓存的writer实例
            if (typeof ZXing.BrowserQRCodeSvgWriter !== 'undefined') {
                if (!ZXingRenderer._writerCache.has('svg')) {
                    ZXingRenderer._writerCache.set('svg', new ZXing.BrowserQRCodeSvgWriter());
                }
                this.writer = ZXingRenderer._writerCache.get('svg');
                this.writerType = 'svg';
            } else if (typeof ZXing.QRCodeWriter !== 'undefined') {
                if (!ZXingRenderer._writerCache.has('matrix')) {
                    ZXingRenderer._writerCache.set('matrix', new ZXing.QRCodeWriter());
                }
                this.writer = ZXingRenderer._writerCache.get('matrix');
                this.writerType = 'matrix';
            } else {
                throw new Error('找不到可用的二维码编码器');
            }
            
        } catch (error) {
            console.error('初始化ZXing编码器失败:', error);
            throw new Error(`初始化编码器失败: ${error.message}`);
        }
    }

    /**
     * 设置二维码样式
     */
    setStyle(options = {}) {
        if (options.foreground) {
            this.colorManager.setForegroundColor(options.foreground);
        }
        if (options.background) {
            this.colorManager.setBackgroundColor(options.background);
        }
        if (typeof options.margin === 'number') {
            this.margin = options.margin;
        }
        if (typeof options.size === 'number') {
            if (options.size <= 0) {
                throw new Error('无效的二维码大小');
            }
            this.size = options.size;
        }
        // 明确设置圆角值，即使是0
        if (typeof options.cornerRadius === 'number') {
            this.cornerRadius = options.cornerRadius;
            console.log(`圆角已设置为: ${this.cornerRadius}px`);
        }
    }

    /**
     * 生成二维码
     */
    async generate(content) {
        if (!content) {
            throw new Error('内容不能为空');
        }

        try {
            let svgElement;

            if (this.writerType === 'svg') {
                // 使用BrowserQRCodeSvgWriter
                svgElement = this.generateWithSvgWriter(content);
            } else if (this.writerType === 'matrix') {
                // 使用QRCodeWriter生成矩阵，然后转换为SVG
                svgElement = this.generateWithMatrixWriter(content);
            } else {
                throw new Error('未知的编码器类型');
            }

            // 确保返回的是SVG元素
            if (!(svgElement instanceof SVGElement)) {
                throw new Error('生成的不是有效的SVG元素');
            }

            // 先应用圆角效果（在其他操作之前）
            if (this.cornerRadius > 0) {
                const modules = svgElement.querySelectorAll('rect');
                modules.forEach(module => {
                    // 只给二维码模块添加圆角，不包括背景
                    if (!module.classList.contains('qr-background')) {
                        module.setAttribute('rx', this.cornerRadius);
                        module.setAttribute('ry', this.cornerRadius);
                    }
                });
            }

            // 应用自定义样式
            this.colorManager.applyColors(
                svgElement,
                this.colorManager.getForegroundColor(),
                this.colorManager.getBackgroundColor()
            );

            // 添加Logo（如果有）
            if (this.options.logo) {
                await this.addLogo(svgElement);
            }

            return svgElement;
        } catch (error) {
            console.error('生成二维码时出错:', error);
            throw new Error(`生成二维码失败: ${error.message}`);
        }
    }

    /**
     * 使用BrowserQRCodeSvgWriter生成SVG
     */
    generateWithSvgWriter(content) {
        try {
            // 尝试不同的参数组合
            const attempts = [
                // 尝试1: 最简单的调用
                () => this.writer.write(content, this.size, this.size),
                // 尝试2: 带Map hints
                () => this.writer.write(content, this.size, this.size, new Map()),
                // 尝试3: 带BarcodeFormat
                () => this.writer.write(content, ZXing.BarcodeFormat.QR_CODE, this.size, this.size),
                // 尝试4: 完整参数
                () => this.writer.write(content, ZXing.BarcodeFormat.QR_CODE, this.size, this.size, new Map())
            ];

            for (let i = 0; i < attempts.length; i++) {
                try {
                    const result = attempts[i]();
                    if (result && result instanceof SVGElement) {
                        return result;
                    }
                } catch (error) {
                    console.warn(`尝试${i + 1}失败:`, error.message);
                    if (i === attempts.length - 1) {
                        throw error;
                    }
                }
            }

            throw new Error('所有生成尝试都失败了');
        } catch (error) {
            throw new Error(`SVG生成失败: ${error.message}`);
        }
    }

    /**
     * 使用QRCodeWriter生成矩阵，然后转换为SVG
     */
    generateWithMatrixWriter(content) {
        try {
            // 创建hints
            const hints = new Map();
            if (typeof ZXing.EncodeHintType !== 'undefined') {
                hints.set(ZXing.EncodeHintType.ERROR_CORRECTION, this.options.errorCorrectionLevel);
                hints.set(ZXing.EncodeHintType.MARGIN, Math.round(this.margin));
            }

            // 生成矩阵
            const matrix = this.writer.encode(
                content,
                ZXing.BarcodeFormat.QR_CODE,
                this.size,
                this.size,
                hints
            );

            // 将矩阵转换为SVG
            return this.matrixToSvg(matrix);
        } catch (error) {
            throw new Error(`矩阵生成失败: ${error.message}`);
        }
    }

    /**
     * 将位矩阵转换为SVG
     */
    matrixToSvg(matrix) {
        const width = matrix.getWidth();
        const height = matrix.getHeight();
        const moduleSize = this.size / width;

        // 初始化SVG
        this.svgBuilder.initCanvas(this.size, this.colorManager.getBackgroundColor());
        const svg = this.svgBuilder.getSVG();

        // 绘制模块
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (matrix.get(x, y)) {
                    this.svgBuilder.addModule(
                        x * moduleSize,
                        y * moduleSize,
                        moduleSize,
                        this.colorManager.getForegroundColor(),
                        this.cornerRadius
                    );
                }
            }
        }

        return svg;
    }

    /**
     * 添加Logo到二维码
     */
    async addLogo(svgElement) {
        try {
            // 检查LogoManager是否存在
            if (typeof LogoManager === 'undefined') {
                console.warn('LogoManager未加载，跳过Logo添加');
                return;
            }

            // 根据二维码大小动态计算Logo比例
            // 优先使用setOptions中预计算的动态Logo大小
            let logoSizeRatio = this.options.dynamicLogoSize || this.options.logoSize || 0.18; // 默认18%
            
            // 如果没有预计算的动态大小，则现场计算
            if (!this.options.dynamicLogoSize) {
                // 比例范围：14% - 20%
                if (this.size <= 250) {
                    logoSizeRatio = Math.min(logoSizeRatio, 0.14); // 小于等于250px时，最大14%
                    console.log(`二维码尺寸${this.size}px较小，Logo比例调整为${logoSizeRatio * 100}%`);
                } else if (this.size <= 280) {
                    logoSizeRatio = Math.min(logoSizeRatio, 0.16); // 小于等于280px时，最大16%
                    console.log(`二维码尺寸${this.size}px，Logo比例调整为${logoSizeRatio * 100}%`);
                } else if (this.size <= 300) {
                    logoSizeRatio = Math.min(logoSizeRatio, 0.18); // 小于等于300px时，最大18%
                    console.log(`二维码尺寸${this.size}px，Logo比例调整为${logoSizeRatio * 100}%`);
                } else {
                    logoSizeRatio = Math.min(logoSizeRatio, 0.20); // 大于300px时，最大20%
                    console.log(`二维码尺寸${this.size}px，Logo比例为${logoSizeRatio * 100}%`);
                }
            } else {
                console.log(`使用预计算的Logo比例: ${logoSizeRatio * 100}%`);
            }

            // 创建LogoManager实例，使用动态计算的比例
            const logoManager = new LogoManager({
                size: logoSizeRatio,                              // 使用动态计算的比例
                margin: this.options.logoMargin || 0.05,         // 较小的边距
                borderRadius: this.options.logoBorderRadius || 0.15,
                borderColor: this.options.logoBorderColor || 'white',
                borderWidth: this.options.logoBorderWidth || 2,  // 更薄的边框
                shadowBlur: this.options.logoShadowBlur || 2,    // 更小的阴影
                shadowColor: this.options.logoShadowColor || 'rgba(0, 0, 0, 0.1)'  // 低透明度阴影
            });

            // 获取SVG尺寸
            const width = parseInt(svgElement.getAttribute('width')) || this.size;
            const height = parseInt(svgElement.getAttribute('height')) || this.size;

            // 添加Logo
            await logoManager.addLogoToSvg(svgElement, this.options.logo, width, height);
            
            // 重新应用圆角效果，确保它不会被Logo添加操作覆盖
            if (this.cornerRadius > 0) {
                const modules = svgElement.querySelectorAll('rect');
                modules.forEach(module => {
                    // 只给二维码模块添加圆角，排除Logo相关元素
                    if (!module.classList.contains('qr-background') && 
                        !module.classList.contains('logo-background')) {
                        module.setAttribute('rx', this.cornerRadius);
                        module.setAttribute('ry', this.cornerRadius);
                    }
                });
            }
            
            console.log(`Logo添加成功，最终比例: ${logoSizeRatio * 100}%，并保持了圆角效果`);
        } catch (error) {
            console.error('添加Logo失败:', error);
            // 不抛出错误，让二维码生成继续进行
        }
    }

    /**
     * 更新选项
     */
    setOptions(newOptions) {
        if (newOptions.size && newOptions.size <= 0) {
            throw new Error('无效的二维码大小');
        }

        // 保存当前的圆角设置，以防在合并选项时丢失
        const currentCornerRadius = this.cornerRadius;
        
        // 合并选项
        this.options = { ...this.options, ...newOptions };
        
        // 应用样式设置
        this.setStyle(newOptions);
        
        // 如果新选项中没有明确指定圆角，则恢复之前的设置
        if (newOptions.cornerRadius === undefined && currentCornerRadius !== undefined) {
            this.cornerRadius = currentCornerRadius;
            console.log(`恢复之前的圆角设置: ${this.cornerRadius}px`);
        }
        
        // 如果尺寸发生变化且有Logo，重新计算动态Logo大小
        if (newOptions.size && this.options.logo) {
            const originalLogoSize = this.options.logoSize || 0.18; // 获取原始设置的Logo大小
            let dynamicLogoSize = originalLogoSize;
            
            // 根据新尺寸动态调整Logo比例（与addLogo方法中的逻辑保持一致）
            if (newOptions.size <= 250) {
                dynamicLogoSize = Math.min(originalLogoSize, 0.14); // 最大14%
            } else if (newOptions.size <= 280) {
                dynamicLogoSize = Math.min(originalLogoSize, 0.16); // 最大16%
            } else if (newOptions.size <= 300) {
                dynamicLogoSize = Math.min(originalLogoSize, 0.18); // 最大18%
            } else {
                dynamicLogoSize = Math.min(originalLogoSize, 0.20); // 最大20%
            }
            
            // 更新动态计算的Logo大小
            this.options.dynamicLogoSize = dynamicLogoSize;
            console.log(`尺寸变化：${newOptions.size}px，Logo比例动态调整为${dynamicLogoSize * 100}%`);
        }
    }

    /**
     * 获取模块大小
     */
    getModuleSize() {
        return this.moduleSize;
    }

    /**
     * 清理缓存（静态方法）
     */
    static clearCache() {
        this._writerCache.clear();
    }

    /**
     * 获取缓存状态（静态方法）
     */
    static getCacheStatus() {
        return {
            size: this._writerCache.size,
            keys: Array.from(this._writerCache.keys())
        };
    }

    /**
     * 导出为PNG格式
     * @param {string} content - 二维码内容
     * @param {number} scale - 缩放比例，默认为1
     * @returns {Promise<string>} PNG数据URL
     */
    async exportToPNG(content, scale = 1) {
        try {
            // 生成SVG
            const svgElement = await this.generate(content);
            
            // 创建Canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 设置Canvas尺寸
            const finalSize = this.size * scale;
            canvas.width = finalSize;
            canvas.height = finalSize;
            
            // 创建Image对象
            const img = new Image();
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    try {
                        // 清空Canvas并设置背景
                        ctx.fillStyle = this.colorManager.getBackgroundColor();
                        ctx.fillRect(0, 0, finalSize, finalSize);
                        
                        // 绘制SVG到Canvas
                        ctx.drawImage(img, 0, 0, finalSize, finalSize);
                        
                        // 转换为PNG数据URL
                        const pngDataUrl = canvas.toDataURL('image/png');
                        resolve(pngDataUrl);
                    } catch (error) {
                        reject(new Error(`Canvas绘制失败: ${error.message}`));
                    }
                };
                
                img.onerror = () => {
                    reject(new Error('SVG图像加载失败'));
                };
                
                // 将SVG转换为数据URL
                const svgData = new XMLSerializer().serializeToString(svgElement);
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const svgUrl = URL.createObjectURL(svgBlob);
                
                img.src = svgUrl;
                
                // 清理URL对象
                setTimeout(() => {
                    URL.revokeObjectURL(svgUrl);
                }, 1000);
            });
            
        } catch (error) {
            throw new Error(`PNG导出失败: ${error.message}`);
        }
    }

    /**
     * 导出为SVG格式
     * @param {string} content - 二维码内容
     * @returns {Promise<string>} SVG数据URL
     */
    async exportToSVG(content) {
        try {
            const svgElement = await this.generate(content);
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            return URL.createObjectURL(svgBlob);
        } catch (error) {
            throw new Error(`SVG导出失败: ${error.message}`);
        }
    }
}

// 导出为全局变量
if (typeof window !== 'undefined') {
window.ZXingRenderer = ZXingRenderer; 
} else {
    global.ZXingRenderer = ZXingRenderer;
} 