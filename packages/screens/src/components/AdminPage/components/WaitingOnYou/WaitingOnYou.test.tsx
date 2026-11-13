import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WaitingOnYou } from './WaitingOnYou';

afterEach(() => {
  vi.unstubAllGlobals();
});

const attention = vi.hoisted(() => ({
  requests: 0,
  failedRequests: 2,
  downloads: 0,
  jobs: 0,
  health: 3,
  latest: null,
  isLatestADevBuild: false,
}));

vi.mock('@ValenceScreens/admin/useAdminAttention', () => ({
  useAdminAttention: () => attention,
}));

/**
 * Draws the buttons against a server that says whether requests are on.
 *
 * @param hasRequests - Whether requests are on.
 * @param onOpenPanel - Told which page to open.
 * @returns What was drawn.
 */
const draw = (hasRequests: boolean, onOpenPanel = vi.fn()) => {
  vi.stubGlobal(
    'fetch',
    vi.fn((path: string) =>
      Promise.resolve(
        new Response(
          JSON.stringify(
            path.includes('availability') ? { isEnabled: hasRequests } : { records: [], total: 0 },
          ),
        ),
      ),
    ),
  );

  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <WaitingOnYou onOpenPanel={onOpenPanel} />
    </QueryClientProvider>,
  );
};

describe('WaitingOnYou', () => {
  it('opens the page a count is dealt with on', async () => {
    const onOpenPanel = vi.fn();

    draw(false, onOpenPanel);
    fireEvent.click(await screen.findByRole('button', { name: /Library problems/ }));

    expect(onOpenPanel).toHaveBeenCalledWith('media');
  });

  it('opens the catalogue for failed requests, where they are listed', async () => {
    const onOpenPanel = vi.fn();

    draw(true, onOpenPanel);
    fireEvent.click(await screen.findByRole('button', { name: /Failed requests/ }));

    expect(onOpenPanel).toHaveBeenCalledWith('catalogue');
  });

  it('leaves out what has nothing waiting', async () => {
    draw(true);

    expect(await screen.findByRole('button', { name: /Failed requests/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Requests to approve/ })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WaitingOnYou.displayName).toBe('WaitingOnYou');
  });
});
