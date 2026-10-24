import {
  BookOpen as BookOpenIcon,
  CodeXml as CodeXmlIcon,
  Compass as CompassIcon,
  Container as ContainerIcon,
  DiagramProject as DiagramProjectIcon,
  Download as DownloadIcon,
  FileText as FileTextIcon,
  Gavel as GavelIcon,
  GitFork as GitForkIcon,
  Info as InfoIcon,
  ListCheck as ListCheckIcon,
  MessagesSquare as MessagesSquareIcon,
  Newspaper as NewspaperIcon,
  Package as PackageIcon,
  Puzzle as PuzzleIcon,
  ShieldCheck as ShieldCheckIcon,
  SlidersHorizontal as SlidersHorizontalIcon,
  SquareTerminal as SquareTerminalIcon,
  SwatchBook as SwatchBookIcon,
  Tape as TapeIcon,
} from '@keyline-icons/react/fill';
import { DISCORD_URL } from '@ValenceLanding/content/DISCORD_URL';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import { VALENCE_REPOSITORY_URL } from '@ValenceCore/project/VALENCE_REPOSITORY_URL';
import type { NavGroup } from '@ValenceLanding/components/LandingNav/LandingNav.types';

const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: 'product',
    label: 'Product',
    eyebrow: 'What Valence does',
    blurb:
      'One server for films, shows, music and books, with requests built in rather than bolted on.',
    items: [
      {
        to: '/tour',
        label: 'Product tour',
        detail: 'Watching, listening, reading, requests, household and admin surfaces.',
        icon: PackageIcon,
      },
      {
        to: '/features',
        label: 'Features',
        detail: 'Everything Valence does, and what is on from the start.',
        icon: ListCheckIcon,
      },
      {
        to: '/architecture',
        label: 'How it runs',
        detail: 'Server, clients, transcoder, plugins, auth and trust boundaries.',
        icon: DiagramProjectIcon,
      },
      {
        to: '/plugins',
        label: 'Plugins',
        detail: 'Signed server-side extensions that ask before they reach anything.',
        icon: PuzzleIcon,
      },
      {
        to: '/compare',
        label: 'Compare',
        detail: 'How Valence differs from a pile of separate media tools.',
        icon: SlidersHorizontalIcon,
      },
    ],
  },
  {
    id: 'run',
    label: 'Run it',
    eyebrow: 'Install and operate',
    blurb:
      'What to run it on, how to install it, and what happens when a file will not play as it is.',
    items: [
      {
        to: '/downloads',
        label: 'Download',
        detail: 'The desktop app, the server and the phone apps.',
        icon: DownloadIcon,
      },
      {
        to: '/requirements',
        label: 'Requirements',
        detail: 'What kind of machine, storage and GPU support make sense.',
        icon: ListCheckIcon,
      },
      {
        href: `${DOCS_URL}/install/complete-compose-file`,
        label: 'Docker compose',
        detail: 'The complete compose file and the settings it expects.',
        icon: ContainerIcon,
      },
      {
        href: `${DOCS_URL}/start/set-up-with-an-ai`,
        label: 'Set up with AI',
        detail: 'A guided prompt for configuring Valence on your machine.',
        icon: SquareTerminalIcon,
      },
      {
        to: '/transcoding',
        label: 'Transcoding',
        detail: 'Direct play, remuxing, HDR, keyframes and fast startup.',
        icon: TapeIcon,
      },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    eyebrow: 'Docs and code',
    blurb: 'Guides for setting it up, and the contracts for building on top of it.',
    items: [
      {
        href: DOCS_URL,
        label: 'Documentation',
        detail: 'Install guides, usage docs, reference pages and troubleshooting.',
        icon: BookOpenIcon,
      },
      {
        to: '/developers',
        label: 'Developers',
        detail: 'API contracts, plugin SDK, webhooks and component system.',
        icon: CodeXmlIcon,
      },
      {
        href: `${DOCS_URL}/api`,
        label: 'API reference',
        detail: 'The OpenAPI-backed server reference.',
        icon: FileTextIcon,
      },
      {
        to: '/changelog',
        label: 'Changelog',
        detail: 'What changed in each release.',
        icon: NewspaperIcon,
      },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    eyebrow: 'People and project',
    blurb: 'Where the project lives, who it is for, and what it promises the people running it.',
    items: [
      {
        to: '/ui',
        label: 'ValenceUI',
        detail: 'The component system the web and desktop apps and this site draw from.',
        icon: SwatchBookIcon,
      },
      {
        href: VALENCE_REPOSITORY_URL,
        label: 'GitHub',
        detail: 'Read the source, open an issue, or follow development.',
        icon: GitForkIcon,
      },
      {
        href: DISCORD_URL,
        label: 'Discord',
        detail: 'Ask questions and talk through a setup.',
        icon: MessagesSquareIcon,
      },
      {
        to: '/about',
        label: 'About Valence',
        detail: 'Why it exists, what it owns, and what stays on your server.',
        icon: InfoIcon,
      },
      {
        to: '/principles',
        label: 'Principles',
        detail: 'What the project holds to, and what it refuses.',
        icon: CompassIcon,
      },
      {
        to: '/privacy',
        label: 'Privacy',
        detail: 'What this site sees, and what the self-hosted app keeps away from us.',
        icon: ShieldCheckIcon,
      },
      {
        to: '/terms',
        label: 'Terms',
        detail: 'The short version of using the site and the MIT-licensed software.',
        icon: GavelIcon,
      },
    ],
  },
];

export { NAV_GROUPS };
