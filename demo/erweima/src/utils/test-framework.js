// 测试框架核心类
class TestFramework {
    constructor() {
        this.suites = new Map();
        this.currentSuite = null;
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0
        };
        console.log('[TestFramework] 初始化完成');
    }

    // 创建测试套件
    suite(name, callback) {
        console.log(`[TestFramework] 创建测试套件: ${name}`);
        this.currentSuite = {
            name,
            tests: [],
            before: null,
            after: null,
            beforeEach: null,
            afterEach: null
        };
        this.suites.set(name, this.currentSuite);
        callback();
    }

    // 添加测试用例
    test(name, callback) {
        if (!this.currentSuite) {
            throw new Error('测试用例必须在测试套件内定义');
        }
        console.log(`[TestFramework] 添加测试用例: ${this.currentSuite.name} - ${name}`);
        this.currentSuite.tests.push({ name, callback });
    }

    // 设置套件前置钩子
    before(callback) {
        if (!this.currentSuite) {
            throw new Error('before钩子必须在测试套件内定义');
        }
        this.currentSuite.before = callback;
    }

    // 设置套件后置钩子
    after(callback) {
        if (!this.currentSuite) {
            throw new Error('after钩子必须在测试套件内定义');
        }
        this.currentSuite.after = callback;
    }

    // 设置每个测试用例的前置钩子
    beforeEach(callback) {
        if (!this.currentSuite) {
            throw new Error('beforeEach钩子必须在测试套件内定义');
        }
        this.currentSuite.beforeEach = callback;
    }

    // 设置每个测试用例的后置钩子
    afterEach(callback) {
        if (!this.currentSuite) {
            throw new Error('afterEach钩子必须在测试套件内定义');
        }
        this.currentSuite.afterEach = callback;
    }

    // 断言工具
    assert = {
        equal: (actual, expected, message = '') => {
            if (actual !== expected) {
                throw new Error(`断言失败: ${message}\n期望值: ${expected}\n实际值: ${actual}`);
            }
            console.log(`[Assert] 相等断言通过: ${message}`);
        },
        notEqual: (actual, expected, message = '') => {
            if (actual === expected) {
                throw new Error(`断言失败: ${message}\n不期望值: ${expected}\n实际值: ${actual}`);
            }
            console.log(`[Assert] 不相等断言通过: ${message}`);
        },
        true: (value, message = '') => {
            if (!value) {
                throw new Error(`断言失败: ${message}\n期望值为true`);
            }
            console.log(`[Assert] 真值断言通过: ${message}`);
        },
        false: (value, message = '') => {
            if (value) {
                throw new Error(`断言失败: ${message}\n期望值为false`);
            }
            console.log(`[Assert] 假值断言通过: ${message}`);
        },
        throws: (callback, expectedError, message = '') => {
            try {
                callback();
                throw new Error(`断言失败: ${message}\n期望抛出错误但没有错误发生`);
            } catch (error) {
                if (expectedError && !(error instanceof expectedError)) {
                    throw new Error(`断言失败: ${message}\n期望错误类型: ${expectedError.name}\n实际错误类型: ${error.constructor.name}`);
                }
                console.log(`[Assert] 异常断言通过: ${message}`);
            }
        },
        fail: (message = '') => {
            throw new Error(`断言失败: ${message}`);
        }
    };

    // 运行所有测试
    async runAll() {
        console.log('[TestFramework] 开始运行所有测试');
        const startTime = performance.now();
        const results = [];

        // 添加全局未捕获Promise错误处理
        window.addEventListener('unhandledrejection', (event) => {
            console.error('[TestFramework] 未捕获的Promise错误:', event.reason);
            this.results.failed++;
            results.push({
                suite: '全局错误',
                test: 'Promise错误',
                status: 'failed',
                error: event.reason.message || '未知Promise错误'
            });
        });

        for (const [suiteName, suite] of this.suites) {
            console.group(`测试套件: ${suiteName}`);
            
            try {
                // 执行套件前置钩子
                if (suite.before) {
                    console.log(`[${suiteName}] 执行套件前置钩子`);
                    await Promise.resolve(suite.before()).catch(error => {
                        throw new Error(`套件前置钩子失败: ${error.message}`);
                    });
                }

                // 执行测试用例
                for (const test of suite.tests) {
                    console.log(`[${suiteName}] 运行测试: ${test.name}`);
                    try {
                        // 执行测试用例前置钩子
                        if (suite.beforeEach) {
                            await Promise.resolve(suite.beforeEach()).catch(error => {
                                throw new Error(`测试前置钩子失败: ${error.message}`);
                            });
                        }

                        // 设置测试超时
                        const testPromise = Promise.resolve(test.callback());
                        const timeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('测试执行超时(10秒)')), 10000);
                        });

                        // 执行测试用例（带超时）
                        await Promise.race([testPromise, timeoutPromise]);
                        
                        // 执行测试用例后置钩子
                        if (suite.afterEach) {
                            await Promise.resolve(suite.afterEach()).catch(error => {
                                throw new Error(`测试后置钩子失败: ${error.message}`);
                            });
                        }

                        results.push({
                            suite: suiteName,
                            test: test.name,
                            status: 'passed'
                        });
                        this.results.passed++;
                        console.log(`[${suiteName}] ✓ ${test.name}`);
                    } catch (error) {
                        results.push({
                            suite: suiteName,
                            test: test.name,
                            status: 'failed',
                            error: error.message
                        });
                        this.results.failed++;
                        console.error(`[${suiteName}] ✗ ${test.name}: ${error.message}`);
                    }
                    this.results.total++;
                }

                // 执行套件后置钩子
                if (suite.after) {
                    console.log(`[${suiteName}] 执行套件后置钩子`);
                    await Promise.resolve(suite.after()).catch(error => {
                        throw new Error(`套件后置钩子失败: ${error.message}`);
                    });
                }
            } catch (error) {
                console.error(`套件执行错误: ${error.message}`);
                results.push({
                    suite: suiteName,
                    test: '套件错误',
                    status: 'failed',
                    error: error.message
                });
                this.results.failed++;
            }

            console.groupEnd();
        }

        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        // 确保报告生成在所有测试完成后
        await Promise.resolve().then(() => {
            this._generateReport(results, duration);
            console.log(`[TestFramework] 测试执行完成，用时 ${duration} 秒`);
        });
    }

    // 生成测试报告
    _generateReport(results, duration) {
        const container = document.createElement('div');
        container.className = 'test-report';

        // 添加总体统计
        const summary = document.createElement('div');
        summary.className = 'test-summary';
        summary.innerHTML = `
            <h2>测试报告</h2>
            <div class="summary-stats">
                <div>总用例数: ${this.results.total}</div>
                <div class="passed">通过: ${this.results.passed}</div>
                <div class="failed">失败: ${this.results.failed}</div>
                <div>执行时间: ${duration}秒</div>
            </div>
        `;
        container.appendChild(summary);

        // 添加详细结果
        const details = document.createElement('div');
        details.className = 'test-details';
        
        let currentSuite = '';
        for (const result of results) {
            if (currentSuite !== result.suite) {
                currentSuite = result.suite;
                const suiteElement = document.createElement('div');
                suiteElement.className = 'test-suite';
                suiteElement.innerHTML = `<h3>测试套件: ${result.suite}</h3>`;
                details.appendChild(suiteElement);
            }

            const resultElement = document.createElement('div');
            resultElement.className = `test-case ${result.status}`;
            resultElement.innerHTML = `
                <div class="test-name">${result.test}</div>
                <div class="test-status">${result.status}</div>
                ${result.error ? `<div class="test-error">${result.error}</div>` : ''}
            `;
            details.appendChild(resultElement);
        }

        container.appendChild(details);

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .test-report {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                margin: 20px;
                padding: 20px;
                border-radius: 8px;
                background: #f5f5f7;
            }
            .test-summary {
                margin-bottom: 20px;
                padding: 15px;
                background: white;
                border-radius: 6px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .summary-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 10px;
                margin-top: 10px;
            }
            .passed { color: #34c759; }
            .failed { color: #ff3b30; }
            .test-suite {
                margin: 15px 0;
                padding: 10px;
                background: white;
                border-radius: 6px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .test-case {
                margin: 5px 0;
                padding: 10px;
                border-radius: 4px;
                background: #fafafa;
            }
            .test-case.passed {
                border-left: 4px solid #34c759;
            }
            .test-case.failed {
                border-left: 4px solid #ff3b30;
            }
            .test-name {
                font-weight: 500;
            }
            .test-error {
                margin-top: 5px;
                padding: 5px;
                color: #ff3b30;
                background: #fff3f3;
                border-radius: 4px;
                font-family: monospace;
                white-space: pre-wrap;
            }
        `;
        document.head.appendChild(style);

        // 将报告添加到页面
        document.body.appendChild(container);
    }
} 