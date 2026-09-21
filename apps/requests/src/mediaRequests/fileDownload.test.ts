import { mkdir, mkdtemp, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fileDownload } from './fileDownload';

/**
 * A downloads folder and a library of their own for one test.
 */
const aPlace = async () => {
  const root = await mkdtemp(join(tmpdir(), 'valence-file-'));

  await mkdir(join(root, 'downloads'));
  await mkdir(join(root, 'library'));

  return { downloads: join(root, 'downloads'), library: join(root, 'library') };
};

/**
 * A film or episode to file.
 */
const anItem = (
  id: string,
  season: number | null,
  episode: number | null,
  title = '',
  releaseTitle: string | null = null,
) => ({
  id,
  season,
  episode,
  title,
  airDate: null,
  filePath: null,
  releaseTitle,
});

describe('fileDownload', () => {
  it('files a film by its largest video, with its subtitles, and leaves the sample', async () => {
    const { downloads, library } = await aPlace();
    const release = join(downloads, 'Dune.2021.1080p.WEB-DL.x264-GRP');

    await mkdir(join(release, 'Sample'), { recursive: true });
    await writeFile(join(release, 'Dune.2021.1080p.WEB-DL.x264-GRP.mkv'), 'the whole film');
    await writeFile(join(release, 'Dune.2021.1080p.WEB-DL.x264-GRP.en.srt'), 'words');
    await writeFile(join(release, 'Sample', 'sample-dune.mkv'), 'a bit of the film, longer');

    const { filed, missing } = await fileDownload(
      { libraryPath: library, title: 'Dune', year: 2021 },
      [anItem('film', null, null)],
      release,
      true,
    );

    expect(missing).toEqual([]);
    expect(filed.get('film')).toBe(
      join(library, 'Dune (2021)', 'Dune (2021) [1080p][WEBDL][x264].mkv'),
    );
    expect((await readdir(join(library, 'Dune (2021)'))).toSorted()).toEqual([
      'Dune (2021) [1080p][WEBDL][x264].en.srt',
      'Dune (2021) [1080p][WEBDL][x264].mkv',
    ]);
    expect(await readFile(join(release, 'Dune.2021.1080p.WEB-DL.x264-GRP.mkv'), 'utf8')).toBe(
      'the whole film',
    );
  });

  it('files each episode of a season pack by the numbers in its name', async () => {
    const { downloads, library } = await aPlace();
    const release = join(downloads, 'Severance.S01.1080p.WEB-DL-GRP');

    await mkdir(release);
    await writeFile(join(release, 'Severance.S01E01.1080p.WEB-DL-GRP.mkv'), 'one');
    await writeFile(join(release, 'Severance.S01E02.1080p.WEB-DL-GRP.mkv'), 'two');

    const { filed, missing } = await fileDownload(
      { libraryPath: library, title: 'Severance', year: 2022 },
      [anItem('1', 1, 1, 'Good News About Hell'), anItem('2', 1, 2), anItem('3', 1, 3)],
      release,
      false,
    );

    expect(missing).toEqual(['3']);
    expect(
      await readFile(
        join(
          library,
          'Severance (2022)',
          'Season 01',
          'Severance (2022) - S01E01 - Good News About Hell [1080p][WEBDL].mkv',
        ),
        'utf8',
      ),
    ).toBe('one');
    expect(filed.get('2')).toBe(
      join(
        library,
        'Severance (2022)',
        'Season 01',
        'Severance (2022) - S01E02 [1080p][WEBDL].mkv',
      ),
    );
  });

  it('files the one video of a download fetched for one episode, whatever it is called', async () => {
    const { downloads, library } = await aPlace();

    await writeFile(join(downloads, 'episode.mkv'), 'one');

    const { filed } = await fileDownload(
      { libraryPath: library, title: 'Severance', year: 2022 },
      [anItem('1', 1, 1)],
      join(downloads, 'episode.mkv'),
      true,
    );

    expect(filed.get('1')).toBe(
      join(library, 'Severance (2022)', 'Season 01', 'Severance (2022) - S01E01.mkv'),
    );
  });

  it('says what a copy is on the file, leaving the folder to name the film alone', async () => {
    const { downloads, library } = await aPlace();

    await writeFile(join(downloads, 'Dune.2021.2160p.BluRay.REMUX.HEVC.TrueHD.7.1.mkv'), 'film');

    const { filed } = await fileDownload(
      { libraryPath: library, title: 'Dune', year: 2021 },
      [anItem('film', null, null)],
      join(downloads, 'Dune.2021.2160p.BluRay.REMUX.HEVC.TrueHD.7.1.mkv'),
      true,
    );

    expect(filed.get('film')).toBe(
      join(library, 'Dune (2021)', 'Dune (2021) [2160p][Remux][x265][TrueHD 7.1].mkv'),
    );
    expect(await readdir(library)).toEqual(['Dune (2021)']);
  });

  it('takes from the release what a file numbered and nothing more does not say', async () => {
    const { downloads, library } = await aPlace();
    const release = join(downloads, 'Severance.S01.2160p.WEB-DL.DDP5.1.Atmos.H.265-GRP');

    await mkdir(release);
    await writeFile(join(release, 'S01E01.mkv'), 'one');

    const { filed } = await fileDownload(
      { libraryPath: library, title: 'Severance', year: 2022 },
      [anItem('1', 1, 1, '', 'Severance.S01.2160p.WEB-DL.DDP5.1.Atmos.H.265-GRP')],
      release,
      true,
    );

    expect(filed.get('1')).toBe(
      join(
        library,
        'Severance (2022)',
        'Season 01',
        'Severance (2022) - S01E01 [2160p][WEBDL][x265][EAC3 Atmos 5.1].mkv',
      ),
    );
  });

  it('removes what an upgrade replaces', async () => {
    const { downloads, library } = await aPlace();
    const old = join(library, 'Dune (2021)', 'Dune (2021).avi');

    await mkdir(join(library, 'Dune (2021)'));
    await writeFile(old, 'worse');
    await writeFile(join(downloads, 'Dune.2021.2160p.mkv'), 'better');

    await fileDownload(
      { libraryPath: library, title: 'Dune', year: 2021 },
      [{ ...anItem('film', null, null), filePath: old }],
      join(downloads, 'Dune.2021.2160p.mkv'),
      true,
    );

    await expect(stat(old)).rejects.toThrow();
  });

  it('says nothing was found where a download holds no video', async () => {
    const { downloads, library } = await aPlace();

    await writeFile(join(downloads, 'readme.txt'), 'hello');

    const { filed, missing } = await fileDownload(
      { libraryPath: library, title: 'Dune', year: 2021 },
      [anItem('film', null, null)],
      downloads,
      true,
    );

    expect(filed.size).toBe(0);
    expect(missing).toEqual(['film']);
  });
});
