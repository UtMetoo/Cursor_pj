/**
 * AI图片生成器 - 全局设置文件
 * 集中管理所有配置变量，便于维护和更新
 */

// 创建模块化配置系统
window.AppConfig = (function() {
  // 默认配置
  const defaultConfig = {
    // API配置
    api: {
      // API密钥 - 已配置在wrangler.toml中，此处不再重复存储
      apiKey: null,
      
      // API端点
      endpoints: {
        models: "/v1/models",
        imageGeneration: "/v1/images/generations"
      },
      
      // 默认模型设置
      defaultModel: "Kwai-Kolors/Kolors",
      
      // 硅基流动API基础URL
      baseUrl: "https://api.siliconflow.cn",
      
      // Worker URL - 用于代理API请求和存储图片
      // 必须替换为您部署的实际Worker URL
      workerUrl: "https://ai.worker.nxlan.cn"
    },
    
    // Worker配置
    worker: {
      // Cloudflare Worker URL
      url: "https://ai.worker.nxlan.cn", // 替换为您实际部署的Worker URL
      
      // Worker API路径
      endpoints: {
        testConnection: "/api/test-connection",
        generateImage: "/api/generate-image",
        getImage: "/image/"
      },
    },
    
    // CORS代理配置
    corsProxy: {
      // CORS代理URL
      url: "https://corsproxy.io/?",
      
      // 替代CORS代理列表(备用)
      alternativeProxies: [
        "https://corsproxy.io/?",
        "https://cors-anywhere.herokuapp.com/"
      ]
    },
    
    // 图片生成设置
    imageGeneration: {
      // 默认模型
      model: "Kwai-Kolors/Kolors",
      
      // 默认尺寸
      defaultSizes: [
        {value: "512x512", label: "512×512 (标准)"},
        {value: "1024x1024", label: "1024×1024 (高清)"}
      ],
      
      // 默认风格
      styles: [
        {value: "default", label: "默认风格"},
        {value: "anime", label: "动漫风格"},
        {value: "photographic", label: "照片风格"},
        {value: "digital-art", label: "数字艺术"},
        {value: "comic-book", label: "漫画风格"},
        {value: "fantasy-art", label: "奇幻艺术"},
        {value: "oil-painting", label: "油画风格"},
        {value: "watercolor", label: "水彩风格"},
        {value: "3d-render", label: "3D渲染"}
      ],
      
      // 风格提示词映射
      stylePrompts: {
        'realistic': 'highly detailed, ultra realistic photograph of {prompt}, 8k, professional photography, sharp focus',
        'anime': 'anime style, {prompt}, vibrant colors, studio ghibli, hayao miyazaki style',
        'watercolor': 'watercolor painting of {prompt}, soft colors, flowing, artistic, hand-painted',
        '3d': '3D rendering of {prompt}, octane render, detailed textures, soft lighting, ray tracing',
        '3d-render': '3D rendering of {prompt}, octane render, detailed textures, soft lighting, ray tracing',
        'digital-art': 'digital art, {prompt}, detailed, vibrant colors, professional illustration',
        'comic-book': 'comic book style, {prompt}, bold lines, vibrant colors, dynamic composition',
        'fantasy-art': 'fantasy art, {prompt}, magical, ethereal, detailed, professional illustration',
        'oil-painting': 'oil painting of {prompt}, detailed brushwork, classical style, rich colors, museum quality',
        'photographic': 'professional photograph of {prompt}, high resolution, sharp focus, detailed, realistic'
      },
      
      // 提示语参数
      prompt: {
        min: 1,
        max: 1000
      },
      
      // 负面提示语参数
      negativePrompt: {
        min: 0,
        max: 1000
      },
      
      // 生成数量参数
      numImages: {
        min: 1,
        max: 4,
        default: 1
      },
      
      // 图像质量参数
      quality: {
        min: 0.1,
        max: 1.0,
        default: 0.8,
        step: 0.1
      },
      
      // CFG参数（创意自由度）
      cfg: {
        min: 0.0,
        max: 15.0,
        default: 7.5,
        step: 0.1
      },
      
      // 图像尺寸选项
      sizes: [
        { value: "256x256", label: "小图 (256x256)" },
        { value: "512x512", label: "中图 (512x512)" },
        { value: "1024x1024", label: "大图 (1024x1024)" }
      ],
      
      // 默认图像尺寸
      defaultSize: "512x512",
      
      // 默认图像风格
      defaultStyle: "base"
    },
    
    // 存储设置
    storage: {
      // localStorage键名
      historyKey: "aiGeneratedImages",
      
      // 历史记录最大数量
      maxHistoryItems: 50
    },
    
    // UI设置
    ui: {
      // 通知显示时间(毫秒)
      notificationDuration: 4000,
      
      // 默认加载状态显示文本
      loadingText: "AI生成中...",
      
      // 图片缩略图最大文本长度
      thumbnailMaxTextLength: 50,
      
      // 主题颜色
      colors: {
        primary: "#6e48aa",
        secondary: "#9f50ac",
        background: "#1a1a2e",
        text: "#e6e6e6"
      },
      
      // 加载文本选项（随机显示）
      loadingTexts: [
        "正在绘制你的想象...",
        "AI正在挥毫泼墨...",
        "正在将文字转化为图像...",
        "灵感正在具象化...",
        "正在编织像素的魔法...",
        "让创意变得可见..."
      ],
      
      // 历史记录最大保存数量
      maxHistoryItems: 50
    }
  };
  
  // 配置系统API
  return {
    // 配置映射表 - 将常用配置项映射到标准路径
    configMappings: {
      // 模型相关
      'defaultModel': 'imageGeneration.model',
      'modelStyles': 'imageGeneration.styles',
      'modelSizes': 'imageGeneration.sizes',
      'defaultSize': 'imageGeneration.defaultSize',
      'stylePrompts': 'imageGeneration.stylePrompts',
      
      // API相关
      'workerUrl': 'worker.url',
      'apiEndpoints': 'worker.endpoints',
      
      // 存储相关
      'historyKey': 'storage.historyKey',
      'maxHistoryItems': 'storage.maxHistoryItems',
      
      // UI相关
      'notificationDuration': 'ui.notificationDuration',
      'loadingTexts': 'ui.loadingTexts',
      'colors': 'ui.colors'
    },
    
    // 获取配置项
    get: function(path, defaultValue) {
      try {
        return path.split('.').reduce((o, i) => o ? o[i] : undefined, defaultConfig) || defaultValue;
      } catch (e) {
        console.warn(`获取配置路径"${path}"失败:`, e);
        return defaultValue;
      }
    },
    
    // 便捷获取配置项 - 通过映射表获取
    getConfig: function(key, defaultValue) {
      const mappedPath = this.configMappings[key] || key;
      return this.get(mappedPath, defaultValue);
    },
    
    // 设置配置项
    set: function(path, value) {
      try {
        const parts = path.split('.');
        const last = parts.pop();
        const obj = parts.reduce((o, i) => {
          if (o[i] === undefined) o[i] = {};
          return o[i];
        }, defaultConfig);
        obj[last] = value;
        return true;
      } catch (e) {
        console.error(`设置配置路径"${path}"失败:`, e);
        return false;
      }
    },
    
    // 便捷设置配置项 - 通过映射表设置
    setConfig: function(key, value) {
      const mappedPath = this.configMappings[key] || key;
      return this.set(mappedPath, value);
    },
    
    // 获取全部配置
    getAll: function() {
      return JSON.parse(JSON.stringify(defaultConfig)); // 返回深拷贝，防止外部修改
    },
    
    // 验证配置（检查必需项）
    validate: function() {
      const required = [
        'worker.url',
        'api.defaultModel',
        'corsProxy.url',
        'imageGeneration.model'
      ];
      
      const missing = required.filter(path => !this.get(path));
      
      if (missing.length > 0) {
        console.warn('配置验证：以下必需配置项缺失：', missing);
        return false;
      }
      
      // 检查配置一致性
      this.syncConfigs();
      
      return true;
    },
    
    // 同步相关配置项，确保一致性
    syncConfigs: function() {
      // 同步模型配置
      const genModel = this.get('imageGeneration.model');
      const apiModel = this.get('api.defaultModel');
      
      if (genModel !== apiModel) {
        console.warn(`模型配置不一致: imageGeneration.model (${genModel}) 与 api.defaultModel (${apiModel}) 不同，正在同步...`);
        this.set('api.defaultModel', genModel);
      }
      
      // 检查Worker URL配置
      const workerUrl = this.get('worker.url');
      const apiWorkerUrl = this.get('api.workerUrl');
      
      if (workerUrl !== apiWorkerUrl) {
        console.warn(`Worker URL配置不一致: worker.url (${workerUrl}) 与 api.workerUrl (${apiWorkerUrl}) 不同，正在同步...`);
        this.set('api.workerUrl', workerUrl);
      }
      
      // 确保存储配置一致
      const uiMaxHistory = this.get('ui.maxHistoryItems');
      const storageMaxHistory = this.get('storage.maxHistoryItems');
      
      if (uiMaxHistory !== storageMaxHistory) {
        console.warn(`历史记录配置不一致: ui.maxHistoryItems (${uiMaxHistory}) 与 storage.maxHistoryItems (${storageMaxHistory}) 不同，正在同步...`);
        this.set('ui.maxHistoryItems', storageMaxHistory);
      }
      
      return true;
    },
    
    // 初始化配置
    init: function() {
      this.validate();
      console.log('配置系统初始化完成');
      
      // 输出当前使用的模型和Worker URL
      console.log(`当前使用的模型: ${this.getConfig('defaultModel')}`);
      console.log(`当前Worker URL: ${this.getConfig('workerUrl')}`);
      
      return this;
    }
  };
})().init(); // 立即初始化 