import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: import.meta.env.CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.CLOUDINARY_API_KEY,
  api_secret: import.meta.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Helper function to generate optimized image URLs
export function getOptimizedImage(publicId, options = {}) {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format,
    ...otherOptions
  } = options;

  const cloudinaryOptions = {
    width,
    height,
    crop,
    quality,
    ...otherOptions
  };

  // Only add format if it's not 'auto'
  if (format && format !== 'auto') {
    cloudinaryOptions.format = format;
  } else {
    // Use fetch_format for automatic format optimization
    cloudinaryOptions.fetch_format = 'auto';
  }

  return cloudinary.url(publicId, cloudinaryOptions);
}

// Helper function for responsive image sets
export function getResponsiveImageSet(publicId, baseOptions = {}) {
  const breakpoints = [320, 640, 768, 1024, 1280, 1536];
  
  return breakpoints.map(width => {
    const srcSet = getOptimizedImage(publicId, {
      ...baseOptions,
      width,
      crop: 'fill'
    });
    
    return `${srcSet} ${width}w`;
  }).join(', ');
}

// Helper function for art direction (different images for different screen sizes)
export function getArtDirectionImageSet(imageSources, defaultOptions = {}) {
  return imageSources.map(({ media, publicId, options = {} }) => {
    const srcSet = getResponsiveImageSet(publicId, { ...defaultOptions, ...options });
    return {
      media,
      srcSet
    };
  });
}
