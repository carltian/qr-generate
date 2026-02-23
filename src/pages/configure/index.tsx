import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Image, Input, Slider } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { Button, ConfigProvider } from "@nutui/nutui-react-taro";
import {
  generateQRCodeTempFile,
  generateFullQRCodeImage,
  QRCodeOptions,
  calculateMaxLogoSize,
} from "@/utils/qrcode";
import "./index.scss";

/**
 * 二维码配置接口
 */
interface QRConfig {
  width: number;
  margin: number;
  darkColor: string;
  lightColor: string;
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  topLabel: string;
  bottomLabel: string;
  logoUrl: string;
  logoSize: number;
}

/**
 * 默认配置
 */
const defaultConfig: QRConfig = {
  width: 150,
  margin: 2,
  darkColor: "#000000",
  lightColor: "#ffffff",
  errorCorrectionLevel: "H",
  topLabel: "",
  bottomLabel: "",
  logoUrl: "",
  logoSize: 30,
};

/**
 * 快捷配色选项
 */
const colorPresets = [
  { name: "经典黑", dark: "#000000", light: "#ffffff" },
  { name: "紫色", dark: "#667eea", light: "#ffffff" },
  { name: "蓝色", dark: "#2196f3", light: "#ffffff" },
  { name: "绿色", dark: "#4caf50", light: "#ffffff" },
  { name: "红色", dark: "#f44336", light: "#ffffff" },
  { name: "橙色", dark: "#ff9800", light: "#ffffff" },
  { name: "深蓝", dark: "#1a237e", light: "#ffffff" },
];

/**
 * 纠错级别选项
 */
const errorCorrectionLevels: Array<{
  value: "L" | "M" | "Q" | "H";
  label: string;
  desc: string;
}> = [
  { value: "L", label: "低", desc: "7%纠错" },
  { value: "M", label: "中", desc: "15%纠错" },
  { value: "Q", label: "高", desc: "25%纠错" },
  { value: "H", label: "最高", desc: "30%纠错" },
];

/**
 * 二维码配置页面
 * 用户可以自定义二维码样式、添加Logo、设置标签等
 */
const ConfigurePage: React.FC = () => {
  const router = useRouter();
  const [text, setText] = useState("");
  const [config, setConfig] = useState<QRConfig>(defaultConfig);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 初始化：获取路由参数
   */
  useEffect(() => {
    const textParam = router.params.text;
    if (textParam) {
      setText(decodeURIComponent(textParam));
    }
  }, [router.params]);

  /**
   * 生成二维码（带防抖）
   */
  const generateQRCode = useCallback(async () => {
    if (!text) return;

    try {
      const options: Partial<QRCodeOptions> = {
        width: config.width,
        margin: config.margin,
        color: {
          dark: config.darkColor,
          light: config.lightColor,
        },
        errorCorrectionLevel: config.errorCorrectionLevel,
      };
      const tempFilePath = await generateQRCodeTempFile(text, options);
      setQrCodeUrl(tempFilePath);
    } catch (error) {
      console.error("生成二维码失败:", error);
    }
  }, [text, config]);

  /**
   * 配置变化时重新生成二维码
   */
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      generateQRCode();
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [generateQRCode]);

  /**
   * 更新配置
   * @param key 配置键
   * @param value 配置值
   */
  const updateConfig = useCallback(
    <K extends keyof QRConfig>(key: K, value: QRConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  /**
   * 应用快捷配色
   * @param index 配色索引
   */
  const applyColorPreset = useCallback(
    (index: number) => {
      const preset = colorPresets[index];
      setActivePreset(index);
      updateConfig("darkColor", preset.dark);
      updateConfig("lightColor", preset.light);
    },
    [updateConfig]
  );

  /**
   * 处理颜色变化
   * @param type 颜色类型
   * @param color 颜色值
   */
  const handleColorChange = useCallback(
    (type: "dark" | "light", color: string) => {
      setActivePreset(-1);
      if (type === "dark") {
        updateConfig("darkColor", color);
      } else {
        updateConfig("lightColor", color);
      }
    },
    [updateConfig]
  );

  /**
   * 选择Logo图片
   */
  const handleChooseLogo = useCallback(async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
      });

      if (res.tempFilePaths && res.tempFilePaths[0]) {
        const logoPath = res.tempFilePaths[0];
        const maxSize = calculateMaxLogoSize(
          config.width,
          config.errorCorrectionLevel
        );
        updateConfig("logoUrl", logoPath);
        updateConfig("logoSize", Math.round(maxSize));
      }
    } catch (error) {
      console.log("用户取消选择图片");
    }
  }, [config.width, config.errorCorrectionLevel, updateConfig]);

  /**
   * 移除Logo
   */
  const handleRemoveLogo = useCallback(() => {
    updateConfig("logoUrl", "");
  }, [updateConfig]);

  /**
   * 保存二维码到相册
   */
  const handleSaveToAlbum = useCallback(async () => {
    if (!qrCodeUrl) {
      Taro.showToast({
        title: "请先生成二维码",
        icon: "none",
      });
      return;
    }

    setIsSaving(true);
    try {
      const fullImagePath = await generateFullQRCodeImage(text, {
        width: config.width,
        margin: config.margin,
        color: {
          dark: config.darkColor,
          light: config.lightColor,
        },
        errorCorrectionLevel: config.errorCorrectionLevel,
        topLabel: config.topLabel,
        bottomLabel: config.bottomLabel,
        logoUrl: config.logoUrl,
        logoSize: config.logoSize,
      });

      await Taro.saveImageToPhotosAlbum({
        filePath: fullImagePath,
      });
      Taro.showToast({
        title: "已保存到相册",
        icon: "success",
      });
    } catch (saveError: any) {
      if (saveError.errMsg && saveError.errMsg.includes("auth deny")) {
        Taro.showModal({
          title: "提示",
          content: "需要您授权保存图片到相册",
          confirmText: "去授权",
          success: (res) => {
            if (res.confirm) {
              Taro.openSetting();
            }
          },
        });
      } else {
        Taro.showToast({
          title: "保存失败",
          icon: "none",
        });
      }
    } finally {
      setIsSaving(false);
    }
  }, [qrCodeUrl]);

  /**
   * 计算Logo最大尺寸
   */
  const maxLogoSize = calculateMaxLogoSize(
    config.width,
    config.errorCorrectionLevel
  );

  /**
   * 将像素值转换为rpx（用于显示）
   */
  const pxToRpx = (px: number) => px * 2;

  return (
    <ConfigProvider>
      <View className="configure-page">
        <View className="preview-section">
          <View className="qr-container">
            {config.topLabel && (
              <Text className="top-label">{config.topLabel}</Text>
            )}
            <View className="qr-wrapper">
              {qrCodeUrl && (
                <Image
                  className="qr-image"
                  src={qrCodeUrl}
                  mode="aspectFit"
                  style={{
                    width: `${pxToRpx(config.width)}rpx`,
                    height: `${pxToRpx(config.width)}rpx`,
                  }}
                />
              )}
              {config.logoUrl && qrCodeUrl && (
                <View className="logo-overlay">
                  <Image
                    className="logo-image"
                    src={config.logoUrl}
                    mode="aspectFit"
                    style={{
                      width: `${pxToRpx(config.logoSize)}rpx`,
                      height: `${pxToRpx(config.logoSize)}rpx`,
                    }}
                  />
                </View>
              )}
            </View>
            {config.bottomLabel && (
              <Text className="bottom-label">{config.bottomLabel}</Text>
            )}
          </View>
        </View>

        <View className="config-section">
          <View className="config-card">
            <View className="card-header">
              <View
                className="card-icon"
                style={{ background: "rgba(102, 126, 234, 0.1)" }}
              >
                📐
              </View>
              <Text className="card-title">尺寸设置</Text>
            </View>
            <View className="card-content">
              <View className="form-item">
                <View className="item-label">
                  <Text>二维码尺寸</Text>
                  <Text className="label-value">{config.width}px</Text>
                </View>
                <View className="slider-wrapper">
                  <Text className="slider-value">100</Text>
                  <Slider
                    className="slider"
                    min={100}
                    max={300}
                    value={config.width}
                    step={10}
                    blockSize={24}
                    activeColor="#667eea"
                    backgroundColor="#e8e8e8"
                    onChange={(e) => updateConfig("width", e.detail.value)}
                  />
                  <Text className="slider-value">300</Text>
                </View>
              </View>
              <View className="form-item">
                <View className="item-label">
                  <Text>边距大小</Text>
                  <Text className="label-value">{config.margin}</Text>
                </View>
                <View className="slider-wrapper">
                  <Text className="slider-value">0</Text>
                  <Slider
                    className="slider"
                    min={0}
                    max={10}
                    value={config.margin}
                    step={1}
                    blockSize={24}
                    activeColor="#667eea"
                    backgroundColor="#e8e8e8"
                    onChange={(e) => updateConfig("margin", e.detail.value)}
                  />
                  <Text className="slider-value">10</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="config-card">
            <View className="card-header">
              <View
                className="card-icon"
                style={{ background: "rgba(102, 126, 234, 0.1)" }}
              >
                🎨
              </View>
              <Text className="card-title">颜色设置</Text>
            </View>
            <View className="card-content">
              <View className="form-item">
                <View className="item-label">
                  <Text>快捷配色</Text>
                </View>
                <View className="color-presets">
                  {colorPresets.map((preset, index) => (
                    <View
                      key={preset.name}
                      className={`preset-btn ${
                        activePreset === index ? "active" : ""
                      }`}
                      onClick={() => applyColorPreset(index)}
                    >
                      <View
                        className="preset-color"
                        style={{ backgroundColor: preset.dark }}
                      />
                      <Text className="preset-name">{preset.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View className="form-item">
                <View className="item-label">
                  <Text>前景色（二维码颜色）</Text>
                </View>
                <View className="color-picker-wrapper">
                  <View
                    className="color-preview"
                    style={{ backgroundColor: config.darkColor }}
                  >
                    <Input
                      className="color-input-native"
                      type="text"
                      value={config.darkColor}
                      onInput={(e) => handleColorChange("dark", e.detail.value)}
                    />
                  </View>
                  <Input
                    className="color-input"
                    type="text"
                    value={config.darkColor}
                    onInput={(e) => handleColorChange("dark", e.detail.value)}
                    placeholder="#000000"
                  />
                </View>
              </View>
              <View className="form-item">
                <View className="item-label">
                  <Text>背景色</Text>
                </View>
                <View className="color-picker-wrapper">
                  <View
                    className="color-preview"
                    style={{ backgroundColor: config.lightColor }}
                  >
                    <Input
                      className="color-input-native"
                      type="text"
                      value={config.lightColor}
                      onInput={(e) =>
                        handleColorChange("light", e.detail.value)
                      }
                    />
                  </View>
                  <Input
                    className="color-input"
                    type="text"
                    value={config.lightColor}
                    onInput={(e) => handleColorChange("light", e.detail.value)}
                    placeholder="#ffffff"
                  />
                </View>
              </View>
            </View>
          </View>

          <View className="config-card">
            <View className="card-header">
              <View
                className="card-icon"
                style={{ background: "rgba(255, 77, 79, 0.1)" }}
              >
                🖼️
              </View>
              <Text className="card-title">Logo设置</Text>
            </View>
            <View className="card-content">
              <View className="form-item">
                <View className="item-label">
                  <Text>中心Logo</Text>
                  <Text className="label-value">
                    最大 {Math.round(maxLogoSize)}px
                  </Text>
                </View>
                <View className="logo-upload">
                  <View className="logo-preview">
                    {config.logoUrl ? (
                      <Image
                        className="logo-image"
                        src={config.logoUrl}
                        mode="aspectFit"
                      />
                    ) : (
                      <Text className="placeholder-text">预览</Text>
                    )}
                  </View>
                  <Button className="upload-btn" onClick={handleChooseLogo}>
                    {config.logoUrl ? "更换Logo" : "上传Logo"}
                  </Button>
                  {config.logoUrl && (
                    <Button className="remove-btn" onClick={handleRemoveLogo}>
                      ✕
                    </Button>
                  )}
                </View>
              </View>
              {config.logoUrl && (
                <View className="form-item">
                  <View className="item-label">
                    <Text>Logo大小</Text>
                    <Text className="label-value">{config.logoSize}px</Text>
                  </View>
                  <View className="slider-wrapper">
                    <Text className="slider-value">20</Text>
                    <Slider
                      className="slider"
                      min={20}
                      max={Math.round(maxLogoSize)}
                      value={config.logoSize}
                      step={5}
                      blockSize={24}
                      activeColor="#667eea"
                      backgroundColor="#e8e8e8"
                      onChange={(e) => updateConfig("logoSize", e.detail.value)}
                    />
                    <Text className="slider-value">
                      {Math.round(maxLogoSize)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          <View className="config-card">
            <View className="card-header">
              <View
                className="card-icon"
                style={{ background: "rgba(255, 153, 0, 0.1)" }}
              >
                🛡️
              </View>
              <Text className="card-title">纠错级别</Text>
            </View>
            <View className="card-content">
              <View className="form-item">
                <View className="item-desc">
                  纠错级别越高，二维码越能容忍损坏（如污损、遮挡），但密度会增大。建议添加Logo时选择高或最高级别。
                </View>
                <View className="radio-group">
                  {errorCorrectionLevels.map((level) => (
                    <View
                      key={level.value}
                      className={`radio-item ${
                        config.errorCorrectionLevel === level.value
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        updateConfig("errorCorrectionLevel", level.value)
                      }
                    >
                      <Text>{level.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View className="config-card">
            <View className="card-header">
              <View
                className="card-icon"
                style={{ background: "rgba(56, 239, 125, 0.1)" }}
              >
                🏷️
              </View>
              <Text className="card-title">标签设置</Text>
            </View>
            <View className="card-content">
              <View className="form-item">
                <View className="item-label">
                  <Text>上方标签</Text>
                </View>
                <Input
                  className="text-input"
                  type="text"
                  value={config.topLabel}
                  onInput={(e) => updateConfig("topLabel", e.detail.value)}
                  placeholder="输入二维码上方显示的文字"
                  maxlength={50}
                />
              </View>
              <View className="form-item">
                <View className="item-label">
                  <Text>下方标签</Text>
                </View>
                <Input
                  className="text-input"
                  type="text"
                  value={config.bottomLabel}
                  onInput={(e) => updateConfig("bottomLabel", e.detail.value)}
                  placeholder="输入二维码下方显示的文字"
                  maxlength={50}
                />
              </View>
            </View>
          </View>
        </View>

        <View className="save-section">
          <Button
            className={`save-btn ${!qrCodeUrl || isSaving ? "disabled" : ""}`}
            onClick={handleSaveToAlbum}
            disabled={!qrCodeUrl || isSaving}
          >
            <Text className="btn-icon">💾</Text>
            <Text>{isSaving ? "保存中..." : "保存到相册"}</Text>
          </Button>
        </View>
      </View>
    </ConfigProvider>
  );
};

export default ConfigurePage;
