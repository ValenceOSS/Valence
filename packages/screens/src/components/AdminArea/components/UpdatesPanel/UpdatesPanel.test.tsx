import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UpdatesPanel } from './UpdatesPanel';

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
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
    expect(
      screen.getByText(
        'Run docker compose pull, then docker compose up -d, in the folder that holds your compose file.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show' }));

    expect(await screen.findByText('docker compose pull')).toBeInTheDocument();
    expect(window.localStorage.getItem('valence.updateStepsShown')).toBe('true');
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

  it('says a dev build is behind the newest dev build, lists what is new and says to use the dev tag', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              current: '1.9.0-dev.d3eee1d',
              latest: '1.8.0',
              isNewer: false,
              publishedAt: '2026-10-30T12:00:00Z',
              notes: null,
              url: 'https://github.com/ValenceOSS/Valence/releases/tag/v1.8.0',
              checkedAt: '2026-11-03T15:00:00.000Z',
              isEnabled: true,
              problem: null,
              dev: {
                commit: 'd3eee1d',
                newest: '1806279',
                builtAt: '2026-11-03T14:41:22Z',
                isNewer: true,
                isOffMain: false,
                behindBy: 3,
                commits: [
                  {
                    sha: '1806279',
                    subject: 'fix: admin badges count what their pages list (#797)',
                    committedAt: '2026-11-03T14:30:00Z',
                    url: 'https://github.com/ValenceOSS/Valence/commit/1806279',
                  },
                ],
                problem: null,
              },
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

    expect(
      await screen.findByRole('link', {
        name: 'fix: admin badges count what their pages list (#797)',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('An update is out')).toBeInTheDocument();
    expect(screen.getByText('1806279')).toBeInTheDocument();
    expect(screen.getByText('3 commits on main since this build')).toBeInTheDocument();
    expect(screen.getByText('And 2 more commits on GitHub')).toBeInTheDocument();
    expect(screen.queryByText(/Use the dev tag/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show' }));

    expect(await screen.findByText(/Use the dev tag/)).toBeInTheDocument();
  });
});
