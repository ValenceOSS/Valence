import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAShell } from '@ValenceScreens/testing/renderInAShell';
import { HiddenPanel } from './HiddenPanel';
import type { Hidden } from '@ValenceContracts/schemas/Hidden';
import type { HiddenSubject } from '@ValenceClient/library/fetchHidden';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

const fetchHidden = vi.fn<() => Promise<Hidden[]>>();
const setHidden = vi.fn<(subject: HiddenSubject, isHidden: boolean) => Promise<boolean>>();

vi.mock('@ValenceClient/library/fetchHidden', () => ({
  fetchHidden: () => fetchHidden(),
  setHidden: (subject: HiddenSubject, isHidden: boolean) => setHidden(subject, isHidden),
}));

const fetchLibraries = vi.hoisted(() =>
  vi.fn<() => Promise<{ id: string; name: string; kind: string }[]>>(),
);

vi.mock('@ValenceClient/library/fetchLibrary', () => ({ fetchLibraries }));

const fetchProfiles = vi.hoisted(() => vi.fn(() => Promise.resolve([])));

vi.mock('@ValenceClient/profiles/fetchProfiles', () => ({ fetchProfiles }));

const WATCHER: ViewerProfile = {
  id: 'profile-1',
  name: 'Dan',
  colour: '#e8503a',
  avatar: { kind: 'initial' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const entry = (overrides: Partial<Hidden> = {}): Hidden => ({
  kind: 'item',
  subjectId: 'media-1',
  title: 'Arrival',
  hiddenAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

const draw = () => renderInAShell(<HiddenPanel />, { watcher: WATCHER });

beforeEach(() => {
  fetchHidden.mockReset().mockResolvedValue([]);
  setHidden.mockReset().mockResolvedValue(true);
  fetchLibraries.mockReset().mockResolvedValue([
    { id: 'library-1', name: 'Shows', kind: 'shows' },
    { id: 'library-2', name: 'Films', kind: 'movies' },
  ]);
});

describe('HiddenPanel', () => {
  it('holds the list in a card that says what it is', async () => {
    draw();

    expect(await screen.findByRole('heading', { name: 'Hidden' })).toBeInTheDocument();
  });

  it('says anything here can be brought back', async () => {
    draw();

    expect(await screen.findByText(/Anything here can be brought back/i)).toBeInTheDocument();
  });

  it('names each thing that has been hidden', async () => {
    fetchHidden.mockResolvedValue([entry(), entry({ subjectId: 'media-2', title: 'Heat' })]);

    draw();

    expect(await screen.findByText('Arrival')).toBeInTheDocument();
    expect(await screen.findByText('Heat')).toBeInTheDocument();
  });

  it('says which of them is a whole programme or a whole library', async () => {
    fetchHidden.mockResolvedValue([
      entry({ kind: 'series', subjectId: 'series-1', title: 'Curb' }),
      entry({ kind: 'library', subjectId: 'library-1', title: 'Shows' }),
    ]);

    draw();

    expect(await screen.findByText('Programme')).toBeInTheDocument();
    expect(await screen.findByText('Whole library')).toBeInTheDocument();
  });

  it('offers a way back for each of them', async () => {
    fetchHidden.mockResolvedValue([entry()]);

    draw();

    expect(await screen.findByRole('button', { name: 'Bring Arrival back' })).toBeInTheDocument();
  });

  it('brings one back when asked, naming what it is bringing back', async () => {
    const user = userEvent.setup();

    fetchHidden.mockResolvedValue([
      entry({ kind: 'series', subjectId: 'series-1', title: 'Curb' }),
    ]);

    draw();

    await user.click(await screen.findByRole('button', { name: 'Bring Curb back' }));

    await waitFor(() => {
      expect(setHidden).toHaveBeenCalledWith({ kind: 'series', subjectId: 'series-1' }, false);
    });
  });

  it('takes the row away at once rather than waiting for the server', async () => {
    const user = userEvent.setup();

    setHidden.mockReturnValue(new Promise(() => {}));
    fetchHidden.mockResolvedValue([entry()]);

    draw();

    await user.click(await screen.findByRole('button', { name: 'Bring Arrival back' }));

    await waitFor(() => {
      expect(screen.queryByText('Arrival')).not.toBeInTheDocument();
    });
  });

  it('explains how something gets here when nothing has', async () => {
    draw();

    expect(await screen.findByText(/You have not hidden anything/i)).toBeInTheDocument();
  });

  it('says so when the list could not be read', async () => {
    fetchHidden.mockRejectedValue(new Error('no'));

    draw();

    expect(await screen.findByText(/What you have hidden/i)).toBeInTheDocument();
  });
});

describe('hiding a whole library', () => {
  it('offers every library, since a viewer never meets one anywhere else', async () => {
    draw();

    expect(
      await screen.findByRole('button', { name: 'Hide the whole Shows library' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Hide the whole Films library' }),
    ).toBeInTheDocument();
  });

  it('says why it is the quickest of the three', async () => {
    draw();

    expect(
      await screen.findByText(/never watches television hides one thing/i),
    ).toBeInTheDocument();
  });

  it('asks before hiding one, naming what goes with it', async () => {
    const user = userEvent.setup();

    draw();

    await user.click(await screen.findByRole('button', { name: 'Hide the whole Shows library' }));

    expect(await screen.findByText('Hide Shows?')).toBeInTheDocument();
    expect(await screen.findByText(/Everything in it disappears/i)).toBeInTheDocument();
  });

  it('hides it once somebody agrees', async () => {
    const user = userEvent.setup();

    draw();

    await user.click(await screen.findByRole('button', { name: 'Hide the whole Shows library' }));
    await user.click(await screen.findByRole('button', { name: 'Hide it' }));

    await waitFor(() => {
      expect(setHidden).toHaveBeenCalledWith({ kind: 'library', subjectId: 'library-1' }, true);
    });
  });

  it('brings one back without asking, an undoing needing no ceremony', async () => {
    const user = userEvent.setup();

    fetchHidden.mockResolvedValue([
      entry({ kind: 'library', subjectId: 'library-1', title: 'Shows' }),
    ]);

    draw();

    await user.click(await screen.findByRole('button', { name: 'Bring the Shows library back' }));

    await waitFor(() => {
      expect(setHidden).toHaveBeenCalledWith({ kind: 'library', subjectId: 'library-1' }, false);
    });
  });

  it('copes with a server that has no libraries yet', async () => {
    fetchLibraries.mockResolvedValue([]);

    draw();

    expect(await screen.findByText(/There are no libraries yet/i)).toBeInTheDocument();
  });
});
