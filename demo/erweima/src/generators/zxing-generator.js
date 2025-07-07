// ZXing二维码生成器基类
class ZXingBaseGenerator {
    constructor(options = {}) {
        this.options = {
            width: options.width || 300,
            height: options.height || 300,
            margin: options.margin || 1,
            errorCorrectionLevel: this._getErrorCorrectionLevel(options.errorCorrectionLevel),
            logo: options.logo || null
        };
        
        this.writer = new ZXing.BrowserQRCodeSvgWriter();
        this.logoManager = new LogoManager(options);
    }

    _getErrorCorrectionLevel(level) {
        const levels = {
            'L': ZXing.QRCodeDecoderErrorCorrectionLevel.L,
            'M': ZXing.QRCodeDecoderErrorCorrectionLevel.M,
            'Q': ZXing.QRCodeDecoderErrorCorrectionLevel.Q,
            'H': ZXing.QRCodeDecoderErrorCorrectionLevel.H
        };
        return levels[level || 'M'] || levels['M'];
    }

    async generate(content) {
        if (!content) {
            throw new Error('内容不能为空');
        }

        try {
            console.log('[ZXingGenerator] Generating QR code with content length:', content.length);
            
            const hints = new Map();
            hints.set(ZXing.EncodeHintType.ERROR_CORRECTION, this.options.errorCorrectionLevel);
            hints.set(ZXing.EncodeHintType.MARGIN, this.options.margin);
            
            // 生成SVG二维码
            const svgElement = this.writer.write(
                content,
                this.options.width,
                this.options.height,
                hints
            );

            // 添加自定义样式
            if (this.options.cornerRadius) {
                svgElement.querySelector('rect').setAttribute('rx', this.options.cornerRadius);
                svgElement.querySelector('rect').setAttribute('ry', this.options.cornerRadius);
            }

            // 如果有Logo，使用LogoManager添加Logo
            if (this.options.logo) {
                await this.logoManager.addLogoToSvg(
                    svgElement,
                    this.options.logo,
                    this.options.width,
                    this.options.height
                );
            }

            return svgElement;
        } catch (error) {
            console.error('[ZXingGenerator] Error generating QR code:', error);
            throw new Error(`生成二维码失败: ${error.message}`);
        }
    }
}

// ZXing WiFi二维码生成器
class ZXingWifiGenerator extends ZXingBaseGenerator {
    constructor(options = {}) {
        super(options);
        
        // WiFi二维码特定配置
        this.encryptionTypes = ['WPA', 'WPA2', 'WPA3', 'WEP', 'nopass'];
        this.encryptionDisplay = {
            'WPA': 'WPA',
            'WPA2': 'WPA2',
            'WPA3': 'WPA2',  // WPA3使用WPA2标识
            'WEP': 'WEP',
            'nopass': 'nopass'
        };
    }

    validateWifiParams(ssid, password, encryption) {
        // 验证SSID
        if (!ssid || typeof ssid !== 'string' || ssid.trim().length === 0) {
            throw new Error('SSID不能为空');
        }

        // 验证加密类型
        if (!this.encryptionTypes.includes(encryption)) {
            throw new Error(`不支持的加密类型: ${encryption}`);
        }

        // 验证密码
        if (encryption !== 'nopass') {
            if (!password || typeof password !== 'string') {
                throw new Error('必须提供密码');
            }

            if (encryption === 'WEP') {
                this.validateWEPPassword(password);
            } else {
                this.validateWPAPassword(password);
            }
        }

        return true;
    }

    async generateWifiQR(ssid, password, encryption = 'WPA2', hidden = false) {
        // 先验证参数
        this.validateWifiParams(ssid, password, encryption);

        const wifiString = this.generateWifiString(ssid, password, encryption, hidden);
        console.log('[ZXingWifiGenerator] Generated WiFi string:', wifiString);
        
        return await this.generate(wifiString);
    }

    generateWifiString(ssid, password, encryption, hidden) {
        // 注意：某些扫码软件可能需要UTF-8编码的SSID
        console.log('[ZXingWifiGenerator] Generating WiFi string for SSID:', ssid);
        
        const encodedSsid = this.encodeString(ssid);
        const encodedPassword = encryption === 'WEP' 
            ? this.encodeWEPPassword(password)
            : this.encodeWPAPassword(password);
        
        const encryptionType = this.encryptionDisplay[encryption];
        const wifiString = `WIFI:T:${encryptionType};S:${encodedSsid};P:${encodedPassword};H:${hidden ? 'true' : ''};;`;
        
        console.log('[ZXingWifiGenerator] Generated WiFi string:', wifiString);
        return wifiString;
    }

    encodeString(text) {
        if (!text) return '';
        
        // 使用UTF-8编码处理文本，然后处理特殊字符
        return text
            .split('')
            .map(char => {
                // 对于ASCII字符和中文字符，直接使用
                // 注意：WiFi SSID支持UTF-8编码，所以我们可以直接使用中文字符
                return char;
            })
            .join('')
            // 处理需要转义的特殊字符
            .replace(/([;:,"'])/g, (match) => {
                // 单引号和双引号都转义为双引号
                if (match === "'" || match === '"') {
                    return '\\"';
                }
                // 其他特殊字符正常转义
                return '\\' + match;
            });
    }

    encodeWPAPassword(password) {
        return this.encodeString(password);
    }

    encodeWEPPassword(password) {
        return this.isHexString(password) ? password : this.encodeString(password);
    }

    isHexString(str) {
        return /^[0-9A-Fa-f]+$/.test(str);
    }

    validateWEPPassword(password) {
        if (this.isHexString(password)) {
            if (password.length !== 10 && password.length !== 26) {
                throw new Error('WEP十六进制密码必须是10个字符(40位)或26个字符(104位)');
            }
        } else {
            if (password.length !== 5 && password.length !== 13) {
                throw new Error('WEP ASCII密码必须是5个字符(40位)或13个字符(104位)');
            }
        }
        return true;
    }

    validateWPAPassword(password) {
        if (password.length < 8 || password.length > 63) {
            throw new Error('WPA/WPA2/WPA3密码长度必须在8-63个字符之间');
        }
        return true;
    }
}

// 导出生成器类
window.ZXingBaseGenerator = ZXingBaseGenerator;
window.ZXingWifiGenerator = ZXingWifiGenerator; 