import { screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { LinkedServersPanel } from './LinkedServersPanel';
import type { Linking } from '@ValenceContracts/schemas/LinkedServer';

const fetchLinking = vi.fn<() => Promise<Linking>>();

vi.mock('@ValenceClient/admin/fetchLinking', () => ({
  fetchLinking: () => fetchLinking(),
}));

const LINKING: Linking = {
  identity: {
    name: 'Anime',
    colour: '#3a8ee8',
    address: 'https://anime.example',
    protocols: ['valence-link/1'],
    publicKey: { kty: 'OKP', crv: 'Ed25519', x: 'AAAA' },
    fingerprint: '0123456789abcdef',
  },
  invites: [],
  servers: [
    {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Films',
      colour: '#e8503a',
      address: 'https://films.example',
      fingerprint: 'fedcba9876543210',
      state: 'linked',
      createdAt: '2026-10-02T12:00:00.000Z',
      linkedAt: '2026-10-02T12:00:00.000Z',
      lastSeenAt: null,
    },
  ],
};

beforeEach(() => {
  fetchLinking.mockReset().mockResolvedValue(LINKING);
});

describe('LinkedServersPanel', () => {
  it('shows the linked servers, the invites, and this server', async () => {
    renderInAnAddress(<LinkedServersPanel />);

    expect(await screen.findByText('Films')).toBeInTheDocument();
    expect(screen.getByText('Invite a server')).toBeInTheDocument();
    expect(screen.getByText('Link to a server')).toBeInTheDocument();
    expect(screen.getByText('0123 4567 89ab cdef')).toBeInTheDocument();
  });

  it('says so when linking could not be read', async () => {
    fetchLinking.mockRejectedValue(new Error('offline'));

    renderInAnAddress(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <LinkedServersPanel />
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Linked servers could not be read.');
  });
});
