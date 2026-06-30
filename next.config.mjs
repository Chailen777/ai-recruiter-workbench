/** @type {import('next').NextConfig} */
import nextPWA from 'next-pwa'

const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },

  /* ── 包按需导入：recharts / @dnd-kit 在引用时才加载 ── */
  experimental: {
    optimizePackageImports: ['recharts', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
  },

  /* ── Server Actions（Next.js 15 已从 experimental 移至顶层）── */
  serverActions: {
    bodySizeLimit: '20mb',
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

  /* ── 动态页面禁止缓存（防止 Service Worker 缓存 server action 响应） ── */
  async headers() {
    return [
      {
        source: '/match',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        ],
      },
      {
        source: '/candidates',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        ],
      },
      {
        source: '/jobs',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        ],
      },
      {
        source: '/companies',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        ],
      },
      {
        source: '/home',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        ],
      },
    ]
  },

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
    // 仅缓存静态资源，绝不缓存 RSC 数据 / server action / API 响应 / 页面 HTML
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
