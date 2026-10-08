import {
  BookOpen as BookOpenIcon,
  Download as DownloadIcon,
  Film as FilmIcon,
  Gauge as GaugeIcon,
  Headphones as HeadphonesIcon,
  Users as UsersIcon,
} from '@keyline-icons/react/fill';
import { EditorialPage } from '@ValenceLanding/components/EditorialPage/EditorialPage';

const ProductTourPage = () => (
  <EditorialPage
    eyebrow="Product tour"
    title="The parts of Valence people actually touch."
    description="A screenshot-led tour should group the app by real workflows: sitting down to watch, running the server, reading, listening, sharing and handling requests."
    cards={[
      {
        title: 'Watching',
        body: 'Home rails, detail pages, device-aware playback, intro skipping, subtitles, HDR and the next episode as credits roll.',
        icon: FilmIcon,
      },
      {
        title: 'Listening',
        body: 'Music and audiobooks share progress, devices and household presence without being hidden behind a separate app.',
        icon: HeadphonesIcon,
      },
      {
        title: 'Reading',
        body: 'EPUBs belong in the same library story: place, device, cover, progress and person are remembered.',
        icon: BookOpenIcon,
      },
      {
        title: 'Requests',
        body: 'People can ask for media, operators can approve it, and the server can follow the release into the library.',
        icon: DownloadIcon,
      },
      {
        title: 'Household',
        body: 'Profiles, roles, devices, setup links and sharing are modeled around people who live with the server.',
        icon: UsersIcon,
      },
      {
        title: 'Admin',
        body: 'The server explains its work: sessions, jobs, scans, downloads, logs, encoding, plugins and linked servers.',
        icon: GaugeIcon,
      },
    ]}
  />
);

ProductTourPage.displayName = 'ProductTourPage';

export { ProductTourPage };
