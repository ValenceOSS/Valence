import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
});
