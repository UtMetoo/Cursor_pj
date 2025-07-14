/**
 * ZXing支持模块 - ZXing库访问和初始化检查
 * 合并了原 zxing-access.js 和 init-check.js 的功能
 */

// ============================
// ZXing访问器区域 (原 zxing-access.js)
// ============================

// 检查ZXing是否可用
function checkZXing() {
    if (typeof window.ZXing === 'undefined') {
        throw new Error('ZXing库未加载，请检查网络连接');
    }
    return window.ZXing;
}

// 获取ZXing对象
export function getZXing() {
    return checkZXing();
}

// 获取ZXing的特定组件
export function getZXingComponent(componentName) {
    const ZXing = checkZXing();
    if (!ZXing[componentName]) {
        throw new Error(`ZXing组件 ${componentName} 不可用`);
    }
    return ZXing[componentName];
}

// 创建ZXing编码器实例
export function createZXingWriter() {
    const ZXing = checkZXing();
    if (!ZXing.BrowserQRCodeSvgWriter) {
        throw new Error('ZXing.BrowserQRCodeSvgWriter 不可用');
    }
    return new ZXing.BrowserQRCodeSvgWriter();
}

// 检查ZXing API的可用性
export function checkZXingAPI() {
    const ZXing = checkZXing();
    const requiredComponents = [
        'BrowserQRCodeSvgWriter',
        'QRCodeWriter',
        'BarcodeFormat',
        'EncodeHintType'
    ];
    
    const missing = requiredComponents.filter(comp => !ZXing[comp]);
    if (missing.length > 0) {
        throw new Error(`缺少ZXing组件: ${missing.join(', ')}`);
    }
    
    return true;
}

// 导出ZXing常量
export const ZXingConstants = {
    get BarcodeFormat() {
        return getZXingComponent('BarcodeFormat');
    },
    get EncodeHintType() {
        return getZXingComponent('EncodeHintType');
    },
    get QRCodeDecoderErrorCorrectionLevel() {
        return getZXingComponent('QRCodeDecoderErrorCorrectionLevel');
    }
};

// ============================
// 初始化检查区域 (原 init-check.js)
// ============================

// 等待所有依赖加载
export async function waitForDependencies() {
    const maxRetries = 10;
    const retryInterval = 500; // 500ms
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            checkDependencies();
            return true;
        } catch (error) {
            if (i === maxRetries - 1) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
    }
}

// 检查所有必需的依赖
export function checkDependencies() {
    const checks = [
        {
            name: 'ZXing库',
            check: () => {
                try {
                    checkZXingAPI();
                    return true;
                } catch (error) {
                    console.error('ZXing API检查失败:', error);
                    return false;
                }
            },
            error: 'ZXing库未正确加载或API不完整'
        },
        {
            name: 'ZXingRenderer',
            check: () => {
                const renderer = typeof window.ZXingRenderer !== 'undefined';
                const methods = renderer && typeof window.ZXingRenderer.prototype.generate === 'function';
                return renderer && methods;
            },
            error: 'ZXingRenderer未加载或不完整'
        },
        {
            name: 'SVG构建器',
            check: () => typeof window.SVGBuilder !== 'undefined',
            error: 'SVG构建器未加载'
        },
        {
            name: '颜色管理器',
            check: () => typeof window.ColorManager !== 'undefined',
            error: '颜色管理器未加载'
        }
    ];

    const failed = checks.filter(check => !check.check());
    
    if (failed.length > 0) {
        const errors = failed.map(check => check.error).join(', ');
        throw new Error(`依赖检查失败: ${errors}`);
    }
    
    console.log('所有依赖检查通过');
    return true;
} 