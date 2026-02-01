# Team Respawn Website

A modern, component-based website showcasing curated gaming content from the Team Respawn YouTube channel. Features walkthroughs and strategy guides for Halo Wars, Halo FPS, Age of Empires, and Age of Mythology.

## Features

- Component-based Astro architecture with WebcoreUI integration
- Block-based content system for reusable components
- Tabbed navigation across game series
- Home page with hero, stats, carousel, and Twitch embed
- Side panel navigation with keyboard support
- Responsive Tailwind-based styling via WebcoreUI
- Accessibility and SEO meta tags
- SCSS support for advanced styling

## Project Structure

```
team-respawn-website/
|-- public/              # Static assets (served as-is)
|   |-- css/
|   |-- js/
|   |-- data/
|   |-- img/
|   `-- content/
|-- src/
|   |-- blocks/          # Reusable content blocks (Author, Socials)
|   |-- components/      # Astro components
|   |-- data/           # Site data and configuration
|   |-- layouts/        # Shared layouts (head/SEO)
|   |-- pages/          # File-based routes
|   `-- styles/         # Global styles and SCSS files
|-- astro.config.mjs    # Astro configuration
|-- package.json        # Dependencies and scripts
`-- webcore.config.scss # WebcoreUI configuration
```

## Setup & Running Locally

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd team-respawn-website
```

2. Install dependencies:
```bash
npm install
```

### Development

1. Start the Astro development server:
```bash
npm run dev
```

2. Open your browser to:
```
http://localhost:4321
```

The development server will hot-reload automatically when you save changes to any file in the `src/` directory.

### Build & Preview

1. Build the production version:
```bash
npm run build
```

2. Preview the production build locally:
```bash
npm run preview
```

The preview server will run on `http://localhost:4321` by default.

## Development

The site uses Astro for layouts/pages with WebcoreUI components and vanilla JavaScript for interactivity. The block system in `src/blocks/` allows for reusable content components.

Key Files:
- `src/pages/index.astro` - Main page structure
- `src/blocks/` - Reusable content blocks (Author profiles, Social media components)
- `public/data/` - Static data files
- `src/components/` - Astro components
- `astro.config.mjs` - Astro and WebcoreUI configuration

### Working with Blocks

The project uses a block-based architecture in `src/blocks/`:
- `Author/` - Author profile and bio blocks
- `Socials/` - Social media link and embed blocks

### Styling

- WebcoreUI provides Tailwind CSS utilities out of the box
- Custom SCSS files can be added to `src/styles/`
- Component-specific styles should be included within Astro components

## Technologies Used

- **Astro v5.16.15** - Component and layout framework with file-based routing
- **WebcoreUI v1.3.0** - Modern UI component library with Tailwind CSS
- **SCSS** - CSS preprocessor for advanced styling
- **TypeScript** - Type-safe JavaScript development
- **HTML5** - Semantic markup
- **JavaScript (ES6+)** - Vanilla JS for interactivity
- **Vite** - Build tool and development server

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run astro` - Run Astro CLI commands

## Data Structure

Video data is stored in public/data/videos.json. Each video object should follow this structure:

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

## Technologies Used

- Astro - Component and layout framework with file-based routing
- HTML5 - Semantic markup
- CSS3 - Custom styles with Tailwind CSS
- JavaScript (ES6+) - Vanilla JS
- Tailwind CSS - Utility-first CSS framework
- Font Awesome - Icons
- DOMPurify - HTML sanitization library
- Google Fonts - Inter font family

## Links

- YouTube Channel: https://www.youtube.com/@TeamRespawn
- Twitch: https://www.twitch.tv/TeamRespawnTV
- Discord: https://discord.gg/TeamRespawn
- Shop: https://www.teamrespawn.shop
