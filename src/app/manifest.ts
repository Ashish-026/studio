import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mandi Monitor',
    short_name: 'MandiApp',
    description: 'Professional Rice Mill Management System',
    start_url: '/',
    display: 'standalone',
    background_color: '#fdfcf7',
    theme_color: '#0b3d1e',
    icons: [
      {
        src: 'https://placehold.co/192x192/0b3d1e/e9c46a?text=MM',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://placehold.co/512x512/0b3d1e/e9c46a?text=Mandi+Monitor',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
