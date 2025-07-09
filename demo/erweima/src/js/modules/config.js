/**
 * 配置模块
 * 包含二维码生成器的默认配置
 */

/**
 * 二维码默认选项
 */
export const defaultQROptions = {
    size: 300,
    foreground: '#000000',
    background: '#FFFFFF',
    cornerRadius: 0,
    logo: null,
    errorCorrectionLevel: 'H',
    margin: 1
};

/**
 * Logo处理相关配置
 */
export const logoConfig = {
    size: 0.2,          // Logo大小占二维码的比例
    margin: 0.1,        // Logo边距占Logo大小的比例
    borderRadius: 0.15, // Logo圆角占Logo大小的比例
    borderColor: '#fff',// Logo边框颜色
    borderWidth: 5,     // Logo边框宽度
    shadowBlur: 5,      // 阴影模糊半径
    shadowColor: 'rgba(0, 0, 0, 0.2)' // 阴影颜色
}; 