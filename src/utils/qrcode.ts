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
  errorCorrectionLevel: "M",
};

/**
 * 生成二维码模块数据
 * @param text 要编码的文本内容
 * @param errorCorrectionLevel 纠错级别
 * @returns 二维码模块数据
 */
export const generateQRCodeModules = (
  text: string,
  errorCorrectionLevel: "L" | "M" | "Q" | "H" = "M"
) => {
  const qrData = QRCode.create(text, { errorCorrectionLevel });
  return qrData.modules;
};

/**
 * 生成二维码临时图片路径（小程序环境）
 * @param text 要编码的文本内容
 * @param options 二维码配置选项
 * @returns 返回Promise<string> 临时图片路径
 */
export const generateQRCodeTempFile = async (
  text: string,
  options: Partial<QRCodeOptions> = {}
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

  return new Promise((resolve, reject) => {
    const offscreenCanvas = Taro.createOffscreenCanvas({
      type: "2d",
      width,
      height: width,
    });

    const ctx = offscreenCanvas.getContext("2d");

    ctx.fillStyle = mergedOptions.color.light;
    ctx.fillRect(0, 0, width, width);

    ctx.fillStyle = mergedOptions.color.dark;
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

    Taro.canvasToTempFilePath({
      canvas: offscreenCanvas,
      success: (res) => {
        resolve(res.tempFilePath);
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
};

/**
 * 生成完整的二维码图片（包含标签和Logo）
 * @param text 要编码的文本内容
 * @param options 完整二维码配置选项
 * @returns 返回Promise<string> 临时图片路径
 */
export const generateFullQRCodeImage = async (
  text: string,
  options: FullQRCodeOptions = {}
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

  const pixelRatio = 2;

  const offscreenCanvas = Taro.createOffscreenCanvas({
    type: "2d",
    width: totalWidth * pixelRatio,
    height: totalHeight * pixelRatio,
  });

  const ctx = offscreenCanvas.getContext("2d");
  ctx.scale(pixelRatio, pixelRatio);

  const gradient = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
  gradient.addColorStop(0, "rgb(245, 247, 250)");
  gradient.addColorStop(1, "rgb(195, 207, 226)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  let currentY = padding;

  if (options.topLabel) {
    ctx.fillStyle = "#333333";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(options.topLabel, totalWidth / 2, currentY + labelHeight / 2);
    currentY += labelHeight + 10;
  }

  const qrStartX = padding;
  const qrStartY = currentY;

  ctx.fillStyle = mergedOptions.color.light;
  ctx.fillRect(qrStartX, qrStartY, qrWidth, qrWidth);

  ctx.fillStyle = mergedOptions.color.dark;
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

  const finishDrawing = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (options.bottomLabel) {
        const bottomY = qrStartY + qrWidth + 10 + labelHeight / 2;
        ctx.fillStyle = "#333333";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(options.bottomLabel, totalWidth / 2, bottomY);
      }

      Taro.canvasToTempFilePath({
        canvas: offscreenCanvas,
        success: (res) => {
          resolve(res.tempFilePath);
        },
        fail: (err) => {
          reject(err);
        },
      });
    });
  };

  if (options.logoUrl && options.logoSize) {
    try {
      const logoX = qrStartX + (qrWidth - options.logoSize) / 2;
      const logoY = qrStartY + (qrWidth - options.logoSize) / 2;
      const logoPadding = 4;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(
        logoX - logoPadding,
        logoY - logoPadding,
        options.logoSize + logoPadding * 2,
        options.logoSize + logoPadding * 2
      );

      const logoImage = offscreenCanvas.createImage();

      await new Promise<void>((resolveLogo) => {
        logoImage.onload = () => {
          ctx.drawImage(
            logoImage,
            logoX,
            logoY,
            options.logoSize!,
            options.logoSize!
          );
          resolveLogo();
        };
        logoImage.onerror = () => {
          resolveLogo();
        };
        logoImage.src = options.logoUrl!;
      });
    } catch (error) {
      console.error("绘制Logo失败:", error);
    }
  }

  return finishDrawing();
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
