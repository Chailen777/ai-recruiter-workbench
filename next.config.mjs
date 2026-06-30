/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },

  /* ── 包按需导入：recharts / @dnd-kit 在引用时才加载 ── */
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
    optimizePackageImports: ['recharts', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
  },

  /* ── 图片优化 ── */
  images: {
    formats: ['image/webp'],
    deviceSizes: [480, 768, 1024, 1440, 1920],
  },

  /* ── 压缩配置 ── */
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
}

export default nextConfig
