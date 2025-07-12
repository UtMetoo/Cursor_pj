/**
 * 二维码生成器工厂模块
 * 使用工厂模式创建不同类型的二维码生成器
 */

import { defaultQROptions } from './config.js';
import { checkZXingAPI } from './zxing-access.js';

/**
 * 二维码生成器工厂类
 */
export class QRGeneratorFactory {
    static createGenerators(options = {}) {
        const mergedOptions = {
            size: options.size || 300,
            foreground: options.foreground || '#000000',
            background: options.background || '#FFFFFF',
            errorCorrectionLevel: options.errorCorrectionLevel || 'H',
            margin: options.margin || 0.5,
            logo: options.logo || null,
            cornerRadius: options.cornerRadius || 0
        };
        
        // 创建基础渲染器实例
        const baseRenderer = new ZXingRenderer(mergedOptions);

        // 创建专用的WiFi渲染器实例
        const wifiRenderer = new ZXingRenderer(mergedOptions);
        
        // 返回不同类型的渲染器
        return {
            text: baseRenderer,
            url: baseRenderer,  // URL类型可以复用基础渲染器
            wifi: wifiRenderer  // WiFi类型使用专用实例
        };
    }
    
    /**
     * 更新所有生成器的选项
     */
    static updateGeneratorsOption(generators, option, value) {
        Object.values(generators).forEach(generator => {
            generator.options[option] = value;
            generator.setOptions({ [option]: value });
        });
    }
}

/**
 * 二维码生成处理器类
 */
export class QRProcessor {
    constructor(generators) {
        this.generators = generators;
    }

    /**
     * 处理二维码内容生成
     */
    async processContent(type, content) {
        if (!content) {
            throw new Error('内容不能为空');
        }

        const generator = this.generators[type];
        if (!generator) {
            throw new Error(`不支持的二维码类型: ${type}`);
        }

        try {
            return await generator.generate(content);
        } catch (error) {
            console.error(`生成${type}类型二维码失败:`, error);
            throw error;
        }
    }

    /**
     * 生成二维码
     */
    async generateQR(inputs) {
        const { text, wifiSsid, wifiPassword, wifiEncryption, wifiHidden, url } = inputs;
        
        // 根据当前类型生成对应的二维码
        switch (appState.currentType) {
            case 'text':
                return await this.processContent('text', text);
            
            case 'wifi':
                const wifiString = `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};H:${wifiHidden ? 'true' : ''};`;
                return await this.processContent('wifi', wifiString);
            
            case 'url':
                let normalizedUrl = url;
                if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                    normalizedUrl = 'https://' + url;
                }
                return await this.processContent('url', normalizedUrl);
            
            default:
                throw new Error(`不支持的二维码类型: ${appState.currentType}`);
        }
    }
} 