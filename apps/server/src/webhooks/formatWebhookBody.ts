import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { describeArrival } from './describeArrival';
import { describeSpan } from './describeSpan';
import { discordEmbedFor } from './discordEmbedFor';
import { nameOfItem } from './nameOfItem';
import { nameOfViewer } from './nameOfViewer';
import type { PlaybackMode } from '@ValenceContracts/functions/describePlaybackMode';
import type { WebhookPayload, WebhookPreset } from '@ValenceContracts/schemas/Webhook';
import { say } from '@ValenceI18n/say';

const HOW_PLAYED: Record<PlaybackMode, string> = {
  DirectPlay: say('server.webhooks.formatWebhookBody.sentAsItLies'),
  Remux: 'repackaged but not re-encoded',
  DirectStream: say('server.webhooks.formatWebhookBody.withOnlyTheSoundConverted'),
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
      return say('server.webhooks.formatWebhookBody.valenceCanReachThisSubscriptionNothing');
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
          one.arrivedNotListed === 0
            ? ''
            : say('server.webhooks.formatWebhookBody.andArrivedNotListedMore', {
                arrivedNotListed: one.arrivedNotListed.toString(),
              });
        const named = one.arrived.map(describeArrival).join(', ');
        const titles = one.arrived.length === 0 ? '' : `\n${named}${andMore}`;

        return `${one.libraryName}: ${counts.join(', ')}${titles}`;
      });

      return said.join('\n');
    }

    case 'catalogue.unreachable': {
      return say('server.webhooks.formatWebhookBody.theCatalogueCouldNotBeReached');
    }

    case 'catalogue.reachable': {
      return say('server.webhooks.formatWebhookBody.theCatalogueCanBeReachedAgain');
    }

    case 'transcoder.unreachable': {
      return say('server.webhooks.formatWebhookBody.theTranscoderCouldNotBeReached', {
        reason: payload.data.reason,
      });
    }

    case 'transcoder.reachable': {
      return say('server.webhooks.formatWebhookBody.theTranscoderIsAnsweringAgainNothing');
    }

    case 'requests.unreachable': {
      return say('server.webhooks.formatWebhookBody.theRequestsServiceCouldNotBe', {
        reason: payload.data.reason,
      });
    }

    case 'requests.reachable': {
      return say('server.webhooks.formatWebhookBody.theRequestsServiceIsAnsweringAgain');
    }

    case 'requests.vpnDown': {
      return say('server.webhooks.formatWebhookBody.vpnDown', {
        reason: payload.data.reason,
      });
    }

    case 'requests.indexerFailing': {
      return say('server.webhooks.formatWebhookBody.theIndexerNameKeepsFailingProblem', {
        name: payload.data.name,
        problem: payload.data.problem,
      });
    }

    case 'requests.indexerWorking': {
      return say('server.webhooks.formatWebhookBody.theIndexerNameIsAnsweringAgain', {
        name: payload.data.name,
      });
    }

    case 'requests.downloadStarted': {
      return say('server.webhooks.formatWebhookBody.titleWasSentToClient', {
        title: payload.data.title,
        client: payload.data.client,
      });
    }

    case 'requests.downloadFailed': {
      return say('server.webhooks.formatWebhookBody.titleFailedInClientProblem', {
        title: payload.data.title,
        client: payload.data.client,
        problem: payload.data.problem,
      });
    }

    case 'requests.made': {
      return say('server.webhooks.formatWebhookBody.requestedByAskedForTheKindTitle', {
        requestedBy: payload.data.requestedBy,
        kind: payload.data.kind,
        title: payload.data.title,
      });
    }

    case 'requests.approved': {
      return payload.data.approvedBy === null
        ? say('server.webhooks.formatWebhookBody.titleWasApprovedAsItWas', {
            title: payload.data.title,
          })
        : `${payload.data.approvedBy} approved ${payload.data.title}.`;
    }

    case 'requests.refused': {
      return payload.data.reason === null
        ? say('server.webhooks.formatWebhookBody.titleWasRefused', { title: payload.data.title })
        : say('server.webhooks.formatWebhookBody.titleWasRefusedReason', {
            title: payload.data.title,
            reason: payload.data.reason,
          });
    }

    case 'requests.chosen': {
      return say('server.webhooks.formatWebhookBody.releaseWasChosenForTitle', {
        release: payload.data.release,
        title: payload.data.title,
      });
    }

    case 'requests.filed': {
      return say('server.webhooks.formatWebhookBody.titleWasFiledIntoFolder', {
        title: payload.data.title,
        folder: payload.data.folder,
      });
    }

    case 'requests.available': {
      return say('server.webhooks.formatWebhookBody.titleIsReadyToWatchAs', {
        title: payload.data.title,
        requestedBy: payload.data.requestedBy,
      });
    }

    case 'requests.vpnUp': {
      const where = [payload.data.publicAddress, payload.data.country].filter(
        (part) => part !== null,
      );

      return where.length === 0
        ? say('server.webhooks.formatWebhookBody.vpnUp')
        : say('server.webhooks.formatWebhookBody.vpnUpFrom', {
            address: where.join(', '),
          });
    }

    case 'job.stalled': {
      return payload.data.everSucceeded
        ? `${payload.data.label} has failed every time it has run since it last worked — ${payload.data.failures.toString()} attempts, most recently: ${payload.data.reason}`
        : `${payload.data.label} has never once succeeded — ${payload.data.failures.toString()} attempts, most recently: ${payload.data.reason}`;
    }

    case 'job.working': {
      return say('server.webhooks.formatWebhookBody.labelHasRunWithoutFailingNothing', {
        label: payload.data.label,
      });
    }

    case 'disk.low': {
      return say('server.webhooks.formatWebhookBody.mountPointIsRunningOutOfRoom', {
        mountPoint: payload.data.mountPoint,
        availableBytes: formatBytes(payload.data.availableBytes),
        totalBytes: formatBytes(payload.data.totalBytes),
      });
    }

    case 'disk.recovered': {
      return say('server.webhooks.formatWebhookBody.mountPointHasRoomAgainAvailableBytesFree', {
        mountPoint: payload.data.mountPoint,
        availableBytes: formatBytes(payload.data.availableBytes),
      });
    }

    case 'auth.succeeded': {
      const from = payload.data.address === null ? '' : ` from ${payload.data.address}`;

      return say('server.webhooks.formatWebhookBody.nameSignedInOnDeviceLabelFrom', {
        name: payload.data.name,
        deviceLabel: payload.data.deviceLabel,
        from,
      });
    }

    case 'auth.failed': {
      const from = payload.data.address === null ? '' : ` from ${payload.data.address}`;

      return say('server.webhooks.formatWebhookBody.aSignInAsIdentifierWas', {
        identifier: payload.data.identifier,
        deviceLabel: payload.data.deviceLabel,
        from,
        reason: payload.data.reason,
      });
    }

    case 'account.created': {
      return say('server.webhooks.formatWebhookBody.nameNowHasAnAccount', {
        name: payload.data.name,
      });
    }

    case 'account.deleted': {
      return say('server.webhooks.formatWebhookBody.nameSAccountWasDeleted', {
        name: payload.data.name,
      });
    }

    case 'account.roleChanged': {
      return payload.data.change === 'given'
        ? say('server.webhooks.formatWebhookBody.nameWasGivenRole', {
            name: payload.data.name,
            role: payload.data.role,
          })
        : say('server.webhooks.formatWebhookBody.nameNoLongerHasRole', {
            name: payload.data.name,
            role: payload.data.role,
          });
    }

    case 'media.added': {
      return say('server.webhooks.formatWebhookBody.itemArrived', {
        item: nameOfItem(payload.data),
        library: payload.data.libraryName,
      });
    }

    case 'media.removed': {
      return say('server.webhooks.formatWebhookBody.itemGone', {
        item: nameOfItem(payload.data),
        library: payload.data.libraryName,
      });
    }

    case 'playback.started': {
      return say('server.webhooks.formatWebhookBody.startedWatching', {
        viewer: nameOfViewer(payload.data),
        item: nameOfItem(payload.data.item),
        device: payload.data.deviceLabel,
        how: HOW_PLAYED[payload.data.mode],
      });
    }

    case 'playback.stopped': {
      const { positionSeconds, durationSeconds } = payload.data;
      const watched = { viewer: nameOfViewer(payload.data), item: nameOfItem(payload.data.item) };

      return positionSeconds === null || durationSeconds === null || durationSeconds === 0
        ? say('server.webhooks.stoppedWatching', watched)
        : say('server.webhooks.stoppedWatchingPartWay', {
            ...watched,
            percent: Math.round((positionSeconds / durationSeconds) * 100),
          });
    }

    case 'session.started': {
      const opened = { viewer: nameOfViewer(payload.data), device: payload.data.deviceLabel };

      return payload.data.address === null
        ? say('server.webhooks.openedValence', opened)
        : say('server.webhooks.openedValenceFrom', { ...opened, address: payload.data.address });
    }

    case 'session.ended': {
      const span = describeSpan(payload.data.lastedSeconds);
      const closed = { viewer: nameOfViewer(payload.data), device: payload.data.deviceLabel };

      return span === null
        ? say('server.webhooks.closedValence', closed)
        : say('server.webhooks.closedValenceAfter', { ...closed, span });
    }

    case 'plugin.event': {
      return `${payload.data.pluginName}: ${payload.data.title}`;
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
    : say('server.webhooks.withHowToFix', {
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
