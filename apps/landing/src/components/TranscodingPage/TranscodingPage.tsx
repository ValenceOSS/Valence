import {
  Activity as ActivityIcon,
  Gauge as GaugeIcon,
  Monitor as MonitorIcon,
  Play as PlayIcon,
  ScanLine as ScanLineIcon,
  Video as VideoIcon,
} from '@keyline-icons/react/fill';
import { EditorialPage } from '@ValenceLanding/components/EditorialPage/EditorialPage';

const TranscodingPage = () => (
  <EditorialPage
    eyebrow="Playback pipeline"
    title="Direct play when possible, transcode when useful."
    description="What happens between a file on disk and a screen in the room: whether it plays as it is, is rewrapped or is converted, and how HDR is kept."
    cards={[
      {
        title: 'Direct play wins',
        body: 'When a device can play the file as it is, Valence sends it untouched, so nothing is lost to a conversion.',
        icon: PlayIcon,
      },
      {
        title: 'Remux before re-encode',
        body: 'If the container is wrong but the video and audio are fine, Valence can change delivery without throwing pixels through an encoder.',
        icon: VideoIcon,
      },
      {
        title: 'Proven hardware',
        body: 'Settings can try the chosen hardware on a short real transcode, and Automatic uses only encoders that proved themselves when the media service started, falling back to the processor.',
        icon: ActivityIcon,
      },
      {
        title: 'Seeking lands where it says',
        body: 'A converted stream is cut into segments that line up with its playlist, so a seek lands on the moment the bar shows.',
        icon: ScanLineIcon,
      },
      {
        title: 'HDR where it can be shown',
        body: 'HDR plays as HDR where the screen and the app can show it, and is tone mapped to SDR, on the graphics card where it can be, where they cannot.',
        icon: MonitorIcon,
      },
      {
        title: 'See the path',
        body: 'The admin Sessions page shows how each stream is delivered, direct, remuxed or converted, and stats for nerds in the player says why.',
        icon: GaugeIcon,
      },
    ]}
  />
);

TranscodingPage.displayName = 'TranscodingPage';

export { TranscodingPage };
