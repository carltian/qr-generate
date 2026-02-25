import QRCode from "qrcode";
import Taro from "@tarojs/taro";

/**
 * 二维码配置选项接口
 */
export interface QRCodeOptions {
  width: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
}

/**
 * 完整二维码配置接口（包含标签和Logo）
 */
export interface FullQRCodeOptions extends Partial<QRCodeOptions> {
  topLabel?: string;
  bottomLabel?: string;
  logoUrl?: string;
  logoSize?: number;
}

/**
 * 默认二维码配置
 */
export const defaultQRCodeOptions: QRCodeOptions = {
  width: 300,
  margin: 2,
  color: {
    dark: "#000000",
    light: "#ffffff",
  },
  errorCorrectionLevel: "H",
};

/**
 * 生成二维码模块数据
 * @param text 要编码的文本内容
 * @param errorCorrectionLevel 纠错级别
 * @returns 二维码模块数据
 */
export const generateQRCodeModules = (
  text: string,
  errorCorrectionLevel: "L" | "M" | "Q" | "H" = "H"
) => {
  const qrData = QRCode.create(text, { errorCorrectionLevel });
  return qrData.modules;
};

/**
 * 使用canvas上下文绘制二维码
 * @param ctx canvas上下文
 * @param text 要编码的文本内容
 * @param options 二维码配置选项
 */
export const drawQRCodeToCanvas = (
  ctx: any,
  text: string,
  options: Partial<QRCodeOptions> = {}
): void => {
  const mergedOptions = { ...defaultQRCodeOptions, ...options };
  const modules = generateQRCodeModules(
    text,
    mergedOptions.errorCorrectionLevel
  );

  const moduleCount = modules.size;
  const width = mergedOptions.width;
  const cellSize = width / (moduleCount + mergedOptions.margin * 2);
  const marginOffset = mergedOptions.margin * cellSize;

  ctx.setFillStyle(mergedOptions.color.light);
  ctx.fillRect(0, 0, width, width);

  ctx.setFillStyle(mergedOptions.color.dark);
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules.data[row * moduleCount + col]) {
        ctx.fillRect(
          marginOffset + col * cellSize,
          marginOffset + row * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }
};

/**
 * 绘制完整的二维码图片到canvas（包含标签和Logo）
 * @param canvasId canvas元素ID
 * @param text 要编码的文本内容
 * @param options 完整二维码配置选项
 * @param componentInstance 组件实例（用于获取canvas上下文）
 * @returns 返回Promise<string> 临时图片路径
 */
export const generateFullQRCodeImage = async (
  canvasId: string,
  text: string,
  options: FullQRCodeOptions = {},
  componentInstance?: any
): Promise<string> => {
  const mergedOptions = { ...defaultQRCodeOptions, ...options };
  const modules = generateQRCodeModules(
    text,
    mergedOptions.errorCorrectionLevel
  );

  const moduleCount = modules.size;
  const qrWidth = mergedOptions.width;
  const cellSize = qrWidth / (moduleCount + mergedOptions.margin * 2);
  const marginOffset = mergedOptions.margin * cellSize;

  const padding = 20;
  const labelHeight = 36;
  const topLabelSpace = options.topLabel ? labelHeight + 10 : 0;
  const bottomLabelSpace = options.bottomLabel ? labelHeight + 10 : 0;
  const totalHeight = qrWidth + topLabelSpace + bottomLabelSpace + padding * 2;
  const totalWidth = qrWidth + padding * 2;

  const ctx = Taro.createCanvasContext(canvasId, componentInstance);

  const gradient = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
  gradient.addColorStop(0, "rgb(245, 247, 250)");
  gradient.addColorStop(1, "rgb(195, 207, 226)");
  ctx.setFillStyle(gradient);
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  let currentY = padding;

  if (options.topLabel) {
    ctx.setFillStyle("#333333");
    ctx.setFontSize(16);
    ctx.setTextAlign("center");
    ctx.setTextBaseline("middle");
    ctx.fillText(options.topLabel, totalWidth / 2, currentY + labelHeight / 2);
    currentY += labelHeight + 10;
  }

  const qrStartX = padding;
  const qrStartY = currentY;

  ctx.setFillStyle(mergedOptions.color.light);
  ctx.fillRect(qrStartX, qrStartY, qrWidth, qrWidth);

  ctx.setFillStyle(mergedOptions.color.dark);
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules.data[row * moduleCount + col]) {
        ctx.fillRect(
          qrStartX + marginOffset + col * cellSize,
          qrStartY + marginOffset + row * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }

  if (options.logoUrl && options.logoSize) {
    try {
      const logoX = qrStartX + (qrWidth - options.logoSize) / 2;
      const logoY = qrStartY + (qrWidth - options.logoSize) / 2;
      const logoPadding = 4;

      ctx.setFillStyle("#ffffff");
      ctx.fillRect(
        logoX - logoPadding,
        logoY - logoPadding,
        options.logoSize + logoPadding * 2,
        options.logoSize + logoPadding * 2
      );

      ctx.drawImage(
        options.logoUrl,
        logoX,
        logoY,
        options.logoSize,
        options.logoSize
      );
    } catch (error) {
      console.error("绘制Logo失败:", error);
    }
  }

  if (options.bottomLabel) {
    const bottomY = qrStartY + qrWidth + 10 + labelHeight / 2;
    ctx.setFillStyle("#333333");
    ctx.setFontSize(16);
    ctx.setTextAlign("center");
    ctx.setTextBaseline("middle");
    ctx.fillText(options.bottomLabel, totalWidth / 2, bottomY);
  }

  return new Promise((resolve, reject) => {
    ctx.draw(false, () => {
      setTimeout(() => {
        Taro.canvasToTempFilePath(
          {
            canvasId: canvasId,
            x: 0,
            y: 0,
            width: totalWidth,
            height: totalHeight,
            destWidth: totalWidth * 2,
            destHeight: totalHeight * 2,
            success: (res) => {
              resolve(res.tempFilePath);
            },
            fail: (err) => {
              console.error("canvasToTempFilePath失败:", err);
              reject(err);
            },
          },
          componentInstance
        );
      }, 100);
    });
  });
};

/**
 * 生成纯二维码临时图片路径（小程序环境）
 * @param canvasId canvas元素ID
 * @param text 要编码的文本内容
 * @param options 二维码配置选项
 * @param componentInstance 组件实例
 * @returns 返回Promise<string> 临时图片路径
 */
export const generateQRCodeTempFile = async (
  canvasId: string,
  text: string,
  options: Partial<QRCodeOptions> = {},
  componentInstance?: any
): Promise<string> => {
  const mergedOptions = { ...defaultQRCodeOptions, ...options };
  const modules = generateQRCodeModules(
    text,
    mergedOptions.errorCorrectionLevel
  );

  const moduleCount = modules.size;
  const width = mergedOptions.width;
  const cellSize = width / (moduleCount + mergedOptions.margin * 2);
  const marginOffset = mergedOptions.margin * cellSize;

  const ctx = Taro.createCanvasContext(canvasId, componentInstance);

  ctx.setFillStyle(mergedOptions.color.light);
  ctx.fillRect(0, 0, width, width);

  ctx.setFillStyle(mergedOptions.color.dark);
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules.data[row * moduleCount + col]) {
        ctx.fillRect(
          marginOffset + col * cellSize,
          marginOffset + row * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }

  return new Promise((resolve, reject) => {
    ctx.draw(false, () => {
      setTimeout(() => {
        Taro.canvasToTempFilePath(
          {
            canvasId: canvasId,
            x: 0,
            y: 0,
            width: width,
            height: width,
            destWidth: width * 2,
            destHeight: width * 2,
            success: (res) => {
              resolve(res.tempFilePath);
            },
            fail: (err) => {
              console.error("canvasToTempFilePath失败:", err);
              reject(err);
            },
          },
          componentInstance
        );
      }, 100);
    });
  });
};

/**
 * 获取纠错级别描述
 * @param level 纠错级别
 * @returns 描述文本
 */
export const getErrorCorrectionLevelDesc = (
  level: "L" | "M" | "Q" | "H"
): string => {
  const map = {
    L: "低 (7%)",
    M: "中 (15%)",
    Q: "较高 (25%)",
    H: "高 (30%)",
  };
  return map[level];
};

/**
 * 计算Logo最大尺寸（基于纠错级别）
 * @param qrSize 二维码尺寸
 * @param errorCorrectionLevel 纠错级别
 * @returns Logo最大尺寸
 */
export const calculateMaxLogoSize = (
  qrSize: number,
  errorCorrectionLevel: "L" | "M" | "Q" | "H"
): number => {
  const maxRatioMap = {
    L: 0.15,
    M: 0.2,
    Q: 0.25,
    H: 0.3,
  };
  return qrSize * maxRatioMap[errorCorrectionLevel];
};

/**
 * 计算完整二维码图片的总尺寸
 * @param qrWidth 二维码宽度
 * @param topLabel 顶部标签
 * @param bottomLabel 底部标签
 * @returns 包含totalWidth和totalHeight的对象
 */
export const calculateFullQRCodeSize = (
  qrWidth: number,
  topLabel?: string,
  bottomLabel?: string
): { totalWidth: number; totalHeight: number } => {
  const padding = 20;
  const labelHeight = 36;
  const topLabelSpace = topLabel ? labelHeight + 10 : 0;
  const bottomLabelSpace = bottomLabel ? labelHeight + 10 : 0;
  const totalHeight = qrWidth + topLabelSpace + bottomLabelSpace + padding * 2;
  const totalWidth = qrWidth + padding * 2;

  return { totalWidth, totalHeight };
};
