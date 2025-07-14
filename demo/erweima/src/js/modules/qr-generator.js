/**
 * 二维码生成器工厂模块
 * 使用工厂模式创建不同类型的二维码生成器
 */

import { defaultQROptions } from './core.js';
import { checkZXingAPI } from './zxing-support.js';

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
            cornerRadius: options.cornerRadius || 0,
            logoSize: options.logoSize || 0.18 // 设置Logo大小为18%
        };
        
        // 确保ZXingRenderer类可用
        if (typeof window.ZXingRenderer === 'undefined') {
            console.error('ZXingRenderer类未加载');
            throw new Error('二维码渲染器未加载，请刷新页面重试');
        }
        
        // 创建基础渲染器实例
        const baseRenderer = new window.ZXingRenderer(mergedOptions);

        // 创建专用的WiFi渲染器实例
        const wifiRenderer = new window.ZXingRenderer(mergedOptions);
        
        console.log('二维码生成器创建成功，参数:', mergedOptions);
        
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
        if (!generators) {
            console.warn('生成器未初始化，无法更新选项');
            return;
        }
        
        console.log(`更新所有生成器的${option}=${value}`);
        
        // 收集所有当前选项
        const currentOptions = {};
        if (generators.text) {
            currentOptions.cornerRadius = generators.text.cornerRadius;
            currentOptions.logo = generators.text.options.logo;
            currentOptions.logoSize = generators.text.options.logoSize || 0.18; // 更新默认值为18%
        }
        
        // 更新每个生成器
        Object.values(generators).forEach(generator => {
            if (generator && typeof generator.setOptions === 'function') {
                // 更新内部选项对象
                if (generator.options) {
                    generator.options[option] = value;
                }
                
                // 创建更新选项对象，保留重要参数
                const updateOptions = { [option]: value };
                
                // 确保圆角设置不丢失
                if (option !== 'cornerRadius' && currentOptions.cornerRadius !== undefined) {
                    updateOptions.cornerRadius = currentOptions.cornerRadius;
                }
                
                // 确保Logo设置不丢失
                if (option !== 'logo' && currentOptions.logo) {
                    updateOptions.logo = currentOptions.logo;
                }
                
                // 确保Logo大小设置不丢失
                if (option !== 'logoSize' && currentOptions.logoSize) {
                    updateOptions.logoSize = currentOptions.logoSize;
                }
                
                // 应用更新
                generator.setOptions(updateOptions);
            } else {
                console.warn('生成器实例无效或缺少setOptions方法');
            }
        });
    }
}

/**
 * 二维码生成处理器类
 */
export class QRProcessor {
    constructor(generators) {
        this.generators = generators;
        this.currentType = 'text'; // 默认类型
    }

    /**
     * 设置当前二维码类型
     * @param {string} type - 二维码类型
     */
    setType(type) {
        this.currentType = type;
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
        switch (this.currentType) {
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
                throw new Error(`不支持的二维码类型: ${this.currentType}`);
        }
    }
} 