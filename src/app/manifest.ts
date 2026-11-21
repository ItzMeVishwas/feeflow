import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FeeFlow',
    short_name: 'FeeFlow',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0E1726',
    theme_color: '#0E1726',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
