import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReencodeDialog } from './ReencodeDialog';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ReencodeCandidate, ReencodeEstimate } from '@ValenceContracts/schemas/Reencode';

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

const candidate = (overrides: Partial<ReencodeCandidate> = {}): ReencodeCandidate => ({
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
  ...overrides,
});

const estimate = (overrides: Partial<ReencodeEstimate> = {}): ReencodeEstimate => ({
  candidates: [candidate()],
  nowBytes: 70 * GIGABYTE,
  afterBytes: 6 * GIGABYTE,
  freeBytes: 900 * GIGABYTE,
  committedBytes: 0,
  awaitingReview: 0,
  awaitingReviewCap: 5,
  ...overrides,
});

const LIBRARIES = [
  {
    id: 'library-1',
    name: 'Movies',
    kind: 'movies' as const,
    path: '/media/Movies',
    itemCount: 1,
    lastScannedAt: null,
    defaultAudioLanguage: null,
    filesAtOnce: null,
    takesRequests: true,
    requestProfileId: null,
    requestPath: null,
  },
  {
    id: 'library-2',
    name: 'Shows',
    kind: 'shows' as const,
    path: '/media/Shows',
    itemCount: 1,
    lastScannedAt: null,
    defaultAudioLanguage: null,
    filesAtOnce: null,
    takesRequests: true,
    requestProfileId: null,
    requestPath: null,
  },
];

const props = {
  isOpen: true,
  libraries: LIBRARIES,
  media: [item()],
  estimate: null,
  onWeigh: vi.fn(),
  onStart: vi.fn(() => Promise.resolve(true)),
  onClose: vi.fn(),
};

const theFilm = () =>
  screen.getByRole('checkbox', { name: /Harry Potter and the Prisoner of Azkaban/ });

describe('ReencodeDialog', () => {
  it('offers the three things somebody can ask for', () => {
    render(<ReencodeDialog {...props} />);

    expect(screen.getByRole('button', { name: 'Replace' })).toBeVisible();
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

  const aProgramme = [
    item({
      id: 'a',
      libraryId: 'library-1',
      title: 'Charm Offensive',
      seriesTitle: 'Pluribus',
      seasonNumber: 1,
      episodeNumber: 1,
      sizeBytes: 4 * GIGABYTE,
    }),
    item({
      id: 'b',
      libraryId: 'library-1',
      title: 'Grace',
      seriesTitle: 'Pluribus',
      seasonNumber: 1,
      episodeNumber: 2,
      sizeBytes: 2 * GIGABYTE,
    }),
  ];

  it('offers a programme as one row carrying what all of it costs', () => {
    render(<ReencodeDialog {...props} media={aProgramme} />);

    expect(screen.getByRole('checkbox', { name: /Pluribus/ })).toHaveAccessibleDescription(
      /2 files · 6\.0 GB/,
    );
  });

  it('opens a programme to every episode it is made of', async () => {
    render(<ReencodeDialog {...props} media={aProgramme} />);

    expect(screen.queryByRole('checkbox', { name: /Charm Offensive/ })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /Show what Pluribus is made of/ }));

    expect(screen.getByRole('checkbox', { name: /Charm Offensive/ })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Grace/ })).toBeInTheDocument();
  });

  it('takes every episode when the programme itself is ticked', async () => {
    const onWeigh = vi.fn();

    render(<ReencodeDialog {...props} media={aProgramme} onWeigh={onWeigh} />);

    await userEvent.click(screen.getByRole('checkbox', { name: /Pluribus/ }));

    await waitFor(() => {
      expect(onWeigh).toHaveBeenCalledWith(['a', 'b'], expect.anything());
    });
  });

  it('says a programme is partly taken when only some of it is', async () => {
    render(<ReencodeDialog {...props} media={aProgramme} />);

    await userEvent.click(screen.getByRole('button', { name: /Show what Pluribus is made of/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Charm Offensive/ }));

    expect(screen.getByRole('checkbox', { name: /Pluribus/ })).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
  });

  it('gathers a film cuts under the film, not only a programme episodes', () => {
    render(
      <ReencodeDialog
        {...props}
        media={[
          item({ id: 'film', title: 'Parasite', parentId: null }),
          item({ id: 'bw', title: 'Parasite', parentId: 'film', versionLabel: 'B&W' }),
        ]}
      />,
    );

    expect(screen.getByRole('checkbox', { name: /Parasite/ })).toHaveAccessibleDescription(
      /2 files/,
    );
  });

  it('draws an ordinary film as a plain row with nothing to open', () => {
    render(<ReencodeDialog {...props} />);

    expect(screen.queryByRole('button', { name: /is made of/ })).toBeNull();
  });

  it('shows one library at a time, so films and episodes are not one long list', () => {
    render(
      <ReencodeDialog
        {...props}
        media={[
          item({ id: 'a', libraryId: 'library-1', title: 'Azkaban' }),
          item({ id: 'b', libraryId: 'library-2', title: 'Charm Offensive' }),
        ]}
      />,
    );

    expect(screen.getByRole('checkbox', { name: /Azkaban/ })).toBeVisible();
    expect(screen.queryByText('Charm Offensive')).toBeNull();
  });

  it('shows the other library when asked for it', async () => {
    render(
      <ReencodeDialog
        {...props}
        media={[
          item({ id: 'a', libraryId: 'library-1', title: 'Azkaban' }),
          item({ id: 'b', libraryId: 'library-2', title: 'Charm Offensive' }),
        ]}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Shows' }));

    expect(screen.getByRole('checkbox', { name: /Charm Offensive/ })).toBeVisible();
  });

  it('remembers what was chosen in a library it is no longer looking at', async () => {
    render(
      <ReencodeDialog
        {...props}
        media={[
          item({ id: 'a', libraryId: 'library-1', title: 'Azkaban' }),
          item({ id: 'b', libraryId: 'library-2', title: 'Charm Offensive' }),
        ]}
      />,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: /Azkaban/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Shows' }));

    expect(screen.getByText(/1 chosen in another library/)).toBeVisible();
  });

  it('offers no library picker where there is only one', () => {
    render(<ReencodeDialog {...props} libraries={[LIBRARIES[0]!]} />);

    expect(screen.queryByRole('button', { name: 'Movies' })).toBeNull();
  });

  it('shows everything by default rather than hiding it behind a size rule', () => {
    render(<ReencodeDialog {...props} media={[item({ sizeBytes: 2 * GIGABYTE })]} />);

    expect(theFilm()).toBeVisible();
  });

  it('hides what falls below the size rule once one is set', async () => {
    render(<ReencodeDialog {...props} media={[item({ sizeBytes: 2 * GIGABYTE })]} />);

    await userEvent.type(screen.getByRole('spinbutton', { name: 'Larger than (GB)' }), '20');

    expect(screen.queryByText('Harry Potter and the Prisoner of Azkaban')).toBeNull();
  });

  it('names the codec the way a person writes it on every row, not only in the menu', () => {
    render(<ReencodeDialog {...props} />);

    expect(screen.getByText(/3840×2160 · H\.264/)).toBeVisible();
  });

  it('says a size was never recorded rather than claiming the file is empty', () => {
    render(<ReencodeDialog {...props} media={[item({ sizeBytes: null })]} />);

    expect(screen.getByText(/size not recorded/)).toBeVisible();
    expect(screen.queryByText(/0 B/)).toBeNull();
  });

  it('names the codec the way a person writes it, not the way ffmpeg does', () => {
    render(<ReencodeDialog {...props} />);

    expect(screen.getByRole('button', { name: 'Codec' })).toHaveTextContent('HEVC');
  });

  it('weighs what was chosen', async () => {
    const onWeigh = vi.fn();

    render(<ReencodeDialog {...props} onWeigh={onWeigh} />);

    await userEvent.click(theFilm());

    await waitFor(() => {
      expect(onWeigh).toHaveBeenCalledWith(['item-1'], expect.objectContaining({ mode: 'replace' }));
    });
  });

  it('weighs once for a burst of choosing rather than once per tick', async () => {
    const onWeigh = vi.fn();

    render(<ReencodeDialog {...props} media={aProgramme} onWeigh={onWeigh} />);

    await userEvent.click(screen.getByRole('checkbox', { name: /Pluribus/ }));

    await waitFor(() => {
      expect(onWeigh).toHaveBeenCalledWith(['a', 'b'], expect.anything());
    });

    expect(onWeigh.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('does not weigh again merely because the caller handed back a new function', async () => {
    const onWeigh = vi.fn();

    const { rerender } = render(<ReencodeDialog {...props} onWeigh={onWeigh} />);

    await waitFor(() => {
      expect(onWeigh).toHaveBeenCalled();
    });

    const soFar = onWeigh.mock.calls.length;

    rerender(
      <ReencodeDialog
        {...props}
        onWeigh={(mediaIds, settings) => {
          onWeigh(mediaIds, settings);
        }}
      />,
    );
    rerender(
      <ReencodeDialog
        {...props}
        onWeigh={(mediaIds, settings) => {
          onWeigh(mediaIds, settings);
        }}
      />,
    );

    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });

    expect(onWeigh.mock.calls.length).toBe(soFar);
  });

  it('says nothing about cost until something is chosen', () => {
    render(<ReencodeDialog {...props} estimate={estimate()} />);

    expect(screen.queryByText(/Frees about/)).toBeNull();
  });

  it('shows the totals both ways round once something is', async () => {
    render(<ReencodeDialog {...props} estimate={estimate()} />);

    await userEvent.click(theFilm());

    expect(screen.getByText(/Frees about/)).toBeVisible();
  });

  it('refuses to start when there is not enough room, and says what would happen', async () => {
    render(
      <ReencodeDialog
        {...props}
        estimate={estimate({ afterBytes: 800 * GIGABYTE, freeBytes: GIGABYTE })}
      />,
    );

    await userEvent.click(theFilm());

    expect(screen.getByText('There is not enough room')).toBeVisible();
  });

  it('says the queue is paused when too many are already waiting', async () => {
    render(
      <ReencodeDialog {...props} estimate={estimate({ awaitingReview: 5, awaitingReviewCap: 5 })} />,
    );

    await userEvent.click(theFilm());

    expect(screen.getByText('The queue is paused')).toBeVisible();
  });

  it('will not start with nothing chosen, and says so on the button', () => {
    render(<ReencodeDialog {...props} />);

    expect(screen.getByRole('button', { name: 'Choose something first' })).toBeDisabled();
  });

  it('asks again before queueing a replacement', async () => {
    const onStart = vi.fn(() => Promise.resolve(true));

    render(<ReencodeDialog {...props} onStart={onStart} estimate={estimate()} />);

    await userEvent.click(theFilm());
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
            candidate({
              estimatedBytes: null,
              refusal: { code: 'BeingWatched', detail: 'Somebody is watching it now.' },
            }),
          ],
        })}
      />,
    );

    expect(screen.getByText(/Somebody is watching it now/)).toBeVisible();
  });
});
