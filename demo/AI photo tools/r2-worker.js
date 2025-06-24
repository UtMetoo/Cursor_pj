// Cloudflare Worker脚本，用于将图片从硅基流动API上传到R2存储
// 部署到Cloudflare Workers平台

export default {
  async fetch(request, env, ctx) {
    // 设置CORS头以允许跨域请求
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // 获取请求URL和方法
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // API代理功能
    if (path.startsWith('/api/')) {
      const apiPath = path.replace('/api/', '');
      
      // 测试API连接
      if (apiPath === 'test-connection') {
        return await handleApiTest(request, env, corsHeaders);
      }
      
      // 生成图片
      if (apiPath === 'generate-image') {
        return await handleImageGeneration(request, env, corsHeaders);
      }
    }

    // 处理GET请求 - 获取图片
    if (method === 'GET') {
      // 检查是否是/image/路径
      if (path.startsWith('/image/')) {
        const fileName = path.replace('/image/', '');
        return await handleImageFetch(fileName, env, corsHeaders);
      }
      
      // 如果不是获取图片的请求，返回API信息
      return new Response(JSON.stringify({
        name: 'AI Image API & Storage',
        version: '2.0',
        endpoints: {
          '/api/test-connection': 'Test API connection',
          '/api/generate-image': 'Generate AI image',
          '/image/{fileName}': 'Get stored image',
          'POST /': 'Legacy: Upload an image to R2'
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // 处理POST请求 - 旧版上传图片功能保留
    if (method === 'POST' && path === '/') {
      try {
        // 解析请求体
        const requestData = await request.json();
        const { imageUrl, prompt, size, style } = requestData;

        if (!imageUrl) {
          return new Response('Image URL is required', {
            status: 400,
            headers: corsHeaders
          });
        }

        // 从原始URL获取图片数据
        const imageResponse = await fetch(imageUrl);
        
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }
        
        const imageData = await imageResponse.arrayBuffer();
        const contentType = imageResponse.headers.get('content-type') || 'image/png';

        // 生成唯一文件名
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 10);
        const fileName = `ai-image-${timestamp}-${randomString}.png`;
        
        // 上传到R2存储桶
        await env.AI_IMAGES.put(fileName, imageData, {
          httpMetadata: {
            contentType: contentType
          },
          customMetadata: {
            prompt: prompt || '',
            size: size || '',
            style: style || '',
            created: new Date().toISOString()
          }
        });

        // 构建公共访问URL
        // 注意：这需要配置R2存储桶的公共访问权限或使用Cloudflare Public Bucket
        const publicUrl = `https://${env.R2_PUBLIC_DOMAIN}/${fileName}`;

        // 返回永久URL和其他元数据
        return new Response(JSON.stringify({
          success: true,
          permanentUrl: publicUrl,
          fileName: fileName,
          metadata: {
            prompt, 
            size, 
            style,
            timestamp
          }
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      } catch (error) {
        console.error('Error processing request:', error);
        
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }

    // 如果既不是已定义的路径，返回方法不允许
    return new Response('Method Not Allowed or Invalid Endpoint', {
      status: 405,
      headers: corsHeaders
    });
  }
};

// API测试处理函数
async function handleApiTest(request, env, corsHeaders) {
  // 从环境变量获取API密钥，如果没有则使用默认值
  const API_KEY = env.SILICON_FLOW_API_KEY || "sk-lsvigtdephufbkhxlhuhcpschibwzzegcbqxzzwvydaqwvmy";
  
  try {
    console.log('测试API连接');
    
    const response = await fetch('https://api.siliconflow.cn/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { error: "解析响应JSON失败" };
    }
    
    return new Response(JSON.stringify({
      status: response.ok ? 'connected' : 'error',
      statusCode: response.status,
      data: response.ok ? data : null,
      error: response.ok ? null : data
    }), {
      status: response.ok ? 200 : response.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('API测试失败:', error);
    
    return new Response(JSON.stringify({
      status: 'error',
      error: error.message,
      details: "服务器无法连接到硅基流动API"
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// 图片生成处理函数
async function handleImageGeneration(request, env, corsHeaders) {
  // 从环境变量获取API密钥，如果没有则使用默认值
  const API_KEY = env.SILICON_FLOW_API_KEY;
  
  try {
    const requestData = await request.json();
    console.log('生成图片请求:', JSON.stringify(requestData));
    
    // 调用硅基流动API
    const apiResponse = await fetch('https://api.siliconflow.cn/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    const apiData = await apiResponse.json();
    
    if (!apiResponse.ok) {
      console.error('API调用失败:', apiData);
      return new Response(JSON.stringify({
        success: false,
        error: apiData
      }), {
        status: apiResponse.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // 获取图片URL
    if (!apiData.images || !apiData.images[0] || !apiData.images[0].url) {
      return new Response(JSON.stringify({
        success: false,
        error: "API返回数据格式错误，未找到图片URL"
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    const imageUrl = apiData.images[0].url;
    console.log('获取到图片URL:', imageUrl);
    
    // 从URL获取图片并存储到R2
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `无法获取生成的图片: ${imageResponse.status}`
      }), {
        status: imageResponse.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    const imageData = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    
    // 生成文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileName = `ai-image-${timestamp}-${randomString}.png`;
    
    // 保存到R2
    try {
      console.log('准备保存图片到R2存储桶...');
      await env.AI_IMAGES.put(fileName, imageData, {
        httpMetadata: { contentType },
        customMetadata: {
          prompt: requestData.prompt || '',
          size: requestData.image_size || '',
          style: requestData.style || '',
          created: new Date().toISOString()
        }
      });
      console.log('图片成功保存到R2存储桶');
    } catch (r2Error) {
      console.error('保存到R2失败:', r2Error);
      throw new Error(`保存图片到R2失败: ${r2Error.message}`);
    }
    
    // 构建永久URL - 使用Worker自身的URL而不是依赖配置的域名
    // 从请求URL中获取基础URL
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    const publicUrl = `${baseUrl}/image/${fileName}`;
    console.log('图片已保存，永久URL:', publicUrl);
    
    return new Response(JSON.stringify({
      success: true,
      originalApiResponse: apiData,
      permanentUrl: publicUrl,
      fileName: fileName,
      metadata: {
        prompt: requestData.prompt || '',
        size: requestData.image_size || '',
        timestamp
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('图片生成处理失败:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// 处理图片获取请求
async function handleImageFetch(fileName, env, corsHeaders) {
  try {
    // 从R2获取图片
    const object = await env.AI_IMAGES.get(fileName);
    
    if (object === null) {
      return new Response('Image not found', {
        status: 404,
        headers: corsHeaders
      });
    }
    
    // 返回图片数据和正确的内容类型
    const headers = new Headers(corsHeaders);
    headers.set('Content-Type', object.httpMetadata.contentType || 'image/png');
    headers.set('Cache-Control', 'public, max-age=31536000'); // 缓存1年
    
    return new Response(object.body, {
      headers
    });
  } catch (error) {
    console.error('获取图片失败:', error);
    
    return new Response(`Error fetching image: ${error.message}`, {
      status: 500,
      headers: corsHeaders
    });
  }
} 