// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Logo处理相关配置
const LOGO_CONFIG = {
    size: 0.2,          // Logo大小占二维码的比例
    margin: 0.1,        // Logo边距占Logo大小的比例
    borderRadius: 0.15, // Logo圆角占Logo大小的比例
    borderColor: '#fff',// Logo边框颜色
    borderWidth: 5,     // Logo边框宽度
    shadowBlur: 5,      // 阴影模糊半径
    shadowColor: 'rgba(0, 0, 0, 0.2)' // 阴影颜色
};

// DOM 元素
const qrInput = document.getElementById('qr-input');
const qrCodeElement = document.getElementById('qr-code');
const fgColorInput = document.getElementById('fg-color');
const bgColorInput = document.getElementById('bg-color');
const sizeRange = document.getElementById('size-range');
const radiusRange = document.getElementById('radius-range');
const logoInput = document.getElementById('logo-input');
const removeLogoBtn = document.getElementById('remove-logo');
const resetBtn = document.getElementById('reset-btn');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');

// 二维码配置
let qrConfig = {
    text: ' ',
    width: 300,
    height: 300,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,
    logo: null
};

// 初始化QR码实例
let qrCode = null;

// 更新二维码
const updateQRCode = debounce(() => {
    // 更新配置
    qrConfig.text = qrInput.value || ' ';
    qrConfig.width = parseInt(sizeRange.value);
    qrConfig.height = parseInt(sizeRange.value);
    qrConfig.colorDark = fgColorInput.value;
    qrConfig.colorLight = bgColorInput.value;

    // 清除旧的二维码
    qrCodeElement.innerHTML = '';
    
    // 创建新的二维码
    qrCode = new QRCode(qrCodeElement, {
        text: qrConfig.text,
        width: qrConfig.width,
        height: qrConfig.height,
        colorDark: qrConfig.colorDark,
        colorLight: qrConfig.colorLight,
        correctLevel: QRCode.CorrectLevel.H
    });

    // 等待二维码生成完成
    setTimeout(() => {
        // 应用圆角
        const radius = parseInt(radiusRange.value);
        const qrImage = qrCodeElement.querySelector('img');
        if (qrImage) {
            qrImage.style.borderRadius = `${radius}%`;
            
            // 如果有Logo，添加Logo
            if (qrConfig.logo) {
                addLogoToQR();
            }
        }
    }, 100);
}, 300);

// 添加Logo到二维码
function addLogoToQR() {
    const qrImage = qrCodeElement.querySelector('img');
    if (!qrImage || !qrConfig.logo) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置canvas尺寸
    canvas.width = qrConfig.width;
    canvas.height = qrConfig.height;
    
    // 创建临时canvas用于Logo处理
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // 计算Logo尺寸和位置
    const logoSize = Math.round(qrConfig.width * LOGO_CONFIG.size);
    const logoX = (canvas.width - logoSize) / 2;
    const logoY = (canvas.height - logoSize) / 2;
    const logoPadding = Math.round(logoSize * LOGO_CONFIG.margin);
    const logoRadius = Math.round(logoSize * LOGO_CONFIG.borderRadius);
    
    // 绘制二维码
    const qrPromise = new Promise((resolve) => {
        if (qrImage.complete) {
            ctx.fillStyle = qrConfig.colorLight;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(qrImage, 0, 0, canvas.width, canvas.height);
            resolve();
        } else {
            qrImage.onload = () => {
                ctx.fillStyle = qrConfig.colorLight;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(qrImage, 0, 0, canvas.width, canvas.height);
                resolve();
            };
        }
    });
    
    // 处理和绘制Logo
    const logoPromise = new Promise((resolve) => {
        const logoImg = new Image();
        logoImg.crossOrigin = 'Anonymous'; // 处理跨域图片
        logoImg.src = qrConfig.logo;
        
        logoImg.onload = () => {
            // 设置临时canvas尺寸
            tempCanvas.width = logoSize + (logoPadding * 2);
            tempCanvas.height = logoSize + (logoPadding * 2);
            
            // 绘制Logo背景（带圆角的白色背景）
            tempCtx.save();
            tempCtx.beginPath();
            tempCtx.roundRect(0, 0, tempCanvas.width, tempCanvas.height, logoRadius);
            tempCtx.fillStyle = LOGO_CONFIG.borderColor;
            tempCtx.shadowColor = LOGO_CONFIG.shadowColor;
            tempCtx.shadowBlur = LOGO_CONFIG.shadowBlur;
            tempCtx.fill();
            tempCtx.restore();
            
            // 绘制Logo图片（带圆角）
            tempCtx.save();
            tempCtx.beginPath();
            tempCtx.roundRect(logoPadding, logoPadding, logoSize, logoSize, logoRadius * 0.8);
            tempCtx.clip();
            tempCtx.drawImage(logoImg, logoPadding, logoPadding, logoSize, logoSize);
            tempCtx.restore();
            
            // 将处理后的Logo绘制到主canvas
            ctx.drawImage(
                tempCanvas,
                logoX - logoPadding,
                logoY - logoPadding,
                tempCanvas.width,
                tempCanvas.height
            );
            
            resolve();
        };
        
        logoImg.onerror = () => {
            console.error('Logo加载失败');
            resolve(); // 即使失败也resolve，以免阻塞二维码生成
        };
    });
    
    // 等待所有绘制完成后更新二维码图片
    Promise.all([qrPromise, logoPromise])
        .then(() => {
            try {
                qrImage.src = canvas.toDataURL('image/png');
            } catch (error) {
                console.error('二维码生成失败:', error);
            }
        });
}

// 图片背景处理函数
function processLogoImage(originalImage, qrSize) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 使用高分辨率canvas以提高清晰度
        const scale = window.devicePixelRatio || 2;
        
        // 计算Logo尺寸为二维码尺寸的25%
        const targetLogoSize = Math.round(qrSize * 0.25);
        
        // 计算合适的尺寸（保持宽高比）
        let width = originalImage.width;
        let height = originalImage.height;
        
        // 根据最长边缩放到目标尺寸
        if (width > height) {
            width = targetLogoSize;
            height = Math.round((height * targetLogoSize) / originalImage.width);
        } else {
            height = targetLogoSize;
            width = Math.round((width * targetLogoSize) / originalImage.height);
        }
        
        // 设置高分辨率canvas尺寸
        canvas.width = width * scale;
        canvas.height = height * scale;
        
        // 配置canvas以获得最佳质量
        ctx.scale(scale, scale);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 绘制图片
        ctx.drawImage(originalImage, 0, 0, width, height);
        
        // 获取图片数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 调整透明度和对比度
        for (let i = 0; i < data.length; i += 4) {
            // 使用更精确的亮度计算公式
            const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            
            // 增加对比度
            const contrast = 1.3; // 略微增加对比度以提高清晰度
            const factor = (contrast * (brightness - 128) + 128) / brightness;
            
            // 使用更精确的颜色调整
            data[i] = Math.min(255, Math.max(0, Math.round(data[i] * factor)));     // R
            data[i + 1] = Math.min(255, Math.max(0, Math.round(data[i + 1] * factor))); // G
            data[i + 2] = Math.min(255, Math.max(0, Math.round(data[i + 2] * factor))); // B
            
            // 调整透明度
            if (brightness > 240) {
                data[i + 3] = 0; // 完全透明
            } else {
                // 使用更平滑的透明度过渡
                const alpha = Math.max(0, Math.min(255, 
                    data[i + 3] * (1 - Math.pow(brightness / 255, 1.5) * 0.5)
                ));
                data[i + 3] = Math.round(alpha);
            }
        }
        
        // 将处理后的数据放回canvas
        ctx.putImageData(imageData, 0, 0);
        
        // 创建新图片，使用高质量PNG格式
        const processedImage = new Image();
        processedImage.onload = () => resolve(processedImage);
        processedImage.src = canvas.toDataURL('image/png', 1.0);
    });
}

// 修改Logo上传处理
logoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件');
            return;
        }
        
        // 验证文件大小（最大2MB）
        if (file.size > 2 * 1024 * 1024) {
            alert('图片大小不能超过2MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            // 预检查图片
            const img = new Image();
            img.onload = async () => {
                // 检查图片尺寸
                if (img.width < 100 || img.height < 100) {
                    alert('图片尺寸太小，请上传至少100x100像素的图片');
                    return;
                }
                
                try {
                    // 处理图片
                    const processedImage = await processLogoImage(img, qrConfig.width);
                    qrConfig.logo = processedImage.src;
                    removeLogoBtn.hidden = false;
                    updateQRCode();
                } catch (error) {
                    console.error('图片处理失败:', error);
                    alert('图片处理失败，请尝试使用其他图片');
                }
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            alert('图片读取失败，请重试');
        };
        reader.readAsDataURL(file);
    }
});

// 移除Logo
removeLogoBtn.addEventListener('click', () => {
    qrConfig.logo = null;
    logoInput.value = '';
    removeLogoBtn.hidden = true;
    updateQRCode();
});

// 重置功能
resetBtn.addEventListener('click', () => {
    qrInput.value = '';
    fgColorInput.value = '#000000';
    bgColorInput.value = '#ffffff';
    sizeRange.value = '300';
    radiusRange.value = '0';
    sizeRange.nextElementSibling.textContent = '300px';
    radiusRange.nextElementSibling.textContent = '0%';
    qrConfig.logo = null;
    logoInput.value = '';
    removeLogoBtn.hidden = true;
    updateQRCode();
});

// 复制二维码
copyBtn.addEventListener('click', async () => {
    try {
        const qrImage = qrCodeElement.querySelector('img');
        if (!qrImage) return;
        
        const response = await fetch(qrImage.src);
        const blob = await response.blob();
        await navigator.clipboard.write([
            new ClipboardItem({
                [blob.type]: blob
            })
        ]);
        
        copyBtn.textContent = '已复制！';
        setTimeout(() => {
            copyBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                复制二维码
            `;
        }, 2000);
    } catch (err) {
        console.error('复制失败:', err);
    }
});

// 下载二维码
downloadBtn.addEventListener('click', () => {
    const qrImage = qrCodeElement.querySelector('img');
    if (!qrImage) return;
    
    const link = document.createElement('a');
    link.download = '二维码.png';
    link.href = qrImage.src;
    link.click();
});

// 事件监听器
qrInput.addEventListener('input', updateQRCode);
fgColorInput.addEventListener('input', updateQRCode);
bgColorInput.addEventListener('input', updateQRCode);
sizeRange.addEventListener('input', (e) => {
    e.target.nextElementSibling.textContent = `${e.target.value}px`;
    updateQRCode();
});
radiusRange.addEventListener('input', (e) => {
    e.target.nextElementSibling.textContent = `${e.target.value}%`;
    updateQRCode();
});

// 初始化
updateQRCode(); 