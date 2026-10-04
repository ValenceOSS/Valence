import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aLinkedServer } from '@ValenceClient/testing/aLinkedServer';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { TheirLibrariesCard } from './TheirLibrariesCard';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { TheirLibraries } from '@ValenceContracts/schemas/LinkSharing';

type Read = { libraries: number; kept: number; forgotten: number };

const fetchTheirLibraries = vi.fn<() => Promise<TheirLibraries>>();
const syncLinkedServer = vi.fn<(id: string) => Promise<Sent<Read | null>>>();

vi.mock('@ValenceClient/admin/fetchTheirLibraries', () => ({
  fetchTheirLibraries: () => fetchTheirLibraries(),
}));

vi.mock('@ValenceClient/admin/syncLinkedServer', () => ({
  syncLinkedServer: (id: string) => syncLinkedServer(id),
}));

const FILMS = aLinkedServer({ state: 'linked' });

beforeEach(() => {
  fetchTheirLibraries.mockReset().mockResolvedValue({
    isReachable: true,
    libraries: [{ id: '00000000-0000-4000-8000-0000000000f1', name: 'Cinema', kind: 'movies' }],
  });
  syncLinkedServer
    .mockReset()
    .mockResolvedValue({ value: { libraries: 1, kept: 12, forgotten: 0 }, refusal: null });
});

describe('TheirLibrariesCard', () => {
  it('names what the other server shares, by kind', async () => {
    renderInAnAddress(<TheirLibrariesCard server={FILMS} />);

    expect(await screen.findByText('Cinema')).toBeInTheDocument();
    expect(screen.getByText('Movies')).toBeInTheDocument();
  });

  it('says it shares nothing yet', async () => {
    fetchTheirLibraries.mockResolvedValue({ isReachable: true, libraries: [] });

    renderInAnAddress(<TheirLibrariesCard server={FILMS} />);

    expect(
      await screen.findByText('Films isn’t sharing anything with this server yet.'),
    ).toBeInTheDocument();
  });

  it('says it could not be reached', async () => {
    fetchTheirLibraries.mockResolvedValue({ isReachable: false, libraries: [] });

    renderInAnAddress(<TheirLibrariesCard server={FILMS} />);

    expect(await screen.findByText('Couldn’t reach Films.')).toBeInTheDocument();
  });

  it('reads it all again now', async () => {
    renderInAnAddress(<TheirLibrariesCard server={FILMS} />);

    await userEvent.click(screen.getByRole('button', { name: 'Sync now' }));

    await waitFor(() => {
      expect(syncLinkedServer).toHaveBeenCalledWith(FILMS.id);
    });
  });
});
