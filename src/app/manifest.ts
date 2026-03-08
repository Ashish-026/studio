import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mandi Monitor - Professional Rice Mill Management',
    short_name: 'MandiApp',
    description: 'Professional Standalone Management System for Official and Private Operations',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fdfcf7',
    theme_color: '#0b3d1e',
    icons: [
      {
        src: 'https://placehold.co/192x192/0b3d1e/ffffff.png?text=MILL',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'https://placehold.co/512x512/0b3d1e/ffffff.png?text=MILL',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'https://placehold.co/192x192/0b3d1e/ffffff.png?text=MILL',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
