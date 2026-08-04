import type { MetadataRoute } from 'next';
import { PWA_CONFIG } from '../config/pwa';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PWA_CONFIG.APP_NAME,
    short_name: PWA_CONFIG.APP_SHORT_NAME,
    description: PWA_CONFIG.APP_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: PWA_CONFIG.BACKGROUND_COLOR,
    theme_color: PWA_CONFIG.THEME_COLOR,
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/maskable-icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
