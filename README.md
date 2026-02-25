# 二维码生成器

基于 Taro + React + TypeScript 开发的多端二维码生成小程序，支持自定义样式、添加 Logo、设置标签等功能。

## 功能特性

- ✨ **快速生成** - 输入内容即可生成二维码
- 🎨 **自定义样式** - 支持调整尺寸、颜色、边距
- 🎯 **快捷配色** - 内置经典黑、紫色、蓝色、绿色、红色、橙色、深蓝等配色方案
- 🖼️ **添加 Logo** - 支持在二维码中心添加 Logo 图片
- 🛡️ **纠错级别** - 支持 L/M/Q/H 四种纠错级别
- 🏷️ **标签设置** - 支持在二维码上下方添加文字标签
- 💾 **保存相册** - 一键保存二维码到手机相册
- 📱 **多端支持** - 支持微信小程序、H5、支付宝小程序等多端

## 技术栈

| 技术                                           | 版本  | 说明               |
| ---------------------------------------------- | ----- | ------------------ |
| [Taro](https://taro.zone/)                     | 4.x   | 多端开发框架       |
| [React](https://react.dev/)                    | 18.x  | UI 框架            |
| [TypeScript](https://www.typescriptlang.org/)  | 5.x   | 类型支持           |
| [Sass](https://sass-lang.com/)                 | -     | CSS 预处理器       |
| [NutUI](https://nutui.jd.com/taro/react/2x/)   | 2.x   | 京东风格 UI 组件库 |
| [qrcode](https://www.npmjs.com/package/qrcode) | 1.5.x | 二维码生成库       |

## 项目结构

```
qr-generate/
├── config/                 # Taro 配置文件
│   ├── dev.ts             # 开发环境配置
│   ├── index.ts           # 配置入口
│   └── prod.ts            # 生产环境配置
├── src/
│   ├── pages/             # 页面目录
│   │   ├── generate/      # 二维码生成页面
│   │   │   ├── index.tsx
│   │   │   ├── index.scss
│   │   │   └── index.config.ts
│   │   ├── configure/     # 二维码配置页面
│   │   │   ├── index.tsx
│   │   │   ├── index.scss
│   │   │   └── index.config.ts
│   │   └── index/         # 首页（重定向）
│   ├── utils/             # 工具函数
│   │   └── qrcode.ts      # 二维码生成核心逻辑
│   ├── app.ts             # 应用入口
│   ├── app.scss           # 全局样式
│   └── app.config.ts      # 应用配置
├── types/                  # 类型定义
├── package.json
├── tsconfig.json
└── project.config.json    # 微信小程序配置
```

## 快速开始

### 环境要求

- Node.js >= 16
- pnpm >= 8（推荐）或 npm

### 安装依赖

```bash
# 使用 pnpm
pnpm install

# 或使用 npm
npm install
```

### 开发运行

```bash
# 微信小程序
pnpm run dev:weapp

# H5
pnpm run dev:h5

# 支付宝小程序
pnpm run dev:alipay

# 抖音小程序
pnpm run dev:tt

# QQ 小程序
pnpm run dev:qq
```

### 构建打包

```bash
# 微信小程序
pnpm run build:weapp

# H5
pnpm run build:h5

# 支付宝小程序
pnpm run build:alipay
```

## 支持平台

| 平台         | 开发命令       | 构建命令         |
| ------------ | -------------- | ---------------- |
| 微信小程序   | `dev:weapp`    | `build:weapp`    |
| H5           | `dev:h5`       | `build:h5`       |
| 支付宝小程序 | `dev:alipay`   | `build:alipay`   |
| 抖音小程序   | `dev:tt`       | `build:tt`       |
| QQ 小程序    | `dev:qq`       | `build:qq`       |
| 京东小程序   | `dev:jd`       | `build:jd`       |
| 快应用       | `dev:quickapp` | `build:quickapp` |

## 页面说明

### 生成页面 (`/pages/generate/index`)

- 输入要生成二维码的内容（支持网址、文本、电话号码等）
- 点击"生成二维码"按钮快速生成
- 预览生成的二维码
- 点击"下一步"进入配置页面进行更多设置

### 配置页面 (`/pages/configure/index`)

- **尺寸设置**：调整二维码大小（100-300px）和边距
- **颜色设置**：选择快捷配色或自定义前景色/背景色
- **Logo 设置**：上传中心 Logo，调整大小
- **纠错级别**：选择 L（低）/M（中）/Q（高）/H（最高）
- **标签设置**：添加上下方文字标签
- **保存相册**：将配置好的二维码保存到手机相册

## 纠错级别说明

| 级别 | 纠错能力 | 说明                               |
| ---- | -------- | ---------------------------------- |
| L    | 7%       | 适合干净环境，数据密度最低         |
| M    | 15%      | 默认级别，适合一般场景             |
| Q    | 25%      | 适合有轻微污损的场景               |
| H    | 30%      | 最高纠错，适合添加 Logo 或恶劣环境 |

## 注意事项

1. **真机调试**：项目使用 Canvas 组件绘制二维码，请确保在真机上测试
2. **Logo 尺寸**：Logo 尺寸受纠错级别限制，纠错级别越高，允许的 Logo 越大
3. **保存权限**：首次保存到相册需要用户授权
4. **内容长度**：二维码内容越长，二维码越复杂，建议控制在 500 字符以内

## 开发说明

### 二维码生成核心

二维码生成逻辑位于 `src/utils/qrcode.ts`，主要导出以下函数：

```typescript
// 生成纯二维码
generateQRCodeTempFile(canvasId, text, options, componentInstance);

// 生成完整二维码（包含标签和 Logo）
generateFullQRCodeImage(canvasId, text, options, componentInstance);

// 计算 Logo 最大尺寸
calculateMaxLogoSize(qrSize, errorCorrectionLevel);

// 计算完整二维码尺寸
calculateFullQRCodeSize(qrWidth, topLabel, bottomLabel);
```

### Canvas 兼容性

项目使用页面 Canvas 组件（`Taro.createCanvasContext`）而非离屏 Canvas，以确保真机兼容性。

## License

MIT

## 小程序地址 & 公众号

<table>
  <tr>
    <td align="center">
      <img src="assets/weapp-qrcode.png" width="150" />
      <br/>
      <b>微信小程序</b>
    </td>
    <td align="center">
      <img src="assets/wechat-qrcode.jpg" width="150" />
      <br/>
      <b>公众号</b>
    </td>
  </tr>
</table>
