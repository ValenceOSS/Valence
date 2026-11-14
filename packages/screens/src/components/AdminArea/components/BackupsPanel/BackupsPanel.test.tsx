import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BackupsPanel } from './BackupsPanel';

const administering = vi.hoisted(() => ({ is: true }));

vi.mock('@ValenceClient/session/useWhatIMayDo', () => ({
  useWhatIMayDo: () => ({ may: () => true, mayAdminister: administering.is }),
}));

afterEach(() => {
  administering.is = true;
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

  describe('downloading a copy', () => {
    const list = {
      backups: [
        {
          name: 'valence-2026-10-01.dump',
          kind: 'byHand',
          takenAt: '2026-10-01T00:00:00.000Z',
          sizeBytes: 2048,
          before: null,
        },
      ],
      folder: '/config/backups',
      tool: 'pg_dump',
      isToolInstalled: true,
      kept: 3,
      restoreCommand: 'restore',
    };

    it('is offered to an administrator', async () => {
      answering(list);
      renderPanel();

      await userEvent.click(
        await screen.findByRole('button', { name: /actions for valence-2026-10-01\.dump/iu }),
      );

      expect(await screen.findByRole('menuitem', { name: 'Download' })).toBeInTheDocument();
    });

    it('is not offered to somebody who may only look after backups', async () => {
      administering.is = false;
      answering(list);
      renderPanel();

      await userEvent.click(
        await screen.findByRole('button', { name: /actions for valence-2026-10-01\.dump/iu }),
      );

      expect(await screen.findByRole('menuitem', { name: 'Restore' })).toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: 'Download' })).not.toBeInTheDocument();
    });
  });
});
