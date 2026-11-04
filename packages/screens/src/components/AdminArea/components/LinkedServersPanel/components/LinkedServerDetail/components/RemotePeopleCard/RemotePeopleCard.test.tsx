import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aFederationActivity } from '@ValenceClient/testing/aFederationActivity';
import { aLinkedServer } from '@ValenceClient/testing/aLinkedServer';
import { aRemotePerson } from '@ValenceClient/testing/aRemotePerson';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { RemotePeopleCard } from './RemotePeopleCard';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { FederationActivity, RemotePerson } from '@ValenceContracts/schemas/LinkSharing';

const fetchRemotePeople = vi.fn<() => Promise<RemotePerson[]>>();
const blockRemotePerson =
  vi.fn<(id: string, personId: string, isBlocked: boolean) => Promise<Sent<RemotePerson | null>>>();

vi.mock('@ValenceClient/admin/fetchRemotePeople', () => ({
  fetchRemotePeople: () => fetchRemotePeople(),
}));

const fetchLinkActivity = vi.fn<() => Promise<FederationActivity[]>>();

vi.mock('@ValenceClient/admin/fetchLinkActivity', () => ({
  fetchLinkActivity: () => fetchLinkActivity(),
}));

vi.mock('@ValenceClient/admin/blockRemotePerson', () => ({
  blockRemotePerson: (id: string, personId: string, isBlocked: boolean) =>
    blockRemotePerson(id, personId, isBlocked),
}));

const FILMS = aLinkedServer({ state: 'linked' });

beforeEach(() => {
  fetchRemotePeople.mockReset().mockResolvedValue([aRemotePerson()]);
  fetchLinkActivity.mockReset().mockResolvedValue([]);
  blockRemotePerson.mockReset().mockResolvedValue({ value: aRemotePerson(), refusal: null });
});

describe('RemotePeopleCard', () => {
  it('says nobody has asked yet, where nobody has', async () => {
    fetchRemotePeople.mockResolvedValue([]);

    renderInAnAddress(<RemotePeopleCard server={FILMS} />);

    expect(
      await screen.findByText('No one from Films has requested anything yet.'),
    ).toBeInTheDocument();
  });

  it('blocks somebody', async () => {
    renderInAnAddress(<RemotePeopleCard server={FILMS} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Block Sam' }));

    await waitFor(() => {
      expect(blockRemotePerson).toHaveBeenCalledWith(FILMS.id, aRemotePerson().id, true);
    });
  });

  it('lets somebody blocked back in, naming somebody whose name was not sent', async () => {
    fetchRemotePeople.mockResolvedValue([
      aRemotePerson({ name: null, blockedAt: '2026-10-02T13:00:00.000Z' }),
    ]);

    renderInAnAddress(<RemotePeopleCard server={FILMS} />);

    expect(await screen.findByText('Blocked')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Unblock Someone from Films' }));

    await waitFor(() => {
      expect(blockRemotePerson).toHaveBeenCalledWith(FILMS.id, aRemotePerson().id, false);
    });
  });

  it('counts only what somebody asked to have requested, not everything they looked up', async () => {
    fetchLinkActivity.mockResolvedValue([
      aFederationActivity({
        id: '00000000-0000-4000-8000-0000000000e1',
        action: 'requests',
        count: 2,
      }),
      aFederationActivity({
        id: '00000000-0000-4000-8000-0000000000e2',
        action: 'media',
        count: 5,
      }),
      aFederationActivity({
        id: '00000000-0000-4000-8000-0000000000e3',
        action: 'requests',
        count: 1,
      }),
    ]);

    renderInAnAddress(<RemotePeopleCard server={FILMS} />);

    const row = await screen.findByRole('row', { name: /Sam/u });

    await waitFor(() => {
      expect(within(row).getByText('3')).toBeInTheDocument();
    });
    expect(within(row).queryByText('8')).not.toBeInTheDocument();
  });
});
