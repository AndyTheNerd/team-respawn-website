# Team Respawn Website

A modern, component-based website showcasing curated gaming content from the Team Respawn YouTube channel. Features walkthroughs and strategy guides for Halo Wars, Halo FPS, Age of Empires, and Age of Mythology.

## Features

- Component-based Astro architecture
- Tabbed navigation across game series
- Home page with hero, stats, carousel, and Twitch embed
- Side panel navigation with keyboard support
- Responsive Tailwind-based styling
- Accessibility and SEO meta tags

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
|   |-- components/       # Astro components
|   |-- layouts/          # Shared layouts (head/SEO)
|   `-- pages/            # File-based routes
`-- astro.config.mjs
```

## Setup & Running Locally

1. Install dependencies:
```bash
npm install
```

2. Start the Astro dev server:
```bash
npm run dev
```

3. Open your browser:
```
http://localhost:4321
```

## Development

The site uses Astro for layouts/pages and vanilla JavaScript for interactivity. Edit files and the dev server will hot-reload.

Key Files:
- src/pages/index.astro - Main page structure
- public/data/videos.json - Video data
- public/js/video-card.js - Video card rendering logic
- src/components/*.astro - Reusable components

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
