/**
 * 操作处理模块
 * 包含二维码的复制和下载功能
 */

import { renderSVGToCanvas, showToast, showError } from './utils.js';
import { getElements } from './dom.js';

/**
 * 处理二维码操作（下载或复制）
 * @param {string} action - 操作类型（'download'或'copy'）
 * @param {Object} options - 二维码选项
 */
export async function processQRCode(action, options) {
    try {
        const elements = getElements();
        const svgElement = elements.preview.querySelector('svg');
        
        if (!svgElement) {
            throw new Error(`没有可${action === 'download' ? '下载' : '复制'}的二维码`);
        }
        
        const canvas = await renderSVGToCanvas(svgElement, {
            size: options.size,
            bgColor: options.background,
            fgColor: options.foreground,
            cornerRadius: options.cornerRadius || 0
        });
        
        if (action === 'download') {
            // 转换为PNG并下载
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `qrcode-${Date.now()}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            showToast('二维码已下载');
        } else if (action === 'copy') {
            // 转换为Blob并复制到剪贴板
            const blob = await new Promise(resolve => canvas.toBlob(resolve));
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            showToast('二维码已复制到剪贴板');
        }
    } catch (error) {
        console.error(`${action === 'download' ? '下载' : '复制'}二维码时出错:`, error);
        showError(`${action === 'download' ? '下载' : '复制'}失败: ${error.message}`, getElements().preview);
    }
}

/**
 * 处理Logo上传
 * @param {Event} event - 文件选择事件
 * @param {Object} options - 二维码选项
 * @param {Function} updateQRCode - 更新二维码的回调函数
 * @param {Object} generators - 生成器对象
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
        Object.values(generators).forEach(generator => {
            if (generator.options) {
                generator.options.logo = logoUrl;
            }
        });

        // 显示移除按钮
        getElements().removeLogoBtn.classList.remove('hidden');

        // 重新生成二维码
        await updateQRCode();
        
        showToast('Logo添加成功');
    } catch (error) {
        console.error('处理Logo上传时出错:', error);
        showError('Logo上传失败: ' + error.message, getElements().preview);
        // 清空文件输入
        event.target.value = '';
    }
}

/**
 * 移除Logo
 * @param {Object} options - 二维码选项
 * @param {Function} updateQRCode - 更新二维码的回调函数
 * @param {Object} generators - 生成器对象
 */
export async function removeLogo(options, updateQRCode, generators) {
    try {
        const elements = getElements();
        
        // 更新选项
        options.logo = null;

        // 更新所有生成器的Logo选项
        Object.values(generators).forEach(generator => {
            if (generator.options) {
                generator.options.logo = null;
            }
        });

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