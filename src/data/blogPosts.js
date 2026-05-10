const blogPosts = [
  {
    title: 'What Happened to Medal of Honor?',
    dateIso: '2026-05-10',
    category: 'Retro',
    tags: ['Medal of Honor'],
    readingTimeMinutes: 5,
    excerpt:
      'From DreamWorks and Spielberg through EA LA and Danger Close, why Warfighter shelved the series, what VR’s Above and Beyond signals, and where the back catalogue is playable today.',
    href: '/blog/posts/what-happened-to-medal-of-honor',
    img: {
      src: 'https://img.youtube.com/vi/D39Ku5pqie8/maxresdefault.jpg',
      alt: 'What Happened to Medal of Honor?',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'What happened to Crackdown?',
    dateIso: '2026-05-08',
    category: 'Retro',
    tags: ['Crackdown'],
    readingTimeMinutes: 5,
    excerpt:
      'From Crackdown 1’s Halo 3 beta tailwind and co-op sandbox to Crackdown 2’s freak outbreak, Crackdown 3’s cloud-destruction pivot—and whether Microsoft might revisit the series.',
    href: '/blog/posts/what-happened-to-crackdown',
    img: {
      src: 'https://img.youtube.com/vi/ZY3XDpg9Q3c/maxresdefault.jpg',
      alt: 'What happened to Crackdown?',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'The Heroes of Halo Wars',
    dateIso: '2026-05-08',
    category: 'Spotlight',
    tags: ['Halo Wars 1'],
    readingTimeMinutes: 8,
    excerpt:
      'Companion notes to the video: Red Team’s role and lore, Forge’s arc and sacrifice, Anders and Cutter, Serena’s six years alone and rampancy—and why the Spirit of Fire crew stops a Covenant Forerunner gambit decades before Halo CE.',
    href: '/blog/posts/the-heroes-of-halo-wars',
    img: {
      src: 'https://img.youtube.com/vi/gF3Jt0CUFfY/maxresdefault.jpg',
      alt: 'The Heroes of Halo Wars',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Sniper Elite Resistance: First Impressions',
    dateIso: '2026-05-08',
    category: 'Spotlight',
    tags: ['Sniper Elite'],
    readingTimeMinutes: 5,
    excerpt:
      'Notes from the first campaign mission on PC (medium): third-person pacing, subsonic ammo, traversal, traps, Fleck cannons, dam objectives, and classic Sniper Elite kill-cam feedback.',
    href: '/blog/posts/sniper-elite-resistance-first-impressions',
    img: {
      src: 'https://img.youtube.com/vi/YcKNnvcRXxU/maxresdefault.jpg',
      alt: 'Sniper Elite Resistance: First Impressions',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'How to set up the CnC Online Launcher',
    dateIso: '2026-05-06',
    category: 'Guides',
    tags: ['Command and Conquer'],
    readingTimeMinutes: 2,
    excerpt:
      'Install the C&C Online launcher, use Hook to enable your game, launch from Origin or Steam, then sign in and host a Custom Match lobby for multiplayer.',
    href: '/blog/posts/how-to-set-up-the-cnc-online-launcher',
    img: {
      src: 'https://img.youtube.com/vi/sv2gi3ge-3c/maxresdefault.jpg',
      alt: 'Command & Conquer — C&C Online launcher setup guide',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Trophies Are Better Than Achievements',
    dateIso: '2026-05-02',
    category: 'Spotlight',
    tags: ['PlayStation', 'Xbox'],
    readingTimeMinutes: 5,
    excerpt:
      'PlayStation trophies versus Xbox achievements: tiers, Platinums, DLC lists, profile levels — and why raw Gamerscore often fails to tell a story.',
    href: '/blog/posts/trophies-are-better-than-achievements',
    img: {
      src: '/img/blog/trophies-vs-achievements.jpg',
      alt: 'Comparison of PlayStation trophies and Xbox achievements',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'What Made RollerCoaster Tycoon so much fun?',
    dateIso: '2026-05-02',
    category: 'Retro',
    tags: ['RollerCoaster Tycoon'],
    readingTimeMinutes: 4,
    excerpt:
      'My love letter to the classic RollerCoaster Tycoon line: late-90s PC success, Chris Sawyer’s one-developer craft, OpenRCT2 and RCT3, and why sandbox plus management still resonates with me.',
    href: '/blog/posts/what-made-rollercoaster-tycoon-so-much-fun',
    img: {
      src: 'https://img.youtube.com/vi/vQgrUSl5tVA/maxresdefault.jpg',
      alt: 'What Made RollerCoaster Tycoon so much fun?',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Call of Duty: Roads to Victory - The PSP FPS!',
    dateIso: '2026-05-02',
    category: 'Retro',
    tags: ['Call of Duty'],
    readingTimeMinutes: 3,
    excerpt:
      'The video treats Call of Duty: Roads to Victory as a curiosity: a World War II–era CoD built for the PSP when the brand was still strongly associated with WWII, months before the franchise’s modern pivot with Call of Duty 4.',
    href: '/blog/posts/call-of-duty-roads-to-victory-psp-gameplay-retro',
    img: {
      src: 'https://img.youtube.com/vi/NbDp6jaxBB8/maxresdefault.jpg',
      alt: 'Call of Duty: Roads to Victory - The PSP FPS!',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Blur - The forgotten Arcade Racer',
    dateIso: '2026-05-02',
    category: 'Retro',
    tags: ['Blur'],
    readingTimeMinutes: 4,
    excerpt:
      'Blur is framed as a standout Xbox 360 / PS3–era arcade combat racer from Activision and Bizarre Creations: power-up heavy, aggressive, and often described as “Mario Kart for adults” (with the joke that adults play Mario Kart anyway).',
    href: '/blog/posts/blur-retro-look-back',
    img: {
      cloudinaryId: 'Blur_v4_wectyn',
      src: 'https://img.youtube.com/vi/Npvba07XaJI/maxresdefault.jpg',
      alt: 'Blur - The forgotten Arcade Racer',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo Wars: The Ultimate Design for Console RTS',
    dateIso: '2026-05-01',
    category: 'Spotlight',
    tags: ['Halo Wars 1'],
    readingTimeMinutes: 6,
    excerpt:
      'How Ensemble Studios designed Halo Wars around a controller-only platform — unit selection, locked base slots, and maps built for fixed bases — and why that blueprint still defines console RTS.',
    href: '/blog/posts/halo-wars-the-ultimate-design-for-console-rts',
    img: {
      src: 'https://cdn.dlcompare.com/game_tetiere/upload/gameimage/file/30445.jpeg.webp',
      alt: 'Halo Wars: The Ultimate Design for Console RTS',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'What Happened to Army of Two?',
    dateIso: '2026-05-01',
    category: 'Retro',
    tags: ['Army of Two'],
    excerpt:
      'Co-op, aggro, three releases in five years, preservation headaches on modern Xbox, and why a remaster might be the path back.',
    href: '/blog/posts/what-happened-to-army-of-two',
    img: {
      src: 'https://img.youtube.com/vi/04Vp5P1Gw9M/maxresdefault.jpg',
      alt: 'What Happened to Army of Two?',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Ashes of the Singularity 2 — Demo First Impressions',
    dateIso: '2026-02-23',
    category: 'Reviews',
    tags: ['Ashes of the Singularity 2'],
    excerpt: 'First impressions of the Ashes of the Singularity 2 demo — a large-scale RTS that blends Command & Conquer, Company of Heroes, and Halo Wars.',
    href: '/blog/posts/ashes-of-the-singularity-2-demo-impressions',
    img: {
      src: 'https://img.youtube.com/vi/uT0bc4IA5zg/maxresdefault.jpg',
      alt: 'Ashes of the Singularity 2 — Demo First Impressions',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo CE Anniversary Full Campaign Walkthrough',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo FPS'],
    excerpt: 'A full walkthrough of Halo Combat Evolved Anniversary. Watch the complete campaign run.',
    href: '/blog/posts/halo-ce-anniversary-walkthrough',
    img: {
      src: 'https://img.youtube.com/vi/F1IcZeDYFd4/maxresdefault.jpg',
      alt: 'Halo CE Anniversary Full Campaign Walkthrough',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo 2 Anniversary Full Campaign Walkthrough',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo FPS'],
    excerpt: 'A full walkthrough of Halo 2 Anniversary. Watch the complete campaign run.',
    href: '/blog/posts/halo-2-anniversary-walkthrough',
    img: {
      src: 'https://img.youtube.com/vi/KmaZvyOKJ0k/maxresdefault.jpg',
      alt: 'Halo 2 Anniversary Full Campaign Walkthrough',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo 3 Full Campaign Walkthrough',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo FPS'],
    excerpt: 'A full walkthrough of Halo 3. Watch the complete campaign run.',
    href: '/blog/posts/halo-3-walkthrough',
    img: {
      src: 'https://img.youtube.com/vi/Mu7YMk5W8-8/maxresdefault.jpg',
      alt: 'Halo 3 Full Campaign Walkthrough',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo 3 ODST Full Campaign Walkthrough',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo FPS'],
    excerpt: 'A full walkthrough of Halo 3 ODST. Watch the complete campaign run.',
    href: '/blog/posts/halo-3-odst-walkthrough',
    img: {
      src: 'https://img.youtube.com/vi/PIirToORUM8/maxresdefault.jpg',
      alt: 'Halo 3 ODST Full Campaign Walkthrough',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo Reach Legendary Walkthrough',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo FPS'],
    readingTimeMinutes: 8,
    excerpt:
      'Legendary co-op playthrough of Halo Reach in MCC—mission-by-mission notes from Andy and Gus, plus overall campaign takeaways.',
    href: '/blog/posts/halo-reach-walkthrough',
    img: {
      src: 'https://img.youtube.com/vi/tKfsjD-ixGk/maxresdefault.jpg',
      alt: 'Halo Reach Legendary Walkthrough',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo 4 Full Campaign Walkthrough',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo FPS'],
    excerpt: 'A full walkthrough of Halo 4. Watch the complete campaign run.',
    href: '/blog/posts/halo-4-walkthrough',
    img: {
      src: 'https://img.youtube.com/vi/LmBFwjGlfmE/maxresdefault.jpg',
      alt: 'Halo 4 Full Campaign Walkthrough',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo Infinite Co-op Walkthrough',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo FPS'],
    readingTimeMinutes: 9,
    excerpt:
      'Andy and Gus tackle the full Halo Infinite campaign on Legendary in co-op — completing the Storehaus run through mainline Halo (except Halo 5), ~8.5 hours, linear missions plus Zeta Halo sandbox, and mixed verdicts on campaign vs. open world.',
    href: '/blog/posts/halo-infinite-walkthrough',
    img: {
      src: 'https://img.youtube.com/vi/pI_oIv-3MSg/maxresdefault.jpg',
      alt: 'Halo Infinite Co-op Walkthrough',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo Wars 2 Full Campaign Walkthrough',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo Wars 2'],
    excerpt: 'A full walkthrough of the Halo Wars 2 campaign. Watch the complete run.',
    href: '/blog/posts/halo-wars-2-campaign-walkthrough',
    img: {
      src: 'https://img.youtube.com/vi/Ain_YH5VD6M/maxresdefault.jpg',
      alt: 'Halo Wars 2 Full Campaign Walkthrough',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Gears of War: Ultimate Edition Full Campaign Walkthrough',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Gears of War'],
    excerpt: 'A full walkthrough of Gears of War: Ultimate Edition. Watch the complete campaign run.',
    href: '/blog/posts/gears-of-war-ultimate-edition-walkthrough',
    img: {
      src: 'https://img.youtube.com/vi/Od2xVtB0z3k/maxresdefault.jpg',
      alt: 'Gears of War: Ultimate Edition Full Campaign Walkthrough',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Goblin Commander: Unleash the Horde Full Campaign Walkthrough',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Goblin Commander'],
    excerpt: 'A full walkthrough of Goblin Commander: Unleash the Horde. Watch the complete campaign run.',
    href: '/blog/posts/goblin-commander-walkthrough',
    img: {
      src: 'https://img.youtube.com/vi/YNxJJ3U09VM/maxresdefault.jpg',
      alt: 'Goblin Commander: Unleash the Horde Full Campaign Walkthrough',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo Wars 2 - Operation Spearkbreaker Walkthrough',
    dateIso: '2026-02-08',
    category: 'Walkthroughs',
    tags: ['Halo Wars 2'],
    excerpt:
      'Complete walkthrough for Operation Spearbreaker DLC in Halo Wars 2. Covers strategies, unit usage, and mission objectives for both missions on Heroic difficulty.',
    href: '/blog/posts/hw2-operation-spearbreaker-walkthrough',
    img: {
      src: 'https://img.youtube.com/vi/WxWnwAIB2Ak/maxresdefault.jpg',
      alt: 'Halo Wars 2 - Operation Spearkbreaker Walkthrough',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo Wars Definitive Edition Full Campaign Walkthrough (Co-op Legendary)',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo Wars 1'],
    featured: true,
    excerpt:
      'A complete co-op Legendary walkthrough of the Halo Wars Definitive Edition campaign. Mission highlights, skull and black box locations, co-op tips, and unit priorities for every mission.',
    href: '/blog/posts/halo-wars-de-full-campaign-coop-legendary',
    img: {
      src: 'https://img.youtube.com/vi/BYBLYmBIS2A/maxresdefault.jpg',
      alt: 'Halo Wars Definitive Edition Full Campaign Walkthrough (Co-op Legendary)',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Terminus Firefight Review - Halo Wars 2',
    dateIso: '2026-02-02',
    category: 'Reviews',
    tags: ['Halo Wars 2'],
    excerpt:
      'A comprehensive review of Terminus Firefight mode in Halo Wars 2. Discover the strategic depth, leader synergies, and what makes this mode worth playing.',
    href: '/blog/posts/terminus-firefight-review-halo-wars-2',
    img: {
      src: 'https://img.youtube.com/vi/E0mbd03QuwY/maxresdefault.jpg',
      cloudinaryId: 'Terminus_FF_Review_2024_pyprp9',
      alt: 'Terminus Firefight Review - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo Wars 2 Review After 1,000 Hours',
    dateIso: '2026-02-02',
    category: 'Reviews',
    tags: ['Halo Wars 2'],
    excerpt:
      'A comprehensive review of Halo Wars 2 after playing for over 1,000 hours. Discover the pros, cons, and whether this RTS is worth your time in 2026.',
    href: '/blog/posts/halo-wars-2-review-after-1000-hours',
    img: {
      src: 'https://img.youtube.com/vi/74TM5X3jgTk/maxresdefault.jpg',
      cloudinaryId: 'Review_2023_u0rg8q',
      alt: 'Halo Wars 2 Review After 1,000 Hours',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Ranking Every Halo Wars 2 Leader - 2026 Edition',
    dateIso: '2026-02-02',
    category: 'Reviews',
    tags: ['Halo Wars 2'],
    excerpt:
      'Annual leader tier list for 2026. A subjective ranking of all Halo Wars 2 leaders from S-tier powerhouses like Atriox and Colony to the situational picks.',
    href: '/blog/posts/ranking-every-halo-wars-2-leader-2026-edition',
    img: {
      src: 'https://img.youtube.com/vi/tNC5_W3aPQY/maxresdefault.jpg',
      cloudinaryId: 'Rankings_2026_v2_ecxhg1',
      alt: 'Ranking Every Halo Wars 2 Leader - 2026 Edition',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Ranking Every Halo Wars 2 Map',
    dateIso: '2026-02-02',
    category: 'Reviews',
    tags: ['Halo Wars 2'],
    excerpt:
      'A comprehensive tier list ranking of all multiplayer maps in Halo Wars 2, from S-tier Sentry to F-tier Fort Jordan. Includes Blitz and Terminus Firefight maps.',
    href: '/blog/posts/ranking-every-halo-wars-2-map',
    img: {
      src: 'https://img.youtube.com/vi/sZS6g6Ui9Ak/maxresdefault.jpg',
      cloudinaryId: 'Project_v3.01_20_31_49.Still335_dqs7yl',
      alt: 'Ranking Every Halo Wars 2 Map',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Top 10 UNSC Leader Powers Ranked - Halo Wars 2',
    dateIso: '2026-02-02',
    category: 'Reviews',
    tags: ['Halo Wars 2'],
    excerpt:
      'A subjective ranking of the top 10 active UNSC leader powers in Halo Wars 2. From Johnson\'s Bunker to Ghost in the Machine, discover which powers dominate the battlefield.',
    href: '/blog/posts/top-10-unsc-leader-powers-ranked-halo-wars-2',
    img: {
      src: 'https://img.youtube.com/vi/GyySuLrif5Y/maxresdefault.jpg',
      cloudinaryId: 'UNSC_Leader_Powers_wbk6cl',
      alt: 'Top 10 UNSC Leader Powers Ranked - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Top 10 Banished Leader Powers Ranked - Halo Wars 2',
    dateIso: '2026-02-01',
    category: 'Reviews',
    tags: ['Halo Wars 2'],
    excerpt:
      'A subjective ranking of the top 10 active Banished leader powers in Halo Wars 2. From Grunt Dome to Cataclysm, discover which powers dominate the battlefield.',
    href: '/blog/posts/top-10-banished-leader-powers-ranked-halo-wars-2',
    img: {
      src: 'https://img.youtube.com/vi/BtfL8SOQ5Nw/maxresdefault.jpg',
      cloudinaryId: 'Banished_Leader_Powers_qe3zdl',
      alt: 'Top 10 Banished Leader Powers Ranked - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'All the Skulls in Halo Wars 2',
    dateIso: '2026-02-01',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    featured: false,
    excerpt:
      'Complete guide to all 15 skulls in Halo Wars 2 campaign. Learn how to unlock each skull, their effects, and detailed strategies for finding them in every mission.',
    href: '/blog/posts/all-the-skulls-in-halo-wars-2',
    img: {
      src: 'https://res.cloudinary.com/damu0vqmp/image/upload/v1769973137/HW2_Campaign_nxrb8a.webp',
      cloudinaryId: 'HW2_Campaign_nxrb8a',
      alt: 'All the Skulls in Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Terminus Firefight Halo Wars 2- The Most Effective Leaders',
    dateIso: '2026-02-01',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Discover the most effective leaders for Terminus Firefight mode in Halo Wars 2. Learn the best 3v3 combinations, top tier leaders like Johnson and Pavium, and key strategies for survival.',
    href: '/blog/posts/terminus-firefight-most-effective-leaders',
    img: {
      src: 'https://img.youtube.com/vi/qmpOIQkLGQA/maxresdefault.jpg',
      alt: 'Terminus Firefight Halo Wars 2- The Most Effective Leaders',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'How to Super Turtle - Halo Wars 2',
    dateIso: '2025-01-30',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    featured: false,
    excerpt:
      'Master the art of super turtling in Halo Wars 2. Learn the best maps, leaders like Pavium and Serina, build orders, and defensive strategies.',
    href: '/blog/posts/how-to-super-turtle',
    img: {
      src: '/img/HW-Guides/How-to-Super-Turtle.jpg',
      alt: 'How to Super Turtle - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Anders Beginner\'s Guide - Halo Wars 2',
    dateIso: '2025-01-30',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to master Professor Anders in Halo Wars 2. This beginner\'s guide covers her strengths with Sentinels and siege gameplay, build orders, and key strategies.',
    href: '/blog/posts/anders-beginners-guide',
    img: {
      src: '/img/HW-Guides/Anders Guide.jpg',
      alt: 'Anders Beginner\'s Guide - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: '10 Tips for Beginners - Halo Wars 2',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'New to Halo Wars 2? Learn the basics with these ten essential tips to get you started on the battlefield!',
    href: '/blog/posts/10-tips-for-beginners-halo-wars-2',
    img: {
      src: '/img/HW-Guides/Ten-Tips.jpg',
      alt: '10 Tips for Beginners - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'How to play as UNSC - Halo Wars 2',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as UNSC in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-unsc-halo-wars-2',
    img: {
      src: '/img/HW-Guides/The UNSC - Beginners Guide.png',
      alt: 'How to play as UNSC - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'How to play as The Banished - Halo Wars 2',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as The Banished in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-the-banished-halo-wars-2',
    img: {
      src: '/img/HW-Guides/The Banished - Beginners Guide.png',
      alt: 'How to play as The Banished - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'How to play as Captain Cutter - Halo Wars 2',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as Captain Cutter in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-captain-cutter-halo-wars-2',
    img: {
      src: '/img/HW-Guides/Captain Cutter - Beginners Guide.png',
      alt: 'How to play as Captain Cutter - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'How to play as Colony - Halo Wars 2',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as Colony in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-colony-halo-wars-2',
    img: {
      src: '/img/HW-Guides/The Colony - Beginners Guide.png',
      alt: 'How to play as Colony - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'How to play as Kinsano - Halo Wars 2',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as Kinsano in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-kinsano-halo-wars-2',
    img: {
      src: '/img/HW-Guides/Kinsano-2.jpg',
      alt: 'How to play as Kinsano - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'How to play as Yap Yap - Halo Wars 2',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as Yap Yap in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-yap-yap-halo-wars-2',
    img: {
      src: '/img/HW-Guides/Yap Yap-2.jpg',
      alt: 'How to play as Yap Yap - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'How to play as Pavium - Halo Wars 2',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as Pavium in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-pavium-halo-wars-2',
    img: {
      src: '/img/HW-Guides/Pavium.jpg',
      alt: 'How to play as Pavium - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'How to play as Atriox - Halo Wars 2',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as Atriox in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-atriox-halo-wars-2',
    img: {
      src: '/img/HW-Guides/Atriox.jpg',
      alt: 'How to play as Atriox - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'How to play as Sgt. Forge - Halo Wars 2',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as Sgt. Forge in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-sgt-forge-halo-wars-2',
    img: {
      src: '/img/HW-Guides/Forge.jpg',
      alt: 'How to play as Sgt. Forge - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'How to play as Voridus - Halo Wars 2',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as Voridus in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-voridus-halo-wars-2',
    img: {
      src: '/img/HW-Guides/Voridus.jpg',
      alt: 'How to play as Voridus - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'How to Stop Air Spam - Halo Wars 2',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to stop air spam in Halo Wars 2.',
    href: '/blog/posts/how-to-stop-air-spam-halo-wars-2',
    img: {
      src: '/img/HW-Guides/Stopping-Air-Spam.jpg',
      alt: 'How to Stop Air Spam - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'How to Break the Super Turtle - Halo Wars 2',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to break the super turtle in Halo Wars 2.',
    href: '/blog/posts/how-to-break-the-super-turtle-halo-wars-2',
    img: {
      src: '/img/HW-Guides/Break-The-Turtle.jpg',
      alt: 'How to Break the Super Turtle - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Advanced Movement and Splitting - Halo Wars 2',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'This is a Halo Wars 2 tutorial I put together on advanced movement: chaining orders, hold position, control groups, splitting when a beam (or similar power) hits, and squeezing information out of fog of war.',
    href: '/blog/posts/advanced-movement-and-splitting-halo-wars-2',
    img: {
      src: '/img/HW-Guides/Advanced-Movement.jpg',
      alt: 'Advanced Movement and Splitting - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Why is Arcadia City so DIFFICULT? - Halo Wars',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 1'],
    excerpt:
      'Learn how to beat the most difficult mission in Halo Wars.',
    href: '/blog/posts/why-is-arcadia-city-so-difficult-halo-wars',
    img: {
      src: '/img/HW-Guides/Why is Arcadia City so hard.jpg',
      alt: 'Why is Arcadia City so DIFFICULT? - Halo Wars',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Why is the Scarab mission so Frustrating in Halo Wars?',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 1'],
    readingTimeMinutes: 4,
    excerpt:
      'Scarab mission tips for Halo Wars (original): pylons, Scorpions and Wolverines, Forge and MAC, reading the beam, and closing on the core.',
    href: '/blog/posts/why-is-the-scarab-mission-so-frustrating-halo-wars',
    img: {
      src: 'https://img.youtube.com/vi/4K8NxWJg9II/maxresdefault.jpg',
      alt: 'Why is the Scarab mission so Frustrating in Halo Wars?',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Noob to Pro in 15 Minutes - Age of Empires II',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Empires II'],
    excerpt:
      'Villagers, aging up, when to add military, proxy and castle drops, starter counters, and trading — a beginner loop for Age of Empires II from Jimbo, Gus, and Andy.',
    href: '/blog/posts/noob-to-pro-in-15-minutes-age-of-empires-ii',
    img: {
      src: '/img/AOE2-Guides/Noob To Pro.jpg',
      alt: 'Noob to Pro in 15 Minutes - Age of Empires II',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Age of Empires 2 Definitive Edition on Xbox — Getting Started',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Empires II'],
    excerpt:
      'Walkthrough-style breakdown of getting moving in Age of Empires II: DE on Xbox: villagers, priority presets, early resources, aging up, and controller basics (radial menus, attack move, rally points).',
    href: '/blog/posts/xbox-beginners-guide-age-of-empires-ii',
    img: {
      src: '/img/AOE2-Guides/Guide for New players.jpg',
      alt: 'Age of Empires 2 Definitive Edition on Xbox — Getting Started',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Xbox Advanced Guide - Age of Empires II',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Empires II'],
    excerpt:
      'Follow-up to basic movement for AoE2 DE on Xbox: chaining villager orders, control groups and production buildings, the Find menu, forward proxy bases, flares, and fast minimap camera moves.',
    href: '/blog/posts/xbox-advanced-guide-age-of-empires-ii',
    img: {
      src: '/img/AOE2-Guides/Advanced Guide.jpg',
      alt: 'Xbox Advanced Guide - Age of Empires II',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'How to get Maximum Villager Efficiency - Age of Empires II',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Empires II'],
    excerpt:
      'Learn how to get maximum villager efficiency in Age of Empires II.',
    href: '/blog/posts/how-to-get-maximum-villager-efficiency-age-of-empires-ii',
    img: {
      src: 'https://img.youtube.com/vi/WLFOhTXAgb4/maxresdefault.jpg',
      alt: 'How to get Maximum Villager Efficiency - Age of Empires II',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Xbox Beginners Guide - Age of Empires IV',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Empires IV'],
    excerpt:
      'A comprehensive guide for new players to the world of Age of Empires IV, covering civilizations, resources, and combat. This guide is for the Xbox version of the game.',
    href: '/blog/posts/xbox-beginners-guide-age-of-empires-iv',
    img: {
      src: '/img/AOE4-Guides/Beginner Guide.jpg',
      alt: 'Xbox Beginners Guide - Age of Empires IV',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Xbox Controller Guide - Age of Empires IV',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Empires IV'],
    excerpt:
      'A guide for using an Xbox controller in Age of Empires IV. This guide is for the Xbox version of the game.',
    href: '/blog/posts/xbox-controller-guide-age-of-empires-iv',
    img: {
      src: '/img/AOE4-Guides/Controller Tutorial.jpg',
      alt: 'Xbox Controller Guide - Age of Empires IV',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Nomad Megarandom 101 - Age of Empires IV',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Empires IV'],
    excerpt:
      'Learn how to play the Nomad Megarandom game mode in Age of Empires IV.',
    href: '/blog/posts/nomad-megarandom-101-age-of-empires-iv',
    img: {
      src: '/img/AOE4-Guides/Nomad 1.jpg',
      alt: 'Nomad Megarandom 101 - Age of Empires IV',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: '10 Tips for every beginner - Age of Empires IV',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Empires IV'],
    excerpt:
      'Learn the basics of Age of Empires IV with these essential tips!',
    href: '/blog/posts/10-tips-for-every-beginner-age-of-empires-iv',
    img: {
      src: '/img/AOE4-Guides/Beginner Guide.jpg',
      alt: '10 Tips for every beginner - Age of Empires IV',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Atlanteans Guide - Age of Mythology',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Mythology'],
    excerpt:
      'A guide for the Atlantean civilization in Age of Mythology.',
    href: '/blog/posts/atlanteans-guide-age-of-mythology',
    img: {
      src: '/img/AOM-Guides/Atlantean Guide.jpg',
      alt: 'Atlanteans Guide - Age of Mythology',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Egyptians Guide - Age of Mythology',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Mythology'],
    excerpt:
      'This is a beginner-oriented walkthrough of the Egyptians in Age of Mythology: Retold: how their economy differs from other civs, how pharaoh and priest work, how favor from monuments shapes their game, and how their military scales from the barracks into stronghold cavalry and siege.',
    href: '/blog/posts/egyptians-guide-age-of-mythology',
    img: {
      src: '/img/AOM-Guides/Egypt Guide.jpg',
      alt: 'Egyptians Guide - Age of Mythology',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Greeks Guide - Age of Mythology (Xbox)',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Mythology'],
    excerpt:
      'Beginner walkthrough for Greeks in Age of Mythology Retold on Xbox/controller: economy, temple and aging, defense, myth units, trade, and Titans—controller shortcuts where they matter.',
    href: '/blog/posts/greeks-guide-age-of-mythology',
    img: {
      src: '/img/AOM-Guides/How to Play as Greeks.jpg',
      alt: 'Greeks Guide - Age of Mythology (Xbox)',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Noob to Pro in 15 Minutes - Age of Mythology',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Mythology'],
    featured: true,
    readingTimeMinutes: 3,
    excerpt:
      'A short, dense skill guide for Age of Mythology: Retold—economy, relics, military production, water, civ adaptation, trade, TCs, upgrades, scouting, and learning habits.',
    href: '/blog/posts/noob-to-pro-in-15-minutes-age-of-mythology',
    img: {
      src: '/img/AOM-Guides/Noob to Pro.jpg',
      alt: 'Noob to Pro in 15 Minutes - Age of Mythology',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Top Tips for Beginners on Xbox - Age of Mythology',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Mythology'],
    excerpt:
      'Learn the basics of Age of Mythology on Xbox with these essential tips!',
    href: '/blog/posts/top-tips-for-beginners-on-xbox-age-of-mythology',
    img: {
      src: '/img/AOM-Guides/New Player Guide.jpg',
      alt: 'Top Tips for Beginners on Xbox - Age of Mythology',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Top Tips for Defensive Play - Age of Mythology',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Mythology'],
    excerpt:
      'Understand the basics of defensive play in Age of Mythology.',
    href: '/blog/posts/top-tips-for-defensive-play-age-of-mythology',
    img: {
      src: '/img/AOM-Guides/Defense v2.jpg',
      alt: 'Top Tips for Defensive Play - Age of Mythology',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Top Tips for Beginners on PS5 - Age of Mythology',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Mythology'],
    excerpt:
      'New to Age of Mythology on PS5? Learn the basics of using the controller and the fundamentals of the game.',
    href: '/blog/posts/top-tips-for-beginners-on-ps5-age-of-mythology',
    img: {
      src: 'https://img.youtube.com/vi/iqhLNODKNyY/maxresdefault.jpg',
      alt: 'Top Tips for Beginners on PS5 - Age of Mythology',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Age of Mythology: Retold — Relic Guide',
    dateIso: '2026-05-05',
    category: 'Guides',
    tags: ['Age of Mythology'],
    excerpt:
      'This is my beginner-friendly walkthrough of relics in Age of Mythology: Retold: how they differ from other Age games, what you need to use them, how I scout and prioritize them, and where the UI still makes things harder on console.',
    href: '/blog/posts/best-practices-for-relics-age-of-mythology',
    img: {
      src: 'https://img.youtube.com/vi/9kAAAt-A-_E/maxresdefault.jpg',
      alt: 'Age of Mythology: Retold — Relic Guide',
      width: 400,
      height: 225,
      lazy: true
    }
  },
];

export default blogPosts;
