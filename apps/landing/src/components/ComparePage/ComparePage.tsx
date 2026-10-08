import {
  BookOpen as BookOpenIcon,
  Gauge as GaugeIcon,
  GitFork as GitForkIcon,
  Package as PackageIcon,
  ShieldCheck as ShieldCheckIcon,
  Users as UsersIcon,
} from '@keyline-icons/react/fill';
import { EditorialPage } from '@ValenceLanding/components/EditorialPage/EditorialPage';

const ComparePage = () => (
  <EditorialPage
    eyebrow="Compare"
    title="Built for people who want the whole home media system, not only a player."
    description="Valence overlaps with media servers, music servers, audiobook tools and request apps, but its bet is different: one household, one server, one contract surface."
    cards={[
      {
        title: 'One library surface',
        body: 'Films, series, books, music, requests, sessions and accounts are all designed to appear in one product instead of a row of separate tools.',
        icon: PackageIcon,
      },
      {
        title: 'Admin work is visible',
        body: 'Jobs, logs, sessions, profiles, downloads, indexers and encoding settings live in the same admin area that explains what the server is doing.',
        icon: GaugeIcon,
      },
      {
        title: 'Household permissions',
        body: 'People can have profiles, roles, setup links, devices and access rules without turning the whole server into one shared admin login.',
        icon: UsersIcon,
      },
      {
        title: 'Books are not a plugin',
        body: 'Reading and listening are part of the app: EPUBs, audiobooks, progress and devices sit beside video and music.',
        icon: BookOpenIcon,
      },
      {
        title: 'Open by default',
        body: 'The repository, API contracts and component system are public, so integrations can target the same surfaces the first-party apps use.',
        icon: GitForkIcon,
      },
      {
        title: 'Trust is explicit',
        body: 'Plugins, linked servers, origins, roles and authentication are named surfaces instead of implicit side effects of installation.',
        icon: ShieldCheckIcon,
      },
    ]}
    comparisons={[
      {
        label: 'Scope',
        valence: 'One product for playback, requests, books, music, admin, sharing and plugins.',
        others:
          'Usually excellent at one layer, then paired with separate request, music or audiobook apps.',
      },
      {
        label: 'Ownership',
        valence: 'Self-hosted by design; the landing site does not become part of your runtime.',
        others:
          'Often self-hosted too, but some features depend on external accounts or companion services.',
      },
      {
        label: 'Extensibility',
        valence:
          'Plugins declare permissions and run against the same server contracts as the app.',
        others:
          'Extensions are often scripts, sidecars, metadata agents or app-specific integrations.',
      },
      {
        label: 'Admin model',
        valence:
          'Admin screens are a first-class product surface, with jobs, sessions and settings in one place.',
        others:
          'Admin features can be powerful, but are frequently split across tools and dashboards.',
      },
    ]}
  />
);

ComparePage.displayName = 'ComparePage';

export { ComparePage };
