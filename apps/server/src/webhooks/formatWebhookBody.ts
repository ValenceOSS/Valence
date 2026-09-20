import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { describeSpan } from './describeSpan';
import { discordEmbedFor } from './discordEmbedFor';
import { nameOfItem } from './nameOfItem';
import { nameOfViewer } from './nameOfViewer';
import type { PlaybackMode } from '@ValenceContracts/functions/describePlaybackMode';
import type { WebhookPayload, WebhookPreset } from '@ValenceContracts/schemas/Webhook';

const HOW_PLAYED: Record<PlaybackMode, string> = {
  DirectPlay: 'sent as it lies',
  Remux: 'repackaged but not re-encoded',
  DirectStream: 'with only the sound converted',
  Transcode: 'transcoded',
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
      return 'Valence can reach this subscription. Nothing has gone wrong; somebody pressed test.';
    }

    case 'job.completed': {
      const about = payload.data.subjectName === null ? '' : ` for ${payload.data.subjectName}`;

      return `${payload.data.label}${about} finished.`;
    }

    case 'job.failed': {
      const about = payload.data.subjectName === null ? '' : ` for ${payload.data.subjectName}`;

      return `${payload.data.label}${about} failed — ${payload.data.reason}`;
    }

    case 'library.scanned': {
      const said = payload.data.libraries.map((one) => {
        const counts = [
          `${one.added.toString()} added`,
          `${one.updated.toString()} updated`,
          `${one.removed.toString()} removed`,
          ...(one.failed === 0 ? [] : [`${one.failed.toString()} unreadable`]),
        ];
        const andMore =
          one.arrivedNotListed === 0 ? '' : ` and ${one.arrivedNotListed.toString()} more`;
        const titles = one.arrived.length === 0 ? '' : `\n${one.arrived.join(', ')}${andMore}`;

        return `${one.libraryName}: ${counts.join(', ')}${titles}`;
      });

      return said.join('\n');
    }

    case 'catalogue.unreachable': {
      return 'The catalogue could not be reached. Scans will import files without matching them.';
    }

    case 'catalogue.reachable': {
      return 'The catalogue can be reached again. Nothing needs doing.';
    }

    case 'transcoder.unreachable': {
      return `The transcoder could not be reached — ${payload.data.reason}`;
    }

    case 'transcoder.reachable': {
      return 'The transcoder is answering again. Nothing needs doing.';
    }

    case 'requests.unreachable': {
      return `The requests service could not be reached — ${payload.data.reason}`;
    }

    case 'requests.reachable': {
      return 'The requests service is answering again. Nothing needs doing.';
    }

    case 'requests.vpnDown': {
      return `The VPN the requests service downloads through is down — ${payload.data.reason}`;
    }

    case 'requests.indexerFailing': {
      return `The indexer ${payload.data.name} keeps failing — ${payload.data.problem}`;
    }

    case 'requests.indexerWorking': {
      return `The indexer ${payload.data.name} is answering again. Nothing needs doing.`;
    }

    case 'requests.downloadStarted': {
      return `${payload.data.title} was sent to ${payload.data.client}.`;
    }

    case 'requests.downloadFailed': {
      return `${payload.data.title} failed in ${payload.data.client} — ${payload.data.problem}`;
    }

    case 'requests.made': {
      return `${payload.data.requestedBy} asked for the ${payload.data.kind} ${payload.data.title}.`;
    }

    case 'requests.approved': {
      return payload.data.approvedBy === null
        ? `${payload.data.title} was approved as it was asked for.`
        : `${payload.data.approvedBy} approved ${payload.data.title}.`;
    }

    case 'requests.refused': {
      return payload.data.reason === null
        ? `${payload.data.title} was refused.`
        : `${payload.data.title} was refused — ${payload.data.reason}`;
    }

    case 'requests.chosen': {
      return `${payload.data.release} was chosen for ${payload.data.title}.`;
    }

    case 'requests.filed': {
      return `${payload.data.title} was filed into ${payload.data.folder}.`;
    }

    case 'requests.available': {
      return `${payload.data.title} is ready to watch, as ${payload.data.requestedBy} asked.`;
    }

    case 'requests.vpnUp': {
      const where = [payload.data.publicAddress, payload.data.country].filter(
        (part) => part !== null,
      );

      return where.length === 0
        ? 'The VPN the requests service downloads through is up.'
        : `The VPN the requests service downloads through is up, leaving from ${where.join(', ')}.`;
    }

    case 'job.stalled': {
      return payload.data.everSucceeded
        ? `${payload.data.label} has failed every time it has run since it last worked — ${payload.data.failures.toString()} attempts, most recently: ${payload.data.reason}`
        : `${payload.data.label} has never once succeeded — ${payload.data.failures.toString()} attempts, most recently: ${payload.data.reason}`;
    }

    case 'job.working': {
      return `${payload.data.label} has run without failing. Nothing needs doing.`;
    }

    case 'disk.low': {
      return `${payload.data.mountPoint} is running out of room — ${formatBytes(payload.data.availableBytes)} left of ${formatBytes(payload.data.totalBytes)}.`;
    }

    case 'disk.recovered': {
      return `${payload.data.mountPoint} has room again — ${formatBytes(payload.data.availableBytes)} free. Nothing needs doing.`;
    }

    case 'auth.succeeded': {
      const from = payload.data.address === null ? '' : ` from ${payload.data.address}`;

      return `${payload.data.name} signed in on ${payload.data.deviceLabel}${from}.`;
    }

    case 'auth.failed': {
      const from = payload.data.address === null ? '' : ` from ${payload.data.address}`;

      return `A sign-in as ${payload.data.identifier} was refused on ${payload.data.deviceLabel}${from} — ${payload.data.reason}`;
    }

    case 'account.created': {
      return `${payload.data.name} now has an account.`;
    }

    case 'account.deleted': {
      return `${payload.data.name}'s account was deleted.`;
    }

    case 'account.roleChanged': {
      return payload.data.change === 'given'
        ? `${payload.data.name} was given ${payload.data.role}.`
        : `${payload.data.name} no longer has ${payload.data.role}.`;
    }

    case 'media.added': {
      return `${nameOfItem(payload.data)} arrived in ${payload.data.libraryName}.`;
    }

    case 'media.removed': {
      return `${nameOfItem(payload.data)} is no longer in ${payload.data.libraryName}.`;
    }

    case 'playback.started': {
      return `${nameOfViewer(payload.data)} started watching ${nameOfItem(payload.data.item)} on ${payload.data.deviceLabel}, ${HOW_PLAYED[payload.data.mode]}.`;
    }

    case 'playback.stopped': {
      const { positionSeconds, durationSeconds } = payload.data;
      const through =
        positionSeconds === null || durationSeconds === null || durationSeconds === 0
          ? ''
          : ` ${Math.round((positionSeconds / durationSeconds) * 100).toString()}% of the way through`;

      return `${nameOfViewer(payload.data)} stopped watching ${nameOfItem(payload.data.item)}${through}.`;
    }

    case 'session.started': {
      const from = payload.data.address === null ? '' : ` from ${payload.data.address}`;

      return `${nameOfViewer(payload.data)} opened Valence on ${payload.data.deviceLabel}${from}.`;
    }

    case 'session.ended': {
      const stayed = describeSpan(payload.data.lastedSeconds);
      const after = stayed === null ? '' : ` after ${stayed}`;

      return `${nameOfViewer(payload.data)} closed Valence on ${payload.data.deviceLabel}${after}.`;
    }
  }
};

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
      return { body: sentenceFor(payload), contentType: 'text/plain' };
    }
  }
};

export { formatWebhookBody };
