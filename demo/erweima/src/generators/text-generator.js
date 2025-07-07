// 文本二维码生成器类
class TextQRCodeGenerator extends BaseQRCodeGenerator {
    constructor(options = {}) {
        super(options);
        this.maxLength = options.maxLength || 1000;
        console.log('[TextQRCodeGenerator] 初始化完成，最大长度:', this.maxLength);
    }

    // 生成文本二维码
    async generateTextQR(text) {
        console.log('[TextQRCodeGenerator] 开始生成文本二维码:', text);
        
        if (!this.validateText(text)) {
            throw new Error(`文本长度必须在1-${this.maxLength}字符之间`);
        }

        try {
            // 确保文本编码正确
            const encodedText = this.encodeText(text);
            console.log('[TextQRCodeGenerator] 编码后的文本长度:', encodedText.length);
            
            return await this.generate(encodedText);
        } catch (error) {
            console.error('[TextQRCodeGenerator] 生成二维码失败:', error);
            throw new Error('生成文本二维码失败: ' + error.message);
        }
    }

    // 验证文本
    validateText(text) {
        if (!text || typeof text !== 'string') {
            console.warn('[TextQRCodeGenerator] 文本为空或类型不正确');
            return false;
        }

        const textLength = text.length;
        console.log('[TextQRCodeGenerator] 验证文本长度:', textLength, '最大长度:', this.maxLength);
        
        return textLength > 0 && textLength <= this.maxLength;
    }

    // 编码文本
    encodeText(text) {
        // 确保正确处理Unicode字符
        return encodeURIComponent(text).replace(/%([0-9A-F]{2})/g,
            function (match, p1) {
                return String.fromCharCode('0x' + p1);
            });
    }
}

// 文本二维码生成器的测试
class TextQRCodeTest {
    static run() {
        const tests = [
            {
                name: '测试正常文本生成',
                run: () => {
                    const generator = new TextQRCodeGenerator();
                    const element = generator.generateTextQR('测试文本');
                    TestUtils.assertEqual(element.tagName.toLowerCase(), 'div', '应该返回div元素');
                }
            },
            {
                name: '测试空文本验证',
                run: () => {
                    const generator = new TextQRCodeGenerator();
                    try {
                        generator.generateTextQR('');
                        throw new Error('应该抛出错误');
                    } catch (error) {
                        TestUtils.assertContains(error.message, '文本长度', '应该提示文本长度错误');
                    }
                }
            },
            {
                name: '测试文本长度限制',
                run: () => {
                    const generator = new TextQRCodeGenerator({ maxLength: 5 });
                    try {
                        generator.generateTextQR('123456');
                        throw new Error('应该抛出错误');
                    } catch (error) {
                        TestUtils.assertContains(error.message, '文本长度', '应该提示文本长度错误');
                    }
                }
            }
        ];

        TestUtils.runTests(tests);
    }
}

// 导出文本二维码生成器类和测试类
window.TextQRCodeGenerator = TextQRCodeGenerator;
window.TextQRCodeTest = TextQRCodeTest; 