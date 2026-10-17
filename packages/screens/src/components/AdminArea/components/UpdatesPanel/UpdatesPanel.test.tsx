import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UpdatesPanel } from './UpdatesPanel';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('UpdatesPanel', () => {
  it('says an update is out, what changed and how to update', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              current: '1.5.0',
              latest: '1.6.0',
              isNewer: true,
              publishedAt: '2026-10-13T17:31:20Z',
              notes: '### Added\n\n* a redesigned player',
              url: 'https://github.com/ValenceOSS/Valence/releases/tag/v1.6.0',
              checkedAt: '2026-10-17T03:00:00.000Z',
              isEnabled: true,
              problem: null,
            }),
          ),
        ),
      ),
    );

    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <UpdatesPanel />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('A redesigned player')).toBeInTheDocument();
    expect(screen.getByText('An update is out')).toBeInTheDocument();
    expect(screen.getByText('docker compose pull')).toBeInTheDocument();
  });

  it('lists the releases before the newest, folded, with the one this server runs marked', async () => {
    const release = (version: string, isNewer: boolean, isCurrent: boolean) => ({
      version,
      publishedAt: '2026-10-13T17:31:20Z',
      notes: `### Fixed\n\n* something in ${version}`,
      url: `https://github.com/ValenceOSS/Valence/releases/tag/v${version}`,
      isNewer,
      isCurrent,
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              current: '1.5.0',
              latest: '1.6.0',
              isNewer: true,
              publishedAt: '2026-10-13T17:31:20Z',
              notes: null,
              url: 'https://github.com/ValenceOSS/Valence/releases/tag/v1.6.0',
              history: [release('1.6.0', true, false), release('1.5.0', false, true)],
              checkedAt: '2026-10-17T03:00:00.000Z',
              isEnabled: true,
              problem: null,
            }),
          ),
        ),
      ),
    );

    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <UpdatesPanel />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Something in 1.6.0')).toBeInTheDocument();
    expect(screen.queryByText('Something in 1.5.0')).toBeNull();
    expect(screen.getByText('This server')).toBeInTheDocument();
  });
});
