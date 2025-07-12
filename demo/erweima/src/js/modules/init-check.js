/**
 * 初始化检查模块
 * 确保所有依赖都正确加载
 */

import { checkZXingAPI } from './zxing-access.js';

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