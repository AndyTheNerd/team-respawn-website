export type ActiveMatch = 'never' | 'exact' | 'prefix' | 'videos' | 'hw2Stats';

export interface NavLink {
  href: string;
  label: string;
  icon?: string;
  activeMatch?: ActiveMatch;
  external?: boolean;
  headerLabel?: string;
  panelLabel?: string;
}

export interface NavSection {
  title: string;
  description?: string;
  headerTitle?: string;
  panelTitle?: string;
  chips?: Array<{
    label: string;
    variant?: 'default' | 'banished';
  }>;
  links: NavLink[];
}

export function normalizePathname(pathname: string): string {
  const normalized = pathname.replace(/\/$/, '');
  return normalized || '/';
}

export function isNavLinkActive(
  link: NavLink,
  pathname: string,
  flags: { isVideos?: boolean; isHw2Stats?: boolean } = {}
): boolean {
  const match = link.activeMatch ?? (link.external ? 'never' : 'exact');
  const normalizedPath = normalizePathname(pathname);
  const linkPath = normalizePathname(link.href.split('?')[0]);

  switch (match) {
    case 'exact':
      return normalizedPath === linkPath;
    case 'prefix':
      return normalizedPath === linkPath || normalizedPath.startsWith(`${linkPath}/`);
    case 'videos':
      return Boolean(flags.isVideos);
    case 'hw2Stats':
      return Boolean(flags.isHw2Stats);
    case 'never':
    default:
      return false;
  }
}

export const STOREHAUS_INVITE_URL =
  'https://discord.com/oauth2/authorize?client_id=1446587655541227552&permissions=117760&integration_type=0&scope=bot';

export const headerPrimaryLinks: NavLink[] = [
  { href: '/blog', label: 'Blog', activeMatch: 'prefix' },
  { href: '/videos', label: 'Videos', activeMatch: 'videos' },
  { href: '/halo-wars-stats', label: 'HW2 Stats', activeMatch: 'hw2Stats' },
  { href: '/halo-wars-de-player-count', label: 'HW1 Data', activeMatch: 'exact' },
];

export const sidePanelPrimaryLinks: NavLink[] = [
  { href: '/blog', label: 'Blog', icon: 'fas fa-blog', activeMatch: 'prefix' },
  { href: '/halo-wars-stats', label: 'HW2 Stats', icon: 'fas fa-chart-bar', activeMatch: 'hw2Stats' },
  { href: '/halo-wars-de-player-count', label: 'HW1 Data', icon: 'fas fa-table', activeMatch: 'exact' },
  { href: '/videos', label: 'Video Database', icon: 'fas fa-database', activeMatch: 'videos' },
  { href: '/blog?category=Guides', label: 'All Guides', icon: 'fas fa-gamepad', activeMatch: 'never' },
];

export const aboutLinks: NavLink[] = [
  { href: '/about', label: 'About Us', icon: 'fas fa-users', activeMatch: 'prefix' },
  { href: '/support', label: 'Support Us', icon: 'fas fa-heart', activeMatch: 'prefix' },
  { href: '/partner', label: 'Partner with Us', icon: 'fas fa-handshake', activeMatch: 'prefix' },
];

export const otherProjectSections: NavSection[] = [
  {
    title: 'Storehaus Bot',
    description: 'Discord bot for HW2, AoE II, and AoE IV - stats, player search, and AI strategy.',
    links: [
      { href: '/storehaus', label: 'Summary', icon: 'fas fa-info-circle', activeMatch: 'exact' },
      { href: '/storehaus/privacy-policy', label: 'Privacy Policy', icon: 'fas fa-shield-alt', activeMatch: 'exact' },
      { href: '/storehaus/terms-of-service', label: 'Terms of Service', icon: 'fas fa-file-contract', activeMatch: 'exact' },
      { href: STOREHAUS_INVITE_URL, label: 'Add to Server', icon: 'fab fa-discord', external: true, activeMatch: 'never' },
    ],
  },
  {
    title: 'Halo Quotes',
    description: 'Website, API, and bots for random quotes from the Halo series.',
    links: [
      { href: 'https://haloquotes.teamrespawntv.com/', label: 'Website', icon: 'fas fa-quote-left', external: true, activeMatch: 'never' },
      { href: 'https://api.haloquotes.teamrespawntv.com/', label: 'API', icon: 'fas fa-code', external: true, activeMatch: 'never' },
      { href: 'https://github.com/AndyTheNerd/Halo-Quotes', label: 'GitHub', icon: 'fab fa-github', external: true, activeMatch: 'never' },
    ],
  },
  {
    title: 'AOE2 API',
    description: 'Self-hosted REST API serving AoE II civs, units, techs, and structures.',
    links: [
      { href: 'https://aoe2api.teamrespawntv.com/', label: 'API', icon: 'fas fa-code', external: true, activeMatch: 'never' },
      { href: 'https://github.com/AndyTheNerd/age-of-empires-II-api', label: 'GitHub', icon: 'fab fa-github', external: true, activeMatch: 'never' },
    ],
  },
];

export const hw2GuideSections: NavSection[] = [
  {
    title: 'Start Here',
    description: 'For brand new players who want a clean on-ramp.',
    links: [
      {
        href: '/blog/posts/10-tips-for-beginners-halo-wars-2',
        label: '10 Tips for Beginners',
        icon: 'fas fa-graduation-cap',
        activeMatch: 'exact',
      },
      {
        href: '/blog/posts/anders-beginners-guide',
        label: 'Starter Leader: Anders',
        headerLabel: 'Best Starter Leader: Anders',
        icon: 'fas fa-lightbulb',
        activeMatch: 'exact',
      },
      {
        href: '/videos?games=halo-wars-2&series=guide',
        label: 'HW2 Guide Videos',
        headerLabel: 'Watch Beginner-Friendly Guides',
        icon: 'fas fa-play-circle',
        activeMatch: 'videos',
      },
    ],
  },
  {
    title: 'Improve Fast',
    description: 'For returning players and ranked grinders looking for fast wins.',
    links: [
      {
        href: '/blog/posts/how-to-stop-air-spam-halo-wars-2',
        label: 'Stop Air Spam',
        headerLabel: 'How to Stop Air Spam',
        icon: 'fas fa-fighter-jet',
        activeMatch: 'exact',
      },
      {
        href: '/blog/posts/how-to-break-the-super-turtle-halo-wars-2',
        label: 'Break Super Turtle',
        headerLabel: 'Break the Super Turtle',
        icon: 'fas fa-shield-halved',
        activeMatch: 'exact',
      },
      {
        href: '/blog/posts/advanced-movement-and-splitting-halo-wars-2',
        label: 'Advanced Movement',
        headerLabel: 'Advanced Movement and Splitting',
        icon: 'fas fa-arrows-left-right-to-line',
        activeMatch: 'exact',
      },
      {
        href: '/blog/posts/ranking-every-halo-wars-2-leader-2026-edition',
        label: '2026 Leader Tier List',
        icon: 'fas fa-trophy',
        activeMatch: 'exact',
      },
    ],
  },
  {
    title: 'Find a Leader',
    panelTitle: 'Leader Guides',
    description: 'Jump into a leader guide by role, faction, or favorite playstyle.',
    chips: [
      { label: 'UNSC' },
      { label: 'Banished', variant: 'banished' },
    ],
    links: [
      {
        href: '/blog/posts/how-to-play-as-captain-cutter-halo-wars-2',
        label: 'Captain Cutter',
        icon: 'fas fa-helmet-safety',
        activeMatch: 'exact',
      },
      {
        href: '/blog/posts/how-to-play-as-kinsano-halo-wars-2',
        label: 'Kinsano',
        icon: 'fas fa-fire',
        activeMatch: 'exact',
      },
      {
        href: '/blog/posts/how-to-play-as-atriox-halo-wars-2',
        label: 'Atriox',
        icon: 'fas fa-hammer',
        activeMatch: 'exact',
      },
      {
        href: '/blog/posts/how-to-play-as-pavium-halo-wars-2',
        label: 'Pavium',
        icon: 'fas fa-tower-observation',
        activeMatch: 'exact',
      },
    ],
  },
];
