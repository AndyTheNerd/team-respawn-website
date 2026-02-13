/**
 * Home content renderer
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
 * Renders the hero section with elegant social media card
 * @returns {string} HTML string for hero section
 */
function renderHeroSection() {
    return `
        <section class="hero-section mb-8">
            <div class="max-w-4xl mx-auto px-4">
                <div class="text-center mb-6">
                    <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                        Welcome to Team Respawn
                    </h1>
                    <p class="text-lg sm:text-xl text-gray-300">
                        Your ultimate destination for RTS strategy guides and gaming walkthroughs. Team Respawn is a thriving gaming channel led by Andy and his friends, dedicated to strategy lovers—especially fans of Halo Wars, Halo FPS, and Age of Empires.
                    </p>
                </div>
                <!-- Social media buttons commented out - can be restored later
                <div class="flex flex-wrap justify-center gap-4">
                    <a href="https://www.youtube.com/@TeamRespawn" target="_blank" rel="noopener noreferrer" 
                       class="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg">
                        <i class="fab fa-youtube" aria-hidden="true"></i>
                        YouTube
                    </a>
                    <a href="https://www.twitch.tv/teamrespawntv" target="_blank" rel="noopener noreferrer" 
                       class="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg">
                        <i class="fab fa-twitch" aria-hidden="true"></i>
                        Twitch
                    </a>
                    <a href="https://discord.gg/TeamRespawn" target="_blank" rel="noopener noreferrer" 
                       class="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg">
                        <i class="fab fa-discord" aria-hidden="true"></i>
                        Discord
                    </a>
                </div>
                -->
            </div>
        </section>
    `;
}
/**
 * Renders the About Us section
 * @param {string} aboutText - About text content
 * @returns {string} HTML string for about section
 */
function renderAboutSection(aboutText) {
    const safeText = escapeHtml(aboutText);
    return `
        <section class="about-section mb-16">
            <div class="max-w-4xl mx-auto px-4">
                <h2 class="text-3xl sm:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    About Us
                </h2>
                <div class="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-gray-700/50">
                    <p class="text-lg text-gray-300 leading-relaxed">
                        ${safeText}
                    </p>
                </div>
            </div>
        </section>
    `;
}

/**
 * Renders the stats section with hardcoded template values
 * @returns {string} HTML string for stats section
 */
function renderStatsSection() {
    const statsData = [
        { icon: 'fa-users', label: 'Subscribers', value: '65K+', color: 'from-blue-500 to-cyan-500' },
        { icon: 'fa-eye', label: 'Total Views', value: '23M+', color: 'from-purple-500 to-pink-500' },
        { icon: 'fa-video', label: 'Videos', value: '3K+', color: 'from-pink-500 to-red-500' },
        { icon: 'fa-calendar', label: 'Years Active', value: '5+', color: 'from-orange-500 to-yellow-500' }
    ];
    const highlightData = [
        { icon: 'fa-crown', text: 'Largest HW2 content creator in the world, with thousands of videos.', color: 'from-indigo-500 to-purple-500' },
        { icon: 'fa-comments', text: 'Largest HW2 community Discord in the world. Over 5.8K members sharing tips and creating groups.', color: 'from-violet-500 to-indigo-500' },
        { icon: 'fa-chart-line', text: 'Growing presence in AoE4 focused on teams gameplay and a casual atmosphere.', color: 'from-emerald-500 to-teal-500' },
        { icon: 'fa-broadcast-tower', text: 'Live on Twitch almost every week playing HW2, AoE4, or Halo FPS.', color: 'from-fuchsia-500 to-purple-500' }
    ];

    const statsCards = statsData.map(stat => `
        <div class="stat-card bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <div class="flex flex-col items-center text-center">
                <div class="w-16 h-16 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg">
                    <i class="fas ${stat.icon} text-2xl text-white" aria-hidden="true"></i>
                </div>
                <div class="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent">
                    ${escapeHtml(stat.value)}
                </div>
                <div class="text-gray-400 text-sm sm:text-base font-semibold">
                    ${escapeHtml(stat.label)}
                </div>
            </div>
        </div>
    `).join('');
    const highlightCards = highlightData.map(highlight => `
        <div class="stat-card bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <div class="flex flex-col items-center text-center">
                <div class="w-16 h-16 rounded-full bg-gradient-to-br ${highlight.color} flex items-center justify-center mb-4 shadow-lg">
                    <i class="fas ${highlight.icon} text-2xl text-white" aria-hidden="true"></i>
                </div>
                <div class="text-gray-300 text-sm sm:text-base font-semibold leading-relaxed">
                    ${escapeHtml(highlight.text)}
                </div>
            </div>
        </div>
    `).join('');

    return `
        <section class="stats-section mb-8">
            <div class="max-w-6xl mx-auto px-4">
                <h2 class="text-2xl sm:text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    Channel Stats
                </h2>
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    ${statsCards}
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-4">
                    ${highlightCards}
                </div>
            </div>
        </section>
    `;
}

/**
 * Renders featured videos carousel
 * @param {Object} allVideos - All video data
 * @returns {string} HTML string for featured videos carousel
 */
function renderFeaturedCarousel(allVideos) {
    // Find all videos marked as featured
    const featuredVideos = [];
    const allVideosList = [
        ...(allVideos.walkthroughs || []),
        ...(allVideos['halo-wars']?.['halo-wars-2']?.videos || []),
        ...(allVideos['halo-wars']?.['halo-wars-1']?.videos || []),
        ...(allVideos['age-of-empires']?.['aoe-2']?.videos || []),
        ...(allVideos['age-of-empires']?.['aoe-4']?.videos || []),
        ...(allVideos['age-of-mythology'] || [])
    ];

    // Filter for featured videos
    allVideosList.forEach(video => {
        if (video.featured === true) {
            featuredVideos.push(video);
        }
    });

    if (featuredVideos.length === 0) {
        return '';
    }

    // Create cards for carousel (wrapping video cards)
    const videoCardsHtml = featuredVideos.map(video => {
        // Use renderVideoCard if available, otherwise create manually
        let cardContent = '';
        if (typeof renderVideoCard === 'function') {
            cardContent = renderVideoCard(video);
        } else {
            const safeTitle = escapeHtml(video.title);
            const safeDescription = escapeHtml(video.description || '');
            const safeImageSrc = escapeHtml(video.imageSrc || '');
            const safeYoutubeUrl = escapeHtml(video.youtubeUrl || '#');
            const safeColor = video.color || 'gray-400';
            const safeButtonColor = video.buttonColor || 'gray-500';

            // Support custom link override (internal/relative paths)
            const hasCustomLink = video.linkUrl && typeof video.linkUrl === 'string' && video.linkUrl.startsWith('/');
            const btnHref = hasCustomLink ? escapeHtml(video.linkUrl) : safeYoutubeUrl;
            const btnTarget = hasCustomLink ? '' : ' target="_blank" rel="noopener noreferrer"';
            const btnText = hasCustomLink && video.linkText ? escapeHtml(video.linkText) : 'Watch on YouTube';

            cardContent = `
                <div class="video-card bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300 flex flex-col">
                    <h2 class="text-xl sm:text-2xl font-bold mb-4 text-${safeColor}">${safeTitle}</h2>
                    <div class="aspect-video mb-4 rounded-lg overflow-hidden border border-gray-700">
                        <img src="${safeImageSrc}" alt="${safeTitle}" loading="lazy" class="w-full h-full object-cover">
                    </div>
                    <p class="text-gray-300 mb-4 flex-grow">${safeDescription}</p>
                    <a href="${btnHref}"${btnTarget} class="inline-flex items-center justify-center gap-2 bg-${safeButtonColor} text-white font-bold py-2 px-6 rounded-full hover:opacity-90 transition-colors duration-300 mt-auto">
                        ${btnText}
                    </a>
                </div>
            `;
        }
        return `<div class="featured-carousel-card flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 px-4">${cardContent}</div>`;
    }).join('');

    return `
        <section class="featured-carousel-section mb-8">
            <div class="max-w-7xl mx-auto px-4">
                <h2 class="text-2xl sm:text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    Curated Best Content
                </h2>
                <div class="relative">
                    <button 
                        id="carousel-prev" 
                        aria-label="Previous videos"
                        class="carousel-nav-btn absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/80 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                        type="button">
                        <i class="fas fa-chevron-left" aria-hidden="true"></i>
                    </button>
                    <div 
                        id="featured-carousel" 
                        class="carousel-container overflow-x-auto scroll-smooth scrollbar-hide flex gap-4 sm:gap-6 px-12"
                        style="scroll-snap-type: x mandatory;">
                        ${videoCardsHtml}
                    </div>
                    <button 
                        id="carousel-next" 
                        aria-label="Next videos"
                        class="carousel-nav-btn absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/80 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                        type="button">
                        <i class="fas fa-chevron-right" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        </section>
    `;
}

/**
 * Renders the timeline section
 * @param {Array} timeline - Array of timeline milestones
 * @returns {string} HTML string for timeline section
 */
function renderTimelineSection(timeline) {
    if (!Array.isArray(timeline) || timeline.length === 0) {
        return '';
    }

    const timelineItems = timeline.map((milestone, index) => {
        const safeDate = escapeHtml(milestone.date || '');
        const safeTitle = escapeHtml(milestone.title || '');
        const safeDescription = escapeHtml(milestone.description || '');
        const isEven = index % 2 === 0;

        return `
            <div class="timeline-item flex flex-col sm:flex-row items-start sm:items-center mb-8 sm:mb-12 relative ${isEven ? 'sm:flex-row-reverse' : ''}">
                <div class="timeline-content w-full sm:w-5/12 ${isEven ? 'sm:text-right' : 'sm:text-left'} mb-4 sm:mb-0">
                    <div class="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl">
                        <div class="text-purple-400 font-bold text-sm mb-2">${safeDate}</div>
                        <h3 class="text-xl sm:text-2xl font-bold mb-2 text-white">${safeTitle}</h3>
                        <p class="text-gray-300 leading-relaxed">${safeDescription}</p>
                    </div>
                </div>
                <div class="timeline-marker flex-shrink-0 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-gray-900 z-10 shadow-lg mx-auto sm:mx-0"></div>
                <div class="timeline-content w-full sm:w-5/12 ${isEven ? 'sm:text-left' : 'sm:text-right'} hidden sm:block"></div>
            </div>
        `;
    }).join('');

    return `
        <section class="timeline-section mb-16">
            <div class="max-w-5xl mx-auto px-4">
                <h2 class="text-3xl sm:text-4xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    Our Journey
                </h2>
                <div class="relative">
                    <div class="timeline-line absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-purple-500 via-pink-500 to-blue-500 h-full top-0 hidden sm:block"></div>
                    <div class="timeline-items">
                        ${timelineItems}
                    </div>
                </div>
            </div>
        </section>
    `;
}

/**
 * Initializes carousel navigation
 */
function initCarousel() {
    const carousel = document.getElementById('featured-carousel');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    if (!carousel || !prevBtn || !nextBtn) {
        return;
    }

    // Calculate scroll amount based on visible card width
    const getScrollAmount = () => {
        const firstCard = carousel.querySelector('.featured-carousel-card');
        if (firstCard) {
            const cardWidth = firstCard.offsetWidth;
            const gap = 16; // 1rem = 16px gap
            return cardWidth + gap;
        }
        return 320; // Fallback
    };

    prevBtn.addEventListener('click', () => {
        const scrollAmount = getScrollAmount();
        carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
        const scrollAmount = getScrollAmount();
        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    // Update button visibility based on scroll position
    const updateButtons = () => {
        prevBtn.style.display = carousel.scrollLeft <= 10 ? 'none' : 'block';
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        nextBtn.style.display = carousel.scrollLeft >= maxScroll - 10 ? 'none' : 'block';
    };

    carousel.addEventListener('scroll', updateButtons);
    
    // Update on window resize
    window.addEventListener('resize', updateButtons);
    
    // Initial update
    updateButtons();
}

/**
 * Renders the complete home content
 * @param {Object} allVideos - All video data
 */
function renderHomeContent(allVideos) {
    const container = document.getElementById('home-content');
    if (!container) {
        console.error('Home content container not found');
        return;
    }

    // Get reference to Twitch container (should already exist in HTML)
    const twitchContainer = document.getElementById('twitch-embed-container');
    
    // Remove any existing dynamically added content (hero, stats, carousel sections)
    // Keep only the Twitch container which is in the original HTML
    const existingHero = container.querySelector('.hero-section');
    const existingStats = container.querySelector('.stats-section');
    const existingCarousel = container.querySelector('.featured-carousel-section');
    
    if (existingHero) existingHero.remove();
    if (existingStats) existingStats.remove();
    if (existingCarousel) existingCarousel.remove();
    
    // Create a wrapper for content sections
    const heroHtml = renderHeroSection();
    const statsHtml = renderStatsSection();
    const carouselHtml = renderFeaturedCarousel(allVideos);
    
    // Build the HTML structure
    let html = heroHtml + statsHtml;
    
    // Sanitize and insert hero and stats sections before Twitch panel
    if (typeof DOMPurify !== 'undefined') {
        const sanitized = DOMPurify.sanitize(html);
        // If Twitch container exists, insert before it, otherwise append
        if (twitchContainer && twitchContainer.parentNode === container) {
            twitchContainer.insertAdjacentHTML('beforebegin', sanitized);
        } else {
            // Create a temporary div to parse the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = sanitized;
            // Insert all children before Twitch container or append to container
            if (twitchContainer) {
                while (tempDiv.firstChild) {
                    container.insertBefore(tempDiv.firstChild, twitchContainer);
                }
            } else {
                while (tempDiv.firstChild) {
                    container.appendChild(tempDiv.firstChild);
                }
            }
        }
    } else {
        if (twitchContainer && twitchContainer.parentNode === container) {
            twitchContainer.insertAdjacentHTML('beforebegin', html);
        } else {
            container.insertAdjacentHTML('beforeend', html);
        }
    }
    
    // Insert carousel after Twitch panel
    if (typeof DOMPurify !== 'undefined') {
        const sanitizedCarousel = DOMPurify.sanitize(carouselHtml);
        if (twitchContainer && twitchContainer.parentNode === container) {
            twitchContainer.insertAdjacentHTML('afterend', sanitizedCarousel);
        } else {
            container.insertAdjacentHTML('beforeend', sanitizedCarousel);
        }
    } else {
        if (twitchContainer && twitchContainer.parentNode === container) {
            twitchContainer.insertAdjacentHTML('afterend', carouselHtml);
        } else {
            container.insertAdjacentHTML('beforeend', carouselHtml);
        }
    }

    // Initialize carousel after content is rendered
    setTimeout(() => {
        initCarousel();
    }, 100);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderHomeContent, renderHeroSection, renderStatsSection, renderFeaturedCarousel, initCarousel };
}
