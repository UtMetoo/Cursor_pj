// Cloudflare Worker脚本，用于将图片从硅基流动API上传到R2存储
// 部署到Cloudflare Workers平台

// 通用错误响应函数
function errorResponse(message, status, corsHeaders, details = null) {
  console.error(`错误 [${status}]: ${message}`, details ? details : '');
  return new Response(JSON.stringify({
    success: false,
    error: message,
    details: details,
    timestamp: new Date().toISOString()
  }), {
    status: status || 500,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// 请求日志函数
function logRequest(request, additionalInfo = {}) {
  const info = {
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries([...request.headers].map(([k, v]) => 
      [k, k.toLowerCase().includes('authorization') ? '******' : v])),
    ...additionalInfo
  };
  
  console.log(`请求信息: ${JSON.stringify(info)}`);
  return info;
}

export default {
  async fetch(request, env, ctx) {
    // 添加请求日志
    logRequest(request);
    
    // 设置CORS头以允许跨域请求
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
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

    try {
      // 对 /image/ 路径单独处理，支持多种方法
      if (path.startsWith('/image/')) {
        const fileName = path.replace('/image/', '');
        // 允许 GET 和 HEAD 请求
        if (method === 'GET' || method === 'HEAD') {
          return await handleImageFetch(fileName, env, corsHeaders, method);
        }
        // 不允许的方法返回 405
        return errorResponse(`Method ${method} not allowed for images`, 405, corsHeaders);
      }
  
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
        
        // 删除单张图片
        if (apiPath === 'delete-image') {
          return await handleImageDelete(request, env, corsHeaders);
        }
        
        // 批量清理图片
        if (apiPath === 'cleanup-images') {
          return await handleImageCleanup(request, env, corsHeaders);
        }
        
        // API路径不匹配
        return errorResponse(`Unknown API endpoint: ${apiPath}`, 404, corsHeaders);
      }
  
      // 处理其他 GET 请求
      if (method === 'GET') {
        // 返回API信息
        return new Response(JSON.stringify({
          name: 'AI Image API & Storage',
          version: '2.3',
          endpoints: {
            '/api/test-connection': 'Test API connection',
            '/api/generate-image': 'Generate AI image',
            '/api/delete-image': 'Delete a specific image',
            '/api/cleanup-images': 'Batch delete images by name or date',
            '/image/{fileName}': 'Get stored image (supports GET and HEAD)',
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

          // 构建永久URL - 使用Worker自身的URL而不是依赖配置的域名
          // 从请求URL中获取基础URL
          const requestUrl = new URL(request.url);
          const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
          
          // 生成图片的完整访问路径
          const publicUrl = `${baseUrl}/image/${fileName}`;
          
          // 添加请求URL的诊断信息，帮助调试
          const urlInfo = {
            requestUrl: request.url,
            baseUrl: baseUrl,
            finalUrl: publicUrl
          };
          
          console.log('图片已保存，URL信息:', JSON.stringify(urlInfo));
          
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
      return errorResponse('Method Not Allowed or Invalid Endpoint', 405, corsHeaders);
    } catch (error) {
      // 全局错误处理
      return errorResponse(
        '服务器处理请求时发生错误', 
        500, 
        corsHeaders, 
        { message: error.message, stack: error.stack }
      );
    }
  }
};

// API测试处理函数
async function handleApiTest(request, env, corsHeaders) {
  // 从环境变量获取API密钥
  const API_KEY = env.SILICON_FLOW_API_KEY;
  
  if (!API_KEY) {
    return errorResponse("未配置API密钥，请在Worker环境变量中设置SILICON_FLOW_API_KEY", 401, corsHeaders);
  }
  
  try {
    logRequest(request, { action: 'API测试' });
    
    // 添加额外检查信息
    let checkResults = {
      apiConnection: false,
      modelAvailability: false,
      recommendedModels: [],
      testTime: new Date().toISOString()
    };
    
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
      
      // 如果成功获取数据，进行模型检查
      if (response.ok && data && data.data) {
        checkResults.apiConnection = true;
        
        // 检查默认模型可用性
        const defaultModel = "dreamshaper-8";
        const availableModels = data.data.map(model => model.id);
        
        // 确认默认模型是否可用
        checkResults.modelAvailability = availableModels.includes(defaultModel);
        
        // 找出推荐的稳定扩散模型
        const recommendedModels = availableModels.filter(model => 
          model.includes("dreamshaper") || 
          model.includes("stable-diffusion") || 
          model.includes("realistic")
        ).slice(0, 5);
        
        checkResults.recommendedModels = recommendedModels;
        
        // 添加模型检查信息到响应中
        data.modelCheck = checkResults;
      }
    } catch (e) {
      data = { error: "解析响应JSON失败" };
      console.error('解析API响应失败:', e);
    }
    
    if (!response.ok) {
      return errorResponse(
        "API连接测试失败", 
        response.status, 
        corsHeaders, 
        { 
          statusCode: response.status, 
          apiError: data, 
          checkResults 
        }
      );
    }
    
    return new Response(JSON.stringify({
      status: 'connected',
      statusCode: response.status,
      data: data,
      modelCheck: checkResults
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('API测试失败:', error);
    
    return errorResponse(
      "服务器无法连接到硅基流动API", 
      500, 
      corsHeaders, 
      { message: error.message, stack: error.stack }
    );
  }
}

// 图片生成处理函数
async function handleImageGeneration(request, env, corsHeaders) {
  // 从环境变量获取API密钥
  const API_KEY = env.SILICON_FLOW_API_KEY;
  
  if (!API_KEY) {
    return errorResponse("未配置API密钥，请在Worker环境变量中设置SILICON_FLOW_API_KEY", 401, corsHeaders);
  }
  
  try {
    const requestData = await request.json();
    logRequest(request, { requestData: { ...requestData, prompt: requestData.prompt?.substring(0, 50) + '...' } });
    
    // 验证请求数据
    if (!requestData.prompt) {
      return errorResponse("缺少必要参数: prompt", 400, corsHeaders);
    }
    
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
      return errorResponse(
        "调用硅基流动API失败", 
        apiResponse.status, 
        corsHeaders, 
        { apiError: apiData }
      );
    }
    
    // 获取图片URL
    if (!apiData.images || !apiData.images[0] || !apiData.images[0].url) {
      return errorResponse(
        "API返回数据格式错误，未找到图片URL", 
        500, 
        corsHeaders, 
        { apiResponse: apiData }
      );
    }
    
    const imageUrl = apiData.images[0].url;
    console.log('获取到图片URL:', imageUrl);
    
    // 从URL获取图片并存储到R2
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      return errorResponse(
        `无法获取生成的图片`, 
        imageResponse.status, 
        corsHeaders, 
        { statusCode: imageResponse.status }
      );
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
      return errorResponse(
        "保存图片到R2失败", 
        500, 
        corsHeaders, 
        { error: r2Error.message }
      );
    }
    
    // 构建永久URL - 使用Worker自身的URL而不是依赖配置的域名
    // 从请求URL中获取基础URL
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    
    // 生成图片的完整访问路径
    const publicUrl = `${baseUrl}/image/${fileName}`;
    
    // 添加请求URL的诊断信息，帮助调试
    const urlInfo = {
      requestUrl: request.url,
      baseUrl: baseUrl,
      finalUrl: publicUrl
    };
    
    console.log('图片已保存，URL信息:', JSON.stringify(urlInfo));
    
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
    return errorResponse(
      "处理图片生成请求失败", 
      500, 
      corsHeaders, 
      { message: error.message, stack: error.stack }
    );
  }
}

// 处理图片获取请求
async function handleImageFetch(fileName, env, corsHeaders, method) {
  try {
    console.log(`获取图片: ${fileName}，请求方法: ${method}`);
    
    // 验证文件名格式
    if (!fileName || !fileName.match(/^[\w\-\.]+\.(png|jpg|jpeg|gif|webp)$/i)) {
      return errorResponse(
        "无效的文件名格式", 
        400, 
        corsHeaders
      );
    }
    
    // 从R2获取图片
    const object = await env.AI_IMAGES.get(fileName);
    
    if (object === null) {
      return errorResponse(
        "找不到请求的图片", 
        404, 
        corsHeaders, 
        { fileName }
      );
    }
    
    // 返回图片数据和正确的内容类型
    const headers = new Headers(corsHeaders);
    headers.set('Content-Type', object.httpMetadata.contentType || 'image/png');
    headers.set('Cache-Control', 'public, max-age=31536000'); // 缓存1年
    headers.set('Etag', `"${object.etag || fileName}"`); // 添加ETag支持
    
    // 对于HEAD请求，只返回头部信息，不返回主体
    if (method === 'HEAD') {
      console.log(`HEAD请求成功: ${fileName}`);
      return new Response(null, {
        headers
      });
    }
    
    // 对于GET请求，返回完整响应（包括头部和主体）
    console.log(`GET请求成功: ${fileName}`);
    return new Response(object.body, {
      headers
    });
  } catch (error) {
    console.error('获取图片失败:', error);
    
    return errorResponse(
      "获取图片时发生错误", 
      500, 
      corsHeaders, 
      { message: error.message, fileName }
    );
  }
}

// 处理图片删除请求
async function handleImageDelete(request, env, corsHeaders) {
  try {
    // 解析请求数据
    const requestData = await request.json();
    const { fileName } = requestData;
    
    logRequest(request, { action: '删除图片', fileName });
    
    // 验证文件名
    if (!fileName || !fileName.match(/^[\w\-\.]+\.(png|jpg|jpeg|gif|webp)$/i)) {
      return errorResponse(
        "无效的文件名格式", 
        400, 
        corsHeaders
      );
    }
    
    // 检查图片是否存在
    const object = await env.AI_IMAGES.head(fileName);
    if (object === null) {
      return errorResponse(
        "找不到要删除的图片", 
        404, 
        corsHeaders, 
        { fileName }
      );
    }
    
    // 删除图片
    await env.AI_IMAGES.delete(fileName);
    console.log(`图片已删除: ${fileName}`);
    
    // 返回成功响应
    return new Response(JSON.stringify({
      success: true,
      message: "图片已成功删除",
      fileName: fileName,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('删除图片失败:', error);
    
    return errorResponse(
      "删除图片时发生错误", 
      500, 
      corsHeaders, 
      { message: error.message }
    );
  }
}

// 处理批量清理图片请求
async function handleImageCleanup(request, env, corsHeaders) {
  try {
    // 解析请求数据
    const requestData = await request.json();
    const { fileNames, olderThan } = requestData;
    
    logRequest(request, { 
      action: '批量清理图片', 
      fileCount: fileNames?.length || 0,
      olderThan: olderThan || 'not specified'
    });
    
    // 验证请求参数
    if (!fileNames && !olderThan) {
      return errorResponse(
        "需要提供 fileNames 或 olderThan 参数", 
        400, 
        corsHeaders
      );
    }
    
    let deletedCount = 0;
    let failedCount = 0;
    const deletedFiles = [];
    const failedFiles = [];
    
    // 按文件名批量删除
    if (fileNames && Array.isArray(fileNames)) {
      for (const fileName of fileNames) {
        try {
          // 验证文件名格式
          if (!fileName.match(/^[\w\-\.]+\.(png|jpg|jpeg|gif|webp)$/i)) {
            failedFiles.push({ fileName, reason: "无效的文件名格式" });
            failedCount++;
            continue;
          }
          
          // 删除图片
          await env.AI_IMAGES.delete(fileName);
          deletedFiles.push(fileName);
          deletedCount++;
        } catch (error) {
          console.error(`删除图片 ${fileName} 失败:`, error);
          failedFiles.push({ fileName, reason: error.message });
          failedCount++;
        }
      }
    }
    
    // 按日期删除旧图片
    if (olderThan) {
      try {
        const cutoffDate = new Date(olderThan);
        if (isNaN(cutoffDate.getTime())) {
          return errorResponse(
            "无效的日期格式", 
            400, 
            corsHeaders
          );
        }
        
        // 列出所有对象
        const objects = await env.AI_IMAGES.list();
        
        for (const object of objects.objects) {
          try {
            // 获取对象的元数据
            const metadata = await env.AI_IMAGES.head(object.key);
            if (metadata && metadata.customMetadata && metadata.customMetadata.created) {
              const createdDate = new Date(metadata.customMetadata.created);
              
              // 如果创建日期早于截止日期，则删除
              if (createdDate < cutoffDate) {
                await env.AI_IMAGES.delete(object.key);
                deletedFiles.push(object.key);
                deletedCount++;
              }
            }
          } catch (error) {
            console.error(`处理对象 ${object.key} 失败:`, error);
            failedFiles.push({ fileName: object.key, reason: error.message });
            failedCount++;
          }
        }
      } catch (error) {
        console.error('列出对象失败:', error);
        return errorResponse(
          "列出存储对象失败", 
          500, 
          corsHeaders, 
          { message: error.message }
        );
      }
    }
    
    // 返回清理结果
    return new Response(JSON.stringify({
      success: true,
      deletedCount,
      failedCount,
      deletedFiles,
      failedFiles,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('批量清理图片失败:', error);
    
    return errorResponse(
      "批量清理图片时发生错误", 
      500, 
      corsHeaders, 
      { message: error.message }
    );
  }
} 