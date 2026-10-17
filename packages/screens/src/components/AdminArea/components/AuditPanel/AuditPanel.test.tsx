import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuditPanel } from './AuditPanel';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AuditPanel', () => {
  it('lists who changed what', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              entries: [
                {
                  id: '1',
                  at: '2026-10-17T03:00:00.000Z',
                  actorId: 'a',
                  actorName: 'Amara',
                  action: 'role.created',
                  target: 'Kids',
                  detail: null,
                },
              ],
              nextCursor: null,
            }),
          ),
        ),
      ),
    );

    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <AuditPanel />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Amara')).toBeInTheDocument();
    expect(screen.getAllByText('Kids').length).toBeGreaterThan(0);
  });
});
