/**
 * Video card component renderer
 */

/**
 * Generates HTML for a single video card
 * @param {Object} videoData - Video data object
 * @returns {string} HTML string for the video card
 */
function renderVideoCard(videoData) {
    const {
        title,
        description,
        youtubeUrl,
        imageSrc,
        iframeSrc,
        color = 'gray-400',
        buttonColor = 'gray-500',
        alt = ''
    } = videoData;

    // Determine video content (image or iframe)
    let videoContent = '';
    if (iframeSrc) {
        videoContent = `
            <iframe 
                src="${iframeSrc}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                sandbox="allow-scripts allow-same-origin allow-presentation"
                title="${title} - YouTube video player"
                loading="lazy">
            </iframe>
        `;
    } else {
        const fallbackSrc = `https://placehold.co/600x400/212121/ffffff?text=${encodeURIComponent(title)}`;
        videoContent = `
            <img 
                src="${imageSrc || fallbackSrc}" 
                onerror="this.onerror=null;this.src='${fallbackSrc}';" 
                alt="${alt || title}"
                loading="lazy"
                width="600"
                height="400">
        `;
    }

    return `
        <div class="video-card bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300 flex flex-col">
            <h2 class="text-xl sm:text-2xl font-bold mb-4 text-${color}">${title}</h2>
            <div class="aspect-video mb-4 rounded-lg overflow-hidden ${iframeSrc ? '' : 'relative'}">
                ${videoContent}
            </div>
            <p class="text-gray-300 mb-4 flex-grow">
                ${description}
            </p>
            <a href="${youtubeUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 bg-${buttonColor} text-white font-bold py-2 px-6 rounded-full hover:bg-${buttonColor.replace(/\d+$/, (match) => {
                const num = parseInt(match);
                if (num < 600) {
                    return (num + 100).toString();
                } else if (num === 600) {
                    return '700';
                } else {
                    return '800';
                }
            })} transition-colors duration-300 mt-auto">
                <i class="fas fa-play" aria-hidden="true"></i>
                Watch on YouTube
            </a>
        </div>
    `;
}

/**
 * Renders multiple video cards into a container
 * @param {Array} videos - Array of video data objects
 * @param {string} containerId - ID of the container element
 */
function renderVideoGrid(videos, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container not found: ${containerId}`);
        return;
    }

    if (!Array.isArray(videos) || videos.length === 0) {
        container.innerHTML = '<p class="text-gray-400">No videos available.</p>';
        return;
    }

    container.innerHTML = videos.map(video => renderVideoCard(video)).join('');
}

/**
 * Renders a section with title, description, and video grid
 * @param {Object} sectionData - Section data object
 * @param {string} containerId - ID of the parent container
 */
function renderVideoSection(sectionData, containerId) {
    const { title, description, videos, gridClass = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8' } = sectionData;
    
    const sectionHtml = `
        <div class="p-6 rounded-xl border border-gray-700">
            <h3 class="text-2xl font-bold text-gray-200 mb-2">${title}</h3>
            <p class="text-gray-400 mb-6">
                ${description}
            </p>
            <div class="${gridClass}" id="${containerId}-grid">
                <!-- Videos will be rendered here -->
            </div>
        </div>
    `;

    const container = document.getElementById(containerId);
    if (container) {
        container.insertAdjacentHTML('beforeend', sectionHtml);
        
        // Render videos into the grid
        if (videos && videos.length > 0) {
            renderVideoGrid(videos, `${containerId}-grid`);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderVideoCard, renderVideoGrid, renderVideoSection };
}

