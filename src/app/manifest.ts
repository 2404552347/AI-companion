import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI Companion — 你的成长伙伴',
    short_name: 'AI Companion',
    description: '一个会记住你是谁、主动关心你人生的 AI 伙伴',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAFAF8',
    theme_color: '#B8956A',
    lang: 'zh-CN',
    categories: ['productivity', 'lifestyle', 'health'],
    icons: [
      {
        src: '/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    screenshots: [],
  }
}
