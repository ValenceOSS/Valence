/* eslint-disable valence/no-hard-coded-strings -- stands in for media in tests */
import type { MediaRef } from '@ValenceSDK/host/ValenceHost';

const A_PLUGIN_MEDIA_FOR_TEST: MediaRef = {
  id: 'm1',
  kind: 'episode',
  title: 'Episode',
  year: 2024,
  seriesId: 's1',
  seasonNumber: 1,
  episodeNumber: 1,
  externalIds: {},
};

export { A_PLUGIN_MEDIA_FOR_TEST };
