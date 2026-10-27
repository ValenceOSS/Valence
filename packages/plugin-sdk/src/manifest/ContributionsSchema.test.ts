import { describe, expect, it } from 'vitest';
import { ContributionsSchema } from './ContributionsSchema';

describe('ContributionsSchema', () => {
  it('defaults every list to empty', () => {
    expect(ContributionsSchema.parse({})).toEqual({
      pages: [],
      panels: [],
      themes: [],
      schedules: [],
      events: [],
      webhooks: [],
      emits: [],
      downloadClients: [],
      sources: [],
      nodes: [],
    });
  });

  it('refuses an event topic Valence does not publish', () => {
    expect(ContributionsSchema.safeParse({ events: ['auth.failed'] }).success).toBe(false);
    expect(ContributionsSchema.safeParse({ events: ['playback.finished'] }).success).toBe(true);
  });

  it('refuses a panel on something Valence has no page for', () => {
    expect(
      ContributionsSchema.safeParse({ panels: [{ id: 'x', title: 'X', on: 'settings' }] }).success,
    ).toBe(false);
  });

  it('reads a download client for one protocol, and a source of films', () => {
    const read = ContributionsSchema.parse({
      downloadClients: [{ id: 'files', title: 'Example files', protocol: 'torrent' }],
      sources: [{ id: 'files', title: 'Example files', kinds: ['film'] }],
    });

    expect(read.downloadClients).toEqual([
      { id: 'files', title: 'Example files', protocol: 'torrent' },
    ]);
    expect(read.sources).toEqual([{ id: 'files', title: 'Example files', kinds: ['film'] }]);
  });

  it('refuses a download client for a protocol Valence does not grab, and a source of nothing', () => {
    expect(
      ContributionsSchema.safeParse({
        downloadClients: [{ id: 'x', title: 'X', protocol: 'ftp' }],
      }).success,
    ).toBe(false);
    expect(
      ContributionsSchema.safeParse({ sources: [{ id: 'x', title: 'X', kinds: [] }] }).success,
    ).toBe(false);
  });
});
