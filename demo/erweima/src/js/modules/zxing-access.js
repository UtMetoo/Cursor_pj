/**
 * ZXing访问器模块
 * 为ES模块提供对全局ZXing对象的访问
 */

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