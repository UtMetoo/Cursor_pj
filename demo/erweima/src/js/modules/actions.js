/**
 * 操作处理模块
 * 包含二维码的复制和下载功能
 */

import { showToast, showError } from './core.js';
import { getElements } from './dom.js';
import { QRGeneratorFactory } from './qr-generator.js';

/**
 * 处理二维码操作（下载或复制）
 * @param {string} action - 操作类型（'download'或'copy'）
 * @param {Object} options - 二维码选项
 * @param {Object} generators - 生成器对象
 * @param {string} currentType - 当前二维码类型
 * @param {Object} inputs - 输入数据
 */
export async function processQRCode(action, options, generators = null, currentType = 'text', inputs = {}) {
    try {
        const elements = getElements();
        const svgElement = elements.preview.querySelector('svg');
        
        if (!svgElement) {
            throw new Error(`没有可${action === 'download' ? '下载' : '复制'}的二维码`);
        }
        
        // 检查是否有生成器可用
        if (!generators || !generators[currentType]) {
            throw new Error('二维码生成器不可用，请刷新页面重试');
        }
        
        // 获取当前输入内容
        let content = '';
        switch (currentType) {
            case 'text':
                content = inputs.text || elements.inputs.text?.value || 'Hello World';
                break;
            case 'wifi':
                const ssid = inputs.wifiSsid || elements.inputs.wifiSsid?.value || 'WiFi';
                const password = inputs.wifiPassword || elements.inputs.wifiPassword?.value || '';
                const encryption = inputs.wifiEncryption || elements.inputs.wifiEncryption?.value || 'WPA2';
                const hidden = inputs.wifiHidden !== undefined ? inputs.wifiHidden : (elements.inputs.wifiHidden?.checked || false);
                content = `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden ? 'true' : ''};`;
                break;
            case 'url':
                const url = inputs.url || elements.inputs.url?.value || 'https://example.com';
                content = url.startsWith('http') ? url : 'https://' + url;
                break;
            default:
                content = 'Hello World';
        }
        
        // 使用生成器的导出方法
        const pngUrl = await generators[currentType].exportToPNG(content);
        
        if (action === 'download') {
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `qrcode-${Date.now()}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            showToast('二维码已下载');
        } else if (action === 'copy') {
            // 将PNG URL转换为Blob
            const response = await fetch(pngUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            showToast('二维码已复制到剪贴板');
        }
    } catch (error) {
        console.error(`${action === 'download' ? '下载' : '复制'}二维码时出错:`, error);
        // 提供更详细的错误信息
        let errorMessage = `${action === 'download' ? '下载' : '复制'}失败: ${error.message}`;
        if (error.message.includes('exportToPNG')) {
            errorMessage += '。请检查网络连接或刷新页面重试。';
        }
        showError(errorMessage, getElements().preview);
    }
}

/**
 * 处理Logo上传
 */
export async function handleLogoUpload(event, options, updateQRCode, generators) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            throw new Error('请选择图片文件');
        }

        // 读取文件
        const logoUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        // 更新选项
        options.logo = logoUrl;

        // 更新所有生成器的Logo选项
        QRGeneratorFactory.updateGeneratorsOption(generators, 'logo', logoUrl);

        // 重新生成二维码
        await updateQRCode();
        
        // 显示移除按钮
        const elements = getElements();
        elements.removeLogoBtn.classList.remove('hidden');
        
        showToast('Logo已添加');
    } catch (error) {
        console.error('上传Logo时出错:', error);
        showError('上传Logo失败: ' + error.message, getElements().preview);
    }
}

/**
 * 移除Logo
 */
export async function removeLogo(options, updateQRCode, generators) {
    try {
        const elements = getElements();
        
        // 更新选项
        options.logo = null;

        // 更新所有生成器的Logo选项
        QRGeneratorFactory.updateGeneratorsOption(generators, 'logo', null);

        // 隐藏移除按钮
        elements.removeLogoBtn.classList.add('hidden');

        // 清空文件输入
        elements.logoFile.value = '';

        // 重新生成二维码
        await updateQRCode();
        
        showToast('Logo已移除');
    } catch (error) {
        console.error('移除Logo时出错:', error);
        showError('移除Logo失败: ' + error.message, getElements().preview);
    }
} 