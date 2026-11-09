import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditPanel } from './AuditPanel';
import type { AuditEntry } from '@ValenceContracts/schemas/Audit';

const CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const ENTRIES: AuditEntry[] = [
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

let pages: { entries: AuditEntry[]; nextCursor: string | null }[] = [];

/**
 * A run of sign-ins for paging through, each its own entry.
 *
 * @param count - How many.
 * @param from - The number of the first.
 * @returns The entries.
 */
const signIns = (count: number, from: number): AuditEntry[] =>
  Array.from({ length: count }, (_, at) => ({
    id: `sign-in-${(from + at).toString()}`,
    at: '2026-10-17T01:00:00.000Z',
    actorId: null,
    actorName: `Person ${(from + at).toString()}`,
    action: 'auth.signedIn',
    target: null,
    detail: null,
    address: null,
    userAgent: null,
  }));

/**
 * Answers the panel's questions: the log, the accounts that can be narrowed to, and the jobs.
 *
 * @param url - What was asked for.
 * @returns The answer.
 */
const answer = (url: string): Promise<Response> => {
  asked.push(url);

  if (url.startsWith('/api/admin/audit')) {
    const page = url.includes('cursor=more') ? pages[1] : pages[0];

    return Promise.resolve(new Response(JSON.stringify(page)));
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
  pages = [{ entries: ENTRIES, nextCursor: null }];
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
    expect(screen.getByText('203.0.113.7')).toBeInTheDocument();

    const [device] = screen.getAllByText('Mac');

    if (device === undefined) {
      throw new Error('The device the change came from is not named.');
    }

    await userEvent.hover(device);

    const sent = (await screen.findAllByText(CHROME)).find(
      (found) => found.closest('[data-slot="tooltip-content"]') !== null,
    );

    expect(sent?.closest('[data-slot="tooltip-content"]')).toHaveTextContent('Chrome');
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

  it('says an address is the server’s own machine', async () => {
    pages = [
      {
        entries: ENTRIES.slice(0, 1).map((entry) => ({
          ...entry,
          id: 'local',
          address: '127.0.0.1',
        })),
        nextCursor: null,
      },
    ];
    drawn();

    expect(await screen.findByText('127.0.0.1 · same machine')).toBeInTheDocument();
  });

  it('names the API key a change was made with', async () => {
    pages = [
      {
        entries: ENTRIES.slice(0, 1).map((entry) => ({
          ...entry,
          id: 'keyed',
          detail: { apiKey: 'Home automation' },
        })),
        nextCursor: null,
      },
    ];
    drawn();

    expect(await screen.findByText('API key · Home automation')).toBeInTheDocument();
  });

  it('reads the next page from the server once the table moves past what it holds', async () => {
    pages = [
      { entries: signIns(25, 1), nextCursor: 'more' },
      { entries: signIns(3, 26), nextCursor: null },
    ];
    drawn();

    expect(await screen.findByText('1–25')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(await screen.findByText('Person 26')).toBeInTheDocument();
    expect(asked.some((url) => url.includes('cursor=more'))).toBe(true);
    expect(screen.getByText('26–28 of 28')).toBeInTheDocument();
  });

  it('goes back to the first page when what it is narrowed to changes', async () => {
    pages = [
      { entries: signIns(25, 1), nextCursor: 'more' },
      { entries: signIns(3, 26), nextCursor: null },
    ];
    drawn();

    await userEvent.click(await screen.findByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Person 26')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search the audit log' }), 'Person');

    expect(await screen.findByText('Person 1')).toBeInTheDocument();
    expect(screen.queryByText('Person 26')).not.toBeInTheDocument();
  });
});
