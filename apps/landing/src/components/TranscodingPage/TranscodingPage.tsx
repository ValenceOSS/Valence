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
    description="Valence should explain what happens between a file on disk and a screen in the room: capability checks, keyframes, remuxing, transcoding, HDR and warm startup."
    cards={[
      {
        title: 'Direct play wins',
        body: 'When a device can handle the file, the server should get out of the way and deliver the stream without flattening quality.',
        icon: PlayIcon,
      },
      {
        title: 'Remux before re-encode',
        body: 'If the container is wrong but the video and audio are fine, Valence can change delivery without throwing pixels through an encoder.',
        icon: VideoIcon,
      },
      {
        title: 'Warm capabilities',
        body: 'The transcoder should know what FFmpeg and the device can do before the first viewer waits on a probe.',
        icon: ActivityIcon,
      },
      {
        title: 'Keyframes have a budget',
        body: 'Startup should not wait forever for perfect boundaries. It can start with what it knows and let background indexing help the next session.',
        icon: ScanLineIcon,
      },
      {
        title: 'HDR is a contract',
        body: 'PQ, HLG and tone mapping need to be described in terms of the display and client, not only the encoder.',
        icon: MonitorIcon,
      },
      {
        title: 'Measure the path',
        body: 'Admin screens should show direct play, remux, transcode, hardware acceleration and fallback so operators can understand latency.',
        icon: GaugeIcon,
      },
    ]}
  />
);

TranscodingPage.displayName = 'TranscodingPage';

export { TranscodingPage };
