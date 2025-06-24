# AI图片生成API集成文档

## 概述

本文档提供了AI图片生成应用程序所使用的API的详细信息，包括硅基流动(Silicon Flow)的AI图片生成API以及Cloudflare Worker代理API。

## 1. 硅基流动API

硅基流动提供强大的AI图片生成能力，支持多种模型和参数。

### 基本信息

- **API基础URL**: `https://api.siliconflow.cn/v1`
- **API密钥**: 需要在[硅基流动官网](https://siliconflow.cn)申请

### 主要端点

#### 获取可用模型

```
GET /models
```

**响应示例**:
```json
{
  "object": "list",
  "data": [
    {
      "id": "silkroad",
      "object": "model",
      "created": 1711414169
    },
    {
      "id": "Kwai-Kolors/Kolors",
      "object": "model",
      "created": 1711414169
    }
  ]
}
```

#### 生成图像

```
POST /images/generations
```

**请求参数**:

| 参数 | 类型 | 描述 |
|------|------|------|
| prompt | string | 图像描述文本 |
| model | string | 使用的模型ID，例如 "silkroad" |
| image_size | string | 图像尺寸，例如 "512x512" |
| style | string | 可选的风格参数 |
| batch_size | integer | 生成图像的数量 |
| num_inference_steps | integer | 推理步数 |
| guidance_scale | number | 引导比例 |
| seed | integer | 随机种子 |

**请求示例**:
```json
{
  "prompt": "一只穿着宇航服的柴犬，太空背景，卡通风格",
  "model": "silkroad",
  "image_size": "512x512"
}
```

**响应示例**:
```json
{
  "created": 1711517097,
  "images": [
    {
      "url": "https://image.siliconflow.cn/sdxl/b8cf0e56.png"
    }
  ]
}
```

### 注意事项

- 生成的图像URL有效期为**1小时**
- 请求中包含敏感内容可能会被拒绝
- 模型和参数可能会随时更新

## 2. Cloudflare Worker代理API

为了解决跨域问题、提供永久存储和优化前端API调用，我们实现了Cloudflare Worker代理API。

### 基本信息

- **Worker URL**: `https://ai-image-storage.sharanlillickclz66.workers.dev`

### 主要端点

#### 测试API连接

```
GET /api/test-connection
```

此端点测试与硅基流动API的连接状态。

**响应示例（成功）**:
```json
{
  "status": "connected",
  "statusCode": 200,
  "data": {
    "object": "list",
    "data": [...]
  },
  "error": null
}
```

**响应示例（失败）**:
```json
{
  "status": "error",
  "statusCode": 401,
  "data": null,
  "error": {
    "message": "API密钥无效"
  }
}
```

#### 生成图像

```
POST /api/generate-image
```

此端点通过硅基流动API生成图像，并自动将图像保存到R2存储中以提供永久URL。

**请求参数**:
与硅基流动API相同。

**请求示例**:
```json
{
  "prompt": "一只穿着宇航服的柴犬，太空背景，卡通风格",
  "model": "silkroad",
  "image_size": "512x512"
}
```

**响应示例（成功）**:
```json
{
  "success": true,
  "originalApiResponse": {
    "created": 1711517097,
    "images": [
      {
        "url": "https://image.siliconflow.cn/sdxl/b8cf0e56.png"
      }
    ]
  },
  "permanentUrl": "https://ai-image-storage.sharanlillickclz66.workers.dev/image/ai-image-1712345678-abc123.png",
  "fileName": "ai-image-1712345678-abc123.png",
  "metadata": {
    "prompt": "一只穿着宇航服的柴犬，太空背景，卡通风格",
    "size": "512x512",
    "timestamp": 1712345678
  }
}
```

#### 获取保存的图像

```
GET /image/{fileName}
```

此端点从R2存储中获取永久保存的图像。

**参数**:
- `fileName`: 图像文件名，通常是从生成图像API返回的fileName字段

**响应**:
图像文件二进制数据，以适当的Content-Type返回。

#### 旧版上传端点（兼容性保留）

```
POST /
```

此端点接受图像URL并将其保存到R2存储中。通常用于将临时URL转换为永久URL。

**请求参数**:

| 参数 | 类型 | 描述 |
|------|------|------|
| imageUrl | string | 原始图像的URL |
| prompt | string | 图像描述文本 |
| size | string | 图像尺寸 |
| style | string | 图像风格 |

**响应示例**:
```json
{
  "success": true,
  "permanentUrl": "https://ai-image-storage.sharanlillickclz66.workers.dev/image/ai-image-1712345678-def456.png",
  "fileName": "ai-image-1712345678-def456.png",
  "metadata": {
    "prompt": "一只穿着宇航服的柴犬，太空背景，卡通风格",
    "size": "512x512",
    "style": "anime",
    "timestamp": 1712345678
  }
}
```

### 优势

1. **跨域解决方案**: 解决浏览器跨域限制问题
2. **永久存储**: 图像将永久存储在Cloudflare R2中，不会过期
3. **API密钥保护**: API密钥存储在服务器端，不暴露给前端
4. **统一API**: 简化前端代码，提供一致的API接口
5. **多浏览器支持**: 解决Edge等浏览器的特殊跨域限制问题

## 集成示例

### 前端JavaScript示例

```javascript
// 配置
const WORKER_URL = "https://ai-image-storage.sharanlillickclz66.workers.dev";

// 测试API连接
async function testApiConnection() {
    try {
        const response = await fetch(`${WORKER_URL}/api/test-connection`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.status === 'connected') {
            console.log('API连接成功');
            return true;
        } else {
            console.error('API连接失败', result.error);
            return false;
        }
    } catch (error) {
        console.error('API连接测试异常:', error);
        return false;
    }
}

// 生成图像
async function generateImage(prompt, size, style) {
    const requestData = {
        prompt: prompt,
        model: "silkroad",
        image_size: size
    };
    
    if (style && style !== 'default') {
        requestData.style = style;
    }
    
    try {
        const response = await fetch(`${WORKER_URL}/api/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || '图片生成失败');
        }
        
        return {
            success: true,
            imageUrl: result.permanentUrl,
            fileName: result.fileName,
            metadata: result.metadata
        };
    } catch (error) {
        console.error('生成图片失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 下载图像
async function downloadImage(imageUrl, fileName) {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = fileName || 'ai-generated-image.png';
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        return true;
    } catch (error) {
        console.error('下载图片失败:', error);
        return false;
    }
}
```

## 安全注意事项

### API密钥处理

为确保API密钥的安全，本应用采取了以下措施：

1. **前端无密钥**：前端代码中不存储或传输API密钥
2. **Worker中间层**：所有API请求通过Cloudflare Worker代理，密钥仅在服务器端使用
3. **环境变量存储**：API密钥存储在Cloudflare Worker的环境变量中
4. **多环境隔离**：开发和生产环境使用不同的API密钥配置

### 数据安全

1. **生成内容**：请确保您的提示词不包含个人敏感信息
2. **存储策略**：生成的图片会存储在Cloudflare R2中，访问受到控制
3. **本地存储**：应用在浏览器本地存储中保存历史记录，但不包含API密钥

## 故障排除

### 常见问题

#### 1. API连接测试失败

**症状**: API状态显示"API不可用"或"API连接失败"

**可能原因**:
- Worker URL配置错误
- Worker未正确部署
- 硅基流动API密钥无效或已过期
- 浏览器网络连接问题

**解决方法**:
- 验证`settings.js`中的Worker URL是否正确
- 检查Cloudflare Worker是否正常运行
- 更新`wrangler.toml`中的API密钥
- 使用CORS代理选项
- 查看浏览器控制台获取更多错误信息

#### 2. 生成图片按钮无响应

**症状**: 点击"生成图片"按钮后没有反应

**可能原因**:
- JavaScript错误导致事件处理程序未执行
- API连接状态检查失败
- Worker URL变量未正确定义

**解决方法**:
- 检查浏览器控制台是否有JavaScript错误
- 确保`settings.js`正确加载并定义了SETTINGS对象
- 验证`script.js`中的WORKER_URL变量正确赋值
- 点击"API测试"按钮检查API连接状态

#### 3. 图片生成失败

**症状**: 显示"生成失败"错误消息

**可能原因**:
- 提示词内容不适合或被API拒绝
- 选择的参数组合不支持
- API配额已用完
- Worker或API暂时性故障

**解决方法**:
- 尝试使用不同的提示词
- 调整参数（尺寸、风格等）
- 检查API配额状态
- 稍后重试

### 调试工具

本项目内置了几个调试工具:

1. **API测试按钮**: 位于界面顶部，用于测试API连接状态
2. **API状态指示器**: 显示当前API连接状态
3. **test-api-connection.html**: 独立的API连接测试工具
4. **浏览器控制台日志**: 包含详细的API请求和响应信息

要启用详细调试信息，请在浏览器控制台中执行:
```javascript
localStorage.setItem('debug', 'true');
location.reload();
```

## API更新记录

### 2023-09-15
- 初始版本

### 2023-10-20
- 添加永久存储功能
- 优化错误处理

### 2023-12-10
- 添加CORS代理选项
- 增强浏览器兼容性

### 2024-03-30
- 修复Worker URL配置问题
- 添加调试功能
- 增强错误报告