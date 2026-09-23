import { describe, expect, it } from 'vitest';
import { discordEmbedFor } from './discordEmbedFor';
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

const embed = (payload: WebhookPayload, sentence = 'a sentence') =>
  discordEmbedFor(payload, sentence);

describe('discordEmbedFor', () => {
  it('names what arrived and where it landed', () => {
    const drawn = embed(anArrival);

    expect(drawn.title).toBe('Dune (2021)');
    expect(drawn.description).toBe('Arrived in Films');
  });

  it('hangs the poster on it, straight from the catalogue', () => {
    expect(embed(anArrival).thumbnail).toStrictEqual({
      url: 'https://image.tmdb.org/t/p/w500/dune.jpg',
    });
  });

  it('still renders something the catalogue never matched, which has no poster', () => {
    const drawn = embed({ ...anArrival, data: { ...anItem, posterUrl: null } });

    expect(drawn.thumbnail).toBeUndefined();
    expect(drawn.title).toBe('Dune (2021)');
  });

  it('names an episode by its place in its series', () => {
    const drawn = embed({
      ...anArrival,
      data: {
        ...anItem,
        kind: 'episode',
        title: 'System',
        seriesTitle: 'The Bear',
        seasonNumber: 2,
        episodeNumber: 3,
      },
    });

    expect(drawn.title).toBe('The Bear S02E03 — System');
  });

  it('carries the moment it happened rather than the moment it was delivered', () => {
    expect(embed(anArrival).timestamp).toBe('2026-08-14T20:00:00.000Z');
  });

  it('colours an arrival differently from a refusal, which is the point of the colour', () => {
    const arrival = embed(anArrival).color;
    const refusal = embed({
      ...anEnvelope,
      event: 'auth.failed',
      data: {
        identifier: 'ada@example.com',
        deviceLabel: 'Chrome on macOS',
        address: null,
        reason: 'those details were not accepted.',
      },
    }).color;

    expect(arrival).not.toBe(refusal);
  });

  it('colours the VPN dropping as bad news and it coming back as good', () => {
    const down = embed({
      ...anEnvelope,
      event: 'requests.vpnDown',
      data: {
        reason: 'The tunnel is stopped',
        docs: 'https://docs.getvalence.app/install/requesting#a-vpn-for-the-download-client',
      },
    });
    const up = embed({
      ...anEnvelope,
      event: 'requests.vpnUp',
      data: { publicAddress: null, country: null },
    });

    expect(down.title).toBe('a sentence');
    expect(down.fields).toEqual([
      {
        name: 'How to fix it',
        value: 'https://docs.getvalence.app/install/requesting#a-vpn-for-the-download-client',
        inline: false,
      },
    ]);
    expect(down.color).not.toBe(up.color);
    expect(up.color).toBe(embed({ ...anEnvelope, event: 'transcoder.reachable', data: {} }).color);
  });

  it('colours an indexer failing as bad news, and one working again as good', () => {
    const failing = embed({
      ...anEnvelope,
      event: 'requests.indexerFailing',
      data: { name: 'Jackett', problem: 'Timed out', docs: null },
    });
    const working = embed({
      ...anEnvelope,
      event: 'requests.indexerWorking',
      data: { name: 'Jackett' },
    });

    expect(failing.color).toBe(
      embed({ ...anEnvelope, event: 'transcoder.unreachable', data: { reason: 'x' } }).color,
    );
    expect(working.color).toBe(
      embed({ ...anEnvelope, event: 'transcoder.reachable', data: {} }).color,
    );
  });

  it('colours a request arriving as good news, and a refusal as quiet', () => {
    expect(
      embed({
        ...anEnvelope,
        event: 'requests.available',
        data: { title: 'Dune', requestedBy: 'Sam', mediaId: 'media-1' },
      }).color,
    ).toBe(embed({ ...anEnvelope, event: 'transcoder.reachable', data: {} }).color);
    expect(
      embed({ ...anEnvelope, event: 'requests.refused', data: { title: 'Dune', reason: null } })
        .color,
    ).toBe(embed({ ...anEnvelope, event: 'webhook.test', data: {} }).color);
  });

  it('colours a failed download as bad news, and a started one as good', () => {
    const failed = embed({
      ...anEnvelope,
      event: 'requests.downloadFailed',
      data: { title: 'Dune', client: 'SABnzbd', problem: 'Out of retention' },
    });
    const started = embed({
      ...anEnvelope,
      event: 'requests.downloadStarted',
      data: { title: 'Dune', client: 'qBittorrent' },
    });

    expect(failed.color).toBe(
      embed({ ...anEnvelope, event: 'transcoder.unreachable', data: { reason: 'x' } }).color,
    );
    expect(started.color).toBe(
      embed({ ...anEnvelope, event: 'transcoder.reachable', data: {} }).color,
    );
  });

  it('colours the requests service going quiet like the transcoder going quiet', () => {
    const quiet = embed({
      ...anEnvelope,
      event: 'requests.unreachable',
      data: { reason: 'no answer', docs: null },
    });
    const back = embed({ ...anEnvelope, event: 'requests.reachable', data: {} });
    const transcoder = embed({
      ...anEnvelope,
      event: 'transcoder.unreachable',
      data: { reason: 'no answer' },
    });

    expect(quiet.color).toBe(transcoder.color);
    expect(back.color).not.toBe(quiet.color);
  });

  it('says who was watching and on what', () => {
    const drawn = embed({
      ...anEnvelope,
      event: 'playback.started',
      data: {
        accountId: 'account-1',
        accountName: 'Ada',
        profileId: 'profile-1',
        profileName: 'Ada',
        item: anItem,
        deviceLabel: 'Chrome on macOS',
        mode: 'Transcode',
      },
    });

    expect(drawn.description).toBe('Ada started watching');
    expect(drawn.fields).toContainEqual({ name: 'Device', value: 'Chrome on macOS', inline: true });
    expect(drawn.fields).toContainEqual({ name: 'Playing', value: 'Transcode', inline: true });
  });

  it('names nobody for a share link rather than leaving the sentence broken', () => {
    const drawn = embed({
      ...anEnvelope,
      event: 'playback.started',
      data: {
        accountId: null,
        accountName: null,
        profileId: null,
        profileName: null,
        item: anItem,
        deviceLabel: 'Chrome on macOS',
        mode: 'DirectPlay',
      },
    });

    expect(drawn.description).toBe('Somebody with a share link started watching');
  });

  it('says how far through somebody got', () => {
    const drawn = embed({
      ...anEnvelope,
      event: 'playback.stopped',
      data: {
        accountId: 'account-1',
        accountName: 'Ada',
        profileId: 'profile-1',
        profileName: 'Ada',
        item: anItem,
        deviceLabel: 'Chrome on macOS',
        mode: 'DirectPlay',
        positionSeconds: 610,
        durationSeconds: 7200,
      },
    });

    expect(drawn.fields).toContainEqual({ name: 'Stopped at', value: '10:10 (8%)', inline: true });
  });

  it('leaves out how far through where nothing ever said', () => {
    const drawn = embed({
      ...anEnvelope,
      event: 'playback.stopped',
      data: {
        accountId: null,
        accountName: null,
        profileId: null,
        profileName: null,
        item: anItem,
        deviceLabel: 'Chrome on macOS',
        mode: 'DirectPlay',
        positionSeconds: null,
        durationSeconds: null,
      },
    });

    expect(drawn.fields.map((one) => one.name)).not.toContain('Stopped at');
  });

  it('never tells Discord which of a wrong password or a wrong address it was', () => {
    const drawn = embed({
      ...anEnvelope,
      event: 'auth.failed',
      data: {
        identifier: 'ada@example.com',
        deviceLabel: 'Chrome on macOS',
        address: null,
        reason: 'those details were not accepted.',
      },
    });

    expect(drawn.title).toBe('A sign-in was refused');
    expect(drawn.fields.map((one) => one.name)).not.toContain('Address');
  });

  it('lists what a scan brought in', () => {
    const drawn = embed({
      ...anEnvelope,
      event: 'library.scanned',
      data: {
        libraries: [
          {
            libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
            libraryName: 'Films',
            added: 2,
            updated: 0,
            removed: 0,
            failed: 0,
            arrived: [
              { title: 'Dune', episodes: 1 },
              { title: 'Arrival', episodes: 1 },
            ],
            arrivedNotListed: 0,
          },
        ],
        added: 2,
        updated: 0,
        removed: 0,
        failed: 0,
      },
    });

    expect(drawn.description).toBe('**Films**\nDune\nArrival');
    expect(drawn.fields).toContainEqual({ name: 'Added', value: '2', inline: true });
  });

  it('says how many it did not list rather than listing them all', () => {
    const drawn = embed({
      ...anEnvelope,
      event: 'library.scanned',
      data: {
        libraries: [
          {
            libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
            libraryName: 'Films',
            added: 30,
            updated: 0,
            removed: 0,
            failed: 0,
            arrived: [{ title: 'Dune', episodes: 1 }],
            arrivedNotListed: 29,
          },
        ],
        added: 30,
        updated: 0,
        removed: 0,
        failed: 0,
      },
    });

    expect(drawn.description).toContain('and 29 more');
  });
});

describe('discordEmbedFor, staying inside what Discord accepts', () => {
  it('cuts a title too long for Discord rather than letting the message be refused', () => {
    const drawn = embed({ ...anArrival, data: { ...anItem, title: 'x'.repeat(400), year: null } });

    expect(drawn.title).toHaveLength(256);
    expect(drawn.title.endsWith('…')).toBe(true);
  });

  it('keeps the whole embed inside the six thousand characters Discord counts', () => {
    const drawn = embed({
      ...anEnvelope,
      event: 'library.scanned',
      data: {
        libraries: [
          {
            libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
            libraryName: 'Films',
            added: 25,
            updated: 0,
            removed: 0,
            failed: 0,
            arrived: Array.from({ length: 25 }, () => ({
              title: 'y'.repeat(400),
              episodes: 1,
            })),
            arrivedNotListed: 0,
          },
        ],
        added: 25,
        updated: 0,
        removed: 0,
        failed: 0,
      },
    });

    const spent =
      drawn.title.length +
      drawn.description.length +
      drawn.author.name.length +
      drawn.fields.reduce((total, one) => total + one.name.length + one.value.length, 0);

    expect(spent).toBeLessThanOrEqual(6000);
  });

  it('never sends more fields than Discord will render', () => {
    expect(embed(anArrival).fields.length).toBeLessThanOrEqual(25);
  });

  it('leaves out a field with nothing in it rather than sending an empty one', () => {
    const drawn = embed({
      ...anEnvelope,
      event: 'job.failed',
      data: {
        kind: 'library.scan',
        label: 'Scan for changes',
        jobId: 'job-1',
        subject: null,
        subjectName: null,
        reason: 'no space left',
      },
    });

    expect(drawn.fields.map((one) => one.name)).not.toContain('About');
  });
});

describe('discordEmbedFor, saying how long something runs', () => {
  const arrivalOf = (durationSeconds: number | null): WebhookPayload => ({
    ...anArrival,
    data: { ...anItem, durationSeconds },
  });

  const runtimeIn = (payload: WebhookPayload) =>
    discordEmbedFor(payload, 'a sentence').fields.find((one) => one.name === 'Runtime')?.value;

  it('says a feature length in hours and minutes', () => {
    expect(runtimeIn(arrivalOf(9780))).toBe('2h 43m');
  });

  it('says a short thing in minutes', () => {
    expect(runtimeIn(arrivalOf(1500))).toBe('25m');
  });

  it('says seconds for a clip, rather than rounding it to nothing', () => {
    expect(runtimeIn(arrivalOf(2))).toBe('2s');
  });

  it('says nothing at all where the runtime is not known', () => {
    expect(runtimeIn(arrivalOf(null))).toBeUndefined();
  });
});

describe('discordEmbedFor, a scan of several libraries at once', () => {
  const twoLibraries: WebhookPayload = {
    ...anEnvelope,
    event: 'library.scanned',
    data: {
      libraries: [
        {
          libraryId: 'library-1',
          libraryName: 'Movies',
          added: 2,
          updated: 0,
          removed: 0,
          failed: 0,
          arrived: [
            { title: 'Dune', episodes: 1 },
            { title: 'Sicario', episodes: 1 },
          ],
          arrivedNotListed: 0,
        },
        {
          libraryId: 'library-2',
          libraryName: 'Shows',
          added: 1,
          updated: 3,
          removed: 0,
          failed: 0,
          arrived: [{ title: 'The Bear', episodes: 8 }],
          arrivedNotListed: 0,
        },
      ],
      added: 3,
      updated: 3,
      removed: 0,
      failed: 0,
    },
  };

  it('says how many libraries finished rather than naming only the first', () => {
    expect(discordEmbedFor(twoLibraries, 'a sentence').title).toBe('2 libraries finished scanning');
  });

  it('names them all in a field', () => {
    expect(discordEmbedFor(twoLibraries, 'a sentence').fields).toContainEqual({
      name: 'Libraries',
      value: 'Movies, Shows',
      inline: false,
    });
  });

  it('adds the counts up across the whole scan', () => {
    const drawn = discordEmbedFor(twoLibraries, 'a sentence');

    expect(drawn.fields).toContainEqual({ name: 'Added', value: '3', inline: true });
    expect(drawn.fields).toContainEqual({ name: 'Updated', value: '3', inline: true });
  });

  it('keeps what arrived under the library it arrived in', () => {
    const drawn = discordEmbedFor(twoLibraries, 'a sentence');

    expect(drawn.description).toContain('**Movies**');
    expect(drawn.description).toContain('**Shows**');
    expect(drawn.description).toContain('The Bear — 8 episodes');
  });

  it('counts a programme rather than reciting its episodes', () => {
    const drawn = discordEmbedFor(
      {
        ...twoLibraries,
        data: {
          ...twoLibraries.data,
          libraries: [
            {
              libraryId: 'library-2',
              libraryName: 'Shows',
              added: 2103,
              updated: 0,
              removed: 0,
              failed: 0,
              arrived: [
                { title: '24', episodes: 192 },
                { title: 'The Thick Of It', episodes: 22 },
              ],
              arrivedNotListed: 40,
            },
          ],
        },
      },
      'a sentence',
    );

    expect(drawn.description).toContain('24 — 192 episodes');
    expect(drawn.description).toContain('The Thick Of It — 22 episodes');
    expect(drawn.description).toContain('…and 40 more');
    expect(drawn.description).not.toContain('S01E');
  });

  it('names the one library where only one was scanned', () => {
    const drawn = discordEmbedFor(
      {
        ...twoLibraries,
        data: {
          ...twoLibraries.data,
          libraries: [twoLibraries.data.libraries[0]!],
        },
      },
      'a sentence',
    );

    expect(drawn.title).toBe('Movies finished scanning');
    expect(drawn.fields.map((one) => one.name)).not.toContain('Libraries');
  });
});

describe('discordEmbedFor, somebody opening and closing Valence', () => {
  const aSession = {
    accountId: 'account-1',
    accountName: 'Dan',
    profileId: 'profile-1',
    profileName: 'Connie',
    clientId: 'tab-1',
    deviceLabel: "Connie's iPhone",
    address: '192.168.1.40',
    guestOf: null,
    viaShare: null,
  };

  const fieldsOf = (payload: WebhookPayload) =>
    Object.fromEntries(embed(payload).fields.map((one) => [one.name, one.value]));

  it('puts whoever arrived in the title rather than burying them in a field', () => {
    expect(embed({ ...anEnvelope, event: 'session.started', data: aSession }).title).toBe(
      'Connie opened Valence',
    );
  });

  it('names the device, and whose account the profile sits on', () => {
    expect(fieldsOf({ ...anEnvelope, event: 'session.started', data: aSession })).toStrictEqual({
      Device: "Connie's iPhone",
      From: '192.168.1.40',
      Account: 'Dan',
    });
  });

  it('leaves the account out where it would only repeat the title', () => {
    expect(
      fieldsOf({
        ...anEnvelope,
        event: 'session.started',
        data: { ...aSession, profileId: null, profileName: null },
      }),
    ).toStrictEqual({ Device: "Connie's iPhone", From: '192.168.1.40' });
  });

  it('names whoever let a guest in', () => {
    expect(
      fieldsOf({
        ...anEnvelope,
        event: 'session.started',
        data: {
          ...aSession,
          accountId: null,
          accountName: null,
          profileId: null,
          profileName: null,
          guestOf: 'Dan',
          viaShare: 'share-1',
        },
      })['Guest of'],
    ).toBe('Dan');
  });

  it('says how long somebody stayed when they go', () => {
    const drawn = embed({
      ...anEnvelope,
      event: 'session.ended',
      data: { ...aSession, lastedSeconds: 4_980 },
    });

    expect(drawn.title).toBe('Connie closed Valence');
    expect(
      fieldsOf({
        ...anEnvelope,
        event: 'session.ended',
        data: { ...aSession, lastedSeconds: 4_980 },
      }),
    ).toStrictEqual({
      Device: "Connie's iPhone",
      Stayed: '1h 23m',
    });
  });

  it('hangs no poster on a session, which is about a person rather than a film', () => {
    expect(
      embed({ ...anEnvelope, event: 'session.started', data: aSession }).thumbnail,
    ).toBeUndefined();
  });
});
