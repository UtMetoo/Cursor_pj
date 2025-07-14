# 优雅二维码生成器

一个简单但功能强大的在线二维码生成工具，具有美观的界面和丰富的自定义选项。

## ✨ 功能特点

- 🔄 **实时预览** - 输入文字时即时生成二维码
- 🎨 **自定义样式** - 自定义颜色、大小、圆角效果
- 🖼️ **Logo支持** - 添加自定义Logo到二维码中心
- 📱 **响应式设计** - 完美支持各种设备
- 💾 **便捷操作** - 一键复制或下载PNG格式

## 🚀 快速开始

1. 直接在浏览器中打开 `index.html` 文件
2. 选择二维码类型：
   - **文本二维码** - 适用于普通文本内容
   - **WiFi二维码** - 生成可快速连接WiFi的配置二维码
   - **URL二维码** - 生成网址链接二维码
3. 在右侧面板调整二维码样式
4. 点击"复制二维码"或"下载PNG"按钮保存结果

## 📁 项目结构

```
demo/erweima/
├── index.html              # 主页面
├── styles.css              # 样式入口
├── colors.css              # 色彩系统
├── components.css          # 组件样式
├── layout.css              # 布局样式
├── theme.js                # 主题管理
│
├── src/                    # 核心源码
│   ├── js/
│   │   ├── app.js          # 主应用入口
│   │   └── modules/        # 功能模块
│   │       ├── core.js     # 核心配置和工具函数
│   │       ├── dom.js      # DOM操作
│   │       ├── actions.js  # 用户操作处理
│   │       ├── qr-generator.js # 生成器工厂
│   │       └── zxing-support.js # ZXing库访问和依赖检查
│   │
│   ├── renderers/          # 渲染引擎
│   │   └── zxing/
│   │       ├── ZXingRenderer.js # 统一渲染引擎
│   │       ├── colorManager.js  # 颜色管理器
│   │       └── svgBuilder.js    # SVG构建工具
│   │
│   ├── generators/         # 生成器
│   │   └── logo-manager.js # Logo管理器
│   │
│   └── utils/
│       └── test-framework.js # 测试框架
│
└── test/                   # 测试文件
    ├── migration-test.html # 功能测试
    ├── test-download.html  # 下载功能测试
    ├── unified-test.html   # 统一测试页面
    └── download-debug.html # 下载调试页面
```

## 🛠️ 技术栈

- **前端**: HTML5 + CSS3 + 原生JavaScript (ES6+)
- **二维码**: ZXing.js 0.21.3
- **模块化**: ES6模块系统
- **样式**: 现代CSS特性（Grid、Flexbox、CSS变量）

## 🎯 核心特性

### 二维码类型
- **文本二维码** - 支持中文输入，高容错率
- **WiFi二维码** - 支持WPA/WPA2/WPA3/WEP加密，隐藏网络配置
- **URL二维码** - 自动补全协议，支持mailto:和tel:协议

### 样式自定义
- **颜色设置** - 前景色和背景色自由选择
- **尺寸调节** - 200px-500px可调，实时预览
- **圆角效果** - 0-50px圆角，支持预览和下载
- **Logo功能** - 上传、移除、自动缩放和定位

### 导出功能
- **PNG下载** - 高质量图片下载，保持样式一致
- **剪贴板复制** - 一键复制图片到剪贴板
- **实时预览** - 所见即所得的预览效果

## 🧪 测试

项目包含完整的测试系统：

- **功能测试** - `test/migration-test.html`
- **下载测试** - `test/test-download.html`
- **调试工具** - `test/download-debug.html`
- **统一测试** - `test/unified-test.html`

## 🌐 浏览器兼容性

- Chrome（推荐）
- Firefox
- Safari
- Edge
- Opera

## 📝 使用注意事项

- Logo图片建议使用透明背景的PNG格式
- Logo大小会自动调整为二维码尺寸的20%
- WiFi SSID不能包含分号(;)，会自动提示错误
- URL会自动补全http/https协议
- 建议在调整样式后进行扫码测试，确保可用性

## 🔧 开发者

本项目由 Cursor 提供技术支持。

## �� 许可证

MIT License 