import type { StreamTitle } from '@ValenceSDK/sources/StreamTitleSchema';
import { saying } from '@ValenceI18n/saying';
import type { PluginSource } from '@ValenceServer/plugins/service/createContributionCalls';
import type { RemoteFile } from '@ValenceServer/transcoder/TranscoderClient';
import type { StreamedChoice } from './createDatabaseStreamedFilms';
import { refusalOf } from './refusalOf';
import { remoteKeyOf } from './remoteKeyOf';
import { StreamRefusal } from './StreamRefusal';

type Link = RemoteFile & {
  key: string;
  expiresAt: number | null;
  pluginId: string;
  sourceId: string;
};

type Resolved = { kind: 'ready'; link: Link } | { kind: 'preparing'; progress: number | null };

type CreateStreamedLinksOptions = {
  choiceOf: (mediaItemId: string) => Promise<StreamedChoice | null>;
  pathOf: (mediaItemId: string) => Promise<string | null>;
  titleOf: (mediaItemId: string) => Promise<StreamTitle | null>;
  source: (pluginId: string, sourceId: string) => Pick<PluginSource, 'resolve'>;
  sourceNameOf: (pluginId: string, sourceId: string) => Promise<string>;
  isOffered: (pluginId: string, sourceId: string) => Promise<boolean>;
  linkHostsOf: (pluginId: string) => Promise<string[]>;
  register: (key: string, remote: RemoteFile) => Promise<void>;
  stateOf: (key: string) => Promise<{ isRegistered: boolean; hasExpired: boolean }>;
  now?: () => number;
};

const RENEWED_BEFORE_MS = 10 * 60 * 1000;

/**
 * Where each streamed film is fetched from now. A source hands out links that expire, so a link is
 * asked for when a film is played, kept for as long as it lasts, and asked for afresh shortly
 * before it would expire, when the media service finds it no longer works, or when whatever
 * fetched it says so. Every link is registered with the media service under a key naming the
 * film and its stream, so a fresh one takes effect on the media service's next read, and a media
 * service that has restarted and forgotten it is told it again without asking the source. A film
 * asked for by several reads at once is asked of its source once. A link whose plugin has been
 * turned off or removed is given up rather than used.
 *
 * @param options - Which stream each film plays, how to ask its source, and how to tell the media
 *   service.
 * @returns The links.
 */
const createStreamedLinks = ({
  choiceOf,
  pathOf,
  titleOf,
  source,
  sourceNameOf,
  isOffered,
  linkHostsOf,
  register,
  stateOf,
  now = Date.now,
}: CreateStreamedLinksOptions) => {
  const held = new Map<string, Link>();
  const asking = new Map<string, Promise<Resolved>>();

  const resolveNow = async (mediaItemId: string): Promise<Resolved> => {
    const [choice, title, path] = await Promise.all([
      choiceOf(mediaItemId),
      titleOf(mediaItemId),
      pathOf(mediaItemId),
    ]);

    if (choice === null || title === null || path === null) {
      throw new StreamRefusal(
        saying('server.streamSources.createStreamedLinks.thisFilmHasNoSourceChosen'),
        'sourceNoFile',
      );
    }

    const answer = await source(choice.pluginId, choice.sourceId).resolve({
      title,
      stream: {
        key: choice.streamKey,
        name: choice.name,
        infoHash: choice.infoHash,
        fileName: choice.fileName,
      },
    });

    if (answer.kind === 'refused') {
      throw refusalOf(answer.reason, await sourceNameOf(choice.pluginId, choice.sourceId));
    }

    if (answer.kind === 'preparing') {
      return { kind: 'preparing', progress: answer.progress };
    }

    const link: Link = {
      key: remoteKeyOf({ ...choice, path }),
      url: answer.url,
      hosts: await linkHostsOf(choice.pluginId),
      sizeBytes: answer.sizeBytes,
      expiresAt: answer.expiresAt === null ? null : Date.parse(answer.expiresAt),
      pluginId: choice.pluginId,
      sourceId: choice.sourceId,
    };

    await register(link.key, { url: link.url, hosts: link.hosts, sizeBytes: link.sizeBytes });
    held.set(mediaItemId, link);

    return { kind: 'ready', link };
  };

  const resolve = (mediaItemId: string): Promise<Resolved> => {
    const already = asking.get(mediaItemId);

    if (already !== undefined) {
      return already;
    }

    const answer = resolveNow(mediaItemId).finally(() => {
      asking.delete(mediaItemId);
    });

    asking.set(mediaItemId, answer);

    return answer;
  };

  const isFresh = async (link: Link): Promise<boolean> => {
    if (link.expiresAt !== null && link.expiresAt - now() <= RENEWED_BEFORE_MS) {
      return false;
    }

    const state = await stateOf(link.key).catch(() => ({ isRegistered: true, hasExpired: false }));

    if (state.hasExpired) {
      return false;
    }

    if (!state.isRegistered) {
      await register(link.key, { url: link.url, hosts: link.hosts, sizeBytes: link.sizeBytes });
    }

    return true;
  };

  return {
    resolve,

    linkFor: async (mediaItemId: string, isStale = false): Promise<Link> => {
      const kept = held.get(mediaItemId);

      if (kept !== undefined && !(await isOffered(kept.pluginId, kept.sourceId))) {
        held.delete(mediaItemId);

        throw new StreamRefusal(
          saying('server.streamSources.createStreamedLinks.thePluginThisFilmPlaysFrom'),
          'sourceNotSetUp',
        );
      }

      if (kept !== undefined && !isStale && (await isFresh(kept))) {
        return kept;
      }

      const resolved = await resolve(mediaItemId);

      if (resolved.kind === 'preparing') {
        throw new StreamRefusal(
          saying('server.streamSources.createStreamedLinks.theSourceIsStillPreparingThis'),
          'sourceNotReady',
        );
      }

      return resolved.link;
    },

    remember: (mediaItemId: string, link: Link): void => {
      held.set(mediaItemId, link);
    },

    forget: (mediaItemId: string): void => {
      held.delete(mediaItemId);
    },
  };
};

type StreamedLinks = ReturnType<typeof createStreamedLinks>;

export type { Link, StreamedLinks };

export { createStreamedLinks };
