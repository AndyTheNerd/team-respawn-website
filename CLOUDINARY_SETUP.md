# Cloudinary Integration Setup Guide

This guide will help you set up Cloudinary for the Team Respawn website to optimize image delivery.

## 1. Cloudinary Account Setup

1. Sign up for a Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Create a new cloud (or use an existing one)
3. Note your:
   - Cloud Name
   - API Key
   - API Secret

## 2. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Cloudinary credentials in `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

## 3. Upload Images to Cloudinary

Upload your existing images to Cloudinary using one of these methods:

### Method A: Cloudinary Dashboard
1. Go to your Cloudinary dashboard
2. Navigate to the Media Library
3. Upload images from the `public/img` and `public/content` directories
4. Use the folder structure: `team-respawn-website/`

### Method B: Cloudinary CLI (Recommended for bulk upload)
```bash
# Install Cloudinary CLI
npm install -g cloudinary-cli

# Set up credentials
cloudinary config

# Upload entire directory
cloudinary upload_dir 'public/img' 'team-respawn-website/img'
cloudinary upload_dir 'public/content' 'team-respawn-website/content'
```

## 4. Image Naming Convention

Use the following public ID structure for consistency:
- `team-respawn-website/content/Banner.jpg`
- `team-respawn-website/img/guides/halo-walkthrough`
- `team-respawn-website/logos/logo-full`

## 5. Using the Cloudinary Components

### Basic Image
```astro
<CloudinaryImage 
  publicId="team-respawn-website/content/Banner.jpg" 
  alt="Banner image"
  width={400}
  height={225}
  fallbackSrc="/content/Banner.jpg"
/>
```

### Responsive Image with Art Direction
```astro
<CloudinaryImage 
  publicId="team-respawn-website/hero-banner"
  alt="Hero banner"
  artDirection={[
    {
      media: '(max-width: 768px)',
      publicId: 'team-respawn-website/hero-banner-mobile',
      options: { width: 768, height: 400 }
    },
    {
      media: '(min-width: 769px)',
      publicId: 'team-respawn-website/hero-banner-desktop',
      options: { width: 1920, height: 600 }
    }
  ]}
  fallbackSrc="/content/hero-banner.jpg"
/>
```

### Background Image
```astro
<CloudinaryBgImage 
  publicId="team-respawn-website/background-pattern"
  class="hero-section"
  width={1920}
  height={1080}
>
  <div class="content">
    <h1>Hero Content</h1>
  </div>
</CloudinaryBgImage>
```

## 6. Predefined Transformations

Use the predefined transformations from `src/utils/imageTransformations.js`:

```astro
import { imageTransformations } from '../utils/imageTransformations.js';

<CloudinaryImage 
  publicId="team-respawn-website/blog-thumbnail"
  alt="Blog post thumbnail"
  {...imageTransformations.blogThumbnail}
  fallbackSrc="/img/thumbnail.jpg"
/>
```

Available transformations:
- `blogThumbnail` (400x225)
- `heroBanner` (1920x600)
- `cardImage` (300x200)
- `socialThumbnail` (1200x630)
- `avatar` (80x80)
- `gallery` (800x600)
- `fullWidth` (1200px wide)

## 7. Migration Helper

Use the migration utilities in `src/utils/imageMigration.js` to help migrate existing images:

```javascript
import { generateMigrationReport, shouldUseCloudinary } from '../utils/imageMigration.js';

// Check if an image should use Cloudinary
if (shouldUseCloudinary('/content/Banner.jpg')) {
  // Use CloudinaryImage component
}
```

## 8. Benefits of Cloudinary Integration

- **Automatic Optimization**: Images are automatically compressed and served in the best format
- **Responsive Images**: Generate multiple sizes automatically
- **CDN Delivery**: Fast global content delivery
- **Transformations**: Resize, crop, apply filters on-the-fly
- **Fallback Support**: Local images serve as fallbacks
- **Performance**: Better Core Web Vitals scores

## 9. Testing

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Check that images load correctly
3. Verify fallback images work when Cloudinary is unavailable
4. Test responsive behavior across different screen sizes

## 10. Production Deployment

Ensure your environment variables are set in your hosting environment:
- Vercel: Add to Environment Variables in project settings
- Netlify: Add to Environment Variables in site settings
- Other hosts: Check their environment variable setup

## Troubleshooting

### Share card map images missing in exports
- Ensure `CLOUDINARY_CLOUD_NAME` is set so map images can be routed through Cloudinary.
- Optionally add `cloudinaryId` or `cloudinaryUrl` to entries in `src/data/haloWars2/maps.ts` to use your uploaded assets directly.

### Images not loading
- Check your environment variables are set correctly
- Verify the public IDs match your Cloudinary Media Library
- Check browser console for error messages

### Fallback images not working
- Ensure the `fallbackSrc` path is correct
- Check that local images exist in the `public` directory

### Performance issues
- Use appropriate image sizes for your use case
- Consider using `quality: 'auto:good'` for better balance
- Use `format: 'auto'` for automatic format optimization
