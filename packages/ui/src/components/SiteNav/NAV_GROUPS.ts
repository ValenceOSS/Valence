import {
  BookOpen as BookOpenIcon,
  ChartBar as ChartBarIcon,
  Container as ContainerIcon,
  Download as DownloadIcon,
  FileText as FileTextIcon,
  Gavel as GavelIcon,
  GitFork as GitForkIcon,
  ListCheck as ListCheckIcon,
  MessagesSquare as MessagesSquareIcon,
  Newspaper as NewspaperIcon,
  Palette as PaletteIcon,
  Puzzle as PuzzleIcon,
  ShieldCheck as ShieldCheckIcon,
  SquareTerminal as SquareTerminalIcon,
  SwatchBook as SwatchBookIcon,
} from '@keyline-icons/react/fill';
import { DISCORD_URL } from '@ValenceCore/project/DISCORD_URL';
import { VALENCE_REPOSITORY_URL } from '@ValenceCore/project/VALENCE_REPOSITORY_URL';
import type { NavGroup } from '@ValenceUI/SiteNav.types';

const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: 'product',
    label: 'ui.siteNav.product',
    eyebrow: 'ui.siteNav.whatValenceDoes',
    blurb: 'ui.siteNav.productBlurb',
    items: [
      {
        site: 'landing',
        path: '/features',
        label: 'ui.siteNav.features',
        detail: 'ui.siteNav.featuresDetail',
        icon: ListCheckIcon,
      },
      {
        site: 'landing',
        path: '/plugins',
        label: 'common.plugins',
        detail: 'ui.siteNav.pluginsDetail',
        icon: PuzzleIcon,
      },
      {
        site: 'landing',
        path: '/downloads',
        label: 'common.download',
        detail: 'ui.siteNav.downloadDetail',
        icon: DownloadIcon,
      },
    ],
  },
  {
    id: 'resources',
    label: 'ui.siteNav.resources',
    eyebrow: 'ui.siteNav.docsAndCode',
    blurb: 'ui.siteNav.resourcesBlurb',
    items: [
      {
        site: 'docs',
        path: '/',
        label: 'ui.siteNav.documentation',
        detail: 'ui.siteNav.documentationDetail',
        icon: BookOpenIcon,
      },
      {
        site: 'docs',
        path: '/install/complete-compose-file',
        label: 'ui.siteNav.dockerCompose',
        detail: 'ui.siteNav.dockerComposeDetail',
        icon: ContainerIcon,
      },
      {
        site: 'docs',
        path: '/start/set-up-with-an-ai',
        label: 'ui.siteFooter.setUpWithAi',
        detail: 'ui.siteNav.setUpWithAiDetail',
        icon: SquareTerminalIcon,
      },
      {
        site: 'docs',
        path: '/api',
        label: 'ui.siteNav.apiReference',
        detail: 'ui.siteNav.apiReferenceDetail',
        icon: FileTextIcon,
      },
      {
        site: 'landing',
        path: '/changelog',
        label: 'ui.siteFooter.changelog',
        detail: 'ui.siteNav.changelogDetail',
        icon: NewspaperIcon,
      },
      {
        site: 'metrics',
        path: '/',
        label: 'screens.adminArea.adminSections.statistics',
        detail: 'ui.siteNav.statisticsDetail',
        icon: ChartBarIcon,
      },
    ],
  },
  {
    id: 'community',
    label: 'ui.siteFooter.community',
    eyebrow: 'ui.siteNav.peopleAndProject',
    blurb: 'ui.siteNav.communityBlurb',
    items: [
      {
        site: 'landing',
        path: '/ui',
        label: 'ui.siteNav.valenceUi',
        detail: 'ui.siteNav.valenceUiDetail',
        icon: SwatchBookIcon,
      },
      {
        site: 'landing',
        path: '/brand',
        label: 'ui.siteNav.brand',
        detail: 'ui.siteNav.brandDetail',
        icon: PaletteIcon,
      },
      {
        href: VALENCE_REPOSITORY_URL,
        label: 'ui.siteFooter.gitHub',
        detail: 'ui.siteNav.gitHubDetail',
        icon: GitForkIcon,
      },
      {
        href: DISCORD_URL,
        label: 'screens.adminArea.webhookFields.discord',
        detail: 'ui.siteNav.discordDetail',
        icon: MessagesSquareIcon,
      },
      {
        site: 'landing',
        path: '/privacy',
        label: 'screens.adminArea.indexerCatalogueDialog.privacy',
        detail: 'ui.siteNav.privacyDetail',
        icon: ShieldCheckIcon,
      },
      {
        site: 'landing',
        path: '/terms',
        label: 'ui.siteFooter.terms',
        detail: 'ui.siteNav.termsDetail',
        icon: GavelIcon,
      },
    ],
  },
];

export { NAV_GROUPS };
