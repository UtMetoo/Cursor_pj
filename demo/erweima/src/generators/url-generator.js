// URL二维码生成器类
class URLQRCodeGenerator extends BaseQRCodeGenerator {
    constructor(options = {}) {
        super(options);
        this.protocols = ['http:', 'https:', 'ftp:', 'mailto:', 'tel:'];
    }

    // 生成URL二维码
    async generateURLQR(url) {
        console.log('[URLQRCodeGenerator] 开始生成URL二维码:', url);
        
        if (!this.validateURL(url)) {
            throw new Error('无效的URL格式');
        }

        try {
        const normalizedUrl = this.normalizeURL(url);
            console.log('[URLQRCodeGenerator] 标准化后的URL:', normalizedUrl);
            
        return await this.generate(normalizedUrl);
        } catch (error) {
            console.error('[URLQRCodeGenerator] 生成二维码失败:', error);
            throw new Error('生成URL二维码失败: ' + error.message);
        }
    }

    // 验证URL
    validateURL(url) {
        try {
            // 如果是简单域名，先标准化
            if (this.isSimpleDomain(url)) {
                url = this.normalizeURL(url);
            }
            
            const urlObj = new URL(url);
            const isValidProtocol = this.protocols.includes(urlObj.protocol);
            console.log('[URLQRCodeGenerator] URL验证结果:', {
                url: url,
                protocol: urlObj.protocol,
                isValid: isValidProtocol
            });
            
            return isValidProtocol;
        } catch (error) {
            console.error('[URLQRCodeGenerator] URL验证失败:', error);
            return false;
        }
    }

    // 检查是否是简单域名
    isSimpleDomain(url) {
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        return domainRegex.test(url);
    }

    // 标准化URL
    normalizeURL(url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return `https://${url}`;
        }
        return url;
    }
}

// URL二维码生成器的测试
class URLQRCodeTest {
    static run() {
        const tests = [
            {
                name: '测试正常URL生成',
                run: () => {
                    const generator = new URLQRCodeGenerator();
                    const element = generator.generateURLQR('https://www.example.com');
                    TestUtils.assertEqual(element.tagName.toLowerCase(), 'div', '应该返回div元素');
                }
            },
            {
                name: '测试无协议URL验证',
                run: () => {
                    const generator = new URLQRCodeGenerator();
                    const element = generator.generateURLQR('example.com');
                    TestUtils.assertEqual(element.tagName.toLowerCase(), 'div', '应该返回div元素');
                }
            },
            {
                name: '测试无效URL验证',
                run: () => {
                    const generator = new URLQRCodeGenerator();
                    try {
                        generator.generateURLQR('not-a-url');
                        throw new Error('应该抛出错误');
                    } catch (error) {
                        TestUtils.assertContains(error.message, 'URL', '应该提示URL格式错误');
                    }
                }
            },
            {
                name: '测试不支持的协议',
                run: () => {
                    const generator = new URLQRCodeGenerator();
                    try {
                        generator.generateURLQR('file:///path/to/file');
                        throw new Error('应该抛出错误');
                    } catch (error) {
                        TestUtils.assertContains(error.message, '协议', '应该提示不支持的协议错误');
                    }
                }
            }
        ];

        TestUtils.runTests(tests);
    }
}

// 导出URL二维码生成器类和测试类
window.URLQRCodeGenerator = URLQRCodeGenerator;
window.URLQRCodeTest = URLQRCodeTest; 