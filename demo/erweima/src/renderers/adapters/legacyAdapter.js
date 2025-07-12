/**
 * 适配器类
 * 保持与旧API兼容性，同时使用新的渲染引擎
 */
class LegacyQRAdapter {
  // 渲染器池，避免重复创建
  static _rendererPool = new Map();
  
  /**
   * 获取或创建渲染器实例
   */
  static getRenderer(options = {}) {
    const key = JSON.stringify(options);
    if (!this._rendererPool.has(key)) {
      this._rendererPool.set(key, new ZXingRenderer(options));
    }
    return this._rendererPool.get(key);
  }
  /**
   * 适配BaseQRCodeGenerator
   */
  static createBaseGenerator(options = {}) {
    const renderer = this.getRenderer(options);
    
    return {
      generate: async function(content) {
        return await renderer.generate(content);
      },
      // 兼容旧API的其他方法
      setOptions: function(newOptions) {
        Object.assign(renderer.options, newOptions);
      }
    };
  }
  
  /**
   * 适配TextQRCodeGenerator
   */
  static createTextGenerator(options = {}) {
    const renderer = this.getRenderer(options);
    const maxLength = options.maxLength || 500;
    
    return {
      generateTextQR: async function(text) {
        if (!text || text.length === 0) {
          throw new Error('文本内容不能为空');
        }
        
        if (maxLength && text.length > maxLength) {
          throw new Error(`文本长度超过限制(${maxLength}字符)`);
        }
        
        return await renderer.generate(text);
      },
      // 兼容旧API的其他方法
      setOptions: function(newOptions) {
        Object.assign(renderer.options, newOptions);
      }
    };
  }
  
  /**
   * 适配URLQRCodeGenerator
   */
  static createURLGenerator(options = {}) {
    const renderer = this.getRenderer(options);
    
    return {
      generateURLQR: async function(url) {
        const normalizedURL = LegacyQRAdapter.normalizeURL(url);
        return await renderer.generate(normalizedURL);
      },
      normalizeURL: function(url) {
        return LegacyQRAdapter.normalizeURL(url);
      }
    };
  }
  
  /**
   * 适配ZXingWifiGenerator
   */
  static createWifiGenerator(options = {}) {
    const renderer = this.getRenderer(options);
    
    return {
      generateWifiQR: async function(ssid, password, encryption = 'WPA2', hidden = false) {
        const wifiString = LegacyQRAdapter.generateWifiString(ssid, password, encryption, hidden);
        return await renderer.generate(wifiString);
      },
      generateWifiString: function(ssid, password, encryption, hidden) {
        return LegacyQRAdapter.generateWifiString(ssid, password, encryption, hidden);
      }
    };
  }
  
  /**
   * 标准化URL
   */
  static normalizeURL(url) {
    if (!url) return '';
    
    // 简单的URL验证
    const urlRegex = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i;
    if (!urlRegex.test(url)) {
      throw new Error('无效的URL格式');
    }
    
    // 添加协议
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    return url;
  }
  
  /**
   * 生成WiFi连接字符串
   */
  static generateWifiString(ssid, password, encryption = 'WPA2', hidden = false) {
    if (!ssid) throw new Error('SSID不能为空');
    
    if (ssid.includes(';')) {
      throw new Error('SSID不能包含分号(;)');
    }
    
    if ((encryption === 'WPA' || encryption === 'WPA2' || encryption === 'WPA3' || encryption === 'WEP') && !password) {
      throw new Error('必须提供密码');
    }
    
    // 生成WiFi连接字符串
    return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden ? 'true' : ''};`;
  }

  /**
   * 清理渲染器池（内存优化）
   */
  static clearRendererPool() {
    this._rendererPool.clear();
  }

  /**
   * 获取渲染器池状态
   */
  static getPoolStatus() {
    return {
      size: this._rendererPool.size,
      keys: Array.from(this._rendererPool.keys())
    };
  }
}

// 导出类
window.LegacyQRAdapter = LegacyQRAdapter; 