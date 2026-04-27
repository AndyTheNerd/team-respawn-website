import { SITE_URL } from '../config.js';
import { getOptimizedImage, hasCloudinaryConfig } from './cloudinary.js';

type BlogCardImg = {
  src?: string;
  cloudinaryId?: string;
};

const origin = SITE_URL.replace(/\/$/, '');

/**
 * Absolute image URL for JSON-LD / Open Graph. Handles YouTube URLs, site paths, and Cloudinary IDs.
 */
export function absoluteBlogCardImageUrl(img?: BlogCardImg): string | undefined {
  if (!img) return undefined;

  if (img.cloudinaryId && hasCloudinaryConfig) {
    const url = getOptimizedImage(img.cloudinaryId, { width: 1200, crop: 'limit', quality: 'auto' });
    if (url) return url;
  }

  const src = img.src;
  if (!src) return undefined;

  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('/')) return `${origin}${src}`;

  return undefined;
}
