import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { LinkedServerList } from './LinkedServerList';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { LinkedServer } from '@ValenceContracts/schemas/LinkedServer';

type Answer = 'approve' | 'refuse' | 'check';

const answerLinkedServer =
  vi.fn<(id: string, what: Answer) => Promise<Sent<LinkedServer | null>>>();

const unlinkServer = vi.fn<(id: string) => Promise<Refusal>>();

vi.mock('@ValenceClient/admin/answerLinkedServer', () => ({
  answerLinkedServer: (id: string, what: Answer) => answerLinkedServer(id, what),
}));

vi.mock('@ValenceClient/admin/unlinkServer', () => ({
  unlinkServer: (id: string) => unlinkServer(id),
}));

const aServer = (change: Partial<LinkedServer> = {}): LinkedServer => ({
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Films',
  colour: '#e8503a',
  address: 'https://films.example',
  fingerprint: 'fedcba9876543210',
  state: 'linked',
  createdAt: '2026-10-02T12:00:00.000Z',
  linkedAt: null,
  lastSeenAt: null,
  ...change,
});

beforeEach(() => {
  answerLinkedServer.mockReset().mockResolvedValue({ value: aServer(), refusal: null });
  unlinkServer.mockReset().mockResolvedValue(null);
});

describe('LinkedServerList', () => {
  it('says so when nothing is linked', () => {
    renderInAnAddress(<LinkedServerList servers={[]} />);

    expect(screen.getByText('No servers are linked yet.')).toBeInTheDocument();
  });

  it('approves a server asking to link', async () => {
    renderInAnAddress(<LinkedServerList servers={[aServer({ state: 'awaitingUs' })]} />);

    expect(screen.getByText('Asking to link')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(answerLinkedServer).toHaveBeenCalledWith(aServer().id, 'approve');
    });
  });

  it('asks again after a server it is waiting on', async () => {
    renderInAnAddress(<LinkedServerList servers={[aServer({ state: 'awaitingThem' })]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Check again' }));

    await waitFor(() => {
      expect(answerLinkedServer).toHaveBeenCalledWith(aServer().id, 'check');
    });
  });

  it('unlinks only once asked', async () => {
    renderInAnAddress(<LinkedServerList servers={[aServer()]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Unlink' }));

    expect(unlinkServer).not.toHaveBeenCalled();
    expect(await screen.findByText('Unlink Films?')).toBeInTheDocument();

    const confirm = screen.getAllByRole('button', { name: 'Unlink' }).at(-1);

    if (confirm === undefined) {
      throw new Error('There was no button to confirm with.');
    }

    await userEvent.click(confirm);

    await waitFor(() => {
      expect(unlinkServer).toHaveBeenCalledWith(aServer().id);
    });
  });

  it('forgets a server that unlinked, without asking', async () => {
    renderInAnAddress(<LinkedServerList servers={[aServer({ state: 'unlinkedByThem' })]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Forget' }));

    await waitFor(() => {
      expect(unlinkServer).toHaveBeenCalledWith(aServer().id);
    });
  });
});
