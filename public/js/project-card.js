/**
 * Project card component renderer
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
 * Validates and sanitizes an asset URL (supports relative paths)
 * @param {string} url - URL to validate
 * @returns {string|null} Sanitized URL or null if invalid
 */
function sanitizeAssetUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
        return trimmed;
    }
    return sanitizeUrl(trimmed);
}

/**
 * Generates HTML for a single project card
 * @param {Object} projectData - Project data object
 * @returns {string} HTML string for the project card
 */
function renderProjectCard(projectData) {
    const {
        name,
        description,
        features = [],
        links = {},
        color = 'gray-400',
        buttonColor = 'gray-500',
        status,
        tags = [],
        year,
        cover,
        featured = false
    } = projectData;

    // Sanitize all user inputs
    const safeName = escapeHtml(name || '');
    const safeDescription = escapeHtml(description || '');
    const safeStatus = escapeHtml(status || '');
    const safeYear = escapeHtml(year !== undefined && year !== null ? String(year) : '');
    const safeCover = sanitizeAssetUrl(cover);

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

    // Build features list
    let featuresHtml = '';
    if (Array.isArray(features) && features.length > 0) {
        featuresHtml = '<ul class="list-disc list-inside space-y-1 mb-4">';
        features.forEach(feature => {
            const safeFeature = escapeHtml(feature);
            featuresHtml += `<li class="text-gray-400 text-sm">${safeFeature}</li>`;
        });
        featuresHtml += '</ul>';
    }

    // Build meta section (status/year)
    let metaHtml = '';
    if (safeStatus || safeYear) {
        const metaItems = [];
        if (safeStatus) {
            metaItems.push(`<span class="project-card__badge text-${safeColor}">${safeStatus}</span>`);
        }
        if (safeYear) {
            metaItems.push(`<span>${safeYear}</span>`);
        }
        metaHtml = `<div class="project-card__meta">${metaItems.join('')}</div>`;
    }

    // Build tags section
    let tagsHtml = '';
    if (Array.isArray(tags) && tags.length > 0) {
        tagsHtml = '<div class="project-card__tags">';
        tags.forEach(tag => {
            const safeTag = escapeHtml(tag);
            tagsHtml += `<span class="project-card__tag">${safeTag}</span>`;
        });
        tagsHtml += '</div>';
    }

    // Build cover image section
    let coverHtml = '';
    if (safeCover) {
        coverHtml = `
            <div class="project-card__cover">
                <img src="${escapeHtml(safeCover)}" alt="${safeName} cover" loading="lazy" />
            </div>
        `;
    }

    // Build links section
    let linksHtml = '<div class="flex flex-wrap gap-2 mt-auto">';
    
    if (links.website) {
        const safeWebsiteUrl = sanitizeUrl(links.website);
        if (safeWebsiteUrl) {
            linksHtml += `<a href="${escapeHtml(safeWebsiteUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-${safeButtonColor} text-white font-semibold py-2 px-4 rounded-lg hover:bg-${hoverColor} transition-colors duration-300">
                <i class="fas fa-globe" aria-hidden="true"></i>
                Website
            </a>`;
        }
    }
    
    if (links.github) {
        const safeGithubUrl = sanitizeUrl(links.github);
        if (safeGithubUrl) {
            linksHtml += `<a href="${escapeHtml(safeGithubUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                <i class="fab fa-github" aria-hidden="true"></i>
                GitHub
            </a>`;
        }
    }
    
    if (links.api) {
        const safeApiUrl = sanitizeUrl(links.api);
        if (safeApiUrl) {
            linksHtml += `<a href="${escapeHtml(safeApiUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-300">
                <i class="fas fa-code" aria-hidden="true"></i>
                API
            </a>`;
        }
    }
    
    if (links.invite) {
        const safeInviteUrl = sanitizeUrl(links.invite);
        if (safeInviteUrl) {
            linksHtml += `<a href="${escapeHtml(safeInviteUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-${safeButtonColor} text-white font-semibold py-2 px-4 rounded-lg hover:bg-${hoverColor} transition-colors duration-300">
                <i class="fas fa-link" aria-hidden="true"></i>
                Invite
            </a>`;
        }
    }
    
    if (links.discord) {
        const safeDiscordUrl = sanitizeUrl(links.discord);
        if (safeDiscordUrl) {
            linksHtml += `<a href="${escapeHtml(safeDiscordUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-600 transition-colors duration-300">
                <i class="fab fa-discord" aria-hidden="true"></i>
                Try in Discord
            </a>`;
        }
    }
    
    linksHtml += '</div>';

    const featuredClass = featured ? ' project-card--featured' : '';
    const accentBar = `<div class="h-1 w-16 rounded-full bg-${safeColor}/70 mb-4"></div>`;

    const cardHtml = `
        <div class="project-card${featuredClass} bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300 flex flex-col">
            ${coverHtml}
            ${accentBar}
            <h2 class="text-xl sm:text-2xl font-bold mb-3 text-${safeColor}">${safeName}</h2>
            ${metaHtml}
            ${tagsHtml}
            <p class="text-gray-300 mb-4 flex-grow">
                ${safeDescription}
            </p>
            ${featuresHtml}
            ${linksHtml}
        </div>
    `;

    // Sanitize the entire card HTML with DOMPurify if available
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(cardHtml, {
            ALLOWED_TAGS: ['div', 'h2', 'p', 'a', 'i', 'ul', 'li', 'span', 'img'],
            ALLOWED_ATTR: ['class', 'href', 'target', 'rel', 'aria-hidden', 'src', 'alt', 'loading'],
            ALLOW_DATA_ATTR: false
        });
    }
    
    return cardHtml;
}

/**
 * Renders multiple project cards into a container
 * @param {Array} projects - Array of project data objects
 * @param {string} containerId - ID of the container element
 */
function renderProjectGrid(projects, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container not found: ${containerId}`);
        return;
    }

    if (!Array.isArray(projects) || projects.length === 0) {
        // Use textContent instead of innerHTML for static content
        const message = document.createElement('p');
        message.className = 'text-gray-400';
        message.textContent = 'No projects available.';
        container.appendChild(message);
        return;
    }

    // Clear container safely
    container.textContent = '';
    
    // Render each project card
    projects.forEach(project => {
        const cardHtml = renderProjectCard(project);
        if (cardHtml) {
            // Use DOMPurify to sanitize before inserting
            if (typeof DOMPurify !== 'undefined') {
                const sanitized = DOMPurify.sanitize(cardHtml, {
                    ALLOWED_TAGS: ['div', 'h2', 'p', 'a', 'i', 'ul', 'li', 'span', 'img'],
                    ALLOWED_ATTR: ['class', 'href', 'target', 'rel', 'aria-hidden', 'src', 'alt', 'loading'],
                    ALLOW_DATA_ATTR: false
                });
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderProjectCard, renderProjectGrid };
}
