const blogPosts = [
  {
    title: 'Ashes of the Singularity 2 — Demo First Impressions',
    date: 'Published on February 23, 2026',
    dateIso: '2026-02-23',
    category: 'Reviews',
    tags: ['Ashes of the Singularity 2'],
    excerpt: 'First impressions of the Ashes of the Singularity 2 demo — a large-scale RTS that blends Command & Conquer, Company of Heroes, and Halo Wars.',
    href: '/blog/posts/ashes-of-the-singularity-2-demo-impressions',
    accentClass: 'text-red-400',
    buttonClass: 'bg-red-500 hover:bg-red-600',
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
    date: 'Published on February 7, 2026',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo'],
    excerpt: 'A full walkthrough of Halo Combat Evolved Anniversary. Watch the complete campaign run.',
    href: '/blog/posts/halo-ce-anniversary-walkthrough',
    accentClass: 'text-orange-400',
    buttonClass: 'bg-orange-500 hover:bg-orange-600',
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
    date: 'Published on February 7, 2026',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo'],
    excerpt: 'A full walkthrough of Halo 2 Anniversary. Watch the complete campaign run.',
    href: '/blog/posts/halo-2-anniversary-walkthrough',
    accentClass: 'text-purple-400',
    buttonClass: 'bg-purple-500 hover:bg-purple-600',
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
    date: 'Published on February 7, 2026',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo'],
    excerpt: 'A full walkthrough of Halo 3. Watch the complete campaign run.',
    href: '/blog/posts/halo-3-walkthrough',
    accentClass: 'text-blue-400',
    buttonClass: 'bg-blue-500 hover:bg-blue-600',
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
    date: 'Published on February 7, 2026',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo'],
    excerpt: 'A full walkthrough of Halo 3 ODST. Watch the complete campaign run.',
    href: '/blog/posts/halo-3-odst-walkthrough',
    accentClass: 'text-pink-400',
    buttonClass: 'bg-pink-500 hover:bg-pink-600',
    img: {
      src: 'https://img.youtube.com/vi/PIirToORUM8/maxresdefault.jpg',
      alt: 'Halo 3 ODST Full Campaign Walkthrough',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo Reach Full Campaign Walkthrough',
    date: 'Published on February 7, 2026',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo'],
    excerpt: 'A full walkthrough of Halo Reach. Watch the complete campaign run.',
    href: '/blog/posts/halo-reach-walkthrough',
    accentClass: 'text-lime-400',
    buttonClass: 'bg-lime-500 hover:bg-lime-600',
    img: {
      src: 'https://img.youtube.com/vi/tKfsjD-ixGk/maxresdefault.jpg',
      alt: 'Halo Reach Full Campaign Walkthrough',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo 4 Full Campaign Walkthrough',
    date: 'Published on February 7, 2026',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo'],
    excerpt: 'A full walkthrough of Halo 4. Watch the complete campaign run.',
    href: '/blog/posts/halo-4-walkthrough',
    accentClass: 'text-teal-400',
    buttonClass: 'bg-teal-500 hover:bg-teal-600',
    img: {
      src: 'https://img.youtube.com/vi/LmBFwjGlfmE/maxresdefault.jpg',
      alt: 'Halo 4 Full Campaign Walkthrough',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo Infinite Full Campaign Walkthrough',
    date: 'Published on February 7, 2026',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo'],
    excerpt: 'A full walkthrough of Halo Infinite. Watch the complete campaign run.',
    href: '/blog/posts/halo-infinite-walkthrough',
    accentClass: 'text-red-400',
    buttonClass: 'bg-red-500 hover:bg-red-600',
    img: {
      src: 'https://img.youtube.com/vi/pI_oIv-3MSg/maxresdefault.jpg',
      alt: 'Halo Infinite Full Campaign Walkthrough',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo Wars 2 Full Campaign Walkthrough',
    date: 'Published on February 7, 2026',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo Wars 2'],
    excerpt: 'A full walkthrough of the Halo Wars 2 campaign. Watch the complete run.',
    href: '/blog/posts/halo-wars-2-campaign-walkthrough',
    accentClass: 'text-yellow-400',
    buttonClass: 'bg-yellow-500 hover:bg-yellow-600',
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
    date: 'Published on February 7, 2026',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Gears of War'],
    excerpt: 'A full walkthrough of Gears of War: Ultimate Edition. Watch the complete campaign run.',
    href: '/blog/posts/gears-of-war-ultimate-edition-walkthrough',
    accentClass: 'text-indigo-400',
    buttonClass: 'bg-indigo-500 hover:bg-indigo-600',
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
    date: 'Published on February 7, 2026',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Goblin Commander'],
    excerpt: 'A full walkthrough of Goblin Commander: Unleash the Horde. Watch the complete campaign run.',
    href: '/blog/posts/goblin-commander-walkthrough',
    accentClass: 'text-emerald-400',
    buttonClass: 'bg-emerald-500 hover:bg-emerald-600',
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
    date: 'Published on February 8, 2026',
    dateIso: '2026-02-08',
    category: 'Walkthroughs',
    tags: ['Halo Wars 2'],
    excerpt:
      'Complete walkthrough for Operation Spearbreaker DLC in Halo Wars 2. Covers strategies, unit usage, and mission objectives for both missions on Heroic difficulty.',
    href: '/blog/posts/hw2-operation-spearbreaker-walkthrough',
    accentClass: 'text-amber-400',
    buttonClass: 'bg-amber-500 hover:bg-amber-600',
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
    date: 'Published on February 7, 2026',
    dateIso: '2026-02-07',
    category: 'Walkthroughs',
    tags: ['Halo Wars 1'],
    featured: true,
    excerpt:
      'A complete co-op Legendary walkthrough of the Halo Wars Definitive Edition campaign. Mission highlights, skull and black box locations, co-op tips, and unit priorities for every mission.',
    href: '/blog/posts/halo-wars-de-full-campaign-coop-legendary',
    accentClass: 'text-orange-400',
    buttonClass: 'bg-orange-500 hover:bg-orange-600',
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
    date: 'Published on February 2, 2026',
    dateIso: '2026-02-02',
    category: 'Reviews',
    tags: ['Halo Wars 2'],
    excerpt:
      'A comprehensive review of Terminus Firefight mode in Halo Wars 2. Discover the strategic depth, leader synergies, and what makes this mode worth playing.',
    href: '/blog/posts/terminus-firefight-review-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
    img: {
      src: '/content/blog/reviews-placeholder.svg',
      cloudinaryId: 'Terminus_FF_Review_2024_pyprp9',
      alt: 'Terminus Firefight Review - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Halo Wars 2 Review After 1,000 Hours',
    date: 'Published on February 2, 2026',
    dateIso: '2026-02-02',
    category: 'Reviews',
    tags: ['Halo Wars 2'],
    excerpt:
      'A comprehensive review of Halo Wars 2 after playing for over 1,000 hours. Discover the pros, cons, and whether this RTS is worth your time in 2026.',
    href: '/blog/posts/halo-wars-2-review-after-1000-hours',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
    img: {
      src: '/content/blog/reviews-placeholder.svg',
      cloudinaryId: 'Review_2023_u0rg8q',
      alt: 'Halo Wars 2 Review After 1,000 Hours',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Ranking Every Halo Wars 2 Leader - 2026 Edition',
    date: 'Published on February 2, 2026',
    dateIso: '2026-02-02',
    category: 'Reviews',
    tags: ['Halo Wars 2'],
    excerpt:
      'Annual leader tier list for 2026. A subjective ranking of all Halo Wars 2 leaders from S-tier powerhouses like Atriox and Colony to the situational picks.',
    href: '/blog/posts/ranking-every-halo-wars-2-leader-2026-edition',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
    img: {
      src: '/content/blog/reviews-placeholder.svg',
      cloudinaryId: 'Rankings_2026_v2_ecxhg1',
      alt: 'Ranking Every Halo Wars 2 Leader - 2026 Edition',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Ranking Every Halo Wars 2 Map',
    date: 'Published on February 2, 2026',
    dateIso: '2026-02-02',
    category: 'Reviews',
    tags: ['Halo Wars 2'],
    excerpt:
      'A comprehensive tier list ranking of all multiplayer maps in Halo Wars 2, from S-tier Sentry to F-tier Fort Jordan. Includes Blitz and Terminus Firefight maps.',
    href: '/blog/posts/ranking-every-halo-wars-2-map',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
    img: {
      src: '/content/blog/reviews-placeholder.svg',
      cloudinaryId: 'Project_v3.01_20_31_49.Still335_dqs7yl',
      alt: 'Ranking Every Halo Wars 2 Map',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Top 10 UNSC Leader Powers Ranked - Halo Wars 2',
    date: 'Published on February 2, 2026',
    dateIso: '2026-02-02',
    category: 'Reviews',
    tags: ['Halo Wars 2'],
    excerpt:
      'A subjective ranking of the top 10 active UNSC leader powers in Halo Wars 2. From Johnson\'s Bunker to Ghost in the Machine, discover which powers dominate the battlefield.',
    href: '/blog/posts/top-10-unsc-leader-powers-ranked-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
    img: {
      src: '/content/blog/reviews-placeholder.svg',
      cloudinaryId: 'UNSC_Leader_Powers_wbk6cl',
      alt: 'Top 10 UNSC Leader Powers Ranked - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Top 10 Banished Leader Powers Ranked - Halo Wars 2',
    date: 'Published on February 1, 2026',
    dateIso: '2026-02-01',
    category: 'Reviews',
    tags: ['Halo Wars 2'],
    excerpt:
      'A subjective ranking of the top 10 active Banished leader powers in Halo Wars 2. From Grunt Dome to Cataclysm, discover which powers dominate the battlefield.',
    href: '/blog/posts/top-10-banished-leader-powers-ranked-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
    img: {
      src: '/content/blog/reviews-placeholder.svg',
      cloudinaryId: 'Banished_Leader_Powers_qe3zdl',
      alt: 'Top 10 Banished Leader Powers Ranked - Halo Wars 2',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'All the Skulls in Halo Wars 2',
    date: 'Published on February 1, 2026',
    dateIso: '2026-02-01',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    featured: false,
    excerpt:
      'Complete guide to all 15 skulls in Halo Wars 2 campaign. Learn how to unlock each skull, their effects, and detailed strategies for finding them in every mission.',
    href: '/blog/posts/all-the-skulls-in-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on February 1, 2026',
    dateIso: '2026-02-01',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Discover the most effective leaders for Terminus Firefight mode in Halo Wars 2. Learn the best 3v3 combinations, top tier leaders like Johnson and Pavium, and key strategies for survival.',
    href: '/blog/posts/terminus-firefight-most-effective-leaders',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 30, 2025',
    dateIso: '2025-01-30',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    featured: true,
    excerpt:
      'Master the art of super turtling in Halo Wars 2. Learn the best maps, leaders like Pavium and Serina, build orders, and defensive strategies.',
    href: '/blog/posts/how-to-super-turtle',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 30, 2025',
    dateIso: '2025-01-30',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to master Professor Anders in Halo Wars 2. This beginner\'s guide covers her strengths with Sentinels and siege gameplay, build orders, and key strategies.',
    href: '/blog/posts/anders-beginners-guide',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'New to Halo Wars 2? Learn the basics with these ten essential tips to get you started on the battlefield!',
    href: '/blog/posts/10-tips-for-beginners-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as UNSC in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-unsc-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as The Banished in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-the-banished-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as Captain Cutter in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-captain-cutter-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as Colony in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-colony-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as Kinsano in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-kinsano-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as Yap Yap in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-yap-yap-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as Pavium in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-pavium-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as Atriox in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-atriox-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as Sgt. Forge in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-sgt-forge-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to play as Voridus in Halo Wars 2.',
    href: '/blog/posts/how-to-play-as-voridus-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to stop air spam in Halo Wars 2.',
    href: '/blog/posts/how-to-stop-air-spam-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to break the super turtle in Halo Wars 2.',
    href: '/blog/posts/how-to-break-the-super-turtle-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 2'],
    excerpt:
      'Learn how to advanced movement and splitting in Halo Wars 2.',
    href: '/blog/posts/advanced-movement-and-splitting-halo-wars-2',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 1'],
    excerpt:
      'Learn how to beat the most difficult mission in Halo Wars.',
    href: '/blog/posts/why-is-arcadia-city-so-difficult-halo-wars',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
    img: {
      src: '/img/HW-Guides/Why is Arcadia City so hard.jpg',
      alt: 'Why is Arcadia City so DIFFICULT? - Halo Wars',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Why is the Scarab mission so FRUSTRATING? - Halo Wars',
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Halo Wars 1'],
    excerpt:
      'Learn how to beat the most frustrating mission in Halo Wars.',
    href: '/blog/posts/why-is-the-scarab-mission-so-frustrating-halo-wars',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
    img: {
      src: '/img/HW-Guides/Why is the Scarab so frustrating.jpg',
      alt: 'Why is the Scarab mission so FRUSTRATING? - Halo Wars',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Noob to Pro in 15 Minutes - Age of Empires II',
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Empires II'],
    featured: true,
    excerpt:
      'A guide for new players to Age of Empires II.',
    href: '/blog/posts/noob-to-pro-in-15-minutes-age-of-empires-ii',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
    img: {
      src: '/img/AOE2-Guides/Noob To Pro.jpg',
      alt: 'Noob to Pro in 15 Minutes - Age of Empires II',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Xbox Beginners Guide - Age of Empires II',
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Empires II'],
    excerpt:
      'A comprehensive guide for new players to the world of Age of Empires II, covering civilizations, resources, and combat. This guide is for the Xbox version of the game.',
    href: '/blog/posts/xbox-beginners-guide-age-of-empires-ii',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
    img: {
      src: '/img/AOE2-Guides/Guide for New players.jpg',
      alt: 'Xbox Beginners Guide - Age of Empires II',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Xbox Advanced Guide - Age of Empires II',
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Empires II'],
    excerpt:
      'An advanced guide for Xbox players in Age of Empires II.',
    href: '/blog/posts/xbox-advanced-guide-age-of-empires-ii',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Empires II'],
    excerpt:
      'Learn how to get maximum villager efficiency in Age of Empires II.',
    href: '/blog/posts/how-to-get-maximum-villager-efficiency-age-of-empires-ii',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
    img: {
      src: '/img/AOE2-Guides/Advanced Guide.jpg',
      alt: 'How to get Maximum Villager Efficiency - Age of Empires II',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Xbox Beginners Guide - Age of Empires IV',
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Empires IV'],
    excerpt:
      'A comprehensive guide for new players to the world of Age of Empires IV, covering civilizations, resources, and combat. This guide is for the Xbox version of the game.',
    href: '/blog/posts/xbox-beginners-guide-age-of-empires-iv',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Empires IV'],
    excerpt:
      'A guide for using an Xbox controller in Age of Empires IV. This guide is for the Xbox version of the game.',
    href: '/blog/posts/xbox-controller-guide-age-of-empires-iv',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Empires IV'],
    excerpt:
      'Learn how to play the Nomad Megarandom game mode in Age of Empires IV.',
    href: '/blog/posts/nomad-megarandom-101-age-of-empires-iv',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Empires IV'],
    excerpt:
      'Learn the basics of Age of Empires IV with these essential tips!',
    href: '/blog/posts/10-tips-for-every-beginner-age-of-empires-iv',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Mythology'],
    excerpt:
      'A guide for the Atlantean civilization in Age of Mythology.',
    href: '/blog/posts/atlanteans-guide-age-of-mythology',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Mythology'],
    excerpt:
      'A guide for the Egyptian civilization in Age of Mythology.',
    href: '/blog/posts/egyptians-guide-age-of-mythology',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
    img: {
      src: '/img/AOM-Guides/Egypt Guide.jpg',
      alt: 'Egyptians Guide - Age of Mythology',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Greeks Guide - Age of Mythology',
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Mythology'],
    excerpt:
      'A guide for the Greek civilization in Age of Mythology.',
    href: '/blog/posts/greeks-guide-age-of-mythology',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
    img: {
      src: '/img/AOM-Guides/How to Play as Greeks.jpg',
      alt: 'Greeks Guide - Age of Mythology',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Noob to Pro in 15 Minutes - Age of Mythology',
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Mythology'],
    featured: true,
    excerpt:
      'Be a noob no more! Learn the most important tips and tricks of Age of Mythology in 15 minutes.',
    href: '/blog/posts/noob-to-pro-in-15-minutes-age-of-mythology',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Mythology'],
    excerpt:
      'Learn the basics of Age of Mythology on Xbox with these essential tips!',
    href: '/blog/posts/top-tips-for-beginners-on-xbox-age-of-mythology',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Mythology'],
    excerpt:
      'Understand the basics of defensive play in Age of Mythology.',
    href: '/blog/posts/top-tips-for-defensive-play-age-of-mythology',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
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
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Mythology'],
    excerpt:
      'New to Age of Mythology on PS5? Learn the basics of using the controller and the fundamentals of the game.',
    href: '/blog/posts/top-tips-for-beginners-on-ps5-age-of-mythology',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
    img: {
      src: '/img/AOM-Guides/Defense v2.jpg',
      alt: 'Top Tips for Beginners on PS5 - Age of Mythology',
      width: 400,
      height: 225,
      lazy: true
    }
  },
  {
    title: 'Best Practices for Relics - Age of Mythology',
    date: 'Published on January 31, 2026',
    dateIso: '2026-01-31',
    category: 'Guides',
    tags: ['Age of Mythology'],
    excerpt:
      'Relics are a powerful resource in Age of Mythology. This guide will show you how to use them to your advantage.',
    href: '/blog/posts/best-practices-for-relics-age-of-mythology',
    accentClass: 'text-cyan-400',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600',
    img: {
      src: '/img/AOM-Guides/New Player Guide.jpg',
      alt: 'Best Practices for Relics - Age of Mythology',
      width: 400,
      height: 225,
      lazy: true
    }
  },
];

export default blogPosts;

