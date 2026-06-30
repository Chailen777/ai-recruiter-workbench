/** @type {import('next').NextConfig} */
import nextPWA from 'next-pwa'

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

  /* ── 静态导出（Capacitor 需要，Vercel 不需要） ── */
  ...(process.env.CAPACITOR_BUILD === '1' ? {
    output: 'export',
    distDir: 'out',
  } : {}),

  /* ── 压缩配置 ── */
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
}

const withPWA = nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    // 仅缓存静态资源，不缓存 RSC 数据 / server action / API 响应
    {
      urlPattern: /\.(?:js|css|png|jpe?g|svg|gif|ico|webp|avif|woff2?|ttf|eot)(\?.*)?$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'staticAssets',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
})

export default withPWA(nextConfig)
