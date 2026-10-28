import { describe, expect, it } from 'vitest';
import { webhookNoticeFor } from './webhookNoticeFor';
import type { WebhookPayload } from '@ValenceContracts/schemas/Webhook';

const anEnvelope = {
  version: 1,
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  occurredAt: '2026-08-14T20:00:00.000Z',
} as const;

const anItem = {
  itemId: 'item-1',
  kind: 'movie' as const,
  title: 'Dune',
  seriesTitle: null,
  seasonNumber: null,
  episodeNumber: null,
  year: 2021,
  posterUrl: 'https://image.tmdb.org/t/p/w500/dune.jpg',
  libraryId: 'library-1',
  libraryName: 'Films',
  overview: null,
  durationSeconds: null,
  genres: [],
  rating: null,
  quality: null,
};

const anArrival: WebhookPayload = { ...anEnvelope, event: 'media.added', data: anItem };

const aVpnDrop: WebhookPayload = {
  ...anEnvelope,
  event: 'requests.vpnDown',
  data: { reason: 'the tunnel closed', docs: 'https://docs.getvalence.app/requests#vpn' },
};

describe('webhookNoticeFor', () => {
  it('names what arrived, with its poster, as good news', () => {
    const notice = webhookNoticeFor(anArrival, 'a sentence');

    expect(notice.title).toBe('Dune (2021)');
    expect(notice.tone).toBe('arrival');
    expect(notice.posterUrl).toBe('https://image.tmdb.org/t/p/w500/dune.jpg');
  });

  it('keeps no poster that is not a web address a receiver could fetch', () => {
    const notice = webhookNoticeFor(
      { ...anArrival, data: { ...anItem, posterUrl: '/api/items/item-1/poster' } },
      'a sentence',
    );

    expect(notice.posterUrl).toBeNull();
  });

  it('leaves out every detail with nothing to say', () => {
    const notice = webhookNoticeFor(anArrival, 'a sentence');

    expect(notice.fields.every((one) => one.value !== '')).toBe(true);
    expect(notice.fields.map((one) => one.name)).toStrictEqual(['Kind', 'Library']);
  });

  it('marks a problem somebody has to put right as urgent, with where to read how', () => {
    const notice = webhookNoticeFor(aVpnDrop, 'The VPN is down');

    expect(notice.isUrgent).toBe(true);
    expect(notice.tone).toBe('failure');
    expect(notice.fields).toContainEqual({
      name: 'How to fix it',
      value: 'https://docs.getvalence.app/requests#vpn',
      inline: false,
    });
  });

  it('marks ordinary news as not urgent', () => {
    expect(webhookNoticeFor(anArrival, 'a sentence').isUrgent).toBe(false);
  });

  it('falls back to the sentence for an event with nothing richer to say', () => {
    const notice = webhookNoticeFor(
      { ...anEnvelope, event: 'catalogue.reachable', data: {} },
      'The catalogue can be reached again.',
    );

    expect(notice.title).toBe('The catalogue can be reached again.');
    expect(notice.description).toBe('');
  });

  it('keeps what a scan brought in under the library it arrived in, apart from the summary', () => {
    const notice = webhookNoticeFor(
      {
        ...anEnvelope,
        event: 'library.scanned',
        data: {
          libraries: [
            {
              libraryId: 'library-1',
              libraryName: 'Films',
              added: 2,
              updated: 0,
              removed: 0,
              failed: 0,
              arrived: [{ title: 'Dune', episodes: 1 }],
              arrivedNotListed: 1,
            },
          ],
          added: 2,
          updated: 0,
          removed: 0,
          failed: 0,
        },
      },
      'a sentence',
    );

    expect(notice.description).toBe('');
    expect(notice.sections).toStrictEqual([{ heading: 'Films', body: 'Dune\n…and 1 more' }]);
  });
});
