import { describe, expect, it } from 'vitest';
import { aSetup } from '@ValenceRequests/arrImport/testing/aSetup';
import { aProfile } from '@ValenceRequests/testing/aProfile';
import { plannedProfilesOf } from './plannedProfilesOf';

describe('plannedProfilesOf', () => {
  it('brings in only the profiles something uses', async () => {
    const radarr = await aSetup('radarr-v5', 'radarr', 'http://radarr:7878');
    const planned = plannedProfilesOf([radarr], []);

    expect(planned.map((one) => one.report)).toEqual([
      expect.objectContaining({
        key: 'video:hd-1080p',
        name: 'HD-1080p',
        standing: 'new',
        from: 'Radarr',
      }),
    ]);
    expect(planned[0]?.sources).toEqual(['http://radarr:7878#4']);
  });

  it('makes one profile of two the same, and tells two that differ apart by their app', async () => {
    const radarr = await aSetup('radarr-v5', 'radarr', 'http://radarr:7878');
    const twin = await aSetup('radarr-v5', 'radarr', 'http://radarr2:7878', 'Radarr Two');
    const sonarr = await aSetup('sonarr-v4', 'sonarr', 'http://sonarr:8989');
    const renamed = {
      ...sonarr,
      profiles: sonarr.profiles.map((one) => ({ ...one, name: 'HD-1080p' })),
    };
    const planned = plannedProfilesOf([radarr, twin, renamed], []);

    expect(planned.map((one) => one.report.name)).toEqual(['HD-1080p', 'HD-1080p (Sonarr)']);
    expect(planned[0]?.sources).toEqual(['http://radarr:7878#4', 'http://radarr2:7878#4']);
  });

  it('keeps a profile Valence has under the same name as it is', async () => {
    const lidarr = await aSetup('lidarr-v2', 'lidarr', 'http://lidarr:8686');
    const [planned] = plannedProfilesOf([lidarr], [aProfile({ name: 'lossless', kind: 'music' })]);

    expect(planned?.report.standing).toBe('kept');
  });

  it('brings in every profile of an app that holds nothing yet', async () => {
    const radarr = await aSetup('radarr-v5', 'radarr', 'http://radarr:7878');

    expect(plannedProfilesOf([{ ...radarr, movies: [], rootFolders: [] }], [])).toHaveLength(2);
  });
});
