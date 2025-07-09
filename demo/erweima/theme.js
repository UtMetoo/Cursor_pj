// 优雅二维码生成器 - 主题系统
// 支持系统级强调色和主题切换

// 检测系统级强调色
function detectSystemAccentColor() {
  // 创建一个临时元素来检测系统强调色
  const tempEl = document.createElement('div');
  tempEl.style.display = 'none';
  tempEl.style.color = '-apple-system-accent-color';
  document.body.appendChild(tempEl);
  
  // 获取计算后的样式
  const computedColor = window.getComputedStyle(tempEl).color;
  document.body.removeChild(tempEl);
  
  // 如果获取到了有效的颜色（不是默认的黑色）
  if (computedColor && computedColor !== 'rgb(0, 0, 0)') {
    console.log('检测到系统强调色:', computedColor);
    return computedColor;
  }
  
  console.log('未检测到系统强调色，使用默认蓝色');
  // 回退到默认蓝色
  return null;
}

// 应用系统强调色
function applySystemAccentColor() {
  const accentColor = detectSystemAccentColor();
  if (accentColor) {
    // 创建一个新的样式元素
    const styleEl = document.createElement('style');
    
    // 只修改非关键元素的颜色，避免影响核心功能
    styleEl.textContent = `
      :root {
        --accent-color: ${accentColor};
      }
      
      .type-btn.active {
        background: var(--blue-500);
      }
      
      .style-section h3::after,
      .preview-section h3::after {
        background: var(--blue-500);
      }
      
      /* 确保按钮文字始终可见 */
      .primary-btn {
        color: white !important;
      }
      
      /* 确保Logo按钮背景色正确 */
      .logo-upload label {
        background: var(--blue-500) !important;
      }
      
      .logo-upload label:hover {
        background: var(--blue-600) !important;
      }
    `;
    document.head.appendChild(styleEl);
    console.log('已应用系统强调色');
  }
}

// 监听系统主题变化
function setupThemeListener() {
  // 初始应用
  applySystemAccentColor();
  
  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    console.log('系统主题已变更，重新应用强调色');
    applySystemAccentColor();
  });
  
  // 确保标题文本可见
  setTimeout(() => {
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
      headerTitle.style.opacity = '1';
      headerTitle.style.visibility = 'visible';
    }
  }, 100);
}

// 初始化
document.addEventListener('DOMContentLoaded', setupThemeListener);
