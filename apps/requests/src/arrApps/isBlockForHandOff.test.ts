import { describe, expect, it } from 'vitest';
import { ArrBlocklistPageSchema } from '@ValenceRequests/arrApps/schemas/ArrBlocklistPageSchema';
import { isBlockForHandOff } from './isBlockForHandOff';

const BLOCKS = ArrBlocklistPageSchema.parse({
  records: [{ id: 1, movieId: 12, seriesId: 7, artistId: 3 }],
}).records;

describe('isBlockForHandOff', () => {
  it('reads each app’s blocklist by the id it gave the request', () => {
    expect(
      BLOCKS.map((block) => [
        isBlockForHandOff(block, 'radarr', 12),
        isBlockForHandOff(block, 'sonarr', 7),
        isBlockForHandOff(block, 'lidarr', 3),
        isBlockForHandOff(block, 'radarr', 7),
        isBlockForHandOff(block, 'prowlarr', 12),
      ]),
    ).toEqual([[true, true, true, false, false]]);
  });
});
