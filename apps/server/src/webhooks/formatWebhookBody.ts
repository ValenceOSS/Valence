import { say } from '@ValenceI18n/say';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { describeArrival } from './describeArrival';
import { describeSpan } from './describeSpan';
import { discordEmbedFor } from './discordEmbedFor';
import { nameOfItem } from './nameOfItem';
import { nameOfViewer } from './nameOfViewer';
import { sayCount } from '@ValenceI18n/sayCount';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { PlaybackMode } from '@ValenceContracts/functions/describePlaybackMode';
import type { WebhookPayload, WebhookPreset } from '@ValenceContracts/schemas/Webhook';

const HOW_PLAYED: Record<PlaybackMode, StringKey> = {
  DirectPlay: 'server.webhook.directPlay',
  Remux: 'server.webhook.remux',
  DirectStream: 'server.webhook.directStream',
  Transcode: 'server.webhook.transcode',
};

const ASKED_FOR: Record<MediaRequestKind, StringKey> = {
  film: 'server.webhook.askedForFilm',
  series: 'server.webhook.askedForSeries',
  artist: 'server.webhook.askedForArtist',
  album: 'server.webhook.askedForAlbum',
  book: 'server.webhook.askedForBook',
};

type WebhookRequestBody = {
  body: string;
  contentType: string;
};

/**
 * Writes what happened as one sentence, for the chat services that show a line rather than render a
 * payload — a delivery nobody can read on a phone is a delivery that may as well not have been sent.
 *
 * @param payload - What happened.
 * @returns The sentence to send.
 */
const sentenceFor = (payload: WebhookPayload): string => {
  switch (payload.event) {
    case 'webhook.test': {
      return say('server.webhook.test');
    }

    case 'job.completed': {
      const { label, subjectName } = payload.data;

      return subjectName === null
        ? say('server.webhook.jobFinished', { label })
        : say('server.webhook.jobFinishedFor', { label, subject: subjectName });
    }

    case 'job.failed': {
      const { label, subjectName, reason } = payload.data;

      return subjectName === null
        ? say('server.webhook.jobFailed', { label, reason })
        : say('server.webhook.jobFailedFor', { label, subject: subjectName, reason });
    }

    case 'library.scanned': {
      const said = payload.data.libraries.map((one) => {
        const numbers = {
          added: one.added.toString(),
          updated: one.updated.toString(),
          removed: one.removed.toString(),
          failed: one.failed.toString(),
        };
        const counts =
          one.failed === 0
            ? say('server.webhook.scanCounts', numbers)
            : say('server.webhook.scanCountsUnreadable', numbers);
        const named = one.arrived.map(describeArrival).join(', ');
        const listed =
          one.arrivedNotListed === 0
            ? named
            : say('server.webhook.andMore', {
                names: named,
                count: one.arrivedNotListed.toString(),
              });
        const titles = one.arrived.length === 0 ? '' : `\n${listed}`;

        return `${say('server.webhook.scannedLibrary', { library: one.libraryName, counts })}${titles}`;
      });

      return said.join('\n');
    }

    case 'catalogue.unreachable': {
      return say('server.webhook.catalogueUnreachable');
    }

    case 'catalogue.reachable': {
      return say('server.webhook.catalogueReachable');
    }

    case 'transcoder.unreachable': {
      return say('server.webhook.transcoderUnreachable', { reason: payload.data.reason });
    }

    case 'transcoder.reachable': {
      return say('server.webhook.transcoderReachable');
    }

    case 'requests.unreachable': {
      return say('server.webhook.requestsUnreachable', { reason: payload.data.reason });
    }

    case 'requests.reachable': {
      return say('server.webhook.requestsReachable');
    }

    case 'requests.vpnDown': {
      return say('server.webhook.vpnDown', { reason: payload.data.reason });
    }

    case 'requests.indexerFailing': {
      return say('server.webhook.indexerFailing', {
        name: payload.data.name,
        problem: payload.data.problem,
      });
    }

    case 'requests.indexerWorking': {
      return say('server.webhook.indexerWorking', { name: payload.data.name });
    }

    case 'requests.downloadStarted': {
      return say('server.webhook.downloadStarted', {
        title: payload.data.title,
        client: payload.data.client,
      });
    }

    case 'requests.downloadFailed': {
      return say('server.webhook.downloadFailed', {
        title: payload.data.title,
        client: payload.data.client,
        problem: payload.data.problem,
      });
    }

    case 'requests.made': {
      return say(ASKED_FOR[payload.data.kind], {
        name: payload.data.requestedBy,
        title: payload.data.title,
      });
    }

    case 'requests.approved': {
      return payload.data.approvedBy === null
        ? say('server.webhook.approvedAsAsked', { title: payload.data.title })
        : say('server.webhook.approvedBy', {
            name: payload.data.approvedBy,
            title: payload.data.title,
          });
    }

    case 'requests.refused': {
      return payload.data.reason === null
        ? say('server.webhook.refused', { title: payload.data.title })
        : say('server.webhook.refusedBecause', {
            title: payload.data.title,
            reason: payload.data.reason,
          });
    }

    case 'requests.chosen': {
      return say('server.webhook.releaseChosen', {
        release: payload.data.release,
        title: payload.data.title,
      });
    }

    case 'requests.filed': {
      return say('server.webhook.filed', {
        title: payload.data.title,
        folder: payload.data.folder,
      });
    }

    case 'requests.available': {
      return say('server.webhook.available', {
        title: payload.data.title,
        name: payload.data.requestedBy,
      });
    }

    case 'requests.vpnUp': {
      const where = [payload.data.publicAddress, payload.data.country].filter(
        (part) => part !== null,
      );

      return where.length === 0
        ? say('server.webhook.vpnUp')
        : say('server.webhook.vpnUpFrom', { where: where.join(', ') });
    }

    case 'job.stalled': {
      const { label, failures, reason } = payload.data;

      return payload.data.everSucceeded
        ? sayCount('server.webhook.stalledSinceWorked', failures, { label, reason })
        : sayCount('server.webhook.neverSucceeded', failures, { label, reason });
    }

    case 'job.working': {
      return say('server.webhook.jobWorking', { label: payload.data.label });
    }

    case 'disk.low': {
      return say('server.webhook.diskLow', {
        disk: payload.data.mountPoint,
        free: formatBytes(payload.data.availableBytes),
        total: formatBytes(payload.data.totalBytes),
      });
    }

    case 'disk.recovered': {
      return say('server.webhook.diskRecovered', {
        disk: payload.data.mountPoint,
        free: formatBytes(payload.data.availableBytes),
      });
    }

    case 'auth.succeeded': {
      const { name, deviceLabel, address } = payload.data;

      return address === null
        ? say('server.webhook.signedIn', { name, device: deviceLabel })
        : say('server.webhook.signedInFrom', { name, device: deviceLabel, address });
    }

    case 'auth.failed': {
      const { identifier, deviceLabel, address, reason } = payload.data;

      return address === null
        ? say('server.webhook.signInRefused', { identifier, device: deviceLabel, reason })
        : say('server.webhook.signInRefusedFrom', {
            identifier,
            device: deviceLabel,
            address,
            reason,
          });
    }

    case 'account.created': {
      return say('server.webhook.accountCreated', { name: payload.data.name });
    }

    case 'account.deleted': {
      return say('server.webhook.accountDeleted', { name: payload.data.name });
    }

    case 'account.roleChanged': {
      const { name, role } = payload.data;

      return payload.data.change === 'given'
        ? say('server.webhook.roleGiven', { name, role })
        : say('server.webhook.roleTaken', { name, role });
    }

    case 'media.added': {
      return say('server.webhook.mediaAdded', {
        item: nameOfItem(payload.data),
        library: payload.data.libraryName,
      });
    }

    case 'media.removed': {
      return say('server.webhook.mediaRemoved', {
        item: nameOfItem(payload.data),
        library: payload.data.libraryName,
      });
    }

    case 'playback.started': {
      return say('server.webhook.playbackStarted', {
        viewer: nameOfViewer(payload.data),
        item: nameOfItem(payload.data.item),
        device: payload.data.deviceLabel,
        how: say(HOW_PLAYED[payload.data.mode]),
      });
    }

    case 'playback.stopped': {
      const { positionSeconds, durationSeconds } = payload.data;
      const viewer = nameOfViewer(payload.data);
      const item = nameOfItem(payload.data.item);

      return positionSeconds === null || durationSeconds === null || durationSeconds === 0
        ? say('server.webhook.playbackStopped', { viewer, item })
        : say('server.webhook.playbackStoppedPart', {
            viewer,
            item,
            percent: Math.round((positionSeconds / durationSeconds) * 100).toString(),
          });
    }

    case 'session.started': {
      const viewer = nameOfViewer(payload.data);
      const { deviceLabel, address } = payload.data;

      return address === null
        ? say('server.webhook.sessionStarted', { viewer, device: deviceLabel })
        : say('server.webhook.sessionStartedFrom', { viewer, device: deviceLabel, address });
    }

    case 'session.ended': {
      const stayed = describeSpan(payload.data.lastedSeconds);
      const viewer = nameOfViewer(payload.data);
      const device = payload.data.deviceLabel;

      return stayed === null
        ? say('server.webhook.sessionEnded', { viewer, device })
        : say('server.webhook.sessionEndedAfter', { viewer, device, span: stayed });
    }
  }
};

/**
 * A sentence, followed by where to read how to put its problem right where there is somewhere.
 *
 * @param sentence - What happened.
 * @param docs - The docs section about the problem, or nothing.
 * @returns The sentence, with the link where there is one.
 */
const withHowToFix = (sentence: string, docs: string | null): string =>
  docs === null
    ? sentence
    : say('server.webhook.howToFix', {
        sentence: sentence.endsWith('.') ? sentence : `${sentence}.`,
        docs,
      });

/**
 * Writes a delivery in the shape its subscriber expects — the event itself for anything generic, and
 * the message shapes Discord and Slack require for those. The same event, said in whichever way the
 * receiver understands.
 *
 * @param preset The shape this subscriber expects.
 * @param payload The event being delivered.
 */
const formatWebhookBody = (preset: WebhookPreset, payload: WebhookPayload): WebhookRequestBody => {
  switch (preset) {
    case 'generic': {
      return { body: JSON.stringify(payload), contentType: 'application/json' };
    }

    case 'discord': {
      return {
        body: JSON.stringify({ embeds: [discordEmbedFor(payload, sentenceFor(payload))] }),
        contentType: 'application/json',
      };
    }

    case 'ntfy': {
      return {
        body: withHowToFix(sentenceFor(payload), 'docs' in payload.data ? payload.data.docs : null),
        contentType: 'text/plain',
      };
    }
  }
};

export { formatWebhookBody };
