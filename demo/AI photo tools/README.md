---

### **Cursor 提示词（Web UI设计师优化版）**  
**目标**：开发一个美观、交互流畅的「AI对话生成图片」网页应用，支持用户输入文本描述并实时生成图片，需兼顾功能性与视觉体验。

---

#### **核心功能需求**  
1. **用户输入界面**  
   - 提供优雅的**多行文本输入框**，支持提示词输入（如："一只穿着宇航服的柴犬，太空背景，卡通风格"）。  
   - 添加**参数调节组件**（可选）：  
     - 图片尺寸下拉菜单（512×512, 1024×1024）。  
     - 风格选择（写实/动漫/水彩等）。  
   - 提交按钮设计为**动态加载状态**（点击后显示旋转图标）。  

2. **AI图片生成与展示**  
   - 调用AI图片生成API（如OpenAI DALL·E、Stable Diffusion等）。  
   - 图片加载时显示**占位骨架屏**（Skeleton Loading），提升等待体验。  
   - 生成后的图片以**卡片瀑布流**布局展示，支持点击放大预览。  

3. **历史记录与交互**  
   - 本地存储用户生成记录（LocalStorage），支持查看历史作品。  
   - 每张图片提供**下载按钮**（PNG/JPEG）和**分享链接**。  

---

#### **UI/UX设计规范**  
1. **视觉风格**  
   - **配色方案**：深色模式为主（降低长时间使用疲劳），搭配AI科技感渐变色（如`#6e48aa`到`#9f50ac`）。  
   - **字体选择**：  
     - 标题：`"Inter"`（现代无衬线，加粗）。  
     - 正文：`"Roboto"`（易读性强）。  
   - **圆角与阴影**：卡片圆角`12px`，柔和阴影（`box-shadow: 0 4px 12px rgba(0,0,0,0.1)`）。  

2. **布局结构**  
   ```html
   <div class="app-container">
     <!-- 左侧输入区 -->
     <div class="input-panel">
       <textarea placeholder="描述你想要的画面..."></textarea>
       <div class="controls">
         <select><option>512×512</option></select>
         <button>生成</button>
       </div>
     </div>
     
     <!-- 右侧展示区 -->
     <div class="gallery">
       <div class="image-card loading"></div> <!-- 骨架屏 -->
       <div class="image-card">
         <img src="ai-generated-image.png">
         <button class="download-btn">↓ 下载</button>
       </div>
     </div>
   </div>
   ```

3. **交互动效**  
   - 输入框聚焦时边框渐变色流动效果（CSS `:focus-within`）。  
   - 图片生成后淡入入场（`@keyframes fadeIn`）。  
   - 按钮微交互（悬停时轻微放大，点击下沉效果）。  

---

#### **技术实现要点**  
1. **前端框架**（可选）  
   - 纯原生JS实现，或使用Vue/React简化状态管理（如历史记录列表）。  

2. **API调用示例**  
   ```javascript
   async function generateImage(prompt) {
     const response = await fetch("https://api.openai.com/v1/images/generations", {
       method: "POST",
       headers: { "Authorization": "Bearer YOUR_API_KEY" },
       body: JSON.stringify({ prompt, size: "512x512" })
     });
     return await response.json();
   }
   ```

3. **性能优化**  
   - 图片懒加载（`<img loading="lazy">`）。  
   - 防抖（Debounce）用户频繁提交请求。  

---

#### **示例效果参考**  
![UI Mockup](https://example.com/ai-image-generator-mockup.jpg)  
（描述：左侧输入面板，右侧图片瀑布流，顶部导航栏含历史记录入口）

---

#### **交付物要求**  
1. 完整HTML/CSS/JS代码，适配移动端（`@media`查询）。  
2. 详细的注释说明关键交互逻辑。  
3. 可选的Figma/Sketch设计稿链接（若需视觉稿参考）。  

请根据此提示词生成代码，并优先确保UI的**美观性**与**用户体验流畅性**。如需调整设计风格或功能优先级，请随时沟通！

---

## 实现说明

本项目已经实现了一个基于纯HTML/CSS/JavaScript的AI图片生成工具雏形，具有以下特点：

1. **美观的深色UI设计**
   - 采用深色主题搭配紫色渐变色调
   - 使用Inter和Roboto字体增强现代感
   - 精心设计的卡片、按钮和交互元素

2. **完整的用户交互流程**
   - 文本输入区支持多行输入
   - 图片尺寸和风格选择
   - 生成按钮带加载状态
   - 图片展示区支持瀑布流布局

3. **增强的用户体验**
   - 骨架屏加载效果
   - 图片点击放大预览
   - 历史记录面板
   - 下载和分享功能

4. **响应式设计**
   - 适配移动端和桌面端
   - 流畅的动画和过渡效果

5. **本地存储功能**
   - 使用localStorage保存历史记录
   - 自动加载历史图片

### 如何使用

1. 在文本框中输入你想要生成的图片描述
2. 选择图片尺寸和风格
3. 点击"生成图片"按钮
4. 等待图片生成（目前使用占位图模拟API调用）
5. 点击图片可查看大图，并可下载或分享

### 注意事项

- 当前版本使用随机占位图模拟API调用
- 实际使用时需替换`mockGenerateImage`函数为真实的AI图像生成API
- 可以根据需要调整UI样式和交互细节

### 未来改进方向

1. 接入真实的AI图像生成API（如DALL-E、Stable Diffusion等）
2. 添加更多图像参数控制（如风格强度、种子值等）
3. 增加图像编辑功能（如简单的滤镜、裁剪等）
4. 实现云端存储和用户账户系统
5. 优化移动端体验和性能