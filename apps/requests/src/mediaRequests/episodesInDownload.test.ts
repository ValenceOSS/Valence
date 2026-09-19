import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseReleaseName } from '@ValenceRequests/releases/parseReleaseName';
import { episodesInDownload } from './episodesInDownload';

describe('episodesInDownload', () => {
  it('reads each episode of a pack from its videos’ names, leaving out samples', async () => {
    const root = await mkdtemp(join(tmpdir(), 'valence-episodes-'));

    await mkdir(join(root, 'Severance.S01'));
    await writeFile(join(root, 'Severance.S01', 'Severance.S01E02.1080p.mkv'), 'two');
    await writeFile(join(root, 'Severance.S01', 'Severance.S01E01.1080p.mkv'), 'one');
    await writeFile(join(root, 'Severance.S01', 'Severance.S01E01.sample.mkv'), 'bit');
    await writeFile(join(root, 'Severance.S01', 'Severance.S01E01.nfo'), 'info');

    expect(
      await episodesInDownload(join(root, 'Severance.S01'), parseReleaseName('Severance.S01')),
    ).toEqual([
      { id: '1x1', season: 1, episode: 1 },
      { id: '1x2', season: 1, episode: 2 },
    ]);
  });

  it('takes the release’s numbers for one video whose own name has none', async () => {
    const root = await mkdtemp(join(tmpdir(), 'valence-episodes-'));

    await writeFile(join(root, 'episode.mkv'), 'one');

    expect(
      await episodesInDownload(
        join(root, 'episode.mkv'),
        parseReleaseName('Severance.S02E03.1080p.WEB-DL'),
      ),
    ).toEqual([{ id: '2x3', season: 2, episode: 3 }]);
    expect(
      await episodesInDownload(join(root, 'episode.mkv'), parseReleaseName('Severance')),
    ).toEqual([]);
  });
});
