import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mandi Monitor - Professional Rice Mill Management',
    short_name: 'MandiApp',
    description: 'Professional Rice Mill Management System for Official and Private Operations',
    start_url: '/',
    display: 'standalone',
    background_color: '#fdfcf7',
    theme_color: '#0b3d1e',
    icons: [
      {
        src: 'https://placehold.co/192x192/0b3d1e/ffffff?text=🏭',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://placehold.co/512x512/0b3d1e/ffffff?text=🏭',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
