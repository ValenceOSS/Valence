import { saying } from '@ValenceI18n/saying';
import type { RemoteRefusalReason } from '@ValenceSDK/remoteFiles/RemoteRefusalSchema';
import { StreamRefusal } from './StreamRefusal';

/**
 * Puts why a source would not play a film into Valence's words and the problem a player shows,
 * naming the source.
 *
 * @param reason - What the source's plugin said.
 * @param source - The source's name.
 * @returns The refusal.
 */
const refusalOf = (reason: RemoteRefusalReason, source: string): StreamRefusal => {
  switch (reason) {
    case 'notReady':
      return new StreamRefusal(
        saying('server.streamSources.refusalOf.sourceHasNotGotItReady', { source }),
        'sourceNotReady',
      );
    case 'limitReached':
      return new StreamRefusal(
        saying('server.streamSources.refusalOf.sourceSaysTheAccountHasReached', { source }),
        'sourceLimit',
      );
    case 'archive':
      return new StreamRefusal(
        saying('server.streamSources.refusalOf.sourceOnlyHasItAsA', { source }),
        'sourceArchive',
      );
    case 'noVideoFile':
      return new StreamRefusal(
        saying('server.streamSources.refusalOf.sourceFoundNoVideoInIt', { source }),
        'sourceNoFile',
      );
    case 'tooBig':
      return new StreamRefusal(
        saying('server.streamSources.refusalOf.itIsBiggerThanSourceWill', { source }),
        'sourceTooBig',
      );
    case 'notSetUp':
      return new StreamRefusal(
        saying('server.streamSources.refusalOf.sourceIsNotSetUp', { source }),
        'sourceNotSetUp',
      );
    case 'unavailable':
    case 'failed':
      return new StreamRefusal(
        saying('server.streamSources.refusalOf.sourceCouldNotBeReached', { source }),
        'sourceUnreachable',
      );
  }
};

export { refusalOf };
