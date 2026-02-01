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

// Responsive breakpoints for different screen sizes
export const breakpoints = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultrawide: 1536
};

// Generate srcset for responsive images
export function generateSrcSet(publicId, transformation) {
  const sizes = Object.values(breakpoints);
  
  return sizes.map(width => {
    const transformedImage = {
      ...transformation,
      width,
      crop: 'fill'
    };
    
    return `${width}w`; // This will be used with the CloudinaryImage component
  }).join(', ');
}

// Art direction presets for different contexts
export const artDirectionPresets = {
  // Mobile-first approach for hero images
  heroMobileFirst: [
    {
      media: '(max-width: 768px)',
      options: {
        width: 768,
        height: 400,
        crop: 'fill',
        gravity: 'auto'
      }
    },
    {
      media: '(min-width: 769px)',
      options: {
        width: 1920,
        height: 600,
        crop: 'fill',
        gravity: 'auto'
      }
    }
  ],
  
  // Card images with different aspect ratios for mobile/desktop
  cardResponsive: [
    {
      media: '(max-width: 640px)',
      options: {
        width: 400,
        height: 300,
        crop: 'fill'
      }
    },
    {
      media: '(min-width: 641px)',
      options: {
        width: 300,
        height: 200,
        crop: 'fill'
      }
    }
  ]
};

// Image optimization settings for different formats
export const optimizationSettings = {
  // For photographs
  photo: {
    quality: 'auto:good',
    format: 'auto',
    fetch_format: 'auto'
  },
  
  // For graphics/screenshots
  graphic: {
    quality: 'auto:best',
    format: 'png',
    lossless: true
  },
  
  // For thumbnails
  thumbnail: {
    quality: 'auto',
    format: 'auto',
    dpr: 'auto'
  }
};
