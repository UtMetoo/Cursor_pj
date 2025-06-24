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

// CORS代理URL
const CORS_PROXY_URL = 'https://corsproxy.io/?';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
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
    
    try {
        // 创建一个简单的请求来测试API连接
        const apiKey = "sk-lsvigtdephufbkhxlhuhcpschibwzzegcbqxzzwvydaqwvmy";
        const url = useCorsProxy && useCorsProxy.checked 
            ? `${CORS_PROXY_URL}https://api.siliconflow.cn/v1/models`
            : 'https://api.siliconflow.cn/v1/models';
            
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            apiAvailable = true;
            updateApiStatus('connected', 'API可用');
        } else {
            apiAvailable = false;
            updateApiStatus('error', 'API错误');
        }
    } catch (error) {
        console.error('API连接测试失败:', error);
        apiAvailable = false;
        updateApiStatus('error', 'API不可用');
    }
}

// 更新API状态显示
function updateApiStatus(status, text) {
    apiStatus.className = 'api-status ' + status;
    apiStatus.querySelector('.status-text').textContent = text;
}

// 处理生成图片
async function handleGenerate() {
    const prompt = promptInput.value.trim();
    
    if (!prompt || isGenerating) {
        return;
    }
    
    const size = sizeSelect.value;
    const style = styleSelect.value;
    const steps = parseInt(stepsRange.value);
    const guidance = parseFloat(guidanceRange.value);
    
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
        // 调用Silicon Flow API生成图片
        const imageUrl = await generateImageWithAPI(prompt, size, style, steps, guidance);
        
        // 移除骨架屏
        gallery.removeChild(loadingCard);
        
        // 添加新图片
        addImageToGallery(imageUrl, prompt, size, style, steps, guidance);
        
        // 保存到历史记录
        saveToHistory(imageUrl, prompt, size, style, steps, guidance);
        
        updateApiStatus('connected', 'AI生成成功');
        
    } catch (error) {
        console.error('生成图片失败:', error);
        gallery.removeChild(loadingCard);
        
        // 显示错误提示
        const errorCard = document.createElement('div');
        errorCard.className = 'image-card error fade-in';
        errorCard.innerHTML = `
            <div class="error-message">生成失败，请重试</div>
        `;
        gallery.insertBefore(errorCard, gallery.firstChild);
        
        updateApiStatus('error', '生成失败');
        
        // 3秒后移除错误提示
        setTimeout(() => {
            if (gallery.contains(errorCard)) {
                gallery.removeChild(errorCard);
            }
        }, 3000);
    } finally {
        // 结束生成状态
        isGenerating = false;
        generateBtn.classList.remove('loading');
    }
}

// 使用Silicon Flow API生成图片
async function generateImageWithAPI(prompt, size, style, steps, guidance) {
    // 根据选择的风格调整提示词
    let enhancedPrompt = prompt;
    let negativePrompt = "";
    
    switch(style) {
        case 'realistic':
            enhancedPrompt += ", photorealistic, detailed, high quality";
            break;
        case 'anime':
            enhancedPrompt += ", anime style, vibrant colors, 2D";
            break;
        case 'watercolor':
            enhancedPrompt += ", watercolor painting, artistic, soft colors";
            break;
        case '3d':
            enhancedPrompt += ", 3D render, detailed textures, lighting effects";
            break;
    }
    
    // 在生产环境中，应该使用环境变量或安全的方式存储API密钥
    // 这里为了演示，直接使用API密钥（实际应用中应通过后端服务调用API）
    const apiKey = "sk-lsvigtdephufbkhxlhuhcpschibwzzegcbqxzzwvydaqwvmy"; // 注意：实际应用中不应在前端暴露API密钥
    
    try {
        // 创建请求数据
        const requestData = {
            "model": "Kwai-Kolors/Kolors",
            "prompt": enhancedPrompt,
            "negative_prompt": negativePrompt,
            "image_size": size,
            "batch_size": 1,
            "seed": Math.floor(Math.random() * 4999999999), // 随机种子
            "num_inference_steps": steps,
            "guidance_scale": guidance
        };
        
        console.log("发送API请求:", requestData);
        
        // 决定是否使用CORS代理
        const useProxy = useCorsProxy && useCorsProxy.checked;
        const apiUrl = useProxy 
            ? `${CORS_PROXY_URL}https://api.siliconflow.cn/v1/images/generations`
            : 'https://api.siliconflow.cn/v1/images/generations';
        
        // 添加超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时
        
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId); // 清除超时
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API响应错误 (${response.status}):`, errorText);
            throw new Error(`API响应错误: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("API响应:", data);
        
        // 检查API返回的图片URL
        if (data.images && data.images[0] && data.images[0].url) {
            return data.images[0].url;
        } else {
            throw new Error('API返回数据格式错误');
        }
    } catch (error) {
        console.error('API调用失败:', error);
        
        // 如果是CORS错误，提供更明确的错误信息
        if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
            console.warn('检测到CORS错误，这是正常的。在实际应用中，应该通过后端服务中转API调用。');
            
            // 如果没有启用CORS代理，建议用户启用
            if (useCorsProxy && !useCorsProxy.checked) {
                useCorsProxy.checked = true;
                alert('检测到跨域问题，已自动启用CORS代理。请重试生成图片。');
                throw new Error('已启用CORS代理，请重试');
            }
        }
        
        // 如果是超时错误
        if (error.name === 'AbortError') {
            console.warn('API请求超时，可能是网络问题或服务器响应慢。');
        }
        
        // 回退到使用占位图
        console.log('使用占位图作为备用方案');
        return mockGenerateImage(prompt, size, style);
    }
}

// 创建骨架屏
function createLoadingCard() {
    const loadingCard = document.createElement('div');
    loadingCard.className = 'image-card loading';
    return loadingCard;
}

// 添加图片到画廊
function addImageToGallery(imageUrl, prompt, size, style, steps, guidance) {
    const imageCard = document.createElement('div');
    imageCard.className = 'image-card fade-in';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = prompt;
    img.loading = 'lazy';
    
    const imageInfo = document.createElement('div');
    imageInfo.className = 'image-info';
    imageInfo.innerHTML = `
        <span>${formatPrompt(prompt)}</span>
        <span>${size}</span>
    `;
    
    imageCard.appendChild(img);
    imageCard.appendChild(imageInfo);
    
    // 点击图片查看大图
    imageCard.addEventListener('click', () => {
        openPreviewModal(imageUrl, prompt, size, style, steps, guidance);
    });
    
    gallery.insertBefore(imageCard, gallery.firstChild);
}

// 打开预览模态框
function openPreviewModal(imageUrl, prompt, size, style, steps, guidance) {
    previewImage.src = imageUrl;
    previewImage.alt = prompt;
    
    // 显示提示词和设置
    previewPrompt.textContent = prompt;
    previewSettings.textContent = `尺寸: ${size} | 风格: ${getStyleName(style)} | 步数: ${steps} | 引导强度: ${guidance}`;
    
    // 设置当前图片索引，用于下载和分享
    currentImageIndex = generatedImages.findIndex(img => img.url === imageUrl);
    
    previewModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 获取风格名称
function getStyleName(styleValue) {
    const styles = {
        'realistic': '写实风格',
        'anime': '动漫风格',
        'watercolor': '水彩风格',
        '3d': '3D渲染'
    };
    return styles[styleValue] || styleValue;
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
    fetch(image.url)
        .then(response => response.blob())
        .then(blob => {
            // 创建一个本地Blob URL
            const blobUrl = URL.createObjectURL(blob);
            
            // 设置下载链接属性
            link.href = blobUrl;
            link.download = `ai-image-${Date.now()}.png`;
            
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
            alert('下载图片失败，请重试');
        });
}

// 分享当前图片
function shareCurrentImage() {
    if (currentImageIndex === null) return;
    
    const image = generatedImages[currentImageIndex];
    
    // 检查是否支持网页分享API
    if (navigator.share) {
        navigator.share({
            title: '我用AI生成的图片',
            text: image.prompt,
            url: image.url
        }).catch(error => {
            console.error('分享失败:', error);
        });
    } else {
        // 复制图片链接到剪贴板
        navigator.clipboard.writeText(image.url)
            .then(() => {
                alert('图片链接已复制到剪贴板');
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
function saveToHistory(url, prompt, size, style, steps, guidance) {
    const timestamp = new Date().getTime();
    const imageData = {
        url,
        prompt,
        size,
        style,
        steps,
        guidance,
        timestamp
    };
    
    generatedImages.unshift(imageData);
    
    // 最多保存20条记录
    if (generatedImages.length > 20) {
        generatedImages.pop();
    }
    
    // 保存到本地存储
    localStorage.setItem('aiImageHistory', JSON.stringify(generatedImages));
    
    // 更新历史记录UI
    updateHistoryList();
}

// 更新历史记录列表
function updateHistoryList() {
    historyList.innerHTML = '';
    
    if (generatedImages.length === 0) {
        const emptyHistory = document.createElement('div');
        emptyHistory.className = 'empty-history';
        emptyHistory.textContent = '暂无历史记录';
        historyList.appendChild(emptyHistory);
        return;
    }
    
    generatedImages.forEach((image, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        historyItem.innerHTML = `
            <img src="${image.url}" alt="${image.prompt}">
            <div class="history-item-details">
                <div class="history-item-prompt">${formatPrompt(image.prompt)}</div>
                <div class="history-item-date">${formatDate(image.timestamp)}</div>
            </div>
        `;
        
        // 点击历史记录项查看大图
        historyItem.addEventListener('click', () => {
            const steps = image.steps || 20; // 兼容旧数据
            const guidance = image.guidance || 7.5; // 兼容旧数据
            openPreviewModal(image.url, image.prompt, image.size, image.style, steps, guidance);
            toggleHistoryPanel();
        });
        
        historyList.appendChild(historyItem);
    });
}

// 从本地存储加载历史记录
function loadFromLocalStorage() {
    const savedHistory = localStorage.getItem('aiImageHistory');
    
    if (savedHistory) {
        generatedImages = JSON.parse(savedHistory);
        updateHistoryList();
        
        // 将历史记录中的图片添加到画廊
        if (generatedImages.length > 0) {
            placeholderText.style.display = 'none';
            
            // 只展示最近5张图片
            const recentImages = generatedImages.slice(0, 5);
            recentImages.forEach(image => {
                const steps = image.steps || 20; // 兼容旧数据
                const guidance = image.guidance || 7.5; // 兼容旧数据
                addImageToGallery(image.url, image.prompt, image.size, image.style, steps, guidance);
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

// 模拟API调用（作为备用方案）
async function mockGenerateImage(prompt, size, style) {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 为了演示，返回随机占位图
    const width = size.split('x')[0];
    const height = size.split('x')[1];
    
    // 使用不同的占位图服务生成随机图片
    const imageServices = [
        `https://picsum.photos/${width}/${height}?random=${Date.now()}`,
        `https://source.unsplash.com/random/${width}x${height}?sig=${Date.now()}`,
        `https://placeimg.com/${width}/${height}/nature?${Date.now()}`
    ];
    
    return imageServices[Math.floor(Math.random() * imageServices.length)];
}

// 显示保存信息弹窗
function showSaveInfo() {
    saveInfoOverlay.classList.add('active');
} 