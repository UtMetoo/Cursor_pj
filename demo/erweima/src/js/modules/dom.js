/**
 * DOM操作模块
 * 包含DOM元素的初始化和事件监听
 */

// DOM 元素缓存
const elements = {
    typeButtons: null,
    sections: {
        text: null,
        wifi: null,
        url: null
    },
    inputs: {
        text: null,
        wifiSsid: null,
        wifiPassword: null,
        wifiEncryption: null,
        wifiHidden: null,
        url: null
    },
    preview: null,
    copyBtn: null,
    downloadBtn: null,
    showPasswordBtn: null,
    logoFile: null,
    removeLogoBtn: null,
    styleInputs: {
        size: null,
        foreground: null,
        background: null,
        cornerRadius: null
    }
};

/**
 * 初始化DOM元素
 * @throws {Error} 如果找不到必需的DOM元素
 */
export function initializeElements() {
    elements.typeButtons = document.querySelectorAll('.type-btn');
    elements.sections.text = document.getElementById('text-input-section');
    elements.sections.wifi = document.getElementById('wifi-input-section');
    elements.sections.url = document.getElementById('url-input-section');
    elements.inputs.text = document.getElementById('text-input');
    elements.inputs.wifiSsid = document.getElementById('wifi-ssid');
    elements.inputs.wifiPassword = document.getElementById('wifi-password');
    elements.inputs.wifiEncryption = document.getElementById('wifi-encryption');
    elements.inputs.wifiHidden = document.getElementById('wifi-hidden');
    elements.inputs.url = document.getElementById('url-input');
    elements.preview = document.getElementById('qr-preview');
    elements.copyBtn = document.getElementById('copy-btn');
    elements.downloadBtn = document.getElementById('download-btn');
    elements.showPasswordBtn = document.querySelector('.show-password-btn');
    elements.logoFile = document.getElementById('logo-file');
    elements.removeLogoBtn = document.querySelector('.remove-logo-btn');
    elements.styleInputs.size = document.getElementById('qr-size');
    elements.styleInputs.foreground = document.getElementById('foreground-color');
    elements.styleInputs.background = document.getElementById('background-color');
    elements.styleInputs.cornerRadius = document.getElementById('corner-radius');

    // 验证所有必需的元素都存在
    for (const [key, value] of Object.entries(elements)) {
        if (value === null || (typeof value === 'object' && Object.values(value).includes(null))) {
            throw new Error(`找不到必需的DOM元素: ${key}`);
        }
    }

    return elements;
}

/**
 * 切换密码可见性
 */
export function togglePasswordVisibility() {
    const passwordInput = elements.inputs.wifiPassword;
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    elements.showPasswordBtn.textContent = type === 'password' ? '👁️' : '🔒';
}

/**
 * 获取DOM元素
 * @returns {Object} DOM元素对象
 */
export function getElements() {
    return elements;
}

/**
 * 更新二维码预览尺寸
 * @param {number} size - 预览尺寸
 */
export function updatePreviewSize(size) {
    if (elements.preview) {
        elements.preview.style.width = `${size}px`;
        elements.preview.style.height = `${size}px`;
    }
}

/**
 * 更新二维码预览内容
 * @param {SVGElement|null} svgElement - SVG元素
 */
export function updatePreview(svgElement) {
    // 清空预览区域
    elements.preview.innerHTML = '';
    
    if (svgElement) {
        // 获取SVG的实际尺寸
        const svgWidth = svgElement.getAttribute('width') || '300';
        const svgHeight = svgElement.getAttribute('height') || '300';
        
        // 设置SVG样式，确保完全填充预览容器
        svgElement.style.width = '100%';
        svgElement.style.height = '100%';
        svgElement.style.display = 'block';
        
        // 确保SVG有正确的viewBox
        if (!svgElement.getAttribute('viewBox')) {
            const viewBox = `0 0 ${svgWidth} ${svgHeight}`;
            svgElement.setAttribute('viewBox', viewBox);
        }
        
        // 设置预览容器的尺寸以匹配SVG
        const size = Math.max(parseInt(svgWidth), parseInt(svgHeight));
        elements.preview.style.width = `${size}px`;
        elements.preview.style.height = `${size}px`;
        
        // 添加SVG到预览区
        elements.preview.appendChild(svgElement);
        
        // 调试信息
        console.log('预览更新:', {
            svgWidth,
            svgHeight,
            containerWidth: elements.preview.style.width,
            containerHeight: elements.preview.style.height
        });
    } else {
        elements.preview.innerHTML = '<p class="empty-state">请输入内容生成二维码</p>';
    }
} 