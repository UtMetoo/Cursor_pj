// SVG构建器 - 负责生成SVG格式的二维码
class SVGBuilder {
    constructor() {
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    }

    /**
     * 初始化SVG画布
     * @param {number} size - 二维码大小
     * @param {string} bgColor - 背景色
     */
    initCanvas(size, bgColor) {
        this.svg.setAttribute("width", size);
        this.svg.setAttribute("height", size);
        this.svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
        this.svg.style.backgroundColor = bgColor;
    }

    /**
     * 添加二维码模块（小方块）
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @param {number} size - 模块大小
     * @param {string} color - 模块颜色
     * @param {number} radius - 圆角半径
     */
    addModule(x, y, size, color, radius = 0) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", size);
        rect.setAttribute("height", size);
        rect.setAttribute("fill", color);
        
        if (radius > 0) {
            rect.setAttribute("rx", radius);
            rect.setAttribute("ry", radius);
        }
        
        this.svg.appendChild(rect);
    }

    /**
     * 获取生成的SVG元素
     * @returns {SVGElement}
     */
    getSVG() {
        return this.svg;
    }

    /**
     * 清除所有内容
     */
    clear() {
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
    }
}

// 导出为全局变量
window.SVGBuilder = SVGBuilder; 