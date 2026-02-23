export default defineAppConfig({
  pages: ["pages/generate/index", "pages/configure/index", "pages/index/index"],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#667eea",
    navigationBarTitleText: "二维码生成",
    navigationBarTextStyle: "white",
  },
  permission: {
    "scope.writePhotosAlbum": {
      desc: "用于保存二维码图片到相册",
    },
  },
});
