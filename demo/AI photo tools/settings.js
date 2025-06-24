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
      workerUrl: "https://ai-image-storage.sharanlillickclz66.workers.dev"
    },
    
    // Worker配置
    worker: {
      // Cloudflare Worker URL
      url: "https://ai-image-storage.sharanlillickclz66.workers.dev", // 替换为您实际部署的Worker URL
      
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
      model: "dreamshaper-8",
      
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
    // 获取配置项
    get: function(path, defaultValue) {
      try {
        return path.split('.').reduce((o, i) => o ? o[i] : undefined, defaultConfig) || defaultValue;
      } catch (e) {
        console.warn(`获取配置路径"${path}"失败:`, e);
        return defaultValue;
      }
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
    
    // 获取全部配置
    getAll: function() {
      return JSON.parse(JSON.stringify(defaultConfig)); // 返回深拷贝，防止外部修改
    },
    
    // 验证配置（检查必需项）
    validate: function() {
      const required = [
        'worker.url',
        'api.defaultModel',
        'corsProxy.url'
      ];
      
      const missing = required.filter(path => !this.get(path));
      
      if (missing.length > 0) {
        console.warn('配置验证：以下必需配置项缺失：', missing);
        return false;
      }
      
      return true;
    },
    
    // 初始化配置
    init: function() {
      this.validate();
      console.log('配置系统初始化完成');
      return this;
    }
  };
})().init(); // 立即初始化 