import {
  Bell as BellIcon,
  BookOpen as BookOpenIcon,
  Cable as CableIcon,
  Code as CodeIcon,
  Download as DownloadIcon,
  Film as FilmIcon,
  HardDrive as HardDriveIcon,
  Plug as PlugIcon,
  RefreshCw as RefreshCwIcon,
  Rocket as RocketIcon,
  Server as ServerIcon,
  Share as ShareIcon,
  ShieldCheck as ShieldCheckIcon,
  Sparkles as SparklesIcon,
  Users as UsersIcon,
} from '@keyline-icons/react';
import type { IconGlyph } from '@ValenceUI/Icon.types';

type FeatureVisualKind = 'window' | 'waveform' | 'orbit' | 'stack';

type Feature = {
  icon: IconGlyph;
  title: string;
  detail: string;
  visual: FeatureVisualKind;
};

type FeatureGroup = {
  title: string;
  detail: string;
  features: Feature[];
};

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: 'Viewing',
    detail: "What it's like to sit down and watch something.",
    features: [
      {
        icon: FilmIcon,
        title: 'Direct play, or a transcode that earns its keep',
        detail:
          "Every device gets what it can actually take, negotiated per device rather than per server. Hardware transcoding runs on VideoToolbox, NVENC, VAAPI, QSV and AMF, several with AV1, and falls back to the processor cleanly when there's no GPU.",
        visual: 'window',
      },
      {
        icon: SparklesIcon,
        title: 'HDR stays HDR',
        detail:
          'Real PQ and HLG tone-mapping, in software or on the device, because a screen needs it, not because the transcoder gave up and flattened it.',
        visual: 'orbit',
      },
      {
        icon: RefreshCwIcon,
        title: 'Skips the parts you already know',
        detail:
          'Intros, recaps and credits are found by fingerprinting the audio across episodes, not by a hand-typed timestamp, so it works on a library you already own.',
        visual: 'waveform',
      },
      {
        icon: BookOpenIcon,
        title: 'Reads books too',
        detail:
          'A real EPUB reader with its own place in your library, remembering exactly where you left off. Not a bolt-on plugin.',
        visual: 'stack',
      },
    ],
  },
  {
    title: 'Sharing & social',
    detail: 'For the people you actually watch things with.',
    features: [
      {
        icon: UsersIcon,
        title: 'Watch together, properly in sync',
        detail:
          'A party keeps everybody at the same moment in the same film, drift-corrected rather than drifting, and can be password-protected.',
        visual: 'orbit',
      },
      {
        icon: ShareIcon,
        title: 'Share a link, not an account',
        detail:
          'One title or one series, to somebody with no account at all, for as long as you decide. No dock, no search, nothing else to see.',
        visual: 'window',
      },
      {
        icon: DownloadIcon,
        title: 'Take it with you',
        detail:
          'Choose a quality against a size before you commit, then watch offline, including a full offline mode with no server calls at all.',
        visual: 'stack',
      },
      {
        icon: BellIcon,
        title: 'Actually tells you things',
        detail: 'In-app notifications and real web push, not just a bell nobody checks.',
        visual: 'waveform',
      },
    ],
  },
  {
    title: 'Library & admin',
    detail: 'Running it, not just watching it.',
    features: [
      {
        icon: ServerIcon,
        title: 'An admin area built for a real library',
        detail:
          'Accounts, roles and permissions, live session control, background jobs and scheduling, a metadata match-picker, cache breakdown by artifact kind, a live log viewer.',
        visual: 'window',
      },
      {
        icon: RefreshCwIcon,
        title: 'Webhooks with a real event catalogue',
        detail:
          'Job lifecycle, library scans, playback, account changes and more, with delivery history and a redeliver button: an automation surface, not a checkbox.',
        visual: 'waveform',
      },
      {
        icon: RocketIcon,
        title: 'A setup wizard, not a config file',
        detail:
          "First run walks through the admin account, the server's name and its trusted origins, and gates the app until it's done.",
        visual: 'stack',
      },
    ],
  },
  {
    title: 'Extensibility & API',
    detail: 'For building on top of it.',
    features: [
      {
        icon: CableIcon,
        title: 'Every endpoint has a contract',
        detail:
          'Contract-first with Zod, an OpenAPI 3.1 document, and a reference generated from it and served by the server itself: over a hundred routes, actually documented.',
        visual: 'window',
      },
      {
        icon: CodeIcon,
        title: 'API keys as a feature, not an afterthought',
        detail: 'Create, list and revoke keys from the account area. Build on the API for real.',
        visual: 'stack',
      },
      {
        icon: PlugIcon,
        title: 'Built for a plugin API',
        detail:
          'A sandboxed capability model (network allowlists, read-only library access, storage quotas) is already designed in. The runtime is on its way; the architecture is not an afterthought bolted on later.',
        visual: 'orbit',
      },
    ],
  },
  {
    title: 'Platform',
    detail: 'What it takes to run it.',
    features: [
      {
        icon: HardDriveIcon,
        title: 'One image, self-hosted, no phoning home',
        detail:
          'The server, the web client and the media service ship in one Docker image. Your library is mounted read-only. Nothing calls out to us.',
        visual: 'stack',
      },
      {
        icon: UsersIcon,
        title: 'A household, not a single account',
        detail:
          'Everybody gets a face, their own continue watching, their own ratings and history. Admin-issued invites, not open signup.',
        visual: 'orbit',
      },
      {
        icon: ShieldCheckIcon,
        title: 'Real auth',
        detail:
          'TOTP two-factor with backup codes, WebAuthn passkeys, a device-authorization code flow for TVs: the kind of auth a self-hosted app usually skips.',
        visual: 'window',
      },
    ],
  },
];

export type { Feature, FeatureGroup };

export { FEATURE_GROUPS };
