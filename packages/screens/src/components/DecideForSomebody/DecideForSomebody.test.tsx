import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAShell } from '@ValenceScreens/testing/renderInAShell';
import { DecideForSomebody } from './DecideForSomebody';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { Account } from '@ValenceClient/admin/fetchAccounts';

const accessMocks = vi.hoisted(() => ({
  fetchExceptionsOn: vi.fn(),
  setException: vi.fn(),
  clearException: vi.fn(),
  fetchLibraryAccess: vi.fn(),
  setLibraryAccess: vi.fn(),
  setCeiling: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchLibraryAccess', () => accessMocks);

const fetchAccounts = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/admin/fetchAccounts', () => ({ fetchAccounts }));

const SIGNED_IN = '00000000-0000-4000-8000-000000000001';

const account = (overrides: Partial<Account> = {}): Account => ({
  id: 'usr_1',
  name: 'Somebody',
  email: 'somebody@valence.local',
  createdAt: '',
  isBanned: false,
  banReason: null,
  position: null,
  isAdministrator: false,
  face: null,
  roles: [],
  ...overrides,
});

/**
 * The three choices offered against one account.
 */
const choicesFor = async (name: string) =>
  within(await screen.findByRole('group', { name: new RegExp(`: ${name}$`) }));

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

  fetchAccounts
    .mockReset()
    .mockResolvedValue([
      account({ id: SIGNED_IN, name: 'Me' }),
      account({ id: 'usr_2', name: 'Kid', email: 'kid@valence.local' }),
      account({ id: 'usr_3', name: 'Boss', isAdministrator: true }),
    ]);
});

describe('DecideForSomebody', () => {
  it('is shut while nothing is being decided', () => {
    renderInAShell(<DecideForSomebody about={null} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names the film it is deciding about', async () => {
    renderInAShell(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    expect(await screen.findByText('Who may watch Arrival')).toBeInTheDocument();
  });

  it('decides about the programme rather than the episode standing for it', async () => {
    renderInAShell(
      <DecideForSomebody
        about={media({ seriesId: 'series-1', seriesTitle: 'Curb Your Enthusiasm' })}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByText('Who may watch Curb Your Enthusiasm')).toBeInTheDocument();
  });

  it('says a denial always wins, which is what people rely on', async () => {
    renderInAShell(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    expect(await screen.findByText(/A denial always wins/i)).toBeInTheDocument();
  });

  it('leaves out whoever is deciding, hiding being what they want for themselves', async () => {
    renderInAShell(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    expect(await screen.findByText('Kid')).toBeInTheDocument();
    expect(screen.queryByText('Me')).not.toBeInTheDocument();
  });

  it('leaves out administrators, for whom both controls would do nothing', async () => {
    renderInAShell(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    await screen.findByText('Kid');

    expect(screen.queryByText('Boss')).not.toBeInTheDocument();
  });

  it('says so plainly when that leaves nobody', async () => {
    fetchAccounts.mockResolvedValue([account({ id: SIGNED_IN, name: 'Me' })]);

    renderInAShell(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    expect(await screen.findByText(/There is nobody to decide about/i)).toBeInTheDocument();
  });

  it('shows each face, and who they are', async () => {
    renderInAShell(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    expect(await screen.findByText('kid@valence.local')).toBeInTheDocument();
  });

  it('allows it for somebody', async () => {
    const user = userEvent.setup();

    renderInAShell(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    await user.click((await choicesFor('Kid')).getByRole('button', { name: 'Allow' }));

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

    renderInAShell(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    await user.click((await choicesFor('Kid')).getByRole('button', { name: 'Deny' }));

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

    renderInAShell(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    expect((await choicesFor('Kid')).getByRole('button', { name: 'Deny' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('hands it back to their own limit, which is a state the control can show', async () => {
    const user = userEvent.setup();

    accessMocks.fetchExceptionsOn.mockResolvedValue([{ accountId: 'usr_2', effect: 'deny' }]);

    renderInAShell(<DecideForSomebody about={media()} onClose={vi.fn()} />);

    await user.click((await choicesFor('Kid')).getByRole('button', { name: 'Their limit' }));

    await waitFor(() => {
      expect(accessMocks.clearException).toHaveBeenCalledWith('usr_2', {
        kind: 'item',
        subjectId: 'media-1',
      });
    });
  });
});
