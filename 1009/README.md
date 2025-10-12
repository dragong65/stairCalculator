# 楼梯计算器 - 专业楼梯设计工具

## 项目简介

这是一个基于Blondel公式的专业楼梯计算器工具，提供精确的楼梯设计计算和可视化预览功能。适用于建筑设计师、装修工程师和DIY爱好者。

## 主要功能

- 🏗️ **专业计算**: 基于Blondel公式的科学计算方法
- 📐 **精确设计**: 支持标准结构和平齐结构设计
- 👁️ **可视化预览**: 实时楼梯图形显示
- ⚡ **实时更新**: 参数调整即时反馈
- 📱 **响应式设计**: 完美适配各种设备
- 🎯 **SEO优化**: 完整的搜索引擎优化

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **样式**: 现代CSS Grid/Flexbox布局
- **图形**: HTML5 Canvas API
- **SEO**: 结构化数据, Open Graph, Twitter Cards
- **分析**: Google Analytics 集成

## 文件结构

```
├── index.html          # 主页面文件
├── script.js           # 核心计算逻辑
├── robots.txt          # 搜索引擎爬虫规则
├── sitemap.xml         # 网站地图
└── README.md           # 项目说明文档
```

## 部署说明

### 1. 本地开发

```bash
# 启动本地服务器
python -m http.server 3000
# 或使用 Node.js
npx serve .
```

### 2. 生产部署

1. **上传文件**: 将所有文件上传到Web服务器
2. **配置域名**: 绑定域名到服务器
3. **更新配置**: 修改以下配置项：
   - `index.html` 中的 `canonical` URL
   - `sitemap.xml` 中的域名
   - Google Analytics ID (替换 `GA_MEASUREMENT_ID`)

### 3. SEO配置

- 替换 `GA_MEASUREMENT_ID` 为实际的Google Analytics ID
- 更新 `og:image` 和 `twitter:image` 为实际图片URL
- 根据实际域名更新所有URL引用

## 使用方法

1. **输入基本参数**: 楼梯总高度和台阶尺寸
2. **选择结构类型**: 标准结构或平齐结构
3. **查看计算结果**: 实时显示计算结果和图形
4. **优化设计**: 根据参考范围调整参数

## 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 许可证

本项目采用 MIT 许可证。

## 联系方式

- 邮箱: support@stair-calculator.com
- 网站: https://stair-calculator.com

---

© 2024 楼梯计算器. 保留所有权利.