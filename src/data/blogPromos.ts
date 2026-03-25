export interface BlogPromoFeature {
  icon: string;
  title: string;
  description: string;
}

export interface BlogPromo {
  title: string;
  description: string;
  sectionClass: string;
  accentClass: string;
  titleClass: string;
  learnMoreClass: string;
  featureCardClass: string;
  featureTitleClass: string;
  features: BlogPromoFeature[];
}

const blogPromos = {
  haloWars2: {
    title: 'Master Halo Wars 2 with AI',
    description: 'Level up your Halo Wars 2 gameplay with our AI-powered strategy advisor Storehaus! Get instant answers to your tactical questions, leader guides, and advanced strategies.',
    sectionClass: 'from-cyan-900/30 to-blue-900/30 border-cyan-500/30',
    accentClass: 'text-cyan-400',
    titleClass: 'from-cyan-400 to-blue-400',
    learnMoreClass: 'bg-cyan-600 hover:bg-cyan-700',
    featureCardClass: 'hover:border-cyan-500/40',
    featureTitleClass: 'text-cyan-200',
    features: [
      {
        icon: 'fas fa-robot',
        title: 'AI Strategy Advisor',
        description: 'RAG-powered tactical tips and build orders',
      },
      {
        icon: 'fas fa-chess',
        title: 'Leader Guides',
        description: 'Detailed strategies for all UNSC & Banished leaders',
      },
      {
        icon: 'fas fa-lightbulb',
        title: 'Tactical Questions',
        description: 'Instant answers to your gameplay questions',
      },
    ],
  },
  ageOfEmpiresIi: {
    title: 'Master Age of Empires II',
    description: 'Access the complete Age of Empires II database with Storehaus! Get instant unit stats, technology trees, civilization bonuses, and building costs right in your Discord server.',
    sectionClass: 'from-green-900/30 to-emerald-900/30 border-green-500/30',
    accentClass: 'text-green-400',
    titleClass: 'from-green-400 to-emerald-400',
    learnMoreClass: 'bg-green-600 hover:bg-green-700',
    featureCardClass: 'hover:border-green-500/40',
    featureTitleClass: 'text-green-200',
    features: [
      {
        icon: 'fas fa-database',
        title: 'Complete Database',
        description: 'Units, technologies, structures, and civilizations',
      },
      {
        icon: 'fas fa-calculator',
        title: 'Unit Stats',
        description: 'Costs, attack, armor, and combat calculations',
      },
      {
        icon: 'fas fa-globe',
        title: 'Civ Bonuses',
        description: 'Unique units and civilization advantages',
      },
    ],
  },
  ageOfEmpiresIv: {
    title: 'Master Age of Empires IV',
    description: 'Track your Age of Empires IV performance with Storehaus! Get real-time player statistics, civilization win rates, match history, and detailed game analysis from aoe4world.com data.',
    sectionClass: 'from-blue-900/30 to-indigo-900/30 border-blue-500/30',
    accentClass: 'text-blue-400',
    titleClass: 'from-blue-400 to-indigo-400',
    learnMoreClass: 'bg-blue-600 hover:bg-blue-700',
    featureCardClass: 'hover:border-blue-500/40',
    featureTitleClass: 'text-blue-200',
    features: [
      {
        icon: 'fas fa-chart-line',
        title: 'Player Statistics',
        description: 'ELO rating, win rates, and match history',
      },
      {
        icon: 'fas fa-globe-americas',
        title: 'Civilization Data',
        description: 'Civ stats and balance analysis for all modes',
      },
      {
        icon: 'fas fa-search',
        title: 'Player Search',
        description: 'Find and compare players across all ranks',
      },
    ],
  },
  walkthrough: {
    title: 'Featured: Storehaus RTS Bot',
    description: 'The ultimate Discord bot for RTS gamers! Get real-time AoE4 statistics, comprehensive AoE2 database lookups, and AI-powered Halo Wars 2 strategy advice.',
    sectionClass: 'from-purple-900/30 to-pink-900/30 border-purple-500/30',
    accentClass: 'text-purple-400',
    titleClass: 'from-purple-400 to-pink-400',
    learnMoreClass: 'bg-green-600 hover:bg-green-700',
    featureCardClass: 'hover:border-purple-500/40',
    featureTitleClass: 'text-purple-200',
    features: [
      {
        icon: 'fas fa-chart-line',
        title: 'AoE4 Statistics',
        description: 'Player stats, civ data, game history from aoe4world.com',
      },
      {
        icon: 'fas fa-database',
        title: 'AoE2 Database',
        description: 'Units, technologies, structures, and civilizations',
      },
      {
        icon: 'fas fa-robot',
        title: 'HW2 AI Advisor',
        description: 'AI-powered strategy tips with RAG technology',
      },
    ],
  },
} satisfies Record<string, BlogPromo>;

export function getBlogPromo(category: string, tags: string[] = []): BlogPromo | null {
  if (tags.includes('Halo Wars 2')) {
    return blogPromos.haloWars2;
  }

  if (tags.includes('Age of Empires II')) {
    return blogPromos.ageOfEmpiresIi;
  }

  if (tags.includes('Age of Empires IV')) {
    return blogPromos.ageOfEmpiresIv;
  }

  if (category === 'Walkthroughs') {
    return blogPromos.walkthrough;
  }

  return null;
}
