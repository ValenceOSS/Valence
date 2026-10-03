/* oxlint-disable valence/no-hard-coded-strings -- stands in for media in tests */
import type { MediaRef } from '@ValenceSDK/host/ValenceHost';

const A_PLUGIN_MEDIA_FOR_TEST: MediaRef = {
  id: 'm1',
  kind: 'episode',
  title: 'Episode',
  year: 2024,
  seriesId: 's1',
  seasonNumber: 1,
  episodeNumber: 1,
  durationSeconds: 1440,
  artist: null,
  album: null,
  externalIds: {},
};

export { A_PLUGIN_MEDIA_FOR_TEST };
