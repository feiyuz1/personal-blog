import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
});

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // 输出 standalone 产物，配合 Dockerfile 多阶段构建，
  // 使最终镜像无需 node_modules 即可运行 server.js，显著减小镜像体积。
  output: "standalone",
  experimental: { proxyClientMaxBodySize: "30mb" },
};

export default withMDX(nextConfig);
