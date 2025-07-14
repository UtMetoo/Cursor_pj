/**
 * 主应用模块
 * 整合其他模块并初始化应用
 */

import { defaultQROptions, debounce, showToast, showError } from './modules/core.js';
import { initializeElements, getElements, togglePasswordVisibility, updatePreview, updatePreviewSize } from './modules/dom.js';
import { QRGeneratorFactory, QRProcessor } from './modules/qr-generator.js';
import { processQRCode, handleLogoUpload, removeLogo } from './modules/actions.js';
import { checkZXingAPI, waitForDependencies } from './modules/zxing-support.js';

// 应用状态
const appState = {
    qrOptions: { ...defaultQROptions },
    currentType: 'text'
};

// 二维码生成器
let generators;
let qrProcessor;

/**
 * 初始化应用
 */
async function initApp() {
    try {
        // 等待所有依赖加载完成
        await waitForDependencies();
        
        // 初始化DOM元素
        const elements = initializeElements();
        
        // 创建生成器
        generators = QRGeneratorFactory.createGenerators(appState.qrOptions);
        qrProcessor = new QRProcessor(generators);
        
        // 设置事件监听器
        setupEventListeners();
        
        // 初始显示文本二维码输入区
        switchType('text');
        
        // 初始生成空二维码
        updateQRCode();

        // 初始化预览容器尺寸
        const initialSize = elements.styleInputs.size.value;
        if (initialSize) {
            updatePreviewSize(initialSize);
        }
    } catch (error) {
        console.error('初始化应用时出错:', error);
        showError('应用初始化失败，请刷新页面重试', document.getElementById('qr-preview'));
    }
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    const elements = getElements();
    
    // 使用事件委托处理类型切换按钮
    document.querySelector('.qr-type-selector').addEventListener('click', (event) => {
        if (event.target.classList.contains('type-btn')) {
            switchType(event.target.dataset.type);
        }
    });

    // 文本输入
    elements.inputs.text.addEventListener('input', debounce(updateQRCode, 300));

    // WiFi输入
    elements.inputs.wifiSsid.addEventListener('input', debounce(updateQRCode, 300));
    elements.inputs.wifiPassword.addEventListener('input', debounce(updateQRCode, 300));
    elements.inputs.wifiEncryption.addEventListener('change', updateQRCode);
    elements.inputs.wifiHidden.addEventListener('change', updateQRCode);

    // URL输入
    elements.inputs.url.addEventListener('input', debounce(updateQRCode, 300));

    // 样式设置 - 使用事件委托
    document.querySelector('.style-grid').addEventListener('input', (event) => {
        if (Object.values(elements.styleInputs).includes(event.target)) {
            handleStyleChange(event);
        }
    });

    // 显示/隐藏密码
    elements.showPasswordBtn.addEventListener('click', togglePasswordVisibility);

    // Logo上传
    elements.logoFile.addEventListener('change', (event) => {
        handleLogoUpload(event, appState.qrOptions, updateQRCode, generators);
    });
    
    elements.removeLogoBtn.addEventListener('click', () => {
        removeLogo(appState.qrOptions, updateQRCode, generators);
    });

    // 复制和下载按钮
    elements.copyBtn.addEventListener('click', () => {
        const inputs = {
            text: elements.inputs.text.value,
            wifiSsid: elements.inputs.wifiSsid.value,
            wifiPassword: elements.inputs.wifiPassword.value,
            wifiEncryption: elements.inputs.wifiEncryption.value,
            wifiHidden: elements.inputs.wifiHidden.checked,
            url: elements.inputs.url.value
        };
        processQRCode('copy', appState.qrOptions, generators, appState.currentType, inputs);
    });
    elements.downloadBtn.addEventListener('click', () => {
        const inputs = {
            text: elements.inputs.text.value,
            wifiSsid: elements.inputs.wifiSsid.value,
            wifiPassword: elements.inputs.wifiPassword.value,
            wifiEncryption: elements.inputs.wifiEncryption.value,
            wifiHidden: elements.inputs.wifiHidden.checked,
            url: elements.inputs.url.value
        };
        processQRCode('download', appState.qrOptions, generators, appState.currentType, inputs);
    });
}

/**
 * 切换二维码类型
 * @param {string} type - 二维码类型
 */
function switchType(type) {
    const elements = getElements();
    
    // 更新当前类型
    appState.currentType = type;
    qrProcessor.setType(type);

    // 更新按钮状态
    elements.typeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });

    // 隐藏所有输入区域
    Object.values(elements.sections).forEach(section => {
        section.classList.remove('visible');
        section.classList.add('hidden');
    });

    // 显示选中的输入区域
    elements.sections[type].classList.remove('hidden');
    elements.sections[type].classList.add('visible');

    // 更新二维码
    updateQRCode();
}

/**
 * 更新二维码
 */
async function updateQRCode() {
    try {
        const elements = getElements();
        
        // 检查ZXing库是否正确加载
        try {
            checkZXingAPI();
        } catch (error) {
            throw new Error('ZXing库未正确加载，请刷新页面重试');
        }
        
        // 获取输入内容
        const inputs = {
            text: elements.inputs.text.value,
            wifiSsid: elements.inputs.wifiSsid.value,
            wifiPassword: elements.inputs.wifiPassword.value,
            wifiEncryption: elements.inputs.wifiEncryption.value,
            wifiHidden: elements.inputs.wifiHidden.checked,
            url: elements.inputs.url.value
        };
        
        // 生成二维码
        const svgElement = await qrProcessor.generateQR(inputs);
        
        // 更新预览
        updatePreview(svgElement);

    } catch (error) {
        console.error('生成二维码时出错:', error);
        const elements = getElements();
        elements.preview.innerHTML = `<p class="error">${error.message || '生成二维码失败'}</p>`;
        showToast(error.message || '生成二维码失败', 'error');
    }
}

/**
 * 处理样式变更
 * @param {Event} event - 输入事件
 */
async function handleStyleChange(event) {
    const input = event.target;
    const value = input.value;
    
    // 更新显示值
    if (input.id === 'qr-size') {
        document.querySelector('.size-value').textContent = `${value}px`;
        appState.qrOptions.size = parseInt(value);
        
        // 更新预览容器的尺寸
        updatePreviewSize(value);
        
        // 检查是否有Logo，如果有，输出调试信息
        if (appState.qrOptions.logo) {
            console.log(`调整二维码大小到${value}px，Logo将动态调整`);
        }
        
        // 更新生成器的尺寸
        QRGeneratorFactory.updateGeneratorsOption(generators, 'size', parseInt(value));
        QRGeneratorFactory.updateGeneratorsOption(generators, 'width', parseInt(value));
        QRGeneratorFactory.updateGeneratorsOption(generators, 'height', parseInt(value));
    } else if (input.id === 'corner-radius') {
        document.querySelector('.radius-value').textContent = `${value}px`;
        appState.qrOptions.cornerRadius = parseInt(value);
        
        // 更新生成器的圆角
        QRGeneratorFactory.updateGeneratorsOption(generators, 'cornerRadius', parseInt(value));
    } else if (input.id === 'foreground-color') {
        appState.qrOptions.foreground = value;
        
        // 更新生成器的前景色
        QRGeneratorFactory.updateGeneratorsOption(generators, 'foreground', value);
    } else if (input.id === 'background-color') {
        appState.qrOptions.background = value;

        // 更新生成器的背景色
        QRGeneratorFactory.updateGeneratorsOption(generators, 'background', value);
    }

    // 重新生成二维码
    await updateQRCode();
}

// 在DOM加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// 导出公共API
export {
    updateQRCode,
    switchType,
    appState,
    generators
}; 