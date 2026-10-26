import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { FindSubtitlesDialog } from './FindSubtitlesDialog';
import type { FoundSubtitles } from '@ValenceContracts/schemas/SubtitleFinding';

const findSubtitles = vi.hoisted(() =>
  vi.fn<(mediaId: string, language: string) => Promise<FoundSubtitles>>(),
);

vi.mock('@ValenceClient/library/findSubtitles', () => ({
  findSubtitles: (mediaId: string, language: string) => findSubtitles(mediaId, language),
}));

vi.mock('@ValenceClient/admin/fetchSubtitleSetup', () => ({
  fetchSubtitleSetup: () => Promise.reject(new Error('not set up in this test')),
}));

const MEDIA = { id: '00000000-0000-4000-8000-000000000001', name: 'A film' };

beforeEach(() => {
  findSubtitles.mockReset();
});

describe('FindSubtitlesDialog', () => {
  it('says so when the sites have nothing in that language', async () => {
    findSubtitles.mockResolvedValue({ subtitles: [], isSetUp: true });

    renderInAnAddress(<FindSubtitlesDialog media={MEDIA} onClose={vi.fn()} />);

    expect(await screen.findByText(/Nothing was found in that language/)).toBeInTheDocument();
  });

  it('says why the sites could not be searched, rather than that they found nothing', async () => {
    findSubtitles.mockRejectedValue(
      new RequestFailed(
        '/api/media/x/subtitles/found',
        503,
        false,
        'OpenSubtitles didn’t accept Valence’s key. An administrator can check it in Settings.',
      ),
    );

    renderInAnAddress(<FindSubtitlesDialog media={MEDIA} onClose={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'OpenSubtitles didn’t accept Valence’s key. An administrator can check it in Settings.',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FindSubtitlesDialog.displayName).toBe('FindSubtitlesDialog');
  });
});
