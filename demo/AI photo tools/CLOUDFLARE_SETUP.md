# Cloudflare Worker & R2 设置指南

本文档详细介绍如何设置Cloudflare Worker和R2存储来为AI图片生成应用提供永久存储和API代理功能。

## 概述

为解决以下问题，我们使用了Cloudflare的服务：

1. **图片过期问题**：硅基流动API生成的图片URL只有1小时有效期
2. **跨域问题**：不同浏览器（特别是Edge浏览器）在调用API时遇到的CORS限制
3. **API密钥保护**：避免在前端暴露API密钥

## 设置步骤

### 1. 创建Cloudflare账户

1. 访问 [Cloudflare官网](https://www.cloudflare.com/) 并注册账户
2. 登录到Cloudflare控制面板

### 2. 设置R2存储

R2是Cloudflare的对象存储服务，类似于AWS S3。

1. 在Cloudflare控制面板中，点击左侧导航栏中的"R2"
2. 点击"创建存储桶"按钮
3. 输入存储桶名称"ai-images"（或您选择的名称）
4. 点击"创建存储桶"按钮完成创建

### 3. 设置Cloudflare Worker

Worker是在Cloudflare边缘运行的JavaScript代码。

1. 在Cloudflare控制面板中，点击左侧导航栏中的"Workers & Pages"
2. 点击"创建应用程序"按钮，选择"创建Worker"
3. 为Worker命名为"ai-worker"（或您选择的名称）
4. 点击"创建"按钮
5. 在编辑界面，清除默认代码，并粘贴项目中的`r2-worker.js`文件内容
6. 点击"部署"按钮

### 4. 安装Wrangler CLI工具

Wrangler是Cloudflare Workers的命令行工具，用于本地开发和部署。

```bash
npm install -g wrangler
```

### 5. 登录Wrangler

```bash
wrangler login
```

按照提示在浏览器中完成授权登录。

### 6. 配置wrangler.toml

在项目目录中创建`wrangler.toml`文件（如果尚未存在），内容参考项目中的`wrangler.toml`文件。注意替换以下值：

- `R2_PUBLIC_DOMAIN`：替换为实际部署的Worker域名
- `SILICON_FLOW_API_KEY`：替换为您的硅基流动API密钥

### 7. 创建R2存储桶（通过CLI）

```bash
wrangler r2 bucket create ai-images
```

### 8. 部署Worker

```bash
wrangler deploy
```

成功部署后，您将获得一个Worker URL，如`https://ai-worker.xxxx.workers.dev`。

## API连接测试

为确保Worker正常工作并能连接到硅基流动API，我们提供了两种测试工具：

### 使用测试网页工具

项目中包含了一个测试工具网页，可以通过浏览器直观地测试API连接：

1. 打开项目中的`test-api-connection.html`文件
2. 在浏览器中打开此文件
3. 在"Worker URL配置"部分，输入您部署的Worker URL
4. 点击"运行所有测试"按钮开始测试
5. 查看测试结果和摘要

这个工具会测试以下端点：
- API连接测试: `/api/test-connection`
- Worker根路径: `/`
- 图片获取测试: `/image/test-image.png`
- 自定义测试: 可以输入自定义端点进行测试

### 使用命令行工具

如果您熟悉命令行操作，可以使用以下方法测试：

1. 使用Node.js运行测试脚本：

```bash
node test-api-connection.js
```

2. 或者使用curl直接测试API端点：

```bash
# 测试Worker根路径
curl -v https://your-worker-url.workers.dev/

# 测试API连接
curl -v https://your-worker-url.workers.dev/api/test-connection
```

### 常见问题解决

如果测试失败，可能的原因包括：

1. **Worker URL不正确**: 确认您使用的是正确的Worker URL
2. **Worker未正确部署**: 重新检查Wrangler部署日志
3. **API密钥问题**: 确认wrangler.toml中的API密钥正确
4. **网络问题**: 检查是否有代理、防火墙或网络限制
5. **CORS问题**: 如果在浏览器中测试失败，但命令行成功，可能是CORS配置问题

如果测试通过，说明您的Worker已正确部署并能连接到硅基流动API，可以正常使用应用程序了。

## Worker实现细节（方案三）

我们的Worker实现了两个主要功能：

### 1. 永久图片存储

Worker接收硅基流动API返回的临时图片URL，下载图片内容，并存储到R2中，提供永久访问链接。

### 2. API代理功能

Worker作为前端和硅基流动API之间的代理，处理以下请求：

- `/api/test-connection`：测试API连接状态
- `/api/generate-image`：代理图片生成请求，并自动保存生成的图片到R2
- `/image/{fileName}`：从R2获取永久存储的图片

### 优势

1. **单一解决方案**：一个Worker同时解决了永久存储和API代理问题
2. **降低复杂性**：无需额外的服务器或代理
3. **增强安全性**：API密钥仅存在于服务器端
4. **跨浏览器兼容**：解决了Edge浏览器的特殊跨域问题
5. **可扩展**：Cloudflare的全球边缘网络提供低延迟和高可靠性

## 更新前端代码

修改前端JavaScript代码，使用Worker URL代替直接调用硅基流动API：

```javascript
const WORKER_URL = "https://ai-worker.xxxx.workers.dev"; // 替换为实际Worker URL

// 测试API连接
async function testApiConnection() {
    const response = await fetch(`${WORKER_URL}/api/test-connection`);
    // ...处理响应
}

// 生成图片
async function generateImage(prompt, size, style) {
    const requestData = {
        prompt: prompt,
        model: "silkroad",
        image_size: size,
        style: style
    };
    
    const response = await fetch(`${WORKER_URL}/api/generate-image`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    });
    
    // ...处理响应
}
```

### 前端配置文件

我们的项目中使用了一个集中的配置文件 `settings.js`，其中包含了所有全局配置，这样可以避免在多个文件中重复配置参数。确保在此文件中正确设置Worker URL：

```javascript
window.SETTINGS = {
  // API配置
  api: {
    // ...其他API配置
    
    // Worker URL - 用于代理API请求和存储图片
    workerUrl: "https://ai-worker.xxxx.workers.dev" // 替换为您的实际Worker URL
  },
  
  // Worker配置
  worker: {
    // Cloudflare Worker URL
    url: "https://ai-worker.xxxx.workers.dev", // 替换为您的实际Worker URL
    
    // Worker API路径
    endpoints: {
      testConnection: "/api/test-connection",
      generateImage: "/api/generate-image",
      getImage: "/image/"
    }
  },
  
  // ...其他配置
};
```

### 确保正确引用配置

在 `script.js` 中，确保正确地引用了全局配置对象：

```javascript
// 确保SETTINGS对象存在
if (typeof window.SETTINGS === 'undefined') {
    console.error('SETTINGS object not found. Initializing with default values.');
    window.SETTINGS = {
        worker: { url: "https://ai-worker.xxxx.workers.dev" }, // 替换为您的实际Worker URL
        corsProxy: { url: "https://corsproxy.io/?" }
    };
}

// 从设置中获取Worker URL
const WORKER_URL = window.SETTINGS.worker.url;

// 现在可以使用WORKER_URL进行API调用
```

## 问题排查

### Worker部署失败

- 检查`wrangler.toml`文件格式是否正确
- 确认R2存储桶已创建（`wrangler r2 bucket create ai-images`）
- 检查是否已正确登录（`wrangler login`）

### 图片存储失败

- 检查R2存储桶权限
- 确认Worker有足够的CPU和内存配额
- 检查原始图片URL是否可访问

### API代理失败

- 确认环境变量中的API密钥正确
- 检查硅基流动API是否可访问
- 查看Worker日志以获取详细错误信息

### 前端JavaScript错误

- **"生成图片"按钮无响应**：
  - 检查浏览器控制台是否有JavaScript错误
  - 确认`settings.js`文件已正确加载并定义了全局SETTINGS对象
  - 确保`script.js`中正确引用了WORKER_URL变量
  - 使用浏览器开发者工具检查网络请求

- **Worker URL未定义错误**：
  - 如果控制台显示 "R2_WORKER_URL is not defined" 或类似错误，检查是否在`script.js`中使用了不存在的变量
  - 确保所有对Worker URL的引用都使用相同的变量名（推荐使用`WORKER_URL`）
  - 确认`settings.js`在`script.js`之前加载

- **API测试功能**：
  项目中添加了一个API测试按钮，可以用来快速验证API连接：
  ```javascript
  // 调试API连接
  async function debugApiConnection() {
      console.log('===== API调试 =====');
      console.log('SETTINGS对象:', window.SETTINGS);
      console.log('WORKER_URL:', WORKER_URL);
      
      try {
          console.log('尝试连接:', `${WORKER_URL}/api/test-connection`);
          const response = await fetch(`${WORKER_URL}/api/test-connection`, {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json'
              }
          });
          
          console.log('API响应状态:', response.status, response.statusText);
          
          const result = await response.json();
          console.log('API响应数据:', result);
          
          // 显示调试信息
          showNotification(`API连接测试: ${result.status}`, 
              result.status === 'connected' ? 'success' : 'error');
      } catch (error) {
          console.error('API连接测试失败:', error);
          showNotification(`API连接错误: ${error.message}`, 'error');
      }
  }
  ```

## 安全性和最佳实践

### API密钥安全

为了提高安全性，我们的应用程序使用以下方式处理API密钥：

1. **API密钥存储**：API密钥仅存储在Cloudflare Worker的环境变量中（通过wrangler.toml配置），不在前端代码中显示
2. **服务器端验证**：所有API请求都通过Cloudflare Worker代理，API密钥仅在服务器端使用
3. **密钥轮换**：定期更新API密钥，可以通过更新wrangler.toml并重新部署Worker来实现
4. **环境隔离**：可以为开发环境和生产环境配置不同的API密钥

### 最小权限原则

确保您的API密钥只拥有完成任务所需的最小权限集合。如果您只需要生成图像功能，不要使用具有更广泛权限的主密钥。

### 定期审计

定期检查您的API使用情况和权限，确保没有异常活动。

## 维护和监控

- 定期查看Worker用量和配额
- 监控R2存储容量和请求数
- 考虑设置预算警报，防止意外费用

## 成本考虑

Cloudflare Workers和R2存储都有免费额度，对于中小型应用通常足够：

- Workers：每天10万次请求免费
- R2存储：每月10GB存储和100万次请求免费

超出免费额度后的费用相对较低。

## 参考文档

- [Cloudflare R2文档](https://developers.cloudflare.com/r2/)
- [Cloudflare Workers文档](https://developers.cloudflare.com/workers/)
- [R2 Worker API使用](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/) 