import { describe, expect, it } from 'vitest';
import { createFilenameMetadataProvider } from './createFilenameMetadataProvider';
import type { MediaProbe } from '@ValenceServer/transcoder/TranscoderClient';

const probe: MediaProbe = {
  container: 'mkv',
  durationSeconds: 7200,
  bitrateKbps: 8000,
  video: null,
  audioStreams: [],
  subtitleStreams: [],
  chapters: [],
};

describe('createFilenameMetadataProvider', () => {
  it('names a file by what the scan read from its path', async () => {
    await expect(
      createFilenameMetadataProvider().describe({
        path: '/movies/Arrival (2016)/movie.mkv',
        probe,
        title: 'Arrival',
        year: 2016,
      }),
    ).resolves.toEqual({ title: 'Arrival', year: 2016 });
  });

  it('reads the file name where the scan gave no title', async () => {
    await expect(
      createFilenameMetadataProvider().describe({ path: '/movies/Heat.1995.1080p.mkv', probe }),
    ).resolves.toEqual({ title: 'Heat', year: 1995 });
  });
});
