# 优雅二维码生成器

一个简单但功能强大的在线二维码生成工具，具有美观的界面和丰富的自定义选项。

## 功能特点

- 🔄 实时预览：输入文字时即时生成二维码
- 🎨 自定义样式：
  - 自定义前景色和背景色
  - 调整二维码大小（200px-500px）
  - 设置圆角效果
  - 添加自定义Logo
- 📱 移动端适配：响应式设计，完美支持各种设备
- 💾 便捷操作：
  - 一键复制二维码到剪贴板
  - 下载PNG格式（支持透明背景）
- ✨ 其他特性：
  - 支持中文输入
  - 高容错率，确保可靠扫描
  - 兼容主流扫码软件（微信、支付宝等）
  - 支持WiFi配置二维码生成
  - 支持URL自动补全和验证

## 使用说明

1. 直接在浏览器中打开 `index.html` 文件
2. 选择二维码类型：
   - 文本二维码：适用于普通文本内容
   - WiFi二维码：生成可快速连接WiFi的配置二维码
   - URL二维码：生成网址链接二维码（支持自动补全http/https）
3. 使用右侧面板调整二维码样式：
   - 选择颜色
   - 调整大小
   - 设置圆角
   - 上传Logo（建议使用透明背景的PNG图片）
4. 点击"复制二维码"或"下载PNG"按钮保存结果

## 技术栈

- HTML5
- CSS3（使用现代CSS特性）
- JavaScript（原生）
- ZXing（专业的二维码生成库）
  - 支持多种二维码格式
  - 提供高级错误纠正
  - 支持自定义编码

## 测试框架

项目使用自定义的测试框架（`test-framework.js`）进行单元测试和功能测试：

- 支持测试套件（Suite）和测试用例（Test Case）组织
- 提供完整的断言工具
- 包含前置/后置钩子（before/after/beforeEach/afterEach）
- 生成美观的测试报告
- 支持异步测试
- 统一的测试运行环境（unified-test.html）

## 浏览器兼容性

- Chrome（推荐）
- Firefox
- Safari
- Edge
- Opera

## 注意事项

- Logo图片建议使用透明背景的PNG格式
- Logo大小会自动调整为二维码尺寸的20%
- 建议在调整样式时进行扫码测试，确保可用性
- WiFi二维码特别说明：
  - 支持WPA/WPA2/WPA3/WEP加密方式
  - 支持中文SSID，并正确处理特殊字符
  - 支持隐藏网络配置
- URL二维码特别说明：
  - 自动补全http/https协议
  - 支持mailto:和tel:协议
  - 自动验证URL格式

## 最近更新

- 优化CSS文件结构，将fixes.css中的修复按功能合并到相应的CSS文件中：
  - 将按钮、表单元素和交互组件相关的修复合并到components.css
  - 将布局、网格和容器相关的修复合并到layout.css
  - 删除了不再需要的fixes.css文件，减少HTTP请求数量
  - 保留了所有修复功能，并添加了清晰的注释
- 修复了下载的PNG二维码无圆角效果的Bug，通过改进Canvas渲染方式，确保下载和复制的二维码与预览保持一致的圆角效果
- 修复了二维码大小滑块与预览尺寸不匹配的Bug，确保二维码实际尺寸与滑块选择一致
- 优化了Logo设置区域布局，使其更加紧凑直观
- 调整了样式设置区域布局，减小了控件间距，优化了颜色选择器排列
- 修复了WiFi二维码错误提示文字被背景覆盖的问题，增强了错误信息的可读性
- 修复了二维码下载时图片与预览不一致的问题
- 优化了SVG到Canvas的转换逻辑，确保颜色正确应用
- 改进了二维码复制功能，确保与预览效果一致
- 重构SVG生成逻辑，完全控制背景色和前景色的应用
- 修复了前景色和背景色无法正确应用到二维码的问题
- 优化了二维码下载和复制功能，确保颜色正确显示
- 修复了Logo大小测试问题（期望40，实际40000）
- 解决了Logo在文本和URL二维码中覆盖二维码的问题
- 统一使用ZXingBaseGenerator作为所有二维码类型的基础生成器
- 优化了测试用例，增强了对不同尺寸表示方式的兼容性
- 修改了脚本加载顺序，确保依赖正确加载
- 将错误纠正级别设置为'H'，增强二维码容错性
- 修复了文本和URL二维码的渲染问题
- 统一了二维码生成器的实现方式
- 优化了SVG渲染性能
- 改进了错误处理和日志记录
- 优化了WiFi二维码中文字符的处理
- 添加了更详细的调试信息
- 改进了特殊字符的转义处理
- 优化了Logo叠加效果

## 后续开发计划

### 0. 页面布局优化（已完成）
- [x] 优化页面布局结构
  - 保留上方的二维码功能区
  - 将输入框和样式设置放在下方左侧
  - 将Logo和二维码预览放在下方右侧
- [x] 增强视觉层次感
  - 优化左侧输入区域的样式
  - 增强右侧预览区域的视觉效果
  - 改进组件间距和对齐方式
- [x] 改进响应式布局
  - 优化移动端显示效果
  - 确保各种屏幕尺寸下的良好体验
  - 增强触摸设备的交互体验

### 1. UI优化与Bug修复（已完成）
- [x] 修复功能性Bug
  - 修复二维码大小滑块与预览尺寸不匹配问题
  - 修复WiFi二维码错误提示文字被背景覆盖问题
  - 修复下载的PNG二维码无圆角效果问题
- [x] 优化界面布局
  - 调整样式设置区域布局，使其更加紧凑
  - 优化Logo设置区域，改为水平布局节省空间
  - 统一表单控件样式和间距
- [x] 增强用户体验
  - 改进错误提示的可见性和可读性
  - 优化控件排列顺序，符合用户使用习惯
  - 增强视觉反馈效果
- [x] 优化CSS文件结构
  - 将fixes.css中的修复按功能合并到相应的CSS文件中
  - 减少HTTP请求数量，提高页面加载性能
  - 保留所有修复功能，并添加清晰的注释
  - 提高代码可维护性和组织性

### 2. 色彩系统升级
- [ ] 优化配色方案
  - 引入柔和的中性色调系统
  - 为重要操作添加渐变效果
  - 统一按钮和交互元素的色彩
- [ ] 改进对比度
  - 实现WCAG 2.1 AA级可访问性标准
  - 优化文本和背景的对比度
  - 增强视觉层次感
- [ ] 支持系统级强调色
  - 响应系统颜色设置
  - 自适应主题色彩
  - 优化视觉反馈的色彩表现

### 3. 字体排版优化
- [ ] 引入系统字体
  - macOS: SF Pro
  - iOS: SF Pro
  - Windows: Segoe UI
  - 无障碍字体回退方案
- [ ] 优化字体层级
  - 标题使用SF Pro Display
  - 正文使用SF Pro Text
  - 代码/数字使用SF Mono
  - 统一字重和大小
- [ ] 改进文字间距
  - 优化标题字距
  - 调整正文行高
  - 统一组件文字间距
  - 确保多语言兼容性
  
## 开发者

本项目由Cursor提供技术支持。

## 许可证

MIT License 