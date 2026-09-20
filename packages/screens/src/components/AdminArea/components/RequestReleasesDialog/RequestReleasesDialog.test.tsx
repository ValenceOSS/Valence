import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceScreens/testing/aMediaRequest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { RequestReleasesDialog } from './RequestReleasesDialog';
import type * as Requests from '@ValenceClient/requests/fetchMediaRequests';
import type { Release } from '@ValenceContracts/schemas/Indexer';

const fetchMediaRequestReleases = vi.fn<typeof Requests.fetchMediaRequestReleases>();
const pickMediaRelease = vi.fn<typeof Requests.pickMediaRelease>();

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  fetchMediaRequestReleases: (...given: Parameters<typeof Requests.fetchMediaRequestReleases>) =>
    fetchMediaRequestReleases(...given),
  pickMediaRelease: (...given: Parameters<typeof Requests.pickMediaRelease>) =>
    pickMediaRelease(...given),
}));

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

const DOWNLOADING = aMediaRequest({ state: 'downloading' });

beforeEach(() => {
  fetchMediaRequestReleases.mockReset().mockResolvedValue({
    releases: [RELEASE],
    indexers: [
      {
        indexerId: RELEASE.indexerId,
        indexerName: 'Jackett',
        found: 1,
        tookMs: 900,
        problem: null,
      },
    ],
    judgements: [],
    pickedId: null,
  });
  pickMediaRelease.mockReset().mockResolvedValue({ value: DOWNLOADING, refusal: null });
});

describe('RequestReleasesDialog', () => {
  it('lists the releases for a request and fetches the one picked', async () => {
    const user = userEvent.setup();
    const handlers = { onClose: vi.fn(), onPicked: vi.fn() };

    renderInAnAddress(<RequestReleasesDialog request={aMediaRequest()} {...handlers} />);

    expect(await screen.findByText(RELEASE.title)).toBeInTheDocument();
    expect(screen.getByText('Jackett: 1 in 0.9s')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fetch this' }));

    await waitFor(() => {
      expect(handlers.onPicked).toHaveBeenCalledWith(DOWNLOADING);
    });
    expect(pickMediaRelease).toHaveBeenCalledWith(aMediaRequest().id, RELEASE);
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it('says why a pick could not be fetched', async () => {
    const user = userEvent.setup();

    pickMediaRelease.mockResolvedValue({
      value: null,
      refusal: { message: 'The film is on its way already' },
    });
    renderInAnAddress(
      <RequestReleasesDialog request={aMediaRequest()} onClose={vi.fn()} onPicked={vi.fn()} />,
    );

    await user.click(await screen.findByRole('button', { name: 'Fetch this' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The film is on its way already');
  });

  it('says where the releases could not be read', async () => {
    fetchMediaRequestReleases.mockRejectedValue(new Error('gone'));

    renderInAnAddress(
      <RequestReleasesDialog request={aMediaRequest()} onClose={vi.fn()} onPicked={vi.fn()} />,
    );

    expect(await screen.findByText(/The releases/)).toBeInTheDocument();
  });
});
