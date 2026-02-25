import React, { useState, useCallback, useRef } from "react";
import { View, Text, Image, Input, Canvas } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { Button, ConfigProvider } from "@nutui/nutui-react-taro";
import { generateQRCodeTempFile } from "@/utils/qrcode";
import "./index.scss";

/**
 * 二维码生成页面
 * 用户输入内容后生成二维码，可跳转到配置页面进行更多设置
 */
const GeneratePage: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const maxLength = 500;
  const pageRef = useRef(null);

  /**
   * 处理输入变化
   * @param e 输入事件
   */
  const handleInputChange = useCallback((e: any) => {
    const value = e.detail.value;
    if (value.length <= maxLength) {
      setInputText(value);
    }
  }, []);

  /**
   * 生成二维码
   */
  const handleGenerate = useCallback(async () => {
    if (!inputText.trim()) {
      Taro.showToast({
        title: "请输入内容",
        icon: "none",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const tempFilePath = await generateQRCodeTempFile(
        "qrcode-generate",
        inputText.trim(),
        {
          width: 200,
          margin: 2,
          errorCorrectionLevel: "H",
        },
        pageRef.current
      );
      setQrCodeUrl(tempFilePath);
      Taro.showToast({
        title: "生成成功",
        icon: "success",
      });
    } catch (error) {
      console.error("生成二维码失败:", error);
      Taro.showToast({
        title: `生成失败，请重试`,
        icon: "none",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [inputText]);

  /**
   * 清空输入
   */
  const handleClear = useCallback(() => {
    setInputText("");
    setQrCodeUrl("");
  }, []);

  /**
   * 跳转到配置页面
   */
  const handleNextStep = useCallback(() => {
    if (!qrCodeUrl) {
      Taro.showToast({
        title: "请先生成二维码",
        icon: "none",
      });
      return;
    }

    Taro.navigateTo({
      url: `/pages/configure/index?text=${encodeURIComponent(inputText)}`,
    });
  }, [qrCodeUrl, inputText]);

  return (
    <ConfigProvider>
      <View className="generate-page" ref={pageRef}>
        <View className="page-header">
          <Text className="subtitle">输入内容，即刻生成二维码</Text>
        </View>

        <View className="input-section">
          <View className="input-wrapper">
            <Input
              className="text-input"
              type="text"
              placeholder="输入网址、文本或任意内容..."
              value={inputText}
              onInput={handleInputChange}
              maxlength={maxLength}
            />
            <Text className="char-count">
              {inputText.length}/{maxLength}
            </Text>
          </View>
          <View className="input-tips">
            <View className="tip-item">
              <Text className="tip-icon">💡</Text>
              <Text>支持网址、文本、电话号码等任意内容</Text>
            </View>
            <View className="tip-item">
              <Text className="tip-icon">💡</Text>
              <Text>内容越长，二维码越复杂</Text>
            </View>
          </View>
        </View>

        <View className="action-buttons">
          <Button
            className={`generate-btn primary ${
              !inputText.trim() || isGenerating ? "disabled" : ""
            }`}
            onClick={handleGenerate}
            disabled={!inputText.trim() || isGenerating}
          >
            <Text className="btn-icon">⚡</Text>
            <Text>{isGenerating ? "生成中..." : "生成二维码"}</Text>
          </Button>
          <Button className="generate-btn secondary" onClick={handleClear}>
            <Text className="btn-icon">🗑️</Text>
            <Text>清空</Text>
          </Button>
        </View>

        <View className="preview-section">
          <Text className="preview-title">预览</Text>
          <View className="qr-preview">
            {qrCodeUrl ? (
              <Image className="qr-image" src={qrCodeUrl} mode="aspectFit" />
            ) : (
              <View className="placeholder">
                <Text className="placeholder-icon">📱</Text>
                <Text className="placeholder-text">二维码预览区域</Text>
              </View>
            )}
          </View>
          <Button
            className={`next-step-btn ${!qrCodeUrl ? "disabled" : ""}`}
            onClick={handleNextStep}
            disabled={!qrCodeUrl}
          >
            <Text>下一步：配置样式</Text>
            <Text className="btn-icon">→</Text>
          </Button>
        </View>

        <Canvas
          canvasId="qrcode-generate"
          className="hidden-canvas"
          style={{
            width: "200px",
            height: "200px",
          }}
        />
      </View>
    </ConfigProvider>
  );
};

export default GeneratePage;
