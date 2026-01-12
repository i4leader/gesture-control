# 🎮 手势控制器 (Gesture Controller)

一个基于 MediaPipe 和 Three.js 的现代化手势交互网页应用。通过摄像头实时识别手势，控制绚丽的荧光粒子特效与文字展示。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)
![Three.js](https://img.shields.io/badge/Three.js-0.181.2-green.svg)
![MediaPipe](https://img.shields.io/badge/MediaPipe-0.10.22-orange.svg)

开发者: [Jack Tu](https://github.com/i4leader) + Kiro

## 演示
<video src="public/demo/demo1.mp4">
</video>

## ✨ 功能特色

### 🤚 手势识别
该应用通过摄像头实时捕捉手势，支持7种不同的手势识别：

| 手势 | 效果 | 颜色 |
|------|------|------|
| 🖐️ **展示手掌** | 显示 "Hello World" | 荧光绿 |
| 👌 **OK手势** | 显示 "OK" | 荧光黄 |
| 👋 **挥手** | 显示 "ByeBye" | 荧光粉 |
| ✌️ **剪刀手** | 显示 "Yeah!! ✌️" | 荧光蓝 |
| 💖 **比心** | 显示 "比心 ❤️" | 荧光粉 |
| 👍 **点赞** | 显示 "Great" | 荧光蓝 |
| ✊ **握拳爆炸** | 握拳聚集→张开爆炸 | 荧光橙→荧光粉 |

### 🎨 视觉效果
- **荧光粒子系统**: 12,000个发光粒子，营造科幻氛围
- **智能跟踪**: 握拳粒子球实时跟随手掌移动
- **朦胧背景**: 摄像头画面添加梦幻滤镜效果
- **1.5倍放大**: 文字和图形更加醒目清晰
- **标准荧光色**: 采用工业标准的5种荧光色彩

### 📊 实时信息显示
- **左上角系统信息**: 分辨率、帧率、浏览器、平台、WebGL版本
- **左下角手势信息**: 识别的手势、左右手、置信度、状态

## 🚀 技术栈

- **🎯 Three.js**: 3D渲染与粒子系统
- **🤖 MediaPipe**: AI手势识别
- **⚡ TypeScript**: 类型安全的逻辑开发
- **🔥 Vite**: 现代化构建工具
- **🎨 后处理**: Bloom、色彩分级、色差效果

## 📦 快速开始

### 环境要求
- Node.js 16+ 
- 现代浏览器 (Chrome/Edge/Firefox)
- 摄像头设备

### 安装运行
```bash
# 克隆项目
git clone https://github.com/quiet-node/mediapipe-for-fun.git
cd gesture-control

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:2501 并允许摄像头权限即可开始体验！

### 构建部署
```bash
# 类型检查
npm run typecheck

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 🎮 使用指南

### 基本操作
1. **允许摄像头权限** - 首次访问时授权摄像头使用
2. **手势识别** - 将手放在摄像头前做出各种手势
3. **观察效果** - 粒子会根据手势形成不同的文字和效果
4. **握拳特效** - 握拳后移动手掌，张开时触发爆炸

### 快捷键
- **ESC键**: 重置粒子状态

### 最佳体验建议
- 🔆 确保充足的光线环境
- 📏 保持适当的距离 (50-100cm)
- 🖐️ 手势动作清晰明确
- 🎯 避免背景干扰

## ⚡ 性能优化

### 自适应优化
- **设备检测**: 自动识别低/中/高端设备
- **动态调节**: 根据设备能力调整粒子数量和效果
- **帧率控制**: 智能调节手势检测频率

### 性能配置
| 设备类型 | 手势检测 | 粒子数量 | 后处理效果 | 目标帧率 |
|----------|----------|----------|------------|----------|
| 低端设备 | 20fps | 5,000 | 基础Bloom | 30fps |
| 中端设备 | 30fps | 8,000 | 完整效果 | 60fps |
| 高端设备 | 60fps | 10,000 | 最高质量 | 60fps |

## 🛠️ 开发指南

### 项目结构
```
src/
├── app.ts                 # 主应用入口
├── main.ts               # 程序启动点
├── particle-text/        # 粒子文字系统
│   ├── GestureManager.ts # 手势识别管理
│   └── ParticleTextRenderer.ts # 粒子渲染器
├── shared/               # 共享模块
│   ├── HandTracker.ts    # MediaPipe手部追踪
│   ├── HandTypes.ts      # 类型定义
│   └── PostProcessingManager.ts # 后处理效果
├── ui/                   # UI组件
│   ├── Footer.ts         # 页脚信息
│   ├── SystemInfo.ts     # 系统信息显示
│   └── GestureInfo.ts    # 手势信息显示
├── utils/                # 工具函数
│   └── PerformanceMonitor.ts # 性能监控
└── config/               # 配置文件
    └── performance.ts    # 性能配置
```

### 核心特性
- **🎯 模块化设计**: 清晰的代码结构和职责分离
- **📱 响应式适配**: 支持各种屏幕尺寸和设备
- **🔧 可配置性**: 丰富的配置选项和自定义能力
- **🚀 高性能**: 优化的渲染管线和智能缓存
- **🛡️ 类型安全**: 完整的TypeScript类型定义

## 🌟 特色亮点

### 创新技术
- **AI手势识别**: 基于MediaPipe的高精度手势检测
- **实时粒子跟踪**: 握拳粒子球跟随手掌移动
- **智能动画系统**: 不同效果使用最适合的动画速度
- **荧光视觉效果**: 标准荧光色彩配合Bloom后处理

### 用户体验
- **零延迟响应**: 优化的检测频率确保实时交互
- **直观操作**: 自然的手势交互，无需学习成本
- **视觉反馈**: 丰富的粒子效果和状态提示
- **性能监控**: 实时显示系统和识别状态

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！


## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [MediaPipe 官方文档](https://ai.google.dev/edge/mediapipe)
- [Three.js 官方文档](https://threejs.org/docs/)
- [项目演示地址](https://github.com/quiet-node/mediapipe-for-fun)

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！
本项目由阿里云ESA提供加速、计算和保护
“本项目由阿里云ESA提供加速、计算和保护” 
<img src="/public/pics/aliyun.png">