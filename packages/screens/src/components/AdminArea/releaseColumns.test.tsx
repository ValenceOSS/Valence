import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataTable } from '@ValenceUI/DataTable';
import { releaseColumns } from './releaseColumns';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { Judgement } from '@ValenceContracts/schemas/QualityProfile';

/**
 * A release of the name given.
 */
const aRelease = (title: string, overrides: Partial<Release> = {}): Release => ({
  id: title,
  title,
  indexerId: '0f8fad5b-d9cb-469f-a165-70867728950e',
  indexerName: 'Jackett',
  protocol: 'torrent',
  sizeBytes: 2 * 1024 ** 3,
  seeders: 12,
  leechers: 3,
  grabs: null,
  publishedAt: '2026-09-18T00:00:00.000Z',
  categories: [],
  downloadUrl: null,
  magnetUrl: null,
  infoUrl: null,
  infoHash: null,
  downloadFactor: null,
  uploadFactor: null,
  minimumRatio: null,
  minimumSeedSeconds: null,
  ...overrides,
});

/**
 * A judgement of a release.
 */
const judged = (releaseId: string, score: number, rejections: string[] = []): Judgement => ({
  releaseId,
  quality: 1,
  parsed: {
    title: releaseId,
    year: null,
    seasons: [],
    episodes: [],
    absoluteEpisodes: [],
    airDate: null,
    isCompleteSeries: false,
    resolution: null,
    source: null,
    codec: null,
    hdr: [],
    audio: [],
    audioChannels: null,
    musicQuality: null,
    languages: [],
    edition: null,
    group: null,
    isProper: false,
    isRepack: false,
  },
  score,
  isRejected: rejections.length > 0,
  rejections: rejections.map(sayVerbatim),
  reasons: [sayVerbatim('1080p, the first preference')],
});

describe('releaseColumns', () => {
  it('shows each release, its verdict, size, peers and age', () => {
    render(
      <DataTable
        label="Releases"
        columns={releaseColumns({
          judged: new Map([
            ['Dune.BluRay', judged('Dune.BluRay', 2200)],
            ['Dune.CAM', judged('Dune.CAM', 0, ['A camera copy isn’t allowed by this profile'])],
            ['Dune.WEB', judged('Dune.WEB', 2100)],
          ]),
          pickedId: 'Dune.BluRay',
          now: Date.parse('2026-09-19T00:00:00.000Z'),
        })}
        rows={[
          aRelease('Dune.BluRay'),
          aRelease('Dune.CAM', {
            protocol: 'usenet',
            grabs: 40,
            sizeBytes: null,
            publishedAt: null,
          }),
          aRelease('Dune.WEB', { protocol: 'usenet', grabs: null, seeders: null, leechers: null }),
        ]}
        getRowId={(release) => release.id}
      />,
    );

    expect(screen.getByText('Picked · 2200')).toBeInTheDocument();
    expect(screen.getByText('Declined')).toBeInTheDocument();
    expect(screen.getByText('Scores 2100')).toBeInTheDocument();
    expect(screen.getByText('A camera copy isn’t allowed by this profile')).toBeInTheDocument();
    expect(screen.getByText('40 grabs')).toBeInTheDocument();
    expect(screen.getByText('12 / 3')).toBeInTheDocument();
  });

  it('leaves out the verdict where nothing was judged', () => {
    render(
      <DataTable
        label="Releases"
        columns={releaseColumns({ judged: new Map(), pickedId: null, now: 0 })}
        rows={[aRelease('Dune.BluRay')]}
        getRowId={(release) => release.id}
      />,
    );

    expect(screen.queryByText('Verdict')).not.toBeInTheDocument();
  });

  it('says each release’s format for music, and its quality for films and series', () => {
    const { unmount } = render(
      <DataTable
        label="Releases"
        columns={releaseColumns({ judged: new Map(), pickedId: null, now: 0, kind: 'music' })}
        rows={[aRelease('Artist - Album (2020) [FLAC]')]}
        getRowId={(release) => release.id}
      />,
    );

    expect(screen.getByText('Format')).toBeInTheDocument();
    expect(screen.getByText('FLAC')).toBeInTheDocument();

    unmount();
    render(
      <DataTable
        label="Releases"
        columns={releaseColumns({ judged: new Map(), pickedId: null, now: 0, kind: 'video' })}
        rows={[aRelease('A.Film.2021.1080p.BluRay.x264')]}
        getRowId={(release) => release.id}
      />,
    );

    expect(screen.getByText('1080p Blu-ray')).toBeInTheDocument();
  });
});
