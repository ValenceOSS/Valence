import {
  Compass as CompassIcon,
  GitFork as GitForkIcon,
  HandHeart as HandHeartIcon,
  Layers as LayersIcon,
  ShieldCheck as ShieldCheckIcon,
  Sparkles as SparklesIcon,
} from '@keyline-icons/react/fill';
import { EditorialPage } from '@ValenceLanding/components/EditorialPage/EditorialPage';

const RoadmapPage = () => (
  <EditorialPage
    eyebrow="Roadmap"
    title="What Valence is trying to become."
    description="The clearest roadmap is not a date list. It is a set of constraints: what the project protects, what it refuses, and what kinds of features fit."
    cards={[
      {
        title: 'Own the home stack',
        body: 'Valence should make the common self-hosted media stack feel like one coherent system without hiding where each part begins.',
        icon: LayersIcon,
      },
      {
        title: 'Keep trust visible',
        body: 'Linked servers, plugins, requests, auth and sharing should always say what they can see and who allowed it.',
        icon: ShieldCheckIcon,
      },
      {
        title: 'Make admin calmer',
        body: 'The operator should understand jobs, sessions and failures from the app itself instead of chasing logs first.',
        icon: CompassIcon,
      },
      {
        title: 'Design for households',
        body: 'Features should fit real people sharing a server: kids, guests, remote friends, setup links, roles and devices.',
        icon: HandHeartIcon,
      },
      {
        title: 'Stay hackable',
        body: 'The codebase, contracts and UI library should be approachable enough for contributors to extend without reverse engineering.',
        icon: GitForkIcon,
      },
      {
        title: 'Polish still counts',
        body: 'A self-hosted app can feel intentional: good motion, clear copy, reliable defaults and controls that do not punish repeated use.',
        icon: SparklesIcon,
      },
    ]}
  />
);

RoadmapPage.displayName = 'RoadmapPage';

export { RoadmapPage };
