import {
  Ban as BanIcon,
  Compass as CompassIcon,
  GitFork as GitForkIcon,
  HandHeart as HandHeartIcon,
  Layers as LayersIcon,
  ShieldCheck as ShieldCheckIcon,
  Sparkles as SparklesIcon,
} from '@keyline-icons/react/fill';
import { EditorialPage } from '@ValenceLanding/components/EditorialPage/EditorialPage';

const PrinciplesPage = () => (
  <EditorialPage
    eyebrow="Principles"
    title="What Valence holds to."
    description="Not a list of dates: what the project protects, what it refuses, and what kinds of features fit."
    cards={[
      {
        title: 'Own the home stack',
        body: 'Films, programmes, music, books, live TV and requests run as one system on your server, without hiding where each part begins.',
        icon: LayersIcon,
      },
      {
        title: 'Keep trust visible',
        body: 'Linked servers, plugins, requests, sign-in and sharing say what they can see and who allowed it.',
        icon: ShieldCheckIcon,
      },
      {
        title: 'Make admin calmer',
        body: 'Jobs, sessions and failures are explained in the app itself, so nobody has to go reading logs first.',
        icon: CompassIcon,
      },
      {
        title: 'Design for households',
        body: 'Features fit real people sharing a server: children, guests, friends elsewhere, setup links, roles and devices.',
        icon: HandHeartIcon,
      },
      {
        title: 'Stay hackable',
        body: 'The codebase, its contracts and its UI library are open, typed and documented, so contributors extend them without reverse engineering.',
        icon: GitForkIcon,
      },
      {
        title: 'Polish still counts',
        body: 'A self-hosted app can feel intentional: good motion, clear words, reliable defaults and controls that do not punish repeated use.',
        icon: SparklesIcon,
      },
      {
        title: 'What it refuses',
        body: 'No account with us, no service of ours your server depends on, no tracking, and no plugin code running in your apps. The demo server is only a demo.',
        icon: BanIcon,
      },
    ]}
  />
);

PrinciplesPage.displayName = 'PrinciplesPage';

export { PrinciplesPage };
