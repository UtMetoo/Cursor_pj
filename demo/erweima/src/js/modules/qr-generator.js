/**
 * 二维码生成器工厂模块
 * 使用工厂模式创建不同类型的二维码生成器
 */

import { defaultQROptions } from './config.js';

/**
 * 二维码生成器工厂类
 */
export class QRGeneratorFactory {
    /**
     * 创建二维码生成器实例
     * @param {Object} options - 二维码选项
     * @returns {Object} 包含不同类型生成器的对象
     */
    static createGenerators(options = {}) {
        const mergedOptions = { ...defaultQROptions, ...options };
        
        return {
            text: new ZXingBaseGenerator({
                width: mergedOptions.size,
                height: mergedOptions.size,
                errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
                margin: mergedOptions.margin,
                logo: mergedOptions.logo,
                foreground: mergedOptions.foreground,
                background: mergedOptions.background,
                cornerRadius: mergedOptions.cornerRadius
            }),
            wifi: new ZXingWifiGenerator({
                width: mergedOptions.size,
                height: mergedOptions.size,
                errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
                margin: mergedOptions.margin,
                logo: mergedOptions.logo,
                foreground: mergedOptions.foreground,
                background: mergedOptions.background,
                cornerRadius: mergedOptions.cornerRadius
            }),
            url: new ZXingBaseGenerator({
                width: mergedOptions.size,
                height: mergedOptions.size,
                errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
                margin: mergedOptions.margin,
                logo: mergedOptions.logo,
                foreground: mergedOptions.foreground,
                background: mergedOptions.background,
                cornerRadius: mergedOptions.cornerRadius
            })
        };
    }
    
    /**
     * 更新所有生成器的选项
     * @param {Object} generators - 生成器对象
     * @param {string} option - 选项名称
     * @param {*} value - 选项值
     */
    static updateGeneratorsOption(generators, option, value) {
        Object.values(generators).forEach(generator => {
            if (generator.options) {
                generator.options[option] = value;
            }
        });
    }
}

/**
 * 二维码处理类
 */
export class QRProcessor {
    /**
     * 构造函数
     * @param {Object} generators - 生成器对象
     */
    constructor(generators) {
        this.generators = generators;
        this.currentType = 'text';
    }
    
    /**
     * 设置当前二维码类型
     * @param {string} type - 二维码类型
     */
    setType(type) {
        this.currentType = type;
    }
    
    /**
     * 获取当前二维码类型
     * @returns {string} 当前二维码类型
     */
    getType() {
        return this.currentType;
    }
    
    /**
     * 生成文本二维码
     * @param {string} text - 文本内容
     * @returns {Promise<SVGElement>} SVG元素
     */
    async generateTextQR(text) {
        if (!text || typeof text !== 'string' || text.trim() === '') {
            return null;
        }
        
        return await this.generators.text.generate(text.trim());
    }
    
    /**
     * 生成WiFi二维码
     * @param {string} ssid - WiFi名称
     * @param {string} password - WiFi密码
     * @param {string} encryption - 加密类型
     * @param {boolean} hidden - 是否隐藏网络
     * @returns {Promise<SVGElement>} SVG元素
     */
    async generateWifiQR(ssid, password, encryption, hidden) {
        if (!ssid || typeof ssid !== 'string' || ssid.trim() === '') {
            return null;
        }
        
        return await this.generators.wifi.generateWifiQR(ssid.trim(), password, encryption, hidden);
    }
    
    /**
     * 生成URL二维码
     * @param {string} url - URL地址
     * @returns {Promise<SVGElement>} SVG元素
     */
    async generateUrlQR(url) {
        if (!url || typeof url !== 'string' || url.trim() === '') {
            return null;
        }
        
        // 标准化URL
        let normalizedUrl = url.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = `https://${normalizedUrl}`;
        }
        
        return await this.generators.url.generate(normalizedUrl);
    }
    
    /**
     * 根据当前类型生成二维码
     * @param {Object} inputs - 输入值对象
     * @returns {Promise<SVGElement>} SVG元素
     */
    async generateQR(inputs) {
        switch (this.currentType) {
            case 'text':
                return await this.generateTextQR(inputs.text);
            
            case 'wifi':
                return await this.generateWifiQR(
                    inputs.wifiSsid,
                    inputs.wifiPassword,
                    inputs.wifiEncryption,
                    inputs.wifiHidden
                );
            
            case 'url':
                return await this.generateUrlQR(inputs.url);
            
            default:
                throw new Error(`不支持的二维码类型: ${this.currentType}`);
        }
    }
} 