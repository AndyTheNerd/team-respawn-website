// Utility to help migrate existing images to Cloudinary
// This script helps map local image paths to Cloudinary public IDs

export const imageMappings = {
  // Blog banners and headers
  '/content/Banner.jpg': 'team-respawn-website/Banner.jpg',
  '/content/Team Respawn Logo Full.png': 'team-respawn-website/logo-full',
  '/content/Team-Respawn-Full.png': 'team-respawn-website/logo-full',
  
  // Game walkthrough images
  '/img/Gears1-Walkthrough.jpg': 'team-respawn-website/guides/gears1-walkthrough',
  '/img/Goblin-Commander-Walkthrough.jpg': 'team-respawn-website/guides/goblin-commander-walkthrough',
  '/img/Halo-2 Walkthrough.jpg': 'team-respawn-website/guides/halo2-walkthrough',
  '/img/Halo-3-ODST-Walkthrough.jpg': 'team-respawn-website/guides/halo3-odst-walkthrough',
  '/img/Halo-3-Walkthrough.jpg': 'team-respawn-website/guides/halo3-walkthrough',
  '/img/Halo-4-Walkthrough.jpg': 'team-respawn-website/guides/halo4-walkthrough',
  '/img/Halo-CEA-Walkthrough-2023.jpg': 'team-respawn-website/guides/halo-cea-walkthrough',
  '/img/Halo-Infinite-Walkthrough.jpg': 'team-respawn-website/guides/halo-infinite-walkthrough',
  '/img/Halo-Reach-Walkthrough.jpg': 'team-respawn-website/guides/halo-reach-walkthrough',
  '/img/Halo-Wars-2-Walkthrough.jpg': 'team-respawn-website/guides/halo-wars2-walkthrough',
  '/img/Halo-Wars-Walkthrough.jpg': 'team-respawn-website/guides/halo-wars-walkthrough',
  '/img/Spearbreaker-Walkthrough.jpg': 'team-respawn-website/guides/spearbreaker-walkthrough',
};

// Function to get Cloudinary public ID from local path
export function getCloudinaryPublicId(localPath) {
  return imageMappings[localPath] || null;
}

// Function to check if an image should use Cloudinary
export function shouldUseCloudinary(localPath) {
  return !!imageMappings[localPath];
}

// Function to generate migration report
export function generateMigrationReport(content) {
  const imgRegex = /src=["']([^"']+)["']/g;
  const matches = content.matchAll(imgRegex);
  const report = {
    totalImages: 0,
    cloudinaryReady: 0,
    needsMigration: [],
    foundPaths: []
  };
  
  for (const match of matches) {
    const imagePath = match[1];
    report.totalImages++;
    report.foundPaths.push(imagePath);
    
    if (shouldUseCloudinary(imagePath)) {
      report.cloudinaryReady++;
    } else {
      report.needsMigration.push(imagePath);
    }
  }
  
  return report;
}
