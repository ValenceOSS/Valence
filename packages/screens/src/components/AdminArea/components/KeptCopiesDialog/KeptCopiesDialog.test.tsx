import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KeptCopiesDialog } from './KeptCopiesDialog';
import type { Rendition } from '@ValenceContracts/schemas/Rendition';

const fetchRenditionsMock = vi.hoisted(() => vi.fn());

const removeRenditionMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/admin/fetchReencodes', () => ({
  fetchRenditions: fetchRenditionsMock,
  fetchReencodes: vi.fn(() => Promise.resolve([])),
  removeRendition: removeRenditionMock,
}));

const MEDIA_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const aCopy: Rendition = {
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3311',
  mediaItemId: MEDIA_ID,
  kind: 'pinned',
  label: '1080p H.264',
  fileName: 'Arrival (2016) - 1080p H264.valence.mp4',
  quality: '1080p',
  sizeBytes: 3 * 1024 ** 3,
  container: 'mp4',
  durationSeconds: 7000,
  bitrateKbps: 3000,
  videoCodec: 'h264',
  videoRange: 'SDR',
  videoBitDepth: 8,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 1920,
  height: 1080,
  audioStreams: [{ index: 1, codec: 'aac', channels: 2, isDefault: true, isAtmos: false }],
  subtitleStreams: [],
  createdAt: '2026-09-30T02:00:00.000Z',
};

beforeEach(() => {
  fetchRenditionsMock.mockReset();
  removeRenditionMock.mockReset();
});

/**
 * Draws the dialog for one film, with a cache of its own.
 *
 * @param subject - The film, or nothing.
 * @returns What it was told.
 */
const draw = (
  subject: { mediaId: string; name: string } | null = { mediaId: MEDIA_ID, name: 'Arrival' },
) => {
  const onClose = vi.fn();

  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}
    >
      <KeptCopiesDialog subject={subject} onClose={onClose} />
    </QueryClientProvider>,
  );

  return { onClose };
};

describe('KeptCopiesDialog', () => {
  it('lists each copy with what it is, how large it is and its file', async () => {
    fetchRenditionsMock.mockResolvedValue([aCopy]);

    draw();

    expect(await screen.findByText(/1080p H\.264 · 3\.0 GB/)).toBeVisible();
    expect(screen.getByText('Arrival (2016) - 1080p H264.valence.mp4')).toBeVisible();
    expect(fetchRenditionsMock).toHaveBeenCalledWith(MEDIA_ID);
  });

  it('removes a copy when asked', async () => {
    fetchRenditionsMock.mockResolvedValue([aCopy]);
    removeRenditionMock.mockResolvedValue(true);

    draw();

    await userEvent.click(await screen.findByRole('button', { name: 'Remove' }));

    expect(removeRenditionMock).toHaveBeenCalledWith(aCopy.id);
  });

  it('says so where nothing is kept', async () => {
    fetchRenditionsMock.mockResolvedValue([]);

    draw();

    expect(await screen.findByText('No saved copies of this')).toBeVisible();
  });

  it('asks nothing while no film is chosen', () => {
    draw(null);

    expect(fetchRenditionsMock).not.toHaveBeenCalled();
  });

  it('closes when asked', async () => {
    fetchRenditionsMock.mockResolvedValue([]);

    const { onClose } = draw();

    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });
});
