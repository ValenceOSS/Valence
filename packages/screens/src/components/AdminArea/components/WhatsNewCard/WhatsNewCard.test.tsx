import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { WhatsNewCard } from './WhatsNewCard';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WhatsNewCard', () => {
  it('says nothing has arrived only once the libraries have been read', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ isEnabled: false })))),
    );

    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <WhatsNewCard libraries={[]} isReadingLibraries onOpenPanel={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    expect(screen.queryByText('Nothing has arrived yet.')).not.toBeInTheDocument();
  });

  it('says when nothing has arrived', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ isEnabled: false })))),
    );

    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <WhatsNewCard libraries={[]} onOpenPanel={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Nothing has arrived yet.')).toBeInTheDocument();
  });

  it('names who asked, never the quality, and leaves out titles only followed', async () => {
    const requests = [
      aMediaRequest({
        id: '00000000-0000-4000-8000-000000000001',
        title: 'Asked Film',
        state: 'available',
        profileName: '4K',
        requestedBy: {
          id: 'them',
          name: 'Sam',
          askingProfile: { profileId: '00000000-0000-4000-8000-000000000003', name: 'Kids' },
        },
      }),
      aMediaRequest({
        id: '00000000-0000-4000-8000-000000000002',
        title: 'Followed Show',
        state: 'available',
        origin: 'monitored',
        profileName: '4K',
      }),
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve(
          new Response(
            JSON.stringify(url.endsWith('/api/requests/media') ? requests : { isEnabled: true }),
          ),
        ),
      ),
    );

    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <WhatsNewCard libraries={[]} onOpenPanel={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Asked Film')).toBeInTheDocument();
    expect(screen.getByText('Asked for by Kids from Sam')).toBeInTheDocument();
    expect(screen.queryByText(/4K/)).not.toBeInTheDocument();
    expect(screen.queryByText('Followed Show')).not.toBeInTheDocument();
  });
});
