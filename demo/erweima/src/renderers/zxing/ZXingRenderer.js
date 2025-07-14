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
        this.cornerRadius = options.cornerRadius || 0;
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

            // 应用自定义样式
            this.colorManager.applyColors(
                svgElement,
                this.colorManager.getForegroundColor(),
                this.colorManager.getBackgroundColor()
            );

            // 应用圆角效果
            if (this.cornerRadius > 0) {
                const modules = svgElement.querySelectorAll('rect:not(.qr-background)');
                modules.forEach(module => {
                    module.setAttribute('rx', this.cornerRadius);
                    module.setAttribute('ry', this.cornerRadius);
                });
            }

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

            // 创建LogoManager实例
            const logoManager = new LogoManager({
                size: this.options.logoSize || 0.2,
                margin: this.options.logoMargin || 0.1,
                borderRadius: this.options.logoBorderRadius || 0.15,
                borderColor: this.options.logoBorderColor || 'white',
                borderWidth: this.options.logoBorderWidth || 5,
                shadowBlur: this.options.logoShadowBlur || 5,
                shadowColor: this.options.logoShadowColor || 'rgba(0, 0, 0, 0.2)'
            });

            // 获取SVG尺寸
            const width = parseInt(svgElement.getAttribute('width')) || this.size;
            const height = parseInt(svgElement.getAttribute('height')) || this.size;

            // 添加Logo
            await logoManager.addLogoToSvg(svgElement, this.options.logo, width, height);
            
            console.log('Logo添加成功');
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

        this.options = { ...this.options, ...newOptions };
        this.setStyle(newOptions);
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