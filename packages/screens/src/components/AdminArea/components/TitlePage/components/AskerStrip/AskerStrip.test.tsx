import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { AskerStrip } from './AskerStrip';

vi.mock('@ValenceClient/admin/fetchAccounts', () => ({
  fetchAccounts: () => Promise.resolve([]),
}));

/**
 * Draws the strip for a request inside a fresh query cache.
 */
const draw = (request: ReturnType<typeof aMediaRequest>) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AskerStrip request={request} />
    </QueryClientProvider>,
  );

describe('AskerStrip', () => {
  it('names who asked first, and everybody else who wants it, with a face for each', () => {
    draw(
      aMediaRequest({
        requestedBy: { id: 'u1', name: 'Dan' },
        alsoAskedBy: [{ id: 'u2', name: 'Sam' }],
        createdAt: new Date().toISOString(),
      }),
    );

    expect(screen.getByText(/Asked for by Dan/)).toBeInTheDocument();
    expect(screen.getByText('Sam wants it too')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AskerStrip.displayName).toBe('AskerStrip');
  });
});
