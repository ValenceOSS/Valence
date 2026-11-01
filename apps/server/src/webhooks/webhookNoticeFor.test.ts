import { describe, expect, it } from 'vitest';
import { webhookNoticeFor } from './webhookNoticeFor';
import type { WebhookNotice } from './webhookNoticeFor';
import type { WebhookRequest } from '@ValenceContracts/schemas/Webhook';

const anEnvelope = {
  version: 1,
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  occurredAt: '2026-08-14T20:00:00.000Z',
} as const;

const POSTER = 'https://image.tmdb.org/t/p/w500/poster.jpg';

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
  overview: 'A town waits for the sun to come back.',
  durationSeconds: 9300,
  genres: ['Drama', 'Mystery', 'Thriller', 'Crime', 'History'],
  rating: 7.42,
  quality: '4K HDR',
};

const aRequest: WebhookRequest = {
  id: 'request-1',
  kind: 'film',
  title: 'The Long Night',
  artistName: null,
  year: 2021,
  overview: 'A town waits for the sun to come back.',
  posterUrl: POSTER,
  requestedBy: 'Dan',
  requestedByAccountId: 'account-1',
  requestedByProfile: null,
  requestedByProfileId: null,
  askers: [],
  seasons: null,
  state: 'waiting',
};

const aViewer = {
  accountId: 'account-1',
  accountName: 'Dan',
  profileId: 'profile-1',
  profileName: 'Connie',
};

const aSession = {
  ...aViewer,
  clientId: 'tab-1',
  deviceLabel: 'iPhone 17 Pro Max',
  clientLabel: 'Valence for iOS',
  address: '192.168.1.20',
  guestOf: null,
  viaShare: null,
};

const aPlayback = {
  ...aViewer,
  item: anItem,
  deviceLabel: 'iPhone 17 Pro Max',
  clientLabel: 'Valence for iOS',
  mode: 'DirectPlay' as const,
};

const anEmptyNotice = {
  lead: [],
  context: [],
  body: '',
  tags: [],
  details: [],
  sections: [],
  link: null,
  isUrgent: false,
  posterUrl: null,
};

/**
 * A notice's sentence with the names in it marked the way Markdown marks bold, to read in a test.
 *
 * @param notice - The notice.
 * @returns The sentence.
 */
const leadOf = (notice: WebhookNotice): string =>
  notice.lead.map((part) => (typeof part === 'string' ? part : `**${part.strong}**`)).join('');

/**
 * The notice for one event about a request, carrying the request.
 *
 * @param event - Which step of the request.
 * @param request - What differs from the usual request.
 * @returns The notice.
 */
const requestNotice = (
  event:
    | 'requests.made'
    | 'requests.approved'
    | 'requests.refused'
    | 'requests.chosen'
    | 'requests.filed'
    | 'requests.available',
  request: Partial<WebhookRequest> = {},
): WebhookNotice => {
  const carried = { ...aRequest, ...request };
  const shared = { title: carried.title, request: carried };
  const asker = { accountId: null, profileId: null, profileName: null };

  switch (event) {
    case 'requests.made': {
      return webhookNoticeFor({
        ...anEnvelope,
        event,
        data: { ...shared, ...asker, kind: carried.kind, requestedBy: 'Dan' },
      });
    }

    case 'requests.approved': {
      return webhookNoticeFor({ ...anEnvelope, event, data: { ...shared, approvedBy: 'Marques' } });
    }

    case 'requests.refused': {
      return webhookNoticeFor({ ...anEnvelope, event, data: { ...shared, reason: 'Not here' } });
    }

    case 'requests.chosen': {
      return webhookNoticeFor({
        ...anEnvelope,
        event,
        data: { ...shared, release: 'The.Long.Night.2021.2160p.WEB-DL' },
      });
    }

    case 'requests.filed': {
      return webhookNoticeFor({ ...anEnvelope, event, data: { ...shared, folder: '/films' } });
    }

    case 'requests.available': {
      return webhookNoticeFor({
        ...anEnvelope,
        event,
        data: { ...shared, ...asker, requestedBy: 'Dan', mediaId: 'media-1' },
      });
    }
  }
};

describe('webhookNoticeFor, the server and its jobs', () => {
  it('says a test reached the webhook, and that nothing needs doing', () => {
    expect(webhookNoticeFor({ ...anEnvelope, event: 'webhook.test', data: {} })).toStrictEqual({
      ...anEmptyNotice,
      title: 'Valence can reach this webhook',
      lead: ['This is a test message. Nothing needs doing.'],
      footer: 'Webhooks',
      tone: 'quiet',
    });
  });

  it('names the job that finished, and what it was about', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'job.completed',
        data: {
          kind: 'library.scan',
          label: 'Scan for changes',
          jobId: 'job-1',
          subject: 'library-1',
          subjectName: 'Films',
        },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'Job finished',
      lead: [{ strong: 'Scan for changes' }, ' finished'],
      context: ['Films'],
      footer: 'Jobs',
      tone: 'quiet',
    });
  });

  it('writes each part of the small line on one line, its spaces collapsed', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'job.completed',
        data: {
          kind: 'library.scan',
          label: 'Scan for changes',
          jobId: 'job-1',
          subject: 'library-1',
          subjectName: '  Films\n\t 4K  ',
        },
      }).context,
    ).toStrictEqual(['Films 4K']);
  });

  it('quotes why a job failed, as a problem somebody has to put right', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'job.failed',
        data: {
          kind: 'server.cleanupSessions',
          label: 'Clean up sessions',
          jobId: 'job-2',
          subject: null,
          subjectName: null,
          reason: 'ffmpeg exited with 1',
        },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'Job failed',
      lead: [{ strong: 'Clean up sessions' }, ' failed'],
      details: [{ label: null, text: 'ffmpeg exited with 1', look: 'quote' }],
      footer: 'Jobs',
      tone: 'failure',
      isUrgent: true,
    });
  });

  it('counts the attempts of a job that keeps failing, under its latest error', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'job.stalled',
      data: {
        kind: 'library.scan',
        label: 'Scan for changes',
        failures: 3,
        everSucceeded: true,
        reason: 'disk full',
      },
    });

    expect(notice.title).toBe('Job keeps failing');
    expect(leadOf(notice)).toBe('**Scan for changes** has failed every run since it last worked');
    expect(notice.tags).toStrictEqual(['3 attempts']);
    expect(notice.details).toStrictEqual([
      { label: 'Latest error', text: 'disk full', look: 'quote' },
    ]);
    expect(notice.footer).toBe('Jobs');
    expect(notice.tone).toBe('failure');
    expect(notice.isUrgent).toBe(true);
  });

  it('says a job that has never worked has failed every run so far', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'job.stalled',
      data: {
        kind: 'library.scan',
        label: 'Scan for changes',
        failures: 1,
        everSucceeded: false,
        reason: 'disk full',
      },
    });

    expect(leadOf(notice)).toBe('**Scan for changes** has failed every run so far');
    expect(notice.tags).toStrictEqual(['1 attempt']);
  });

  it('says a job working again needs nothing doing', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'job.working',
        data: { kind: 'library.scan', label: 'Scan for changes' },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'Job working again',
      lead: [{ strong: 'Scan for changes' }, ' is running normally again'],
      context: ['No action needed'],
      footer: 'Jobs',
      tone: 'arrival',
    });
  });

  it('says the catalogue going quiet means scans import files without matching them', () => {
    expect(
      webhookNoticeFor({ ...anEnvelope, event: 'catalogue.unreachable', data: {} }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'Couldn’t reach the metadata catalogue',
      lead: ['Scans will import files without matching them'],
      footer: 'Server',
      tone: 'failure',
      isUrgent: true,
    });
  });

  it('says the catalogue is back and needs nothing doing', () => {
    expect(
      webhookNoticeFor({ ...anEnvelope, event: 'catalogue.reachable', data: {} }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'Metadata catalogue is back',
      lead: ['Reachable again'],
      context: ['No action needed'],
      footer: 'Server',
      tone: 'arrival',
    });
  });

  it('quotes why the transcoder could not be reached', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'transcoder.unreachable',
        data: { reason: 'connection refused' },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'Couldn’t reach the transcoder',
      details: [{ label: null, text: 'connection refused', look: 'quote' }],
      footer: 'Server',
      tone: 'failure',
      isUrgent: true,
    });
  });

  it('says the transcoder is responding again', () => {
    const notice = webhookNoticeFor({ ...anEnvelope, event: 'transcoder.reachable', data: {} });

    expect(notice.title).toBe('Transcoder is back');
    expect(notice.lead).toStrictEqual(['Responding again']);
    expect(notice.context).toStrictEqual(['No action needed']);
    expect(notice.tone).toBe('arrival');
  });

  it('says how much of a disk is free, with the mount and the free space set apart', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'disk.low',
      data: {
        mountPoint: '/media',
        availableBytes: 112 * 1024 ** 3,
        totalBytes: 7.3 * 1024 ** 4,
      },
    });

    expect(notice.title).toBe('Running out of space');
    expect(leadOf(notice)).toBe('**/media** has **112 GB** free of 7.3 TB');
    expect(notice.context).toStrictEqual(['1.5% free']);
    expect(notice.footer).toBe('Server');
    expect(notice.tone).toBe('failure');
    expect(notice.isUrgent).toBe(true);
  });

  it('says a disk with room again is good news, in whole percent above ten', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'disk.recovered',
      data: { mountPoint: '/media', availableBytes: 2 * 1024 ** 4, totalBytes: 8 * 1024 ** 4 },
    });

    expect(notice.title).toBe('Space freed up');
    expect(leadOf(notice)).toBe('**/media** has **2.0 TB** free of 8.0 TB');
    expect(notice.context).toStrictEqual(['25% free']);
    expect(notice.tone).toBe('arrival');
    expect(notice.isUrgent).toBe(false);
  });

  it('says no share of a disk is free where its size is not known', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'disk.low',
        data: { mountPoint: '/media', availableBytes: 0, totalBytes: 0 },
      }).context,
    ).toStrictEqual([]);
  });
});

describe('webhookNoticeFor, a library scan', () => {
  const aLibrary = {
    libraryId: 'library-1',
    libraryName: 'Films',
    added: 15,
    updated: 2,
    removed: 0,
    failed: 0,
    arrived: [
      { title: 'The Long Night (2021)', episodes: 1 },
      { title: 'A Quiet Town', episodes: 3 },
    ],
    arrivedNotListed: 13,
  };

  it('names the one library scanned, counts what changed and lists what arrived', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'library.scanned',
        data: { libraries: [aLibrary], added: 15, updated: 2, removed: 0, failed: 0 },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'Films scanned',
      tags: ['15 added', '2 updated', '0 removed'],
      sections: [
        {
          heading: 'Films · 15 added',
          lines: ['The Long Night (2021)', 'A Quiet Town · 3 episodes', '…and 13 more'],
        },
      ],
      footer: 'Libraries',
      tone: 'arrival',
    });
  });

  it('counts the libraries scanned, and lists only those where something arrived', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'library.scanned',
      data: {
        libraries: [
          { ...aLibrary, arrivedNotListed: 0 },
          {
            ...aLibrary,
            libraryId: 'library-2',
            libraryName: 'Music',
            added: 0,
            failed: 4,
            arrived: [],
          },
        ],
        added: 15,
        updated: 4,
        removed: 0,
        failed: 4,
      },
    });

    expect(notice.title).toBe('2 libraries scanned');
    expect(notice.context).toStrictEqual(['Films', 'Music']);
    expect(notice.tags).toStrictEqual(['15 added', '4 updated', '0 removed', '4 unreadable']);
    expect(notice.sections.map((one) => one.heading)).toStrictEqual(['Films · 15 added']);
    expect(notice.sections[0]?.lines).toStrictEqual([
      'The Long Night (2021)',
      'A Quiet Town · 3 episodes',
    ]);
  });

  it('is quiet news where nothing arrived', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'library.scanned',
        data: {
          libraries: [{ ...aLibrary, added: 0, arrived: [], arrivedNotListed: 0 }],
          added: 0,
          updated: 1,
          removed: 1,
          failed: 0,
        },
      }).tone,
    ).toBe('quiet');
  });
});

describe('webhookNoticeFor, the requests service', () => {
  it('quotes why the requests service could not be reached, with where to read how to fix it', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'requests.unreachable',
        data: { reason: 'no answer', docs: 'https://docs.getvalence.app/requests' },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'Couldn’t reach the requests service',
      details: [{ label: null, text: 'no answer', look: 'quote' }],
      link: { label: 'How to fix it', url: 'https://docs.getvalence.app/requests' },
      footer: 'Requests',
      tone: 'failure',
      isUrgent: true,
    });
  });

  it('gives no link where the documentation says nothing about the problem', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'requests.unreachable',
        data: { reason: 'no answer', docs: null },
      }).link,
    ).toBeNull();
  });

  it('says the requests service is responding again', () => {
    const notice = webhookNoticeFor({ ...anEnvelope, event: 'requests.reachable', data: {} });

    expect(notice.title).toBe('Requests service is back');
    expect(notice.lead).toStrictEqual(['Responding again']);
    expect(notice.context).toStrictEqual(['No action needed']);
    expect(notice.footer).toBe('Requests');
  });

  it('quotes why the download VPN went down', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'requests.vpnDown',
      data: { reason: 'the tunnel closed', docs: 'https://docs.getvalence.app/requests#vpn' },
    });

    expect(notice.title).toBe('Download VPN is down');
    expect(notice.details).toStrictEqual([
      { label: null, text: 'the tunnel closed', look: 'quote' },
    ]);
    expect(notice.link).toStrictEqual({
      label: 'How to fix it',
      url: 'https://docs.getvalence.app/requests#vpn',
    });
    expect(notice.isUrgent).toBe(true);
  });

  it('says where traffic leaves from once the VPN is up', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'requests.vpnUp',
        data: { publicAddress: '203.0.113.9', country: 'Sweden' },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'Download VPN is up',
      context: ['Public IP 203.0.113.9', 'Sweden'],
      footer: 'Requests',
      tone: 'arrival',
    });
  });

  it('says the VPN is up without saying where when it does not know', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'requests.vpnUp',
        data: { publicAddress: null, country: null },
      }).context,
    ).toStrictEqual([]);
  });

  it('names an indexer that keeps failing, and quotes why', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'requests.indexerFailing',
      data: { name: 'An indexer', problem: 'Timed out', docs: null },
    });

    expect(notice.title).toBe('Indexer keeps failing');
    expect(leadOf(notice)).toBe('**An indexer** keeps failing');
    expect(notice.details).toStrictEqual([{ label: null, text: 'Timed out', look: 'quote' }]);
    expect(notice.link).toBeNull();
    expect(notice.isUrgent).toBe(true);
  });

  it('names an indexer responding again', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'requests.indexerWorking',
      data: { name: 'An indexer' },
    });

    expect(notice.title).toBe('Indexer is back');
    expect(leadOf(notice)).toBe('**An indexer** is responding again');
    expect(notice.context).toStrictEqual(['No action needed']);
    expect(notice.tone).toBe('arrival');
  });

  it('names the release a download started for, and the client it went to', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'requests.downloadStarted',
        data: { title: 'The Long Night (2021)', client: 'qBittorrent' },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'Download started',
      lead: [{ strong: 'The Long Night (2021)' }],
      context: ['Sent to qBittorrent'],
      footer: 'Requests',
      tone: 'arrival',
    });
  });

  it('quotes why a download failed, and in which client', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'requests.downloadFailed',
        data: { title: 'The Long Night (2021)', client: 'SABnzbd', problem: 'Out of retention' },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'Download failed',
      lead: [{ strong: 'The Long Night (2021)' }],
      context: ['SABnzbd'],
      details: [{ label: null, text: 'Out of retention', look: 'quote' }],
      footer: 'Requests',
      tone: 'failure',
      isUrgent: true,
    });
  });
});

describe('webhookNoticeFor, a request that carries its request', () => {
  it('titles a request by what it is for, with its summary and poster when it is made', () => {
    expect(requestNotice('requests.made')).toStrictEqual({
      ...anEmptyNotice,
      title: 'The Long Night (2021)',
      lead: [{ strong: 'Dan' }, ' requested this film'],
      body: 'A town waits for the sun to come back.',
      posterUrl: POSTER,
      footer: 'Requests',
      tone: 'quiet',
    });
  });

  it('tags a request waiting for approval, and asks for attention', () => {
    const notice = requestNotice('requests.made', { state: 'awaitingApproval' });

    expect(notice.tags).toStrictEqual(['Waiting for approval']);
    expect(notice.tone).toBe('attention');
  });

  it('names each kind of thing asked for', () => {
    expect(
      (['series', 'artist', 'album', 'book', 'bookSeries'] as const).map((kind) =>
        leadOf(requestNotice('requests.made', { kind })),
      ),
    ).toStrictEqual([
      '**Dan** requested this series',
      '**Dan** requested this artist',
      '**Dan** requested this album',
      '**Dan** requested this book',
      '**Dan** requested this book series',
    ]);
  });

  it('names the asker by their profile and household where those differ', () => {
    expect(leadOf(requestNotice('requests.made', { requestedByProfile: 'Connie' }))).toBe(
      '**Connie from Dan** requested this film',
    );
    expect(leadOf(requestNotice('requests.made', { requestedByProfile: 'Dan' }))).toBe(
      '**Dan** requested this film',
    );
  });

  it('leaves out the year of a title that has none', () => {
    expect(requestNotice('requests.made', { year: null }).title).toBe('The Long Night');
  });

  it('says which seasons of a series were asked for', () => {
    expect(
      requestNotice('requests.made', { kind: 'series', seasons: [1, 2, 3, 4, 6, 7] }).context,
    ).toStrictEqual(['Seasons 1–4, 6 and 7']);
    expect(
      requestNotice('requests.made', { kind: 'series', seasons: [0, 2] }).context,
    ).toStrictEqual(['Specials and season 2']);
    expect(requestNotice('requests.made', { kind: 'series', seasons: [] }).context).toStrictEqual(
      [],
    );
  });

  it('says whose album was asked for', () => {
    expect(
      requestNotice('requests.made', { kind: 'album', artistName: 'The Band' }).context,
    ).toStrictEqual(['By The Band']);
  });

  it('says who approved a request, and whose it was', () => {
    const notice = requestNotice('requests.approved');

    expect(leadOf(notice)).toBe('**Marques** approved **Dan**’s request');
    expect(notice.tone).toBe('quiet');
    expect(notice.footer).toBe('Requests');
  });

  it('says a request nobody approved by hand was approved automatically', () => {
    expect(
      leadOf(
        webhookNoticeFor({
          ...anEnvelope,
          event: 'requests.approved',
          data: { title: 'The Long Night', approvedBy: null, request: aRequest },
        }),
      ),
    ).toBe('**Dan**’s request was approved automatically');
  });

  it('tells the summary only when a request is made and when it arrives', () => {
    expect(
      (
        [
          'requests.made',
          'requests.approved',
          'requests.refused',
          'requests.chosen',
          'requests.filed',
          'requests.available',
        ] as const
      ).map((event) => requestNotice(event).body !== ''),
    ).toStrictEqual([true, false, false, false, false, true]);
  });

  it('keeps the poster at every step of a request', () => {
    expect(requestNotice('requests.filed').posterUrl).toBe(POSTER);
  });

  it('quotes why a request was declined, as bad news', () => {
    const notice = requestNotice('requests.refused');

    expect(leadOf(notice)).toBe('**Dan**’s request was declined');
    expect(notice.details).toStrictEqual([{ label: 'Reason', text: 'Not here', look: 'quote' }]);
    expect(notice.tone).toBe('failure');
    expect(notice.isUrgent).toBe(false);
  });

  it('gives a declined request with no reason no details', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'requests.refused',
        data: { title: 'The Long Night', reason: null, request: aRequest },
      }).details,
    ).toStrictEqual([]);
  });

  it('sets the release chosen for a request as code', () => {
    const notice = requestNotice('requests.chosen');

    expect(leadOf(notice)).toBe('Found a release for **Dan**’s request');
    expect(notice.details).toStrictEqual([
      { label: 'Release', text: 'The.Long.Night.2021.2160p.WEB-DL', look: 'code' },
    ]);
    expect(notice.tone).toBe('viewing');
  });

  it('says a request is in the library once it is filed', () => {
    const notice = requestNotice('requests.filed');

    expect(leadOf(notice)).toBe('**Dan**’s request is in the library');
    expect(notice.tone).toBe('viewing');
  });

  it('says a request is ready to watch, listen to or read, as good news', () => {
    expect(
      (['film', 'series', 'album', 'artist', 'book', 'bookSeries'] as const).map((kind) =>
        leadOf(requestNotice('requests.available', { kind })),
      ),
    ).toStrictEqual([
      '**Dan**’s request is ready to watch',
      '**Dan**’s request is ready to watch',
      '**Dan**’s request is ready to listen to',
      '**Dan**’s request is ready to listen to',
      '**Dan**’s request is ready to read',
      '**Dan**’s request is ready to read',
    ]);
    expect(requestNotice('requests.available').tone).toBe('arrival');
  });
});

describe('webhookNoticeFor, a request from a service too old to send the request', () => {
  it('says who asked for what, from the event alone', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'requests.made',
        data: {
          title: 'The Long Night',
          kind: 'series',
          requestedBy: 'Dan',
          accountId: null,
          profileId: null,
          profileName: null,
          request: null,
        },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'The Long Night',
      lead: [{ strong: 'Dan' }, ' requested this series'],
      footer: 'Requests',
      tone: 'quiet',
    });
  });

  it('says who approved the request', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'requests.approved',
        data: { title: 'The Long Night', approvedBy: 'Marques', request: null },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'The Long Night',
      lead: [{ strong: 'Marques' }, ' approved the request'],
      footer: 'Requests',
      tone: 'quiet',
    });
  });

  it('says the request was approved automatically where nobody approved it by hand', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'requests.approved',
        data: { title: 'The Long Night', approvedBy: null, request: null },
      }).lead,
    ).toStrictEqual(['The request was approved automatically']);
  });

  it('still quotes why a request was declined', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'requests.refused',
      data: { title: 'The Long Night', reason: 'Not here', request: null },
    });

    expect(notice.lead).toStrictEqual(['The request was declined']);
    expect(notice.details).toStrictEqual([{ label: 'Reason', text: 'Not here', look: 'quote' }]);
    expect(notice.tone).toBe('failure');
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'requests.refused',
        data: { title: 'The Long Night', reason: null, request: null },
      }).details,
    ).toStrictEqual([]);
  });

  it('says a release was found, and sets it as code', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'requests.chosen',
      data: { title: 'The Long Night', release: 'A.Release', request: null },
    });

    expect(notice.lead).toStrictEqual(['Found a release']);
    expect(notice.details).toStrictEqual([{ label: 'Release', text: 'A.Release', look: 'code' }]);
  });

  it('says a filed request is now in the library', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'requests.filed',
        data: { title: 'The Long Night', folder: '/films', request: null },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'The Long Night',
      lead: ['Now in the library'],
      footer: 'Requests',
      tone: 'viewing',
    });
  });

  it('says whose request is ready to watch', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'requests.available',
      data: {
        title: 'The Long Night',
        requestedBy: 'Dan',
        accountId: null,
        profileId: null,
        profileName: null,
        mediaId: 'media-1',
        request: null,
      },
    });

    expect(notice.title).toBe('The Long Night');
    expect(leadOf(notice)).toBe('**Dan**’s request is ready to watch');
    expect(notice.body).toBe('');
    expect(notice.posterUrl).toBeNull();
    expect(notice.tone).toBe('arrival');
  });

  it('names the profile that asked and its household', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'requests.made',
        data: {
          title: 'The Long Night',
          kind: 'film',
          requestedBy: 'Dan',
          accountId: null,
          profileId: null,
          profileName: 'Connie',
          request: null,
        },
      }).lead,
    ).toStrictEqual([{ strong: 'Connie from Dan' }, ' requested this film']);
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'requests.available',
        data: {
          title: 'The Long Night',
          requestedBy: 'Dan',
          accountId: null,
          profileId: null,
          profileName: 'Connie',
          mediaId: 'media-1',
          request: null,
        },
      }).lead,
    ).toStrictEqual([{ strong: 'Connie from Dan' }, '’s request is ready to watch']);
  });
});

describe('webhookNoticeFor, people', () => {
  it('says who signed in, on what and from where', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'auth.succeeded',
        data: {
          accountId: 'account-1',
          name: 'Dan',
          deviceLabel: 'iPhone 17 Pro Max',
          clientLabel: 'Valence for iOS',
          address: '192.168.1.20',
        },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'Dan signed in',
      context: ['iPhone 17 Pro Max', 'Valence for iOS', 'from 192.168.1.20'],
      footer: 'Accounts',
      tone: 'attention',
    });
  });

  it('leaves out what nothing said about where a sign-in came from', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'auth.succeeded',
        data: {
          accountId: 'account-1',
          name: 'Dan',
          deviceLabel: 'Chrome on macOS',
          clientLabel: null,
          address: null,
        },
      }).context,
    ).toStrictEqual(['Chrome on macOS']);
  });

  it('says what a blocked sign-in tried, and quotes why it was blocked', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'auth.failed',
        data: {
          identifier: 'dan@example.com',
          deviceLabel: 'Chrome on macOS',
          clientLabel: null,
          address: '203.0.113.9',
          reason: 'Those details weren’t accepted.',
        },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'A sign-in was blocked',
      lead: ['Tried ', { strong: 'dan@example.com' }],
      context: ['Chrome on macOS', 'from 203.0.113.9'],
      details: [{ label: null, text: 'Those details weren’t accepted.', look: 'quote' }],
      footer: 'Accounts',
      tone: 'failure',
    });
  });

  it('says who is watching, under the household it belongs to', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'profile.chosen',
        data: {
          accountId: 'account-1',
          accountName: 'The Morgans',
          profileId: 'profile-1',
          profileName: 'Connie',
          deviceLabel: 'Living room TV',
          clientLabel: null,
          address: null,
        },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'Connie from The Morgans is watching',
      context: ['Living room TV'],
      footer: 'Accounts',
      tone: 'attention',
    });
  });

  it('names the profile alone where it shares its household’s name', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'profile.chosen',
        data: {
          accountId: 'account-1',
          accountName: 'Dan',
          profileId: 'profile-1',
          profileName: 'Dan',
          deviceLabel: 'Living room TV',
          clientLabel: null,
          address: null,
        },
      }).title,
    ).toBe('Dan is watching');
  });

  it('names somebody new with an account', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'account.created',
        data: { accountId: 'account-2', name: 'Ada' },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'New account',
      lead: [{ strong: 'Ada' }, ' created an account'],
      footer: 'Accounts',
      tone: 'arrival',
    });
  });

  it('names whose account was deleted', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'account.deleted',
        data: { accountId: 'account-2', name: 'Ada' },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'Account deleted',
      lead: [{ strong: 'Ada' }, '’s account was deleted'],
      footer: 'Accounts',
      tone: 'failure',
    });
  });

  it('names who was given a role, and which', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'account.roleChanged',
      data: { accountId: 'account-2', name: 'Ada', role: 'Admin', change: 'given' },
    });

    expect(notice.title).toBe('Role given');
    expect(leadOf(notice)).toBe('**Ada** was given the **Admin** role');
    expect(notice.footer).toBe('Accounts');
    expect(notice.tone).toBe('attention');
  });

  it('names who no longer has a role, and which', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'account.roleChanged',
      data: { accountId: 'account-2', name: 'Ada', role: 'Admin', change: 'taken' },
    });

    expect(notice.title).toBe('Role taken away');
    expect(leadOf(notice)).toBe('**Ada** no longer has the **Admin** role');
  });
});

describe('webhookNoticeFor, somebody opening and closing Valence', () => {
  it('says who opened Valence, on what, from where, and on whose account', () => {
    expect(
      webhookNoticeFor({ ...anEnvelope, event: 'session.started', data: aSession }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'Connie from Dan opened Valence',
      context: ['iPhone 17 Pro Max', 'Valence for iOS', 'from 192.168.1.20', 'On Dan’s account'],
      footer: 'Sessions',
      tone: 'viewing',
    });
  });

  it('leaves the account out where it is the profile', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'session.started',
        data: { ...aSession, profileName: 'Dan', clientLabel: null, address: null },
      }).context,
    ).toStrictEqual(['iPhone 17 Pro Max']);
  });

  it('leaves the account out where nobody chose a profile', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'session.started',
      data: { ...aSession, profileId: null, profileName: null },
    });

    expect(notice.title).toBe('Dan opened Valence');
    expect(notice.context).toStrictEqual([
      'iPhone 17 Pro Max',
      'Valence for iOS',
      'from 192.168.1.20',
    ]);
  });

  it('names whoever let a guest in', () => {
    const notice = webhookNoticeFor({
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
    });

    expect(notice.title).toBe('A guest of Dan opened Valence');
    expect(notice.context).toStrictEqual([
      'iPhone 17 Pro Max',
      'Valence for iOS',
      'from 192.168.1.20',
    ]);
  });

  it('says how long somebody stayed, and not where they came from, when they go', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'session.ended',
        data: { ...aSession, lastedSeconds: 4_980 },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'Connie from Dan closed Valence',
      context: ['iPhone 17 Pro Max', 'Valence for iOS'],
      tags: ['Stayed 1h 23m'],
      footer: 'Sessions',
      tone: 'quiet',
    });
  });

  it('says nothing of a stay that lasted no time at all', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'session.ended',
        data: { ...aSession, lastedSeconds: 0 },
      }).tags,
    ).toStrictEqual([]);
  });
});

describe('webhookNoticeFor, the library', () => {
  it('says what arrived and where, with its summary, details, genres and poster', () => {
    expect(webhookNoticeFor({ ...anEnvelope, event: 'media.added', data: anItem })).toStrictEqual({
      ...anEmptyNotice,
      title: 'The Long Night (2021)',
      lead: ['Added to ', { strong: 'Films' }],
      context: ['Drama', 'Mystery', 'Thriller', 'Crime'],
      body: 'A town waits for the sun to come back.',
      tags: ['Film', '2h 35m', '4K HDR', '★ 7.4'],
      posterUrl: POSTER,
      footer: 'Films',
      tone: 'arrival',
    });
  });

  it('leaves out every detail nothing said', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'media.added',
      data: {
        ...anItem,
        overview: null,
        durationSeconds: null,
        genres: [],
        rating: 0,
        quality: null,
      },
    });

    expect(notice.tags).toStrictEqual(['Film']);
    expect(notice.context).toStrictEqual([]);
    expect(notice.body).toBe('');
  });

  it('names an episode by its place in its series', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'media.added',
        data: {
          ...anItem,
          kind: 'episode',
          title: 'The Bridge',
          seriesTitle: 'A Quiet Town',
          seasonNumber: 2,
          episodeNumber: 3,
        },
      }).title,
    ).toBe('A Quiet Town S02E03 — The Bridge');
  });

  it('says what left and where from, quietly and with nothing more', () => {
    expect(webhookNoticeFor({ ...anEnvelope, event: 'media.removed', data: anItem })).toStrictEqual(
      {
        ...anEmptyNotice,
        title: 'The Long Night (2021)',
        lead: ['Removed from ', { strong: 'Films' }],
        posterUrl: POSTER,
        footer: 'Films',
        tone: 'quiet',
      },
    );
  });

  it('keeps no poster that is not a web address a receiver could fetch', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'media.added',
        data: { ...anItem, posterUrl: 'ftp://example.com/poster.jpg' },
      }).posterUrl,
    ).toBeNull();
  });
});

describe('webhookNoticeFor, somebody watching or listening', () => {
  it('says who started watching what, on which device, and how it plays', () => {
    expect(
      webhookNoticeFor({ ...anEnvelope, event: 'playback.started', data: aPlayback }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'The Long Night (2021)',
      lead: [{ strong: 'Connie from Dan' }, ' started watching'],
      context: ['iPhone 17 Pro Max', 'Valence for iOS'],
      tags: ['Direct play', '4K HDR', '2h 35m'],
      posterUrl: POSTER,
      footer: 'Films',
      tone: 'viewing',
    });
  });

  it('names each way a title can play', () => {
    expect(
      (['DirectStream', 'Remux', 'Transcode'] as const).map(
        (mode) =>
          webhookNoticeFor({
            ...anEnvelope,
            event: 'playback.started',
            data: { ...aPlayback, mode, item: { ...anItem, quality: null, durationSeconds: null } },
          }).tags,
      ),
    ).toStrictEqual([['Direct stream'], ['Remux'], ['Transcode']]);
  });

  it('says somebody started listening to a song', () => {
    expect(
      leadOf(
        webhookNoticeFor({
          ...anEnvelope,
          event: 'playback.started',
          data: { ...aPlayback, item: { ...anItem, kind: 'song' } },
        }),
      ),
    ).toBe('**Connie from Dan** started listening');
  });

  it('says where somebody stopped, and how much of it they watched', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'playback.stopped',
      data: { ...aPlayback, positionSeconds: 1350, durationSeconds: 2700 },
    });

    expect(leadOf(notice)).toBe('**Connie from Dan** stopped watching');
    expect(notice.tags).toStrictEqual(['Stopped at 22:30 of 45:00', '50% watched']);
    expect(notice.tone).toBe('viewing');
  });

  it('says where somebody stopped past the first hour in hours as well', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'playback.stopped',
        data: { ...aPlayback, positionSeconds: 4500, durationSeconds: 9005 },
      }).tags,
    ).toStrictEqual(['Stopped at 1:15:00 of 2:30:05', '50% watched']);
  });

  it('says how much of a song somebody listened to', () => {
    const notice = webhookNoticeFor({
      ...anEnvelope,
      event: 'playback.stopped',
      data: {
        ...aPlayback,
        item: { ...anItem, kind: 'song' },
        positionSeconds: 61,
        durationSeconds: 244,
      },
    });

    expect(leadOf(notice)).toBe('**Connie from Dan** stopped listening');
    expect(notice.tags).toStrictEqual(['Stopped at 1:01 of 4:04', '25% listened']);
  });

  it('leaves out how far through where nothing said', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'playback.stopped',
        data: { ...aPlayback, positionSeconds: null, durationSeconds: null },
      }).tags,
    ).toStrictEqual([]);
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'playback.stopped',
        data: { ...aPlayback, positionSeconds: 30, durationSeconds: 0 },
      }).tags,
    ).toStrictEqual(['Stopped at 0:30']);
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'playback.stopped',
        data: { ...aPlayback, positionSeconds: 30, durationSeconds: null },
      }).tags,
    ).toStrictEqual(['Stopped at 0:30']);
  });

  it('names nobody for a share link rather than leaving the sentence broken', () => {
    expect(
      leadOf(
        webhookNoticeFor({
          ...anEnvelope,
          event: 'playback.started',
          data: {
            ...aPlayback,
            accountId: null,
            accountName: null,
            profileId: null,
            profileName: null,
          },
        }),
      ),
    ).toBe('**Someone with a share link** started watching');
  });
});

describe('webhookNoticeFor, a plugin', () => {
  it('puts a number before what it counts and anything else after its name', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'plugin.event',
        data: {
          pluginId: 'music-import',
          pluginName: 'Playlist import',
          name: 'imported',
          title: 'A playlist was imported',
          detail: {
            playlist: 'Road trip',
            songs: 1200,
            year: 2024,
            ratio: 1.23456,
            explicit: false,
            requested: null,
          },
        },
      }),
    ).toStrictEqual({
      ...anEmptyNotice,
      title: 'A playlist was imported',
      tags: ['playlist: Road trip', '1200 songs', '2024 year', '1.23456 ratio', 'explicit: false'],
      footer: 'Playlist import',
      tone: 'quiet',
    });
  });

  it('shows no more than ten of a plugin’s details', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'plugin.event',
        data: {
          pluginId: 'music-import',
          pluginName: 'Playlist import',
          name: 'imported',
          title: 'A playlist was imported',
          detail: Object.fromEntries(
            Array.from({ length: 12 }, (_, index) => [`detail${index.toString()}`, index]),
          ),
        },
      }).tags,
    ).toHaveLength(10);
  });

  it('writes each tag on one line, its spaces collapsed, cut to eighty characters', () => {
    expect(
      webhookNoticeFor({
        ...anEnvelope,
        event: 'plugin.event',
        data: {
          pluginId: 'music-import',
          pluginName: 'Playlist import',
          name: 'imported',
          title: 'A playlist was imported',
          detail: { note: 'one\n\n  two', long: 'x'.repeat(200) },
        },
      }).tags,
    ).toStrictEqual(['note: one two', `long: ${'x'.repeat(73)}…`]);
  });
});

describe('webhookNoticeFor, under a server’s own name', () => {
  it('names the server by the name it was given wherever a notice names it', () => {
    expect(webhookNoticeFor({ ...anEnvelope, event: 'webhook.test', data: {} }, 'Flux').title).toBe(
      'Flux can reach this webhook',
    );
    expect(
      webhookNoticeFor(
        {
          ...anEnvelope,
          event: 'session.started',
          data: { ...aSession, address: null },
        },
        'Flux',
      ).title,
    ).toBe('Connie from Dan opened Flux');
  });
});
