// 确保SETTINGS对象存在
if (typeof window.SETTINGS === 'undefined') {
    console.error('SETTINGS object not found. Initializing with default values.');
    window.SETTINGS = {
        worker: { url: "https://ai-image-storage.sharanlillickclz66.workers.dev" },
        corsProxy: { url: "https://corsproxy.io/?" }
    };
}

// DOM 元素
const promptInput = document.getElementById('prompt-input');
const sizeSelect = document.getElementById('size-select');
const styleSelect = document.getElementById('style-select');
const generateBtn = document.getElementById('generate-btn');
const gallery = document.getElementById('gallery');
const historyBtn = document.getElementById('history-btn');
const historyPanel = document.getElementById('history-panel');
const closeHistory = document.getElementById('close-history');
const historyList = document.getElementById('history-list');
const previewModal = document.getElementById('preview-modal');
const previewImage = document.getElementById('preview-image');
const previewPrompt = document.getElementById('preview-prompt');
const previewSettings = document.getElementById('preview-settings');
const closeModal = document.getElementById('close-modal');
const downloadBtn = document.getElementById('download-btn');
const shareBtn = document.getElementById('share-btn');
const placeholderText = document.querySelector('.placeholder-text');
const apiStatus = document.getElementById('api-status');
const useCorsProxy = document.getElementById('use-cors-proxy');
const stepsRange = document.getElementById('steps-range');
const stepsValue = document.getElementById('steps-value');
const guidanceRange = document.getElementById('guidance-range');
const guidanceValue = document.getElementById('guidance-value');
const saveInfoOverlay = document.getElementById('save-info-overlay');
const closeSaveInfo = document.getElementById('close-save-info');

// 状态变量
let isGenerating = false;
let generatedImages = [];
let currentImageIndex = null;
let apiAvailable = null; // null = 未测试, true = 可用, false = 不可用

// 从设置中获取CORS代理URL和Worker URL
const CORS_PROXY_URL = window.SETTINGS.corsProxy.url;
const WORKER_URL = window.SETTINGS.worker.url;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检测是否是Edge浏览器，如果是则默认启用CORS代理
    if (navigator.userAgent.indexOf("Edg") !== -1) {
        if (useCorsProxy) {
            useCorsProxy.checked = true;
            console.log('检测到Edge浏览器，已自动启用CORS代理');
        }
    }
    
    loadFromLocalStorage();
    setupEventListeners();
    testApiConnection();
    
    // 添加帮助按钮到头部
    const headerActions = document.querySelector('.header-actions');
    const helpBtn = document.createElement('button');
    helpBtn.className = 'icon-btn';
    helpBtn.title = '查看帮助';
    helpBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
    `;
    helpBtn.addEventListener('click', showSaveInfo);
    headerActions.insertBefore(helpBtn, historyBtn);
    
    // 添加调试按钮
    const debugBtn = document.createElement('button');
    debugBtn.className = 'icon-btn';
    debugBtn.title = '调试API连接';
    debugBtn.style.backgroundColor = '#ff5722';
    debugBtn.style.color = 'white';
    debugBtn.innerHTML = 'API测试';
    debugBtn.addEventListener('click', debugApiConnection);
    document.querySelector('header').appendChild(debugBtn);
});

// 设置事件监听器
function setupEventListeners() {
    // 生成按钮点击事件
    generateBtn.addEventListener('click', handleGenerate);
    
    // 历史记录按钮点击事件
    historyBtn.addEventListener('click', toggleHistoryPanel);
    closeHistory.addEventListener('click', toggleHistoryPanel);
    
    // 模态框相关事件
    closeModal.addEventListener('click', closePreviewModal);
    downloadBtn.addEventListener('click', downloadCurrentImage);
    shareBtn.addEventListener('click', shareCurrentImage);
    
    // 点击模态框外部关闭
    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            closePreviewModal();
        }
    });
    
    // 防止表单提交
    document.querySelector('textarea').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleGenerate();
        }
    });
    
    // 滑块值更新
    stepsRange.addEventListener('input', () => {
        stepsValue.textContent = stepsRange.value;
    });
    
    guidanceRange.addEventListener('input', () => {
        guidanceValue.textContent = guidanceRange.value;
    });
    
    // API状态点击事件
    apiStatus.addEventListener('click', testApiConnection);
    
    // 保存信息弹窗关闭事件
    closeSaveInfo.addEventListener('click', () => {
        saveInfoOverlay.classList.remove('active');
    });
    
    // 点击弹窗外部关闭
    saveInfoOverlay.addEventListener('click', (e) => {
        if (e.target === saveInfoOverlay) {
            saveInfoOverlay.classList.remove('active');
        }
    });
}

// 测试API连接
async function testApiConnection() {
    updateApiStatus('loading', 'API测试中...');
    
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    try {
        // 使用Worker代理检查API连接
        const response = await fetch(`${WORKER_URL}/api/test-connection`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId); // 清除超时
        
        const result = await response.json();
        
        if (result.status === 'connected') {
            apiAvailable = true;
            updateApiStatus('connected', 'API可用');
            generateBtn.disabled = false;
        } else {
            apiAvailable = false;
            updateApiStatus('error', `API不可用 ❌ (${result.error || '未知错误'})`);
            generateBtn.disabled = true;
        }
    } catch (error) {
        clearTimeout(timeoutId); // 清除超时
        
        if (error.name === 'AbortError') {
            console.error('API连接测试超时');
            apiAvailable = false;
            updateApiStatus('error', 'API连接超时 ❌');
        } else {
            console.error('API连接测试失败:', error);
            apiAvailable = false;
            updateApiStatus('error', 'API连接失败 ❌');
        }
        generateBtn.disabled = true;
    }
}

// 更新API状态显示
function updateApiStatus(status, text) {
    apiStatus.className = 'api-status ' + status;
    apiStatus.querySelector('.status-text').textContent = text;
}

// 处理生成图片
async function handleGenerate() {
    console.log('生成按钮被点击');
    const prompt = promptInput.value.trim();
    
    if (!prompt || isGenerating) {
        console.log('提示词为空或正在生成中，退出函数');
        return;
    }
    
    const size = sizeSelect.value;
    const style = styleSelect.value;
    const steps = parseInt(stepsRange.value);
    const guidance = parseFloat(guidanceRange.value);
    
    console.log('生成参数:', { prompt, size, style, steps, guidance });
    console.log('Worker URL:', WORKER_URL);
    
    // 开始生成状态
    isGenerating = true;
    generateBtn.classList.add('loading');
    updateApiStatus('loading', 'AI生成中...');
    
    // 添加骨架屏
    if (gallery.querySelector('.placeholder-text')) {
        gallery.removeChild(placeholderText);
    }
    
    const loadingCard = createLoadingCard();
    gallery.insertBefore(loadingCard, gallery.firstChild);
    
    try {
        // 准备请求数据
        const requestData = {
            prompt: prompt,
            model: window.SETTINGS.api.defaultModel || "Kwai-Kolors/Kolors",
            image_size: size
        };
        
        if (style && style !== 'default') {
            requestData.style = style;
        }
        
        // 添加高级参数
        requestData.num_inference_steps = steps;
        requestData.guidance_scale = guidance;
        
        console.log('发送请求数据:', requestData);
        console.log('请求URL:', `${WORKER_URL}/api/generate-image`);
        
        // 使用Worker API代理生成图片
        const response = await fetch(`${WORKER_URL}/api/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('收到响应状态:', response.status, response.statusText);
        
        // 获取原始响应文本，便于调试
        const responseText = await response.text();
        console.log('原始响应文本:', responseText);
        
        // 尝试解析JSON
        let result;
        try {
            result = JSON.parse(responseText);
            console.log('解析后的响应数据:', result);
        } catch (parseError) {
            console.error('响应解析失败:', parseError);
            throw new Error(`响应解析失败: ${parseError.message}, 原始响应: ${responseText.substring(0, 100)}...`);
        }
        
        if (!response.ok || !result.success) {
            const errorMsg = typeof result.error === 'object' 
                ? JSON.stringify(result.error) 
                : (result.error || '图片生成失败');
            console.error('图片生成响应错误:', errorMsg);
            throw new Error(errorMsg);
        }
        
        // 移除骨架屏
        gallery.removeChild(loadingCard);
        
        // 检查返回的URL是否有效
        const imageUrl = result.permanentUrl;
        if (!imageUrl) {
            throw new Error('返回的图片URL为空');
        }
        
        console.log('获取到永久URL:', imageUrl);
        
        // 测试图片URL是否可访问
        try {
            const imgResponse = await fetch(imageUrl, { method: 'HEAD' });
            console.log('图片URL测试结果:', imgResponse.status, imgResponse.statusText);
            if (!imgResponse.ok) {
                console.warn('警告: 图片URL可能无法访问:', imgResponse.status);
            }
        } catch (imgError) {
            console.warn('警告: 图片URL测试失败:', imgError);
        }
        
        // 使用永久URL创建图片卡片
        const imageData = {
            url: imageUrl,
            prompt: prompt,
            size: size,
            style: style || 'default',
            timestamp: new Date().toISOString(),
            fileName: result.fileName,
            isPermanent: true
        };
        
        console.log('创建图片数据:', imageData);
        
        // 添加到图库和历史记录
        addImageToGallery(imageData);
        saveToHistory(imageData);
        
        updateApiStatus('connected', 'AI生成成功');
    } catch (error) {
        console.error('生成图片失败:', error);
        
        // 移除骨架屏
        if (gallery.contains(loadingCard)) {
            gallery.removeChild(loadingCard);
        }
        
        // 调试信息
        console.log('错误详情:', error);
        console.log('Worker URL:', WORKER_URL);
        console.log('API状态:', apiAvailable);
        
        // 给用户更有用的提示
        if (error.message.includes('R2')) {
            showNotification(`存储图片失败: ${error.message}. 请检查R2存储配置`, 'error');
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
            showNotification(`网络请求失败: ${error.message}. 请检查网络连接`, 'error');
        } else if (error.message.includes('parse') || error.message.includes('JSON')) {
            showNotification(`响应解析失败: ${error.message}. 服务器返回了无效数据`, 'error');
        } else {
            showNotification(`生成失败: ${error.message}`, 'error');
        }
        
        // 尝试重新测试API连接
        testApiConnection();
    } finally {
        // 结束生成状态
        isGenerating = false;
        generateBtn.classList.remove('loading');
    }
}

// 创建骨架屏
function createLoadingCard() {
    const loadingCard = document.createElement('div');
    loadingCard.className = 'image-card loading';
    return loadingCard;
}

// 添加图片到画廊
function addImageToGallery(imageData) {
    const imageCard = document.createElement('div');
    imageCard.className = 'image-card fade-in';
    
    const img = document.createElement('img');
    img.src = imageData.url;
    img.alt = imageData.prompt;
    img.loading = 'lazy';
    
    const imageInfo = document.createElement('div');
    imageInfo.className = 'image-info';
    imageInfo.innerHTML = `
        <span>${formatPrompt(imageData.prompt)}</span>
        <span>${imageData.size}</span>
    `;
    
    imageCard.appendChild(img);
    imageCard.appendChild(imageInfo);
    
    // 点击图片查看大图
    imageCard.addEventListener('click', () => {
        openPreviewModal(imageData);
    });
    
    gallery.insertBefore(imageCard, gallery.firstChild);
}

// 打开预览模态框
function openPreviewModal(imageData) {
    previewImage.src = imageData.url;
    previewImage.alt = imageData.prompt;
    
    // 显示提示词和设置
    previewPrompt.textContent = imageData.prompt;
    previewSettings.textContent = `尺寸: ${imageData.size} | 风格: ${formatStyle(imageData.style)} | 生成时间: ${formatDate(imageData.timestamp)}`;
    
    // 设置当前图片索引，用于下载和分享
    currentImageIndex = generatedImages.findIndex(img => img.url === imageData.url);
    
    previewModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 获取风格名称
function formatStyle(style) {
    if (!style || style === 'default') return '默认';
    
    const styleMap = {
        'anime': '动漫风格',
        'photographic': '照片风格',
        'digital-art': '数字艺术',
        'comic-book': '漫画风格',
        'fantasy-art': '奇幻艺术',
        'oil-painting': '油画风格',
        'watercolor': '水彩风格',
        '3d-render': '3D渲染',
        'realistic': '写实风格',
        '3d': '3D渲染'
    };
    
    return styleMap[style] || style;
}

// 关闭预览模态框
function closePreviewModal() {
    previewModal.classList.remove('active');
    document.body.style.overflow = '';
}

// 下载当前图片
function downloadCurrentImage() {
    if (currentImageIndex === null) return;
    
    const image = generatedImages[currentImageIndex];
    
    // 创建一个新的下载链接
    const link = document.createElement('a');
    
    // 从URL加载图片以保存到本地
    console.log(`尝试下载图片: ${image.url}`);
    fetch(image.url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
    })
        .then(response => {
            if (!response.ok) {
                console.error(`获取图片失败: ${response.status} ${response.statusText}`);
                throw new Error(`Failed to fetch image: ${response.status}`);
            }
            return response.blob();
        })
        .then(blob => {
            // 创建一个本地Blob URL
            const blobUrl = URL.createObjectURL(blob);
            
            // 设置下载链接属性
            link.href = blobUrl;
            link.download = image.fileName || `ai-image-${Date.now()}.png`;
            
            // 添加链接到DOM，触发点击，然后移除
            document.body.appendChild(link);
            link.click();
            
            // 清理
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl); // 释放Blob URL
            }, 100);
        })
        .catch(error => {
            console.error('下载图片失败:', error);
            
            // 如果图片URL已过期，尝试使用R2 Worker获取永久URL
            if (image.isPermanent && image.fileName) {
                alert('正在从云存储获取图片，请稍候...');
                
                // 构建直接访问R2存储的URL
                const r2Url = `${WORKER_URL}/image/${image.fileName}`;
                console.log(`尝试从R2获取图片: ${r2Url}`);
                
                // 尝试从R2获取
                fetch(r2Url, {
                    method: 'GET',
                    mode: 'cors',
                    credentials: 'omit'
                })
                    .then(response => {
                        if (!response.ok) {
                            console.error(`从R2获取图片失败: ${response.status} ${response.statusText}`);
                            throw new Error('无法从云存储获取图片');
                        }
                        return response.blob();
                    })
                    .then(blob => {
                        const blobUrl = URL.createObjectURL(blob);
                        link.href = blobUrl;
                        link.download = image.fileName;
                        document.body.appendChild(link);
                        link.click();
                        setTimeout(() => {
                            document.body.removeChild(link);
                            URL.revokeObjectURL(blobUrl);
                        }, 100);
                    })
                    .catch(r2Error => {
                        console.error('从云存储获取图片失败:', r2Error);
                        alert('下载图片失败，请重试或联系管理员');
                    });
            } else {
                alert('下载图片失败，图片链接可能已过期');
            }
        });
}

// 分享当前图片
function shareCurrentImage() {
    if (currentImageIndex === null) return;
    
    const image = generatedImages[currentImageIndex];
    
    // 检查图片URL是否可能已过期，优先使用永久URL
    const shareUrl = (image.isPermanent && image.fileName) 
        ? `${WORKER_URL}/image/${image.fileName}` 
        : image.url;
    
    // 检查是否支持网页分享API
    if (navigator.share) {
        navigator.share({
            title: '我用AI生成的图片',
            text: image.prompt,
            url: shareUrl
        }).catch(error => {
            console.error('分享失败:', error);
        });
    } else {
        // 复制图片链接到剪贴板
        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                alert('永久图片链接已复制到剪贴板');
            })
            .catch(err => {
                console.error('复制失败:', err);
            });
    }
}

// 切换历史记录面板
function toggleHistoryPanel() {
    historyPanel.classList.toggle('active');
}

// 保存到历史记录
function saveToHistory(imageData) {
    generatedImages.unshift(imageData);
    
    // 限制历史记录数量
    if (generatedImages.length > 50) {
        generatedImages = generatedImages.slice(0, 50);
    }
    
    // 保存到localStorage
    localStorage.setItem('aiGeneratedImages', JSON.stringify(generatedImages));
    
    // 更新历史面板
    updateHistoryPanel();
}

// 更新历史面板
function updateHistoryPanel() {
    historyList.innerHTML = '';
    
    if (generatedImages.length === 0) {
        historyList.innerHTML = '<p class="empty-history">暂无历史记录</p>';
        return;
    }
    
    generatedImages.forEach((imageData, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        item.innerHTML = `
            <img src="${imageData.url}" alt="${imageData.prompt}">
            <div class="history-item-info">
                <p>${formatPrompt(imageData.prompt)}</p>
                <span>${formatDate(imageData.timestamp)}</span>
            </div>
        `;
        
        item.addEventListener('click', () => {
            openPreviewModal(imageData);
        });
        
        historyList.appendChild(item);
    });
    
    // 更新历史记录数量
    const historyCountElement = document.getElementById('history-count');
    if (historyCountElement) {
        historyCountElement.textContent = generatedImages.length;
    }
}

// 从本地存储加载历史记录
function loadFromLocalStorage() {
    const savedHistory = localStorage.getItem('aiGeneratedImages');
    
    if (savedHistory) {
        generatedImages = JSON.parse(savedHistory);
        updateHistoryPanel();
        
        // 将历史记录中的图片添加到画廊
        if (generatedImages.length > 0) {
            placeholderText.style.display = 'none';
            
            // 只展示最近5张图片
            const recentImages = generatedImages.slice(0, 5);
            recentImages.forEach(image => {
                addImageToGallery(image);
            });
        }
    }
}

// 格式化提示文本（截断长文本）
function formatPrompt(prompt) {
    return prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;
}

// 格式化日期
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 显示保存信息弹窗
function showSaveInfo() {
    // 检测是否是Edge浏览器
    const isEdgeBrowser = navigator.userAgent.indexOf("Edg") !== -1;
    
    // 更新保存说明内容，包含R2永久存储信息
    const tooltipContent = document.querySelector('.tooltip-content');
    tooltipContent.innerHTML = `
        <h3>关于图片保存</h3>
        <p>1. 图片生成后会立即上传到云存储以确保永久保存</p>
        <p>2. 即使一小时后原始图片链接失效，您依然可以访问所有历史图片</p>
        <p>3. 图片URL和提示词会自动保存在浏览器的本地存储中</p>
        <p>4. 点击图片后，可以使用"下载"按钮将图片保存到您的设备上</p>
        <p>5. 下载的图片将保存在您的默认下载文件夹中</p>
        <p>6. 您可以随时在"历史记录"中查看并下载之前生成的图片</p>
        ${isEdgeBrowser ? '<p style="color:#f0a020"><strong>注意:</strong> 检测到您正在使用Edge浏览器，已自动启用CORS代理以提高兼容性</p>' : ''}
        <button id="close-save-info" class="action-btn">我知道了</button>
    `;
    
    // 重新绑定关闭按钮事件
    document.getElementById('close-save-info').addEventListener('click', () => {
        saveInfoOverlay.classList.remove('active');
    });
    
    saveInfoOverlay.classList.add('active');
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="notification-icon ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 淡入动画
    setTimeout(() => notification.classList.add('visible'), 10);
    
    // 自动消失
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// 获取通知图标
function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fas fa-check-circle';
        case 'error': return 'fas fa-exclamation-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        default: return 'fas fa-info-circle';
    }
}

// 调试API连接
async function debugApiConnection() {
    // 添加高级调试选项
    const debugChoice = confirm('选择调试方式：\n点击"确定"打开API测试工具\n点击"取消"在控制台执行快速测试');
    
    if (debugChoice) {
        const debugWindow = window.open('test-api-connection.html', '_blank');
        if (!debugWindow) {
            alert('请允许打开弹窗以查看API测试工具');
        }
    } else {
        console.log('===== 快速API测试开始 =====');
        console.log('SETTINGS对象:', window.SETTINGS);
        console.log('Worker URL:', WORKER_URL);
        
        try {
            // 测试API连接
            console.log('测试API连接状态...');
            const connectionTest = await fetch(`${WORKER_URL}/api/test-connection`);
            const connectionResult = await connectionTest.json();
            console.log('API连接测试结果:', connectionResult);
            
            // 测试Worker信息
            console.log('获取Worker信息...');
            const workerTest = await fetch(WORKER_URL);
            const workerResult = await workerTest.json();
            console.log('Worker信息:', workerResult);
            
            // 测试图片获取
            console.log('测试图片获取功能...');
            try {
                const imageTest = await fetch(`${WORKER_URL}/image/test-image.png`);
                console.log('图片获取测试状态:', imageTest.status, imageTest.statusText);
            } catch (e) {
                console.log('图片获取测试失败(预期结果，因为测试图片可能不存在):', e.message);
            }
            
            // 测试R2状态
            console.log('准备测试发送简单生成请求...');
            try {
                const testGenRequest = {
                    prompt: "测试图片请求",
                    model: window.SETTINGS.api.defaultModel || "Kwai-Kolors/Kolors",
                    image_size: "256x256"
                };
                
                const testGenResponse = await fetch(`${WORKER_URL}/api/generate-image`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(testGenRequest)
                });
                
                if (testGenResponse.ok) {
                    console.log('测试生成请求成功，查看详细响应');
                    const testGenResult = await testGenResponse.json();
                    console.log('测试生成响应:', testGenResult);
                } else {
                    console.error('测试生成请求失败:', testGenResponse.status, testGenResponse.statusText);
                    const errorText = await testGenResponse.text();
                    console.error('错误详情:', errorText);
                }
            } catch (testGenError) {
                console.error('测试生成请求异常:', testGenError);
            }
            
            console.log('===== 快速API测试完成 =====');
            
            // 显示调试信息
            showNotification('快速API测试完成，请查看控制台', 'info');
        } catch (error) {
            console.error('快速API测试失败:', error);
            showNotification(`API测试错误: ${error.message}`, 'error');
        }
    }
} 