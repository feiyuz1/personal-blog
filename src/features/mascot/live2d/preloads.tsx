"use client";

import ReactDOM from "react-dom";

import {
  LIVE2D_TEXTURE_PATH,
  getLive2DCubismCoreUrl,
  getLive2DWidgetBaseUrl,
} from "./assets";

/**
 * 在 HTML 外壳阶段就发起看板娘关键资源请求，避免运行时才发现资源、
 * 逐层串行下载。纹理与 moc3 由 widget 在初始化后才会创建请求，
 * 提前 preload 可以让它们与 React 水合、Cubism Core 加载并行。
 */
export function Live2DAssetPreloads() {
  const widgetBaseUrl = getLive2DWidgetBaseUrl();

  ReactDOM.preload(LIVE2D_TEXTURE_PATH, { as: "image" });
  ReactDOM.preloadModule(`${widgetBaseUrl}waifu-tips.js`, { as: "script" });
  ReactDOM.preloadModule(`${widgetBaseUrl}chunk/index2.js`, { as: "script" });
  ReactDOM.preload(getLive2DCubismCoreUrl(), {
    as: "script",
    fetchPriority: "low",
  });
  ReactDOM.preload(`${widgetBaseUrl}waifu.css`, {
    as: "style",
    fetchPriority: "low",
  });

  return null;
}
