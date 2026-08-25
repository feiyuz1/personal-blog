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
  // 为 100 MB 视频预留 multipart 表单开销；实际文件大小仍由上传接口限制。
  experimental: { proxyClientMaxBodySize: "105mb" },
  async headers() {
    return [
      {
        source: "/mascot/interaction-voice/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default withMDX(nextConfig);
