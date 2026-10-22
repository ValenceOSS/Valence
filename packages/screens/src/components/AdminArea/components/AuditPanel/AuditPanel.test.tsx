import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditPanel } from './AuditPanel';

const CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const ENTRIES = [
  {
    id: '1',
    at: '2026-10-17T03:00:00.000Z',
    actorId: 'a',
    actorName: 'Amara',
    action: 'role.created',
    target: 'Kids',
    detail: null,
    address: '203.0.113.7',
    userAgent: CHROME,
  },
  {
    id: '2',
    at: '2026-10-17T02:00:00.000Z',
    actorId: null,
    actorName: '',
    action: 'auth.signInFailed',
    target: 'tom@example.com',
    detail: { method: 'password' },
    address: '198.51.100.4',
    userAgent: null,
  },
];

const asked: string[] = [];

/**
 * Answers the panel's questions: the log, the accounts that can be narrowed to, and the jobs.
 *
 * @param url - What was asked for.
 * @returns The answer.
 */
const answer = (url: string): Promise<Response> => {
  asked.push(url);

  if (url.startsWith('/api/admin/audit')) {
    return Promise.resolve(new Response(JSON.stringify({ entries: ENTRIES, nextCursor: null })));
  }

  if (url.startsWith('/api/admin/accounts')) {
    return Promise.resolve(
      new Response(JSON.stringify([{ id: 'a', name: 'Amara', email: 'amara@example.com' }])),
    );
  }

  return Promise.resolve(new Response(JSON.stringify({ definitions: [] })));
};

const drawn = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AuditPanel />
    </QueryClientProvider>,
  );

beforeEach(() => {
  asked.length = 0;
  vi.stubGlobal('fetch', vi.fn(answer));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AuditPanel', () => {
  it('lists who changed what, and the device and address it came from', async () => {
    drawn();

    expect(await screen.findByText('Amara')).toBeInTheDocument();
    expect(screen.getAllByText('Kids').length).toBeGreaterThan(0);
    expect(screen.getByText('Chromium on macOS')).toBeInTheDocument();
    expect(screen.getByText('203.0.113.7')).toBeInTheDocument();
  });

  it('shows a failed sign-in as nobody, with what was typed and how', async () => {
    drawn();

    expect(await screen.findByText('Nobody signed in')).toBeInTheDocument();
    expect(screen.getAllByText('tom@example.com').length).toBeGreaterThan(0);
    expect(screen.getAllByText('With a password').length).toBeGreaterThan(0);
  });

  it('asks the server for what was searched for', async () => {
    drawn();

    await userEvent.type(
      await screen.findByRole('searchbox', { name: 'Search the audit log' }),
      'tom',
    );

    await waitFor(() => {
      expect(asked.some((url) => url.includes('search=tom'))).toBe(true);
    });
  });
});
