// Live2D 静态资源地址统一在此维护，供初始化与预加载共用。
export const LIVE2D_MODEL_PATH =
  "/pet/pachan%202.0/pachirisu%20anime%20girl%20-%20top%20half.model3.json";

// 由 4096² PNG 压缩而来；看板娘画布为 800²，1024² 足以保持清晰。
export const LIVE2D_TEXTURE_PATH = "/pet/pachan%202.0/textures/texture_00.webp";

export const LIVE2D_MOC_PATH =
  "/pet/pachan%202.0/pachirisu%20anime%20girl%20-%20top%20half.moc3";

export const LIVE2D_TIPS_PATH = "/live2d/waifu-tips.json";

export const DEFAULT_LIVE2D_WIDGET_BASE_URL = "/live2d/widget/";

// 自托管 Cubism Core：官方 CDN 响应头为 no-store，且跨境访问延迟高。
export const DEFAULT_LIVE2D_CUBISM_CORE_URL =
  "/live2d/cubism/live2dcubismcore.min.js";

export function getLive2DWidgetBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_LIVE2D_WIDGET_BASE_URL ??
    DEFAULT_LIVE2D_WIDGET_BASE_URL
  ).replace(/\/?$/, "/");
}

export function getLive2DCubismCoreUrl() {
  return (
    process.env.NEXT_PUBLIC_LIVE2D_CUBISM_CORE_URL ??
    DEFAULT_LIVE2D_CUBISM_CORE_URL
  );
}
