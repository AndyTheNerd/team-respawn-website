/**
 * Video card component renderer
 */

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Validates and sanitizes a URL
 * @param {string} url - URL to validate
 * @returns {string|null} Sanitized URL or null if invalid
 */
function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return null;
    try {
        const parsed = new URL(url);
        // Only allow http/https protocols
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.toString();
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Validates and sanitizes an image source (handles both relative and absolute paths)
 * @param {string} imageSrc - Image source path to validate
 * @returns {string|null} Sanitized image source or null if invalid
 */
function sanitizeImageSrc(imageSrc) {
    if (!imageSrc || typeof imageSrc !== 'string') return null;
    
    // Check if it's an absolute URL
    try {
        const parsed = new URL(imageSrc);
        // Only allow http/https protocols for absolute URLs
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.toString();
        }
        return null;
    } catch {
        // Not an absolute URL, treat as relative path
        // Prevent path traversal attacks by checking for .. sequences
        if (imageSrc.includes('..') || imageSrc.includes('//')) {
            return null; // Reject paths with .. or // to prevent directory traversal
        }
        
        // Normalize the path - remove leading slashes but preserve the rest
        const cleaned = imageSrc.replace(/^\/+/, '');
        
        // Basic validation: ensure it's not empty and doesn't contain null bytes
        if (cleaned.length === 0 || cleaned.includes('\0')) {
            return null;
        }
        
        // For relative paths, escape HTML but return the path
        // The main security is preventing path traversal, which we've already done
        return cleaned;
    }
}

/**
 * Validates YouTube URL or embed URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid YouTube URL
 */
function isValidYouTubeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();
        return hostname === 'www.youtube.com' || 
               hostname === 'youtube.com' || 
               hostname === 'youtu.be' ||
               hostname === 'www.youtu.be';
    } catch {
        return false;
    }
}

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
        blogUrl,
        buttonText,
        imageSrc,
        iframeSrc,
        color = 'gray-400',
        buttonColor = 'gray-500',
        alt = ''
    } = videoData;

    // Sanitize all user inputs
    const safeTitle = escapeHtml(title || '');
    const safeDescription = escapeHtml(description || '');
    const safeAlt = escapeHtml(alt || title || '');

    // Determine link URL and behavior
    let linkHref = '';
    let linkTarget = '';
    let linkRel = '';
    let safeBtnText = 'Watch on YouTube';

    if (blogUrl && typeof blogUrl === 'string') {
        // Internal blog link - no target="_blank", no rel
        linkHref = escapeHtml(blogUrl);
        safeBtnText = escapeHtml(buttonText || 'Watch Walkthrough');
    } else {
        // Validate YouTube URL
        const safeYoutubeUrl = sanitizeUrl(youtubeUrl);
        if (!safeYoutubeUrl || !isValidYouTubeUrl(safeYoutubeUrl)) {
            console.error('Invalid YouTube URL:', youtubeUrl);
            return ''; // Return empty string if URL is invalid
        }
        linkHref = escapeHtml(safeYoutubeUrl);
        linkTarget = ' target="_blank"';
        linkRel = ' rel="noopener noreferrer"';
    }

    // Validate iframe source (should be YouTube embed URL)
    let safeIframeSrc = null;
    if (iframeSrc) {
        const sanitized = sanitizeUrl(iframeSrc);
        if (sanitized && sanitized.includes('youtube.com/embed/')) {
            safeIframeSrc = sanitized;
        }
    }

    // Validate image source (handles both relative and absolute paths)
    const safeImageSrc = imageSrc ? sanitizeImageSrc(imageSrc) : null;
    const fallbackSrc = `https://placehold.co/600x400/212121/ffffff?text=${encodeURIComponent(safeTitle)}`;

    // Validate color values (only allow Tailwind color classes)
    const validColorPattern = /^[a-z]+-[0-9]{1,3}$/;
    const safeColor = validColorPattern.test(color) ? color : 'gray-400';
    const safeButtonColor = validColorPattern.test(buttonColor) ? buttonColor : 'gray-500';

    // Calculate hover color safely
    const hoverColor = safeButtonColor.replace(/\d+$/, (match) => {
        const num = parseInt(match);
        if (num < 600) {
            return (num + 100).toString();
        } else if (num === 600) {
            return '700';
        } else {
            return '800';
        }
    });

    // Determine video content (image or iframe)
    let videoContent = '';
    if (safeIframeSrc) {
        // Use DOMPurify to sanitize iframe HTML
        const iframeHtml = `
            <iframe 
                src="${escapeHtml(safeIframeSrc)}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                sandbox="allow-scripts allow-same-origin allow-presentation"
                title="${safeTitle} - YouTube video player"
                loading="lazy">
            </iframe>
        `;
        videoContent = typeof DOMPurify !== 'undefined' 
            ? DOMPurify.sanitize(iframeHtml, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'sandbox'] })
            : iframeHtml;
    } else {
        // Use event listener instead of inline onerror
        const imgId = `img-${Math.random().toString(36).substr(2, 9)}`;
        videoContent = `
            <img 
                id="${imgId}"
                src="${escapeHtml(safeImageSrc || fallbackSrc)}" 
                alt="${safeAlt}"
                loading="lazy"
                width="600"
                height="400">
        `;
        // Set up error handler after DOM insertion (handled in renderVideoGrid)
    }

    const cardHtml = `
        <div class="video-card bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300 flex flex-col">
            <h2 class="text-xl sm:text-2xl font-bold mb-4 text-${safeColor}">${safeTitle}</h2>
            <div class="aspect-video mb-4 rounded-lg overflow-hidden ${safeIframeSrc ? '' : 'relative'}">
                ${videoContent}
            </div>
            <p class="text-gray-300 mb-4 flex-grow">
                ${safeDescription}
            </p>
            <a href="${linkHref}"${linkTarget}${linkRel} class="inline-flex items-center justify-center gap-2 bg-${safeButtonColor} text-white font-bold py-2 px-6 rounded-full hover:bg-${hoverColor} transition-colors duration-300 mt-auto">
                <i class="fas fa-play" aria-hidden="true"></i>
                ${safeBtnText}
            </a>
        </div>
    `;

    // Sanitize the entire card HTML with DOMPurify if available
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(cardHtml, {
            ALLOWED_TAGS: ['div', 'h2', 'p', 'a', 'i', 'iframe', 'img'],
            ALLOWED_ATTR: ['class', 'href', 'target', 'rel', 'aria-hidden', 'src', 'alt', 'loading', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'sandbox', 'title', 'id'],
            ALLOW_DATA_ATTR: false
        });
    }
    
    return cardHtml;
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
        // Use textContent instead of innerHTML for static content
        const message = document.createElement('p');
        message.className = 'text-gray-400';
        message.textContent = 'No videos available.';
        container.appendChild(message);
        return;
    }

    // Clear container safely
    container.textContent = '';
    
    // Render each video card
    videos.forEach(video => {
        const cardHtml = renderVideoCard(video);
        if (cardHtml) {
            // Use DOMPurify to sanitize before inserting
            if (typeof DOMPurify !== 'undefined') {
                const sanitized = DOMPurify.sanitize(cardHtml);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = sanitized;
                
                // Move all children to container
                while (tempDiv.firstChild) {
                    container.appendChild(tempDiv.firstChild);
                }
            } else {
                // Fallback: use insertAdjacentHTML (less safe, but better than innerHTML)
                container.insertAdjacentHTML('beforeend', cardHtml);
            }
        }
    });

    // Set up image error handlers for dynamically added images
    container.querySelectorAll('img').forEach(img => {
        if (!img.onerror) {
            img.addEventListener('error', function() {
                const fallbackSrc = `https://placehold.co/600x400/212121/ffffff?text=Image+not+available`;
                this.src = fallbackSrc;
            });
        }
    });
}

/**
 * Renders a section with title, description, and video grid
 * @param {Object} sectionData - Section data object
 * @param {string} containerId - ID of the parent container
 * @param {string} sectionId - Optional unique identifier for the grid ID
 */
function renderVideoSection(sectionData, containerId, sectionId = null) {
    const { title, description, videos, gridClass = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8' } = sectionData;
    
    // Sanitize inputs
    const safeTitle = escapeHtml(title || '');
    const safeDescription = escapeHtml(description || '');
    const safeGridClass = escapeHtml(gridClass);
    
    // Create unique grid ID using sectionId or generate from title
    const uniqueGridId = sectionId 
        ? `${containerId}-${sectionId}-grid` 
        : `${containerId}-${safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-grid`;
    
    const sectionHtml = `
        <div class="p-6 rounded-xl border border-gray-700">
            <h3 class="text-2xl font-bold text-gray-200 mb-2">${safeTitle}</h3>
            <p class="text-gray-400 mb-6">
                ${safeDescription}
            </p>
            <div class="${safeGridClass}" id="${uniqueGridId}">
                <!-- Videos will be rendered here -->
            </div>
        </div>
    `;

    const container = document.getElementById(containerId);
    if (container) {
        // Sanitize section HTML before inserting
        const sanitizedHtml = typeof DOMPurify !== 'undefined' 
            ? DOMPurify.sanitize(sectionHtml)
            : sectionHtml;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitizedHtml;
        
        // Move all children to container
        while (tempDiv.firstChild) {
            container.appendChild(tempDiv.firstChild);
        }
        
        // Render videos into the grid using the unique ID
        if (videos && videos.length > 0) {
            renderVideoGrid(videos, uniqueGridId);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderVideoCard, renderVideoGrid, renderVideoSection };
}
