# Team Respawn Website

A modern, component-based website showcasing curated gaming content from the Team Respawn YouTube channel. Features walkthroughs and strategy guides for Halo Wars, Halo FPS, Age of Empires, and Age of Mythology.

## 🚀 Features

- **Component-Based Architecture**: Modular HTML components loaded dynamically for better maintainability
- **Tabbed Navigation**: Organized content by game series (Home, Walkthroughs, Halo Wars, Age of Empires, Age of Mythology) with keyboard navigation support
- **Home Page Features**:
  - Hero section with social media links (YouTube, Twitch, Discord)
  - Channel statistics display (Subscribers, Views, Videos, Years Active)
  - Featured videos carousel with smooth scrolling navigation
  - Live Twitch stream embed with collapse/expand functionality and state persistence
- **Side Panel Navigation**: Mobile-friendly navigation panel with focus trapping and keyboard support
- **Responsive Design**: Mobile-first design using Tailwind CSS with glassmorphism effects
- **Accessibility**: ARIA labels, keyboard navigation, skip links, screen reader support, and focus management
- **Security**: XSS protection with DOMPurify, input sanitization, URL validation, and path traversal prevention
- **Performance**: Lazy loading images, optimized asset loading
- **SEO Optimized**: Meta tags, Open Graph, Twitter Cards, and structured data (JSON-LD)

## 📁 Project Structure

```
team-respawn-website/
├── components/          # Reusable HTML components
│   ├── header.html
│   ├── footer.html
│   ├── side-panel.html
│   ├── tab-navigation.html
│   └── social-icons.html
├── css/                # Custom styles
│   └── styles.css
├── js/                 # JavaScript modules
│   ├── components.js   # Component loader
│   ├── main.js         # Main initialization
│   ├── video-card.js   # Video card renderer with XSS protection
│   ├── tabs.js         # Tab navigation logic
│   └── side-panel.js   # Side panel functionality
├── data/               # JSON data files
│   └── videos.json      # Video metadata
├── img/                 # Image assets
│   ├── [game]-Walkthrough.jpg
│   └── [game]-Guides/
├── blog/                # Blog pages
│   ├── blog.html
│   └── posts/
└── index.html          # Main page
```

## 🛠️ Setup & Running Locally

### Prerequisites

- Python 3
- A modern web browser

### Running the Server

1. Navigate to the project directory

2. Start a local web server using Python 3:
```bash
python -m http.server 8000
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

### Development

The site uses vanilla JavaScript with no build process required. Simply edit the files and refresh your browser.

**Key Files:**
- `index.html` - Main page structure
- `data/videos.json` - Video data (add/edit videos here)
- `js/video-card.js` - Video card rendering logic
- `components/*.html` - Reusable components

## 📊 Data Structure

Video data is stored in `data/videos.json`. Each video object should follow this structure:

```json
{
  "title": "Video Title",
  "description": "Video description",
  "youtubeUrl": "https://youtu.be/VIDEO_ID",
  "imageSrc": "img/path/to/image.jpg",
  "color": "orange-400",
  "buttonColor": "orange-500",
  "alt": "Alt text for image"
}
```

### Supported Categories

- `walkthroughs` - Array of walkthrough videos
- `halo-wars` - Object containing Halo Wars guides
  - `halo-wars-1` - Halo Wars 1 guides
  - `halo-wars-2` - Halo Wars 2 guides
- `age-of-empires` - Object containing Age of Empires guides
  - `aoe-2` - Age of Empires II guides
  - `aoe-4` - Age of Empires IV guides
- `age-of-mythology` - Array of Age of Mythology guides

## 🔒 Security & Data Validation

### XSS Protection

The site implements multiple layers of XSS protection:

1. **DOMPurify Integration**: All HTML content is sanitized using DOMPurify before insertion
2. **Input Sanitization**: All user data is HTML-escaped before rendering
3. **URL Validation**: URLs are validated and sanitized to prevent malicious links
4. **Path Traversal Prevention**: Component names and image paths are validated to prevent directory traversal attacks
5. **Type Validation**: Data structures are validated before processing

### Security Features

- **HTML Escaping**: All text content is escaped using `escapeHtml()` function
- **URL Sanitization**: `sanitizeUrl()` validates absolute URLs (http/https only)
- **Image Path Sanitization**: `sanitizeImageSrc()` handles both relative and absolute paths safely
- **Component Name Validation**: Prevents path traversal in component loading
- **YouTube URL Validation**: Ensures only valid YouTube URLs are used

### Security Headers

The site includes security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 🎨 Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Custom styles with Tailwind CSS
- **JavaScript (ES6+)** - Vanilla JS, no frameworks
- **Tailwind CSS** - Utility-first CSS framework
- **Font Awesome** - Icons
- **DOMPurify** - HTML sanitization library
- **Google Fonts** - Inter font family

## 📝 Adding New Videos

1. Add your video thumbnail image to the `img/` directory
2. Edit `data/videos.json` and add a new video object to the appropriate category
3. Ensure the `imageSrc` path matches your image location
4. Refresh the page to see your changes

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please ensure all code follows the existing patterns and includes proper security measures.

## 🔗 Links

- [YouTube Channel](https://www.youtube.com/@TeamRespawn)
- [Twitch](https://www.twitch.tv/TeamRespawnTV)
- [Discord](https://discord.gg/TeamRespawn)
- [Shop](https://www.teamrespawn.shop)
