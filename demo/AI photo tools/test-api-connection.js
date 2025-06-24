/**
 * API连接测试工具
 * 此脚本用于测试Cloudflare Worker API代理连接是否正常工作
 */

// Worker URL - 替换为您的实际Worker URL
const WORKER_URL = "https://ai-image-storage.sharanlillickclz66.workers.dev";

// 测试端点
const TEST_ENDPOINTS = [
  {
    name: "API连接测试",
    url: `${WORKER_URL}/api/test-connection`,
    method: "GET"
  },
  {
    name: "Worker根路径",
    url: WORKER_URL,
    method: "GET"
  },
  {
    name: "图片获取测试",
    url: `${WORKER_URL}/image/test-image.png`, // 假设的图片，可能不存在
    method: "GET",
    expectError: true
  }
];

// 颜色输出辅助函数
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

/**
 * 测试单个端点
 * @param {Object} endpoint 端点配置
 * @returns {Promise<Object>} 测试结果
 */
async function testEndpoint(endpoint) {
  console.log(`${colors.blue}[测试]${colors.reset} ${endpoint.name}: ${endpoint.url}`);
  
  const startTime = Date.now();
  try {
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: {
        "Content-Type": "application/json"
      },
      mode: "cors",
      credentials: "omit"
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    let data = null;
    let dataType = "无内容";
    
    try {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await response.json();
        dataType = "JSON";
      } else if (contentType.includes("image/")) {
        data = "[图片数据]";
        dataType = contentType;
      } else {
        data = await response.text();
        dataType = "Text";
        if (data.length > 200) {
          data = data.substring(0, 197) + "...";
        }
      }
    } catch (e) {
      data = `解析响应失败: ${e.message}`;
    }
    
    // 检查是否预期错误
    if (!response.ok && !endpoint.expectError) {
      return {
        success: false,
        status: response.status,
        statusText: response.statusText,
        duration,
        data,
        dataType,
        error: `HTTP错误: ${response.status} ${response.statusText}`
      };
    }
    
    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      duration,
      data,
      dataType
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      success: false,
      duration,
      error: error.message
    };
  }
}

/**
 * 显示测试结果
 * @param {Object} result 测试结果
 */
function displayResult(result) {
  if (result.success) {
    console.log(`${colors.green}[成功]${colors.reset} 状态码: ${result.status} ${result.statusText}`);
  } else {
    console.log(`${colors.red}[失败]${colors.reset} 错误: ${result.error || "未知错误"}`);
  }
  
  console.log(`${colors.cyan}[响应时间]${colors.reset} ${result.duration}ms`);
  
  if (result.data) {
    console.log(`${colors.yellow}[响应数据]${colors.reset} (${result.dataType}):`);
    if (typeof result.data === "object") {
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.log(result.data);
    }
  }
  
  console.log("-".repeat(60));
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log(`${colors.green}===== API连接测试开始 =====${colors.reset}`);
  console.log(`测试Worker URL: ${WORKER_URL}`);
  console.log("-".repeat(60));
  
  let successes = 0;
  let failures = 0;
  
  for (const endpoint of TEST_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    displayResult(result);
    
    if (result.success) {
      successes++;
    } else {
      failures++;
    }
  }
  
  console.log(`${colors.green}===== 测试摘要 =====${colors.reset}`);
  console.log(`总测试: ${TEST_ENDPOINTS.length}`);
  console.log(`成功: ${successes}`);
  console.log(`失败: ${failures}`);
  
  if (failures > 0) {
    console.log(`\n${colors.red}有${failures}个测试失败，请检查以上错误信息并排除问题。${colors.reset}`);
    console.log(`常见问题排查建议:`);
    console.log(`1. 确认Worker URL是否正确`);
    console.log(`2. 检查Worker是否已正确部署`);
    console.log(`3. 确认R2存储桶是否已创建并配置`);
    console.log(`4. 查看Cloudflare Worker日志以获取更多信息`);
  } else {
    console.log(`\n${colors.green}所有测试都成功通过！API连接正常工作。${colors.reset}`);
  }
}

// 运行测试
runTests().catch(error => {
  console.error(`${colors.red}[错误]${colors.reset} 运行测试时发生错误: ${error.message}`);
}); 