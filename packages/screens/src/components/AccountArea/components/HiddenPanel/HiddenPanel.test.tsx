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
});

describe('HiddenPanel', () => {
  it('holds the list in a card that says what it is', async () => {
    draw();

    expect(await screen.findByRole('heading', { name: 'Hidden' })).toBeInTheDocument();
  });

  it('says plainly that this affects nobody else on the account', async () => {
    draw();

    expect(await screen.findByText(/Nobody else on this account is affected/i)).toBeInTheDocument();
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
