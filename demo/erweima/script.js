// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// 当前二维码选项
const qrOptions = {
    size: 300,
    foreground: '#000000',
    background: '#FFFFFF',
    cornerRadius: 0,
    logo: null,
    errorCorrectionLevel: 'H',
    margin: 1
};

// 当前选中的二维码类型
let currentType = 'text';

// 二维码生成器实例
let generators = {
    text: new ZXingBaseGenerator({
        width: qrOptions.size,
        height: qrOptions.size,
        errorCorrectionLevel: qrOptions.errorCorrectionLevel,
        margin: qrOptions.margin,
        logo: qrOptions.logo,
        foreground: qrOptions.foreground,
        background: qrOptions.background,
        cornerRadius: qrOptions.cornerRadius
    }),
    wifi: new ZXingWifiGenerator({
        width: qrOptions.size,
        height: qrOptions.size,
        errorCorrectionLevel: qrOptions.errorCorrectionLevel,
        margin: qrOptions.margin,
        logo: qrOptions.logo,
        foreground: qrOptions.foreground,
        background: qrOptions.background,
        cornerRadius: qrOptions.cornerRadius
    }),
    url: new ZXingBaseGenerator({
        width: qrOptions.size,
        height: qrOptions.size,
        errorCorrectionLevel: qrOptions.errorCorrectionLevel,
        margin: qrOptions.margin,
        logo: qrOptions.logo,
        foreground: qrOptions.foreground,
        background: qrOptions.background,
        cornerRadius: qrOptions.cornerRadius
    })
};

// DOM 元素
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

// 初始化函数
function init() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }
}

// 应用初始化
function initializeApp() {
    try {
        initializeElements();
        setupEventListeners();
        switchType('text');
        updateQRCode();

        // 初始化预览容器尺寸
        const initialSize = elements.styleInputs.size.value;
        if (elements.preview && initialSize) {
            elements.preview.style.width = `${initialSize}px`;
            elements.preview.style.height = `${initialSize}px`;
        }
    } catch (error) {
        console.error('初始化应用时出错:', error);
        showError('应用初始化失败，请刷新页面重试');
    }
}

// 初始化 DOM 元素
function initializeElements() {
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
}

// 设置事件监听器
function setupEventListeners() {
    // 类型切换按钮
    elements.typeButtons.forEach(btn => {
        btn.addEventListener('click', () => switchType(btn.dataset.type));
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

    // 样式设置
    Object.values(elements.styleInputs).forEach(input => {
        input.addEventListener('input', handleStyleChange);
    });

    // 显示/隐藏密码
    elements.showPasswordBtn.addEventListener('click', togglePasswordVisibility);

    // Logo上传
    elements.logoFile.addEventListener('change', handleLogoUpload);
    elements.removeLogoBtn.addEventListener('click', removeLogo);

    // 复制和下载按钮
    elements.copyBtn.addEventListener('click', () => processQRCode('copy'));
    elements.downloadBtn.addEventListener('click', () => processQRCode('download'));
}

// 切换二维码类型
function switchType(type) {
    currentType = type;

    // 更新按钮状态
    elements.typeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });

    // 隐藏所有输入区域
    Object.values(elements.sections).forEach(section => {
        section.classList.remove('visible');
    });

    // 显示选中的输入区域
    elements.sections[type].classList.add('visible');

    // 更新二维码
    updateQRCode();
}

// 更新二维码
async function updateQRCode() {
    try {
        let content = '';
        let svgElement = null;
        
        // 检查ZXing库是否正确加载
        if (typeof ZXing === 'undefined') {
            throw new Error('ZXing库未正确加载，请刷新页面重试');
        }
        
        // 获取输入内容
        switch (currentType) {
            case 'text':
                content = elements.inputs.text.value.trim();
                if (content) {
                    svgElement = await generators.text.generate(content);
                }
                break;
            
            case 'wifi':
                const ssid = elements.inputs.wifiSsid.value.trim();
                const password = elements.inputs.wifiPassword.value;
                const encryption = elements.inputs.wifiEncryption.value;
                const hidden = elements.inputs.wifiHidden.checked;
                
                if (ssid) {
                    svgElement = await generators.wifi.generateWifiQR(ssid, password, encryption, hidden);
                }
                break;
            
            case 'url':
                content = elements.inputs.url.value.trim();
                if (content) {
                    // 标准化URL
                    if (!content.startsWith('http://') && !content.startsWith('https://')) {
                        content = `https://${content}`;
                    }
                    svgElement = await generators.url.generate(content);
                }
                break;
        }

        // 清空预览区域
        elements.preview.innerHTML = '';
        
        if (svgElement) {
            // 设置SVG样式
            svgElement.style.width = '100%';
            svgElement.style.height = '100%';
            
            // 确保SVG有正确的viewBox
            if (!svgElement.getAttribute('viewBox')) {
                const viewBox = `0 0 ${qrOptions.size} ${qrOptions.size}`;
                svgElement.setAttribute('viewBox', viewBox);
            }
            
            // 添加SVG到预览区
            elements.preview.appendChild(svgElement);
        } else {
            elements.preview.innerHTML = '<p class="empty-state">请输入内容生成二维码</p>';
        }

    } catch (error) {
        console.error('生成二维码时出错:', error);
        elements.preview.innerHTML = `<p class="error">${error.message || '生成二维码失败'}</p>`;
        showToast(error.message || '生成二维码失败', 'error');
    }
}

// 处理样式变更
async function handleStyleChange(event) {
    const input = event.target;
    const value = input.value;
    
    // 更新显示值
    if (input.id === 'qr-size') {
        document.querySelector('.size-value').textContent = `${value}px`;
        qrOptions.size = parseInt(value);
        
        // 更新预览容器的尺寸
        const previewElement = document.getElementById('qr-preview');
        if (previewElement) {
            previewElement.style.width = `${value}px`;
            previewElement.style.height = `${value}px`;
        }
        
        // 更新生成器的宽高
        Object.values(generators).forEach(generator => {
            if (generator.options) {
                generator.options.width = qrOptions.size;
                generator.options.height = qrOptions.size;
            }
        });
    } else if (input.id === 'corner-radius') {
        document.querySelector('.radius-value').textContent = `${value}px`;
        qrOptions.cornerRadius = parseInt(value);
        
        // 更新生成器的圆角
        Object.values(generators).forEach(generator => {
            if (generator.options) {
                generator.options.cornerRadius = qrOptions.cornerRadius;
            }
        });
    } else if (input.id === 'foreground-color') {
        qrOptions.foreground = value;
        
        // 更新生成器的前景色
        Object.values(generators).forEach(generator => {
            if (generator.options) {
                generator.options.foreground = qrOptions.foreground;
            }
        });
    } else if (input.id === 'background-color') {
        qrOptions.background = value;

        // 更新生成器的背景色
    Object.values(generators).forEach(generator => {
        if (generator.options) {
                generator.options.background = qrOptions.background;
        }
    });
    }

    // 重新生成二维码
    await updateQRCode();
}

// 处理Logo上传
async function handleLogoUpload(event) {
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
        qrOptions.logo = logoUrl;

        // 更新所有生成器的Logo选项
        Object.values(generators).forEach(generator => {
            if (generator.options) {
                generator.options.logo = logoUrl;
            }
        });

        // 显示移除按钮
        elements.removeLogoBtn.classList.remove('hidden');

        // 重新生成二维码
        await updateQRCode();
        
        showToast('Logo添加成功');
    } catch (error) {
        console.error('处理Logo上传时出错:', error);
        showError('Logo上传失败: ' + error.message);
        // 清空文件输入
        event.target.value = '';
    }
}

// 移除Logo
async function removeLogo() {
    try {
        // 更新选项
        qrOptions.logo = null;

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
        showError('移除Logo失败: ' + error.message);
    }
}

// 切换密码可见性
function togglePasswordVisibility() {
    const passwordInput = elements.inputs.wifiPassword;
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    elements.showPasswordBtn.textContent = type === 'password' ? '👁️' : '🔒';
}

// 将SVG渲染到Canvas并应用圆角效果
async function renderQRToCanvas(action = 'download') {
    try {
        const svgElement = elements.preview.querySelector('svg');
        if (!svgElement) {
            throw new Error(`没有可${action === 'download' ? '下载' : '复制'}的二维码`);
        }

        // 获取当前二维码的配置
        const size = qrOptions.size;
        const bgColor = qrOptions.background;
        const fgColor = qrOptions.foreground;
        const cornerRadius = qrOptions.cornerRadius || 0;

        // 创建一个深度克隆的SVG副本，避免修改原始SVG
        const svgClone = svgElement.cloneNode(true);
        
        // 确保SVG尺寸正确
        svgClone.setAttribute('width', size);
        svgClone.setAttribute('height', size);
        
        // 确保背景色正确
        const bgRect = svgClone.querySelector('rect');
        if (bgRect) {
            bgRect.setAttribute('fill', bgColor);
        }
        
        // 确保所有路径使用正确的前景色
        const paths = svgClone.querySelectorAll('path, polygon');
        paths.forEach(path => {
            path.setAttribute('fill', fgColor);
        });

        // 创建一个离屏Canvas用于渲染SVG
        const svgCanvas = document.createElement('canvas');
        svgCanvas.width = size;
        svgCanvas.height = size;
        const svgCtx = svgCanvas.getContext('2d');

        // 将SVG转换为XML字符串，确保包含所有命名空间
        const svgData = new XMLSerializer().serializeToString(svgClone);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        // 创建图片对象
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // 处理可能的跨域问题

        // 等待图片加载完成
        await new Promise((resolve, reject) => {
            img.onload = () => {
                try {
                    // 绘制到SVG Canvas
                    svgCtx.drawImage(img, 0, 0, size, size);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = (err) => {
                reject(new Error('加载SVG图片失败'));
            };
            img.src = svgUrl;
        });

        // 释放SVG URL
        URL.revokeObjectURL(svgUrl);

        // 创建最终的Canvas，应用圆角效果
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = size;
        finalCanvas.height = size;
        const finalCtx = finalCanvas.getContext('2d');

        // 应用圆角效果
        if (cornerRadius > 0) {
            // 创建圆角路径
            finalCtx.beginPath();
            finalCtx.moveTo(cornerRadius, 0);
            finalCtx.lineTo(size - cornerRadius, 0);
            finalCtx.quadraticCurveTo(size, 0, size, cornerRadius);
            finalCtx.lineTo(size, size - cornerRadius);
            finalCtx.quadraticCurveTo(size, size, size - cornerRadius, size);
            finalCtx.lineTo(cornerRadius, size);
            finalCtx.quadraticCurveTo(0, size, 0, size - cornerRadius);
            finalCtx.lineTo(0, cornerRadius);
            finalCtx.quadraticCurveTo(0, 0, cornerRadius, 0);
            finalCtx.closePath();
            
            // 设置裁剪区域
            finalCtx.save();
            finalCtx.clip();
            
            // 绘制背景
            finalCtx.fillStyle = bgColor;
            finalCtx.fillRect(0, 0, size, size);
            
            // 绘制SVG内容
            finalCtx.drawImage(svgCanvas, 0, 0);
            
            // 恢复裁剪区域
            finalCtx.restore();
        } else {
            // 无圆角，直接绘制
            finalCtx.fillStyle = bgColor;
            finalCtx.fillRect(0, 0, size, size);
            finalCtx.drawImage(svgCanvas, 0, 0);
        }

        return finalCanvas;
    } catch (error) {
        console.error(`渲染二维码到Canvas时出错:`, error);
        throw error;
    }
}

// 处理二维码操作（下载或复制）
async function processQRCode(action) {
    try {
        const canvas = await renderQRToCanvas(action);
        
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
        showError(`${action === 'download' ? '下载' : '复制'}失败: ${error.message}`);
    }
}

// 显示提示消息
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }, 100);
}

// 显示错误信息
function showError(message) {
    if (elements.preview) {
        elements.preview.innerHTML = `<p class="error">${message}</p>`;
    } else {
        console.error(message);
    }
}

// 启动应用
init(); 
