import {
  Bot as BotIcon,
  CodeXml as CodeXmlIcon,
  FileText as FileTextIcon,
  GitFork as GitForkIcon,
  Puzzle as PuzzleIcon,
  Webhook as WebhookIcon,
} from '@keyline-icons/react/fill';
import { EditorialPage } from '@ValenceLanding/components/EditorialPage/EditorialPage';

const DevelopersPage = () => (
  <EditorialPage
    eyebrow="Developers"
    title="Contracts first, then apps."
    description="Valence is built from shared schemas, a public API, a plugin SDK and a UI library, each documented and easy to find before you open the repository."
    cards={[
      {
        title: 'OpenAPI reference',
        body: 'The server API is documented from the contracts the app uses, so integrations can target real behavior instead of screenshots.',
        icon: FileTextIcon,
      },
      {
        title: 'Plugin SDK',
        body: 'Plugins package server-side behavior with a manifest, permission summary and host API rather than reaching through private internals.',
        icon: PuzzleIcon,
      },
      {
        title: 'Webhooks',
        body: 'Server events can be delivered to the systems around a household: requests, scans, playback events and operational signals.',
        icon: WebhookIcon,
      },
      {
        title: 'Shared UI',
        body: 'ValenceUI carries the app’s button, menu, table, sidebar, motion and feedback patterns for first-party and reference surfaces.',
        icon: CodeXmlIcon,
      },
      {
        title: 'Repository map',
        body: 'The monorepo separates apps, screens, client functions, contracts, server routes and transcoder code so each boundary can be read directly.',
        icon: GitForkIcon,
      },
      {
        title: 'Docs for machines too',
        body: 'Reference pages can expose raw text and markdown so search, AI readers and scrapers can understand the project without a browser.',
        icon: BotIcon,
      },
    ]}
  />
);

DevelopersPage.displayName = 'DevelopersPage';

export { DevelopersPage };
