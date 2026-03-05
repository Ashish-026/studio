
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mandi Monitor',
    short_name: 'MandiApp',
    description: 'Rice Mill Management System',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f4f6',
    theme_color: '#1f2937',
    icons: [
      {
        src: 'https://placehold.co/192x192/1f2937/white?text=MM',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://placehold.co/512x512/1f2937/white?text=Mandi+Monitor',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
