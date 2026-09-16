import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { DecideForSomebody } from './DecideForSomebody';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const accessMocks = vi.hoisted(() => ({
  fetchExceptionsOn: vi.fn(),
  setException: vi.fn(),
  clearException: vi.fn(),
  fetchLibraryAccess: vi.fn(),
  setLibraryAccess: vi.fn(),
  setCeiling: vi.fn(),
  fetchExceptions: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchLibraryAccess', () => accessMocks);

const fetchAccounts = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/admin/fetchAccounts', () => ({ fetchAccounts }));

const media = (overrides: Partial<MediaSummary> = {}): MediaSummary => ({
  id: 'media-1',
  libraryId: 'library-1',
  title: 'Arrival',
  year: 2016,
  durationSeconds: 7200,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  parentId: null,
  extraKind: null,
  versionLabel: null,
  rating: null,
  seriesTitle: null,
  seasonNumber: null,
  episodeNumber: null,
  genres: null,
  ...overrides,
});

beforeEach(() => {
  for (const mock of Object.values(accessMocks)) {
    mock.mockReset();
  }

  accessMocks.fetchExceptionsOn.mockResolvedValue([]);
  accessMocks.setException.mockResolvedValue(null);
  accessMocks.clearException.mockResolvedValue(null);

  fetchAccounts.mockReset().mockResolvedValue([
    { id: 'usr_1', name: 'Dan', email: 'dan@valence.local', roles: [], isBanned: false },
    { id: 'usr_2', name: 'Kid', email: 'kid@valence.local', roles: [], isBanned: false },
  ]);
});

describe('DecideForSomebody', () => {
  it('is shut while nothing is being decided', () => {
    renderInAnAddress(<DecideForSomebody about={null} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names the film it is deciding about', async () => {
    renderInAnAddress(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    expect(await screen.findByText('Who may watch Arrival')).toBeInTheDocument();
  });

  it('decides about the programme rather than the episode standing for it', async () => {
    renderInAnAddress(
      <DecideForSomebody
        about={media({ seriesId: 'series-1', seriesTitle: 'Curb Your Enthusiasm' })}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByText('Who may watch Curb Your Enthusiasm')).toBeInTheDocument();
  });

  it('says a denial always wins, which is what people rely on', async () => {
    renderInAnAddress(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    expect(await screen.findByText(/A denial always wins/i)).toBeInTheDocument();
  });

  it('offers every account, since a denial is worth having with no limit set', async () => {
    renderInAnAddress(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    expect(await screen.findByText('Dan')).toBeInTheDocument();
    expect(await screen.findByText('Kid')).toBeInTheDocument();
  });

  it('allows it for somebody', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Allow Arrival for Kid' }));

    await waitFor(() => {
      expect(accessMocks.setException).toHaveBeenCalledWith(
        'usr_2',
        { kind: 'item', subjectId: 'media-1' },
        'allow',
      );
    });
  });

  it('denies it for somebody', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Deny Arrival for Kid' }));

    await waitFor(() => {
      expect(accessMocks.setException).toHaveBeenCalledWith(
        'usr_2',
        { kind: 'item', subjectId: 'media-1' },
        'deny',
      );
    });
  });

  it('shows what was already decided rather than asking blind', async () => {
    accessMocks.fetchExceptionsOn.mockResolvedValue([{ accountId: 'usr_2', effect: 'deny' }]);

    renderInAnAddress(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    expect(await screen.findByText('deny')).toBeInTheDocument();
  });

  it('takes a decision back when the same one is pressed again', async () => {
    const user = userEvent.setup();

    accessMocks.fetchExceptionsOn.mockResolvedValue([{ accountId: 'usr_2', effect: 'deny' }]);

    renderInAnAddress(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Deny Arrival for Kid' }));

    await waitFor(() => {
      expect(accessMocks.clearException).toHaveBeenCalledWith('usr_2', {
        kind: 'item',
        subjectId: 'media-1',
      });
    });
  });
});
