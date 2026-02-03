// Predefined image transformations for common use cases
export const imageTransformations = {
  // Blog post thumbnails
  blogThumbnail: {
    width: 400,
    height: 225,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
    gravity: 'auto'
  },
  
  // Hero banners
  heroBanner: {
    width: 1920,
    height: 600,
    crop: 'fill',
    quality: 'auto:good',
    format: 'auto',
    gravity: 'auto'
  },
  
  // Card images
  cardImage: {
    width: 300,
    height: 200,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
    gravity: 'auto'
  },
  
  // Thumbnail for social sharing
  socialThumbnail: {
    width: 1200,
    height: 630,
    crop: 'fill',
    quality: 'auto:good',
    format: 'auto',
    gravity: 'auto'
  },
  
  // Avatar images
  avatar: {
    width: 80,
    height: 80,
    crop: 'thumb',
    gravity: 'face',
    quality: 'auto',
    format: 'auto'
  },
  
  // Gallery images
  gallery: {
    width: 800,
    height: 600,
    crop: 'fill',
    quality: 'auto:good',
    format: 'auto',
    gravity: 'auto'
  },
  
  // Full width images
  fullWidth: {
    width: 1200,
    quality: 'auto:good',
    format: 'auto',
    crop: 'limit'
  }
};
