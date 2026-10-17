import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WhatsNewCard } from './WhatsNewCard';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WhatsNewCard', () => {
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
