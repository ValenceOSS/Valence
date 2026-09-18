import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReencodeDialog } from './ReencodeDialog';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ReencodeEstimate } from '@ValenceContracts/schemas/Reencode';

const GIGABYTE = 1024 ** 3;

const item = (overrides: Partial<MediaSummary> = {}): MediaSummary => ({
  id: 'item-1',
  libraryId: 'library-1',
  title: 'Harry Potter and the Prisoner of Azkaban',
  year: 2004,
  durationSeconds: 8520,
  width: 3840,
  height: 2160,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  seriesTitle: null,
  seasonNumber: null,
  episodeNumber: null,
  sizeBytes: 70 * GIGABYTE,
  ...overrides,
});

const estimate = (overrides: Partial<ReencodeEstimate> = {}): ReencodeEstimate => ({
  candidates: [],
  nowBytes: 70 * GIGABYTE,
  afterBytes: 6 * GIGABYTE,
  freeBytes: 900 * GIGABYTE,
  committedBytes: 0,
  awaitingReview: 0,
  awaitingReviewCap: 5,
  ...overrides,
});

const props = {
  isOpen: true,
  media: [item()],
  estimate: null,
  onWeigh: vi.fn(),
  onStart: vi.fn(() => Promise.resolve(true)),
  onClose: vi.fn(),
};

describe('ReencodeDialog', () => {
  it('offers the three things somebody can ask for', () => {
    render(<ReencodeDialog {...props} />);

    expect(screen.getByRole('button', { name: 'Replace the original' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Keep alongside' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Audio only' })).toBeVisible();
  });

  it('says what replacing means, including that nothing else in Valence does it', () => {
    render(<ReencodeDialog {...props} />);

    expect(screen.getByText(/destroys your own media/)).toBeVisible();
  });

  it('says what keeping one alongside buys, which is the opposite trade', async () => {
    render(<ReencodeDialog {...props} />);

    await userEvent.click(screen.getByRole('button', { name: 'Keep alongside' }));

    expect(screen.getByText(/never converts anything/)).toBeVisible();
  });

  it('shows only the files above the size rule', () => {
    render(
      <ReencodeDialog
        {...props}
        media={[item(), item({ id: 'item-2', title: 'A short', sizeBytes: 2 * GIGABYTE })]}
      />,
    );

    expect(screen.queryByText('A short')).toBeNull();
  });

  it('weighs what was chosen', async () => {
    const onWeigh = vi.fn();

    render(<ReencodeDialog {...props} onWeigh={onWeigh} />);

    await userEvent.click(
      screen.getByRole('checkbox', {
        name: /Harry Potter and the Prisoner of Azkaban/,
      }),
    );

    expect(onWeigh).toHaveBeenCalledWith(['item-1'], expect.objectContaining({ mode: 'replace' }));
  });

  it('shows the totals both ways round', () => {
    render(<ReencodeDialog {...props} estimate={estimate()} />);

    expect(screen.getByText(/Frees about/)).toBeVisible();
  });

  it('refuses to start when there is not enough room, and says what would happen', () => {
    render(
      <ReencodeDialog
        {...props}
        estimate={estimate({ afterBytes: 800 * GIGABYTE, freeBytes: GIGABYTE })}
      />,
    );

    expect(screen.getByText('There is not enough room')).toBeVisible();
  });

  it('says the queue is paused when too many are already waiting', () => {
    render(
      <ReencodeDialog
        {...props}
        estimate={estimate({ awaitingReview: 5, awaitingReviewCap: 5 })}
      />,
    );

    expect(screen.getByText('The queue is paused')).toBeVisible();
  });

  it('asks again before queueing a replacement', async () => {
    const onStart = vi.fn(() => Promise.resolve(true));

    render(
      <ReencodeDialog
        {...props}
        onStart={onStart}
        estimate={estimate({
          candidates: [
            {
              mediaId: 'item-1',
              title: 'Azkaban',
              seriesTitle: null,
              libraryId: 'library-1',
              sizeBytes: 70 * GIGABYTE,
              durationSeconds: 8520,
              width: 3840,
              height: 2160,
              videoCodec: 'h264',
              videoRange: 'SDR',
              estimatedBytes: 6 * GIGABYTE,
              refusal: null,
            },
          ],
        })}
      />,
    );

    await userEvent.click(
      screen.getByRole('checkbox', { name: /Harry Potter and the Prisoner of Azkaban/ }),
    );
    await userEvent.click(screen.getByRole('button', { name: /^Re-encode 1$/ }));

    expect(screen.getByText(/gone for good/)).toBeVisible();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('says why a file was turned away, against the file it is about', () => {
    render(
      <ReencodeDialog
        {...props}
        estimate={estimate({
          candidates: [
            {
              mediaId: 'item-1',
              title: 'Azkaban',
              seriesTitle: null,
              libraryId: 'library-1',
              sizeBytes: 70 * GIGABYTE,
              durationSeconds: 8520,
              width: 3840,
              height: 2160,
              videoCodec: 'h264',
              videoRange: 'SDR',
              estimatedBytes: null,
              refusal: { code: 'BeingWatched', detail: 'Somebody is watching it now.' },
            },
          ],
        })}
      />,
    );

    expect(screen.getByText(/Somebody is watching it now/)).toBeVisible();
  });
});
