import {
  Cpu as CpuIcon,
  Database as DatabaseIcon,
  Gauge as GaugeIcon,
  HardDrive as HardDriveIcon,
  Monitor as MonitorIcon,
  Package as PackageIcon,
} from '@keyline-icons/react/fill';
import { EditorialPage } from '@ValenceLanding/components/EditorialPage/EditorialPage';

const RequirementsPage = () => (
  <EditorialPage
    eyebrow="Self-hosting"
    title="What kind of machine should run Valence?"
    description="The honest answer depends on how much direct play you get, how many people watch at once, and whether your box has hardware acceleration. This page gives the shape of that decision."
    cards={[
      {
        title: 'Start with Docker compose',
        body: 'The supported path is a compose stack: server, database, optional requests pieces and transcoder wiring in one repeatable setup.',
        icon: PackageIcon,
      },
      {
        title: 'Storage matters first',
        body: 'Your library stays on mounted disks or network storage. The server needs stable paths more than it needs exotic hardware.',
        icon: HardDriveIcon,
      },
      {
        title: 'CPU covers the fallback',
        body: 'If a device cannot direct play and no hardware encoder is available, CPU transcoding is the safety net. It should be sized for the streams you expect.',
        icon: CpuIcon,
      },
      {
        title: 'GPU helps with guests',
        body: 'VideoToolbox, NVENC, VAAPI, QSV and AMF support let a small server survive more devices, more codecs and more remote viewers.',
        icon: GaugeIcon,
      },
      {
        title: 'Database is ordinary',
        body: 'The server stores accounts, libraries, jobs, sessions and configuration in a regular database instead of inventing a mystery state folder.',
        icon: DatabaseIcon,
      },
      {
        title: 'Clients decide a lot',
        body: 'A good TV box or browser can direct play far more often than an old client. Requirements are a server-and-device question.',
        icon: MonitorIcon,
      },
    ]}
  />
);

RequirementsPage.displayName = 'RequirementsPage';

export { RequirementsPage };
