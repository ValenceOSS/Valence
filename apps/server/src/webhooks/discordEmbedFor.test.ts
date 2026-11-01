import { describe, expect, it } from 'vitest';
import { discordEmbedFor } from './discordEmbedFor';
import type { WebhookPayload, WebhookRequest } from '@ValenceContracts/schemas/Webhook';

const anEnvelope = {
  version: 1,
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  occurredAt: '2026-08-14T20:00:00.000Z',
} as const;

const POSTER = 'https://image.tmdb.org/t/p/w500/poster.jpg';

const ICON = 'https://valence.example.com/icon.png';

const anItem = {
  itemId: 'item-1',
  kind: 'movie' as const,
  title: 'The Long Night',
  seriesTitle: null,
  seasonNumber: null,
  episodeNumber: null,
  year: 2021,
  posterUrl: POSTER,
  libraryId: 'library-1',
  libraryName: 'Films',
  overview: null,
  durationSeconds: null,
  genres: [],
  rating: null,
  quality: null,
};

const aRequest: WebhookRequest = {
  id: 'request-1',
  kind: 'series',
  title: 'A Quiet Town',
  artistName: null,
  year: 2019,
  overview: 'A town waits for the sun to come back.',
  posterUrl: POSTER,
  requestedBy: 'Dan',
  requestedByAccountId: 'account-1',
  requestedByProfile: null,
  requestedByProfileId: null,
  askers: [],
  seasons: [1, 2, 3],
  state: 'awaitingApproval',
};

const aRequestMade: WebhookPayload = {
  ...anEnvelope,
  event: 'requests.made',
  data: {
    title: 'A Quiet Town',
    kind: 'series',
    requestedBy: 'Dan',
    accountId: null,
    profileId: null,
    profileName: null,
    request: aRequest,
  },
};

const anAccount = (name: string): WebhookPayload => ({
  ...anEnvelope,
  event: 'account.created',
  data: { accountId: 'account-2', name },
});

const aVpnDrop = (reason: string): WebhookPayload => ({
  ...anEnvelope,
  event: 'requests.vpnDown',
  data: { reason, docs: 'https://docs.getvalence.app/requests#vpn' },
});

describe('discordEmbedFor', () => {
  it('draws Valence at the head, the title, the sentence over a small line, the summary and tags, the poster and the foot', () => {
    expect(
      discordEmbedFor(aRequestMade, { name: 'Valence', iconUrl: ICON, accent: null }),
    ).toStrictEqual({
      title: 'A Quiet Town (2019)',
      description:
        '**Dan** requested this series\n-# Seasons 1–3\n\nA town waits for the sun to come back.\n\n`Waiting for approval`',
      color: 0xe8a33a,
      author: { name: 'Valence', icon_url: ICON },
      timestamp: '2026-08-14T20:00:00.000Z',
      footer: { text: 'Requests' },
      thumbnail: { url: POSTER },
    });
  });

  it('leaves Valence’s icon out where the server cannot say where it is', () => {
    expect(discordEmbedFor(aRequestMade).author).toStrictEqual({ name: 'Valence' });
  });

  it('carries the moment it happened rather than the moment it was delivered', () => {
    expect(discordEmbedFor(aRequestMade).timestamp).toBe('2026-08-14T20:00:00.000Z');
  });

  it('sets the tags in code between bars, and a detail under its label as a quote', () => {
    expect(
      discordEmbedFor({
        ...anEnvelope,
        event: 'job.stalled',
        data: {
          kind: 'library.scan',
          label: 'Scan for changes',
          failures: 3,
          everSucceeded: true,
          reason: 'disk full\n# at line 2',
        },
      }).description,
    ).toBe(
      '**Scan for changes** has failed every run since it last worked\n\n`3 attempts`\n\n**Latest error**\n> disk full\n> \\# at line 2',
    );
  });

  it('quotes a problem with no label, and links to how to fix it', () => {
    expect(discordEmbedFor(aVpnDrop('the tunnel closed')).description).toBe(
      '> the tunnel closed\n\n[How to fix it](https://docs.getvalence.app/requests#vpn)',
    );
  });

  it('sets an exact detail in a code span, which cannot hold a backtick of its own', () => {
    expect(
      discordEmbedFor({
        ...anEnvelope,
        event: 'requests.chosen',
        data: { title: 'A Quiet Town', release: 'A.Quiet`Town.S01', request: null },
      }).description,
    ).toBe('Found a release\n\n**Release**\n`A.QuietˋTown.S01`');
  });

  it('writes each list under its heading in bold, a line to an entry', () => {
    expect(
      discordEmbedFor({
        ...anEnvelope,
        event: 'library.scanned',
        data: {
          libraries: [
            {
              libraryId: 'library-1',
              libraryName: 'Films',
              added: 3,
              updated: 0,
              removed: 0,
              failed: 0,
              arrived: [
                { title: 'The Long Night (2021)', episodes: 1 },
                { title: 'A Quiet Town', episodes: 2 },
              ],
              arrivedNotListed: 1,
            },
          ],
          added: 3,
          updated: 0,
          removed: 0,
          failed: 0,
        },
      }).description,
    ).toBe(
      '`3 added` | `0 updated` | `0 removed`\n\n**Films · 3 added**\n- The Long Night (2021)\n- A Quiet Town · 2 episodes\n- …and 1 more',
    );
  });

  it('sets the small line under the sentence, its parts between dots', () => {
    expect(
      discordEmbedFor({
        ...anEnvelope,
        event: 'auth.succeeded',
        data: {
          accountId: 'account-1',
          name: 'Dan',
          deviceLabel: 'iPhone 17 Pro Max',
          clientLabel: 'Valence for iOS',
          address: '192.168.1.20',
        },
      }).description,
    ).toBe('-# iPhone 17 Pro Max · Valence for iOS · from 192.168.1.20');
  });

  it('keeps a name from being read as Discord’s formatting', () => {
    expect(discordEmbedFor(anAccount('*NSYNC_fan `~|[x]\\')).description).toBe(
      '**\\*NSYNC\\_fan \\`\\~\\|\\[x\\]\\\\** created an account',
    );
  });

  it('keeps a name from pinging anybody', () => {
    expect(discordEmbedFor(anAccount('<@123> <@&456>')).description).toBe(
      '**\\<@123> \\<@&456>** created an account',
    );
  });

  it('keeps a line of a summary from starting a numbered list', () => {
    expect(
      discordEmbedFor({
        ...anEnvelope,
        event: 'media.added',
        data: { ...anItem, overview: 'One\n1. Two\n12. Three' },
      }).description,
    ).toContain('One\n1\\. Two\n12\\. Three');
  });

  it('keeps a line of a summary from starting a heading, a quote or a list', () => {
    expect(
      discordEmbedFor({
        ...anEnvelope,
        event: 'media.added',
        data: { ...anItem, overview: 'One\n# Two\n> Three\n- Four' },
      }).description,
    ).toContain('One\n\\# Two\n\\> Three\n\\- Four');
  });

  it('sends no description where there is nothing beyond the title', () => {
    expect(
      discordEmbedFor({
        ...anEnvelope,
        event: 'plugin.event',
        data: {
          pluginId: 'a-plugin',
          pluginName: 'A plugin',
          name: 'reported',
          title: 'Something happened',
          detail: {},
        },
      }),
    ).not.toHaveProperty('description');
  });

  it('hangs no poster on a notice that has none', () => {
    expect(discordEmbedFor(anAccount('Ada')).thumbnail).toBeUndefined();
  });

  it('colours each kind of news its own way', () => {
    expect(
      [
        aVpnDrop('the tunnel closed'),
        aRequestMade,
        anAccount('Ada'),
        { ...anEnvelope, event: 'media.removed', data: anItem } satisfies WebhookPayload,
        {
          ...anEnvelope,
          event: 'requests.filed',
          data: { title: 'A Quiet Town', folder: '/tv', request: aRequest },
        } satisfies WebhookPayload,
      ].map((payload) => discordEmbedFor(payload).color),
    ).toStrictEqual([0xe8503a, 0xe8a33a, 0x3ac47d, 0x8b5ce8, 0x3a8ee8]);
  });
});

describe('discordEmbedFor, staying inside what Discord accepts', () => {
  it('cuts a title too long for Discord rather than letting the message be refused', () => {
    expect(
      discordEmbedFor({
        ...anEnvelope,
        event: 'media.added',
        data: { ...anItem, title: 'T'.repeat(400), year: null },
      }).title,
    ).toHaveLength(256);
  });

  it('cuts a long problem short and keeps the way to put it right', () => {
    const { description } = discordEmbedFor(aVpnDrop('x'.repeat(5000)));

    expect(description?.length).toBeLessThanOrEqual(4096);
    expect(description).toContain('…');
    expect(description?.endsWith('[How to fix it](https://docs.getvalence.app/requests#vpn)')).toBe(
      true,
    );
  });

  it('gives up the summary before anything else where the rest would not fit', () => {
    const { description } = discordEmbedFor({
      ...anEnvelope,
      event: 'media.added',
      data: {
        itemId: 'item-1',
        kind: 'movie',
        title: 'A Long Story',
        seriesTitle: null,
        seasonNumber: null,
        episodeNumber: null,
        year: 2021,
        posterUrl: null,
        libraryId: 'films',
        libraryName: 'Films',
        overview: 'Once upon a time. '.repeat(400),
        durationSeconds: 6300,
        genres: [],
        rating: null,
        quality: '4K HDR',
      },
    });

    expect(description?.length).toBeLessThanOrEqual(4096);
    expect(description).toContain('Added to **Films**');
    expect(description?.endsWith('`Film` | `1h 45m` | `4K HDR`')).toBe(true);
  });

  it('keeps the whole embed inside the six thousand characters Discord counts', () => {
    const drawn = discordEmbedFor({
      ...anEnvelope,
      event: 'plugin.event',
      data: {
        pluginId: 'a-plugin',
        pluginName: 'P'.repeat(2000),
        name: 'reported',
        title: 'T'.repeat(256),
        detail: Object.fromEntries(
          Array.from({ length: 10 }, (_, index) => [`d${index.toString()}`, 'x'.repeat(1000)]),
        ),
      },
    });

    expect(drawn.footer?.text).toHaveLength(2000);
    expect(
      drawn.title.length + (drawn.description?.length ?? 0) + (drawn.footer?.text.length ?? 0),
    ).toBeLessThanOrEqual(6000);
  });

  it('signs with the name and logo the server was given, in its accent where nothing is wrong', () => {
    const brand = {
      name: 'Flux',
      iconUrl: 'https://flux.example.com/api/brand/logo',
      accent: 0x123456,
    };

    expect(discordEmbedFor(aRequestMade, brand).author).toStrictEqual({
      name: 'Flux',
      icon_url: 'https://flux.example.com/api/brand/logo',
    });
    expect(discordEmbedFor(aVpnDrop('It dropped.'), brand).color).toBe(0xe8503a);
    expect(
      discordEmbedFor(
        {
          ...anEnvelope,
          event: 'job.working',
          data: { kind: 'scan', label: 'Scan the libraries' },
        },
        brand,
      ).color,
    ).toBe(0x3ac47d);
    expect(
      discordEmbedFor(
        {
          ...anEnvelope,
          event: 'job.completed',
          data: {
            kind: 'scan',
            label: 'Scan the libraries',
            jobId: 'job-1',
            subject: null,
            subjectName: null,
          },
        },
        brand,
      ).color,
    ).toBe(0x123456);
  });
});
