import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReleasePickTable } from './ReleasePickTable';
import type { Release } from '@ValenceContracts/schemas/Indexer';

const RELEASE: Release = {
  id: 'dune-web',
  title: 'Dune.2021.1080p.WEB-DL.x264-GRP',
  indexerId: '0f8fad5b-d9cb-469f-a165-70867728950e',
  indexerName: 'Jackett',
  protocol: 'torrent',
  sizeBytes: null,
  seeders: 12,
  leechers: 3,
  grabs: null,
  publishedAt: null,
  categories: [],
  downloadUrl: null,
  magnetUrl: 'magnet:?xt=urn:btih:abc',
  infoUrl: null,
  infoHash: null,
  downloadFactor: null,
  uploadFactor: null,
  minimumRatio: null,
  minimumSeedSeconds: null,
};

const FOUND = {
  releases: [RELEASE],
  indexers: [
    { indexerId: RELEASE.indexerId, indexerName: 'Jackett', found: 1, tookMs: 900, problem: null },
  ],
  judgements: [],
  pickedId: null,
};

describe('ReleasePickTable', () => {
  it('lists what was found and what each indexer said, and says which was picked', async () => {
    const onPick = vi.fn();

    render(
      <ReleasePickTable
        found={FOUND}
        foundAt={0}
        pickingId={null}
        emptyMessage="None"
        onPick={onPick}
      />,
    );

    expect(screen.getByText('Jackett: 1 in 0.9s')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Fetch this' }));

    expect(onPick).toHaveBeenCalledWith(RELEASE);
  });

  it('waits while one is being fetched, and says when nothing was found', () => {
    const { rerender } = render(
      <ReleasePickTable
        found={FOUND}
        foundAt={0}
        pickingId="other"
        emptyMessage="None"
        onPick={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Fetch this' })).toBeDisabled();

    rerender(
      <ReleasePickTable
        found={{ ...FOUND, releases: [] }}
        foundAt={0}
        pickingId={null}
        emptyMessage="Nothing for it."
        onPick={vi.fn()}
      />,
    );

    expect(screen.getByText('Nothing for it.')).toBeInTheDocument();
  });
});
