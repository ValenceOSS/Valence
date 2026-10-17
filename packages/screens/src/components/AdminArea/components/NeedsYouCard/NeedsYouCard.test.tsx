import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NeedsYouCard } from './NeedsYouCard';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NeedsYouCard', () => {
  it('opens the page a count is dealt with on', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((path: string) =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              path.includes('availability') ? { isEnabled: false } : { records: [], total: 0 },
            ),
          ),
        ),
      ),
    );
    const onOpenPanel = vi.fn();

    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <NeedsYouCard onOpenPanel={onOpenPanel} />
      </QueryClientProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: /Library problems/ }));

    expect(onOpenPanel).toHaveBeenCalledWith('media');
  });
});
