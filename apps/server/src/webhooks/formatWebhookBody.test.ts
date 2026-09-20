import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { WEBHOOK_PAYLOAD_VERSION } from '@ValenceContracts/schemas/Webhook';
import { formatWebhookBody } from './formatWebhookBody';
import type { WebhookPayload } from '@ValenceContracts/schemas/Webhook';

const DiscordMessageSchema = z.object({
  embeds: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      color: z.number(),
      author: z.object({ name: z.string() }),
      fields: z.array(z.object({ name: z.string(), value: z.string() })),
    }),
  ),
});

const anEnvelope = {
  version: WEBHOOK_PAYLOAD_VERSION,
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  occurredAt: '2026-08-14T20:00:00.000Z',
} as const;

const aFailure: WebhookPayload = {
  ...anEnvelope,
  event: 'job.failed',
  data: {
    kind: 'library.scan',
    label: 'Scan for changes',
    jobId: 'job-1',
    subject: 'library-1',
    subjectName: 'Films',
    reason: 'ffmpeg exited with 1',
  },
};

const aServerWideCompletion: WebhookPayload = {
  ...anEnvelope,
  event: 'job.completed',
  data: {
    kind: 'server.cleanupSessions',
    label: 'Clean up sessions',
    jobId: 'job-2',
    subject: null,
    subjectName: null,
  },
};

describe('formatWebhookBody', () => {
  it('sends the whole envelope to a generic receiver', () => {
    const written = formatWebhookBody('generic', aFailure);

    expect(written.contentType).toBe('application/json');
    expect(JSON.parse(written.body)).toStrictEqual(aFailure);
  });

  it('gives Discord an embed, not a line of text and not an envelope', () => {
    const written = formatWebhookBody('discord', aFailure);
    const sent = DiscordMessageSchema.parse(JSON.parse(written.body));

    expect(written.contentType).toBe('application/json');
    expect(sent.embeds).toHaveLength(1);
    expect(sent.embeds[0]?.title).toContain('Scan for changes');
    expect(sent.embeds[0]?.description).toContain('ffmpeg exited with 1');
  });

  it('sends no more embeds in one message than Discord will render', () => {
    const written = formatWebhookBody('discord', aFailure);
    const sent = DiscordMessageSchema.parse(JSON.parse(written.body));

    expect(sent.embeds.length).toBeLessThanOrEqual(10);
  });

  it('leaves the other presets alone, which is the whole of what changed', () => {
    expect(formatWebhookBody('generic', aFailure).body).toBe(JSON.stringify(aFailure));
    expect(formatWebhookBody('ntfy', aFailure).contentType).toBe('text/plain');
  });

  it('gives ntfy plain text, because JSON would be printed verbatim', () => {
    const written = formatWebhookBody('ntfy', aFailure);

    expect(written.contentType).toBe('text/plain');
    expect(written.body).toContain('ffmpeg exited with 1');
    expect(written.body.startsWith('{')).toBe(false);
  });

  it('names which library a job was about, by its name and never by its identifier', () => {
    const written = formatWebhookBody('ntfy', aFailure).body;

    expect(written).toContain('Films');
    expect(written).not.toContain('library-1');
    expect(written).not.toContain('library.scan');
  });

  it('says nothing about a subject for a job that had none', () => {
    const written = formatWebhookBody('ntfy', aServerWideCompletion);

    expect(written.body).toContain('Clean up sessions');
    expect(written.body).not.toContain('null');
    expect(written.body).not.toContain('()');
  });

  it('names the subject of a job that finished, as well as one that failed', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'job.completed',
      data: {
        kind: 'library.scan',
        label: 'Scan for changes',
        jobId: 'job-3',
        subject: 'library-1',
        subjectName: 'Films',
      },
    });

    expect(written.body).toContain('for Films');
  });

  it('says nothing about a subject for a failure that had none', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'job.failed',
      data: {
        kind: 'server.cleanupSessions',
        label: 'Clean up sessions',
        jobId: 'job-4',
        subject: null,
        subjectName: null,
        reason: 'no space',
      },
    });

    expect(written.body).toContain('no space');
    expect(written.body).not.toContain('()');
  });

  it('counts files it could not read, and says nothing of them when there were none', () => {
    const scanned = (failed: number) =>
      formatWebhookBody('ntfy', {
        ...anEnvelope,
        event: 'library.scanned',
        data: {
          libraries: [
            {
              libraryId: 'library-1',
              libraryName: 'Films',
              added: 2,
              updated: 1,
              removed: 0,
              failed,
              arrived: [],
              arrivedNotListed: 0,
            },
          ],
          added: 2,
          updated: 1,
          removed: 0,
          failed,
        },
      }).body;

    expect(scanned(3)).toContain('3 unreadable');
    expect(scanned(0)).not.toContain('unreadable');
  });

  it('writes a test as reassurance rather than as an alarm', () => {
    const written = formatWebhookBody('ntfy', { ...anEnvelope, event: 'webhook.test', data: {} });

    expect(written.body).toContain('Nothing has gone wrong');
  });

  it('says what a viewer would notice when the catalogue is unreachable', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'catalogue.unreachable',
      data: {},
    });

    expect(written.body).toContain('without matching them');
  });

  it('names the library and what a scan changed', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'library.scanned',
      data: {
        libraries: [
          {
            libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3302',
            libraryName: 'Films',
            added: 4,
            updated: 1,
            removed: 0,
            failed: 0,
            arrived: [],
            arrivedNotListed: 0,
          },
        ],
        added: 4,
        updated: 1,
        removed: 0,
        failed: 0,
      },
    });

    expect(written.body).toContain('Films');
    expect(written.body).toContain('4 added');
    expect(written.body).toContain('0 removed');
  });

  it('states removals, which is the number a mount going missing shows up in', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'library.scanned',
      data: {
        libraries: [
          {
            libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3302',
            libraryName: 'Films',
            added: 0,
            updated: 0,
            removed: 214,
            failed: 0,
            arrived: [],
            arrivedNotListed: 0,
          },
        ],
        added: 0,
        updated: 0,
        removed: 214,
        failed: 0,
      },
    });

    expect(written.body).toContain('214 removed');
  });

  it('mentions unreadable files only when there are some', () => {
    const clean = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'library.scanned',
      data: {
        libraries: [
          {
            libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3302',
            libraryName: 'Films',
            added: 1,
            updated: 0,
            removed: 0,
            failed: 0,
            arrived: [],
            arrivedNotListed: 0,
          },
        ],
        added: 1,
        updated: 0,
        removed: 0,
        failed: 0,
      },
    });

    expect(clean.body).not.toContain('unreadable');
  });

  it('says a recovery is not something to act on', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'transcoder.reachable',
      data: {},
    });

    expect(written.body).toContain('answering again');
    expect(written.body).toContain('Nothing needs doing');
  });

  it('says the same for a catalogue that came back', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'catalogue.reachable',
      data: {},
    });

    expect(written.body).toContain('Nothing needs doing');
  });

  it('says a job that has never once worked has never once worked', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'job.stalled',
      data: {
        kind: 'library.scan.scheduled',
        label: 'Scan for changes',
        failures: 457,
        everSucceeded: false,
        reason: 'Cannot read properties of null',
      },
    });

    expect(written.body).toContain('Scan for changes');
    expect(written.body).toContain('never once succeeded');
    expect(written.body).toContain('457');
    expect(written.body).toContain('Cannot read properties of null');
  });

  it('says a job that used to work has stopped working', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'job.stalled',
      data: {
        kind: 'server.checkDiskSpace',
        label: 'Check disk space',
        failures: 3,
        everSucceeded: true,
        reason: 'the disk is gone',
      },
    });

    expect(written.body).toContain('since it last worked');
  });

  it('says a job that is working again needs nothing doing', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'job.working',
      data: { kind: 'server.checkDiskSpace', label: 'Check disk space' },
    });

    expect(written.body).toContain('Check disk space');
    expect(written.body).toContain('Nothing needs doing');
  });

  it('says which disk is filling and how much is left', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'disk.low',
      data: { mountPoint: '/media', totalBytes: 2_000_000_000_000, availableBytes: 5_000_000_000 },
    });

    expect(written.body).toContain('/media');
    expect(written.body).toContain('4.7 GB');
    expect(written.body).toContain('1.8 TB');
  });

  it('says a disk with room again needs nothing doing', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'disk.recovered',
      data: {
        mountPoint: '/media',
        totalBytes: 2_000_000_000_000,
        availableBytes: 900_000_000_000,
      },
    });

    expect(written.body).toContain('/media');
    expect(written.body).toContain('Nothing needs doing');
  });

  it('carries the reason the transcoder could not be reached', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'transcoder.unreachable',
      data: { reason: 'connection refused' },
    });

    expect(written.body).toContain('connection refused');
  });

  it('carries the reason the requests service could not be reached', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'requests.unreachable',
      data: { reason: 'http://requests:8421 did not answer' },
    });

    expect(written.body).toContain('requests service could not be reached');
    expect(written.body).toContain('did not answer');
  });

  it('says the requests service came back', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'requests.reachable',
      data: {},
    });

    expect(written.body).toContain('Nothing needs doing');
  });

  it('says why the VPN went down', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'requests.vpnDown',
      data: { reason: 'The tunnel is stopped' },
    });

    expect(written.body).toContain('The tunnel is stopped');
  });

  it('says where traffic leaves from once the VPN is back', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'requests.vpnUp',
      data: { publicAddress: '203.0.113.7', country: 'Netherlands' },
    });

    expect(written.body).toContain('leaving from 203.0.113.7, Netherlands');
  });

  it('says the VPN is up without saying where when it does not know', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'requests.vpnUp',
      data: { publicAddress: null, country: null },
    });

    expect(written.body).toBe('The VPN the requests service downloads through is up.');
  });

  it('names an indexer that keeps failing, and why', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'requests.indexerFailing',
      data: { name: 'Jackett', problem: 'The indexer refused the API key' },
    });

    expect(written.body).toBe(
      'The indexer Jackett keeps failing — The indexer refused the API key',
    );
  });

  it('says an indexer came back is nothing to act on', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'requests.indexerWorking',
      data: { name: 'Jackett' },
    });

    expect(written.body).toContain('Nothing needs doing');
  });

  it('says which client a download was sent to', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'requests.downloadStarted',
      data: { title: 'Dune', client: 'qBittorrent' },
    });

    expect(written.body).toBe('Dune was sent to qBittorrent.');
  });

  it('says where a download failed, and why', () => {
    const written = formatWebhookBody('ntfy', {
      ...anEnvelope,
      event: 'requests.downloadFailed',
      data: { title: 'Dune', client: 'SABnzbd', problem: 'Out of retention' },
    });

    expect(written.body).toBe('Dune failed in SABnzbd — Out of retention');
  });

  it('follows a request from being made to being ready to watch', () => {
    const said = (payload: Parameters<typeof formatWebhookBody>[1]) =>
      formatWebhookBody('ntfy', payload).body;

    expect(
      said({
        ...anEnvelope,
        event: 'requests.made',
        data: { title: 'Dune', kind: 'film', requestedBy: 'Sam' },
      }),
    ).toBe('Sam asked for the film Dune.');
    expect(
      said({
        ...anEnvelope,
        event: 'requests.approved',
        data: { title: 'Dune', approvedBy: null },
      }),
    ).toBe('Dune was approved as it was asked for.');
    expect(
      said({
        ...anEnvelope,
        event: 'requests.approved',
        data: { title: 'Dune', approvedBy: 'Alex' },
      }),
    ).toBe('Alex approved Dune.');
    expect(
      said({ ...anEnvelope, event: 'requests.refused', data: { title: 'Dune', reason: null } }),
    ).toBe('Dune was refused.');
    expect(
      said({
        ...anEnvelope,
        event: 'requests.refused',
        data: { title: 'Dune', reason: 'No room' },
      }),
    ).toBe('Dune was refused — No room');
    expect(
      said({
        ...anEnvelope,
        event: 'requests.chosen',
        data: { title: 'Dune', release: 'Dune.2021.1080p.WEB-DL' },
      }),
    ).toBe('Dune.2021.1080p.WEB-DL was chosen for Dune.');
    expect(
      said({
        ...anEnvelope,
        event: 'requests.filed',
        data: { title: 'Dune', folder: '/media/Films/Dune (2021)' },
      }),
    ).toBe('Dune was filed into /media/Films/Dune (2021).');
    expect(
      said({
        ...anEnvelope,
        event: 'requests.available',
        data: { title: 'Dune', requestedBy: 'Sam', mediaId: 'media-1' },
      }),
    ).toBe('Dune is ready to watch, as Sam asked.');
  });
});

describe('formatWebhookBody, somebody opening and closing Valence', () => {
  const aSession = {
    accountId: 'account-1',
    accountName: 'Dan',
    profileId: 'profile-1',
    profileName: 'Connie',
    clientId: 'tab-1',
    deviceLabel: "Connie's iPhone",
    guestOf: null,
    viaShare: null,
  };

  const said = (payload: WebhookPayload) => formatWebhookBody('ntfy', payload).body;

  it('names whoever opened it by their profile, and the device they opened it on', () => {
    expect(said({ ...anEnvelope, event: 'session.started', data: aSession })).toBe(
      "Connie opened Valence on Connie's iPhone.",
    );
  });

  it('falls back to the account where nobody picked a profile', () => {
    expect(
      said({
        ...anEnvelope,
        event: 'session.started',
        data: { ...aSession, profileId: null, profileName: null },
      }),
    ).toBe("Dan opened Valence on Connie's iPhone.");
  });

  it('names whoever shared the link a guest came in on', () => {
    expect(
      said({
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
      }),
    ).toBe("A guest of Dan opened Valence on Connie's iPhone.");
  });

  it('says how long somebody stayed', () => {
    expect(
      said({
        ...anEnvelope,
        event: 'session.ended',
        data: { ...aSession, lastedSeconds: 4_980 },
      }),
    ).toBe("Connie closed Valence on Connie's iPhone after 1h 23m.");
  });

  it('leaves the length out rather than saying somebody stayed no time at all', () => {
    expect(
      said({ ...anEnvelope, event: 'session.ended', data: { ...aSession, lastedSeconds: 0 } }),
    ).toBe("Connie closed Valence on Connie's iPhone.");
  });
});
