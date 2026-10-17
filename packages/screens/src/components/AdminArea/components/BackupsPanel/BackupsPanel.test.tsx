import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BackupsPanel } from './BackupsPanel';

afterEach(() => {
  vi.unstubAllGlobals();
});

const answering = (body: object) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(body)))),
  );
};

const renderPanel = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <BackupsPanel onOpenSchedule={vi.fn()} />
    </QueryClientProvider>,
  );

describe('BackupsPanel', () => {
  it('lists the copies, with why each was taken', async () => {
    answering({
      backups: [
        {
          name: 'valence-2026-10-01T00-00-00-000Z-before-0128_plays.dump',
          kind: 'beforeUpgrade',
          takenAt: '2026-10-01T00:00:00.000Z',
          sizeBytes: 2048,
          before: '0128_plays',
        },
      ],
      folder: '/config/backups',
      tool: 'pg_dump',
      isToolInstalled: true,
      kept: 3,
      restoreCommand: 'restore',
    });

    renderPanel();

    expect(await screen.findByText('Before an upgrade')).toBeInTheDocument();
    expect(screen.getByText('0128_plays')).toBeInTheDocument();
  });

  it('says when the dump tool is missing', async () => {
    answering({
      backups: [],
      folder: '/config/backups',
      tool: 'pg_dump',
      isToolInstalled: false,
      kept: 3,
      restoreCommand: 'restore',
    });

    renderPanel();

    expect(await screen.findByText('Backups can’t be taken here')).toBeInTheDocument();
  });
});
