import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { OnItsWayShelf } from './OnItsWayShelf';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

const held: { requests: MediaRequest[] } = { requests: [] };

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  fetchMediaRequests: () => Promise.resolve(held.requests),
}));

vi.mock('@ValenceClient/requests/fetchAskable', () => ({
  fetchRequestProgress: () => Promise.resolve([]),
}));

vi.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () =>
    Promise.resolve({ id: 'me', name: 'Ada', email: 'ada@valence.test', image: null }),
}));

describe('OnItsWayShelf', () => {
  it('shows what you asked for that has not come yet, and opens it', async () => {
    const onAsk = vi.fn();

    held.requests = [
      aMediaRequest({
        id: 'a',
        title: 'Coming Film',
        tmdbId: 7,
        state: 'wanted',
        requestedBy: { id: 'me', name: 'Ada' },
      }),
      aMediaRequest({
        id: 'b',
        title: 'Here Film',
        state: 'available',
        requestedBy: { id: 'me', name: 'Ada' },
      }),
      aMediaRequest({
        id: 'c',
        title: 'Their Film',
        state: 'wanted',
        requestedBy: { id: 'them', name: 'Sam' },
      }),
    ];

    renderInAnAddress(<OnItsWayShelf onAsk={onAsk} onOpenAll={vi.fn()} />);

    await userEvent.setup().click(await screen.findByRole('button', { name: /Coming Film/ }));

    expect(onAsk).toHaveBeenCalledWith('film:7');
    expect(screen.queryByRole('button', { name: /Here Film/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Their Film/ })).not.toBeInTheDocument();
  });

  it('draws nothing where nothing is on its way', async () => {
    held.requests = [];

    renderInAnAddress(<OnItsWayShelf onAsk={vi.fn()} onOpenAll={vi.fn()} />);

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(screen.queryByText('Requested')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(OnItsWayShelf.displayName).toBe('OnItsWayShelf');
  });
});
