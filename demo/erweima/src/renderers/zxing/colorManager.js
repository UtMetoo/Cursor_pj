/**
 * 二维码颜色管理器
 * 负责处理颜色相关的逻辑
 */
class ColorManager {
  constructor(debug = false) {
    this.debug = debug;
        this.foregroundColor = "#000000";
        this.backgroundColor = "#ffffff";
    }

    /**
     * 设置前景色
     */
    setForegroundColor(color) {
        this.foregroundColor = this.validateColor(color);
    }

    /**
     * 设置背景色
     */
    setBackgroundColor(color) {
        this.backgroundColor = this.validateColor(color);
    }

    /**
     * 获取前景色
     */
    getForegroundColor() {
        return this.foregroundColor;
    }

    /**
     * 获取背景色
     */
    getBackgroundColor() {
        return this.backgroundColor;
  }
  
  /**
   * 验证颜色格式并标准化
   */
  validateColor(color) {
    // 简单验证是否为有效的颜色值
    const colorPattern = /^(#[0-9A-Fa-f]{3,8}|rgba?\(.*\)|hsla?\(.*\)|[a-z]+)$/;
    if (!colorPattern.test(color)) {
      throw new Error(`无效的颜色格式: ${color}`);
    }
    
    // 标准化颜色格式
    return this.normalizeColor(color);
  }
  
  /**
   * 标准化颜色格式，将RGB等格式转换为十六进制
   */
  normalizeColor(color) {
    // 如果已经是十六进制格式，直接返回（转换为小写）
    if (color.startsWith('#')) {
      return color.toLowerCase();
    }
    
    // 处理RGB格式
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // 处理RGBA格式
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]);
      const g = parseInt(rgbaMatch[2]);
      const b = parseInt(rgbaMatch[3]);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // 处理命名颜色
    const namedColors = {
      'black': '#000000',
      'white': '#ffffff',
      'red': '#ff0000',
      'green': '#008000',
      'blue': '#0000ff',
      'yellow': '#ffff00',
      'cyan': '#00ffff',
      'magenta': '#ff00ff',
      'gray': '#808080',
      'grey': '#808080'
    };
    
    const lowerColor = color.toLowerCase();
    if (namedColors[lowerColor]) {
      return namedColors[lowerColor];
    }
    
    // 如果无法标准化，返回原始值
    return color;
  }
  
  /**
   * 应用颜色到SVG元素
   */
  applyColors(svg, foreground, background) {
    const fgColor = this.validateColor(foreground);
    const bgColor = this.validateColor(background);
    
    if (this.debug) {
      console.log(`应用颜色 - 前景: ${fgColor}, 背景: ${bgColor}`);
    }
    
    // 首先移除任何现有的style元素
    const existingStyles = svg.querySelectorAll('style');
    existingStyles.forEach(style => style.remove());
    
    // 设置SVG根元素的背景色
    svg.style.backgroundColor = bgColor;
    svg.setAttribute('style', `background-color: ${bgColor} !important;`);
    
    // 获取所有元素并强制修改
    const allElements = svg.querySelectorAll('*');
    let modifiedCount = 0;
    
    if (this.debug) {
      console.log(`找到 ${allElements.length} 个SVG元素`);
    }
    
    // 强制修改所有图形元素的颜色
    allElements.forEach((element, index) => {
      const tagName = element.tagName.toLowerCase();
      const currentFill = element.getAttribute('fill');
      
      if (this.debug) {
        console.log(`元素${index}: ${tagName}, 当前fill=${currentFill}`);
      }
      
      // 对于所有图形元素，强制设置颜色
      if (['rect', 'path', 'circle', 'polygon', 'ellipse', 'line', 'polyline'].includes(tagName)) {
        // 不管原来是什么颜色，都强制设置
        element.setAttribute('fill', fgColor);
        element.style.fill = fgColor;
        element.setAttribute('style', `fill: ${fgColor} !important;`);
        modifiedCount++;
        
        if (this.debug) {
          console.log(`  -> 强制设置为: ${fgColor}`);
        }
      }
    });
    
    if (this.debug) {
      console.log(`强制修改了 ${modifiedCount} 个元素的颜色`);
    }
    
    // 添加最强力的CSS样式覆盖
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `
      /* 最强力的颜色覆盖 */
      * {
        fill: ${fgColor} !important;
      }
      
      /* SVG背景 */
      svg {
        background-color: ${bgColor} !important;
        background: ${bgColor} !important;
      }
      
      /* 特殊元素处理 */
      defs, style, title, desc, metadata {
        fill: none !important;
      }
      
      /* Logo相关元素保护 */
      .logo-background {
        fill: white !important;
      }
      
      .logo-image {
        fill: none !important;
      }
    `;
    
    // 将style元素插入到SVG的最前面
    svg.insertBefore(style, svg.firstChild);
    
    // 最后的保险措施：直接在SVG上设置内联样式
    const inlineStyle = `
      fill: ${fgColor} !important;
      background-color: ${bgColor} !important;
      background: ${bgColor} !important;
    `;
    
    svg.setAttribute('style', (svg.getAttribute('style') || '') + inlineStyle);
    
    if (this.debug) {
      console.log('强制颜色应用完成');
      console.log('最终SVG样式:', svg.getAttribute('style'));
    }
    
    return svg;
  }
  
  /**
   * 提取二维码中使用的颜色
   */
  extractColors(svg) {
    const bgElement = svg.querySelector('.qr-background');
    const fgElement = svg.querySelector('.qr-module');
    
    return {
      foreground: fgElement ? fgElement.getAttribute('fill') : '#000000',
      background: bgElement ? bgElement.getAttribute('fill') : '#FFFFFF'
    };
    }
}

// 导出为全局变量
window.ColorManager = ColorManager; 