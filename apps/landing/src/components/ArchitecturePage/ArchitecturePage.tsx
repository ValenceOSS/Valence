import {
  CodeXml as CodeXmlIcon,
  Database as DatabaseIcon,
  Globe as GlobeIcon,
  KeyRound as KeyRoundIcon,
  Plug as PlugIcon,
  Server as ServerIcon,
} from '@keyline-icons/react/fill';
import { EditorialPage } from '@ValenceLanding/components/EditorialPage/EditorialPage';

const ArchitecturePage = () => (
  <EditorialPage
    eyebrow="How Valence runs"
    title="One server, many apps, clear boundaries."
    description="Valence is not a hosted account with a media folder bolted on. The server owns the library, the clients ask it for exactly what they need, and optional services plug into that shape."
    cards={[
      {
        title: 'Server first',
        body: 'The web app, API, account model, library scanner, sessions and admin tools are served from the machine you run. That is the center of the system.',
        icon: ServerIcon,
      },
      {
        title: 'Clients stay thin',
        body: 'Web, desktop, TV and mobile clients are different surfaces over the same contracts: playback, people, libraries, downloads and household state.',
        icon: GlobeIcon,
      },
      {
        title: 'Media stays mounted',
        body: 'Libraries are read from folders you choose. Valence indexes and streams them; it does not need you to upload a library to a cloud product.',
        icon: DatabaseIcon,
      },
      {
        title: 'Transcoding is separate',
        body: 'The transcoder can be warmed, measured and deployed beside the server, so playback work does not hide inside unrelated app code.',
        icon: CodeXmlIcon,
      },
      {
        title: 'Plugins ask first',
        body: 'Server-side plugins describe what they need before they run. The host can explain, grant and revoke those capabilities.',
        icon: PlugIcon,
      },
      {
        title: 'Auth is part of the product',
        body: 'Accounts, passkeys, two-factor codes, roles and trusted origins are modeled as first-class server features, not left as a reverse-proxy footnote.',
        icon: KeyRoundIcon,
      },
    ]}
  />
);

ArchitecturePage.displayName = 'ArchitecturePage';

export { ArchitecturePage };
