import type { AdminAlert } from '@ValenceContracts/schemas/AdminAlert';
import type { ConcernTone } from '@ValenceScreens/components/AdminArea/collectConcerns';

const ALERT_TONES: Readonly<Record<AdminAlert, ConcernTone>> = {
  requests: 'broken',
  'requests-vpn': 'broken',
  'requests-solver': 'broken',
  transcoder: 'broken',
  'ffmpeg-version': 'attention',
  'requests-indexers': 'attention',
  'playback-problems': 'attention',
  'starved-sessions': 'attention',
  'failed-jobs': 'broken',
  'stalled-jobs': 'broken',
  memory: 'attention',
  disk: 'attention',
  cpu: 'attention',
  encoder: 'attention',
  artefacts: 'attention',
  'unreadable-libraries': 'broken',
  unscanned: 'attention',
  'no-libraries': 'setup',
  'no-catalogue-key': 'setup',
};

export { ALERT_TONES };
