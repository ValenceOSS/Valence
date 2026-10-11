import { randomUUID } from 'node:crypto';
import { MOST_PLAYLIST_BYTES } from '@ValenceContracts/schemas/LiveTv';
import { saying } from '@ValenceI18n/saying';
import { isHlsPlaylist } from './isHlsPlaylist';
import { liveChannelIdOf } from './liveChannelIdOf';
import { matchGuideIds } from './matchGuideIds';
import { parseM3u } from './parseM3u';
import { parseXmltv } from './parseXmltv';
import { readRemoteText } from './readRemoteText';
import { readTunerLineup } from './readTunerLineup';
import type { LiveSource } from '@ValenceContracts/schemas/LiveTv';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { LiveTvService } from './LiveTvService';
import type { LiveTvStore, StoredLiveSource } from './LiveTvStore';
import type { ParsedChannel } from './ParsedChannel';

const MOST_GUIDE_BYTES = 300 * 1024 * 1024;

const HOUR_MS = 60 * 60 * 1000;

const GUIDE_KEEPS_BEHIND_MS = 6 * HOUR_MS;

const GUIDE_KEEPS_AHEAD_MS = 8 * 24 * HOUR_MS;

type LiveTvServiceOptions = {
  store: LiveTvStore;
  now?: () => Date;
  fetcher?: typeof fetch;
  warn?: (message: string) => void;
};

/**
 * A source as an admin sees it: never the playlist an admin uploaded, which can be large and is
 * theirs already.
 *
 * @param source - The source as stored.
 * @returns The source as shown.
 */
const shownOf = (source: StoredLiveSource): LiveSource => ({
  id: source.id,
  name: source.name,
  kind: source.kind,
  address: source.address,
  guideUrl: source.guideUrl,
  logoUrl: source.logoUrl,
  channelCount: source.channelCount,
  refreshedAt: source.refreshedAt?.toISOString() ?? null,
  problem: source.problem,
});

/**
 * Live TV: the sources an admin adds — one stream, a playlist by address or uploaded, or a tuner on
 * the network — read into numbered channels in the order each lists them, with what is on each from
 * the guide a source names or comes with, and which channels each profile keeps as favourites.
 *
 * A source that cannot be read keeps the channels it had, and says why, so a provider that is down
 * for an hour does not empty the guide. A playlist address that turns out to be one HLS stream
 * rather than a list of channels is taken as one channel, since that is what it is.
 *
 * @param options - The store, the clock, how requests are sent, and where to warn.
 * @returns The service.
 */
const createLiveTvService = ({
  store,
  now = () => new Date(),
  fetcher = fetch,
  warn = () => undefined,
}: LiveTvServiceOptions): LiveTvService => {
  const oneChannel = (source: StoredLiveSource, streamUrl: string): ParsedChannel[] => [
    {
      number: null,
      name: source.name,
      group: null,
      logoUrl: source.logoUrl,
      guideId: null,
      streamUrl,
      userAgent: null,
      referrer: null,
    },
  ];

  const readPlaylist = (
    source: StoredLiveSource,
    text: string | null,
    streamUrl: string | null,
  ): { channels: ParsedChannel[]; guideUrl: string | null } | Said => {
    if (text === null) {
      return saying('server.live.thePlaylistCouldNotBeRead');
    }

    if (isHlsPlaylist(text) && streamUrl !== null) {
      return { channels: oneChannel(source, streamUrl), guideUrl: null };
    }

    const parsed = parseM3u(text);

    return parsed.channels.length === 0 ? saying('server.live.thePlaylistHasNoChannels') : parsed;
  };

  const channelsOf = async (
    source: StoredLiveSource,
  ): Promise<{ channels: ParsedChannel[]; guideUrl: string | null } | Said> => {
    switch (source.kind) {
      case 'stream':
        return { channels: oneChannel(source, source.address ?? ''), guideUrl: null };
      case 'playlistUrl':
        return readPlaylist(
          source,
          source.address === null
            ? null
            : await readRemoteText(source.address, MOST_PLAYLIST_BYTES, fetcher),
          source.address,
        );
      case 'playlistFile':
        return readPlaylist(source, source.playlist, null);
      case 'tuner': {
        const lineup =
          source.address === null ? null : await readTunerLineup(source.address, fetcher);

        return lineup === null
          ? saying('server.live.theTunerCouldNotBeReached')
          : { channels: lineup, guideUrl: null };
      }
    }
  };

  const refreshed = async (source: StoredLiveSource): Promise<LiveSource> => {
    const read = await channelsOf(source);

    if ('code' in read) {
      warn(`live tv: ${source.name} could not be read`);
      await store.changeSource(source.id, { problem: read, refreshedAt: now() });

      return shownOf({ ...source, problem: read, refreshedAt: now() });
    }

    const guideUrl = source.guideUrl ?? read.guideUrl;
    const guideText =
      guideUrl === null ? null : await readRemoteText(guideUrl, MOST_GUIDE_BYTES, fetcher);
    const at = now();
    const guide =
      guideText === null
        ? null
        : parseXmltv(guideText, {
            from: new Date(at.getTime() - GUIDE_KEEPS_BEHIND_MS),
            until: new Date(at.getTime() + GUIDE_KEEPS_AHEAD_MS),
          });
    const channels = guide === null ? read.channels : matchGuideIds(read.channels, guide.names);

    await store.replaceChannels(
      source.id,
      channels.map((channel, position) => ({
        ...channel,
        id: liveChannelIdOf(source.id, channel.streamUrl),
        sourceId: source.id,
        position,
      })),
    );

    if (guide !== null) {
      await store.replaceProgrammes(source.id, guide.programmes);
    }

    const problem =
      guideUrl !== null && guideText === null ? saying('server.live.theGuideCouldNotBeRead') : null;

    await store.changeSource(source.id, {
      channelCount: channels.length,
      refreshedAt: at,
      problem,
    });

    return shownOf({ ...source, channelCount: channels.length, refreshedAt: at, problem });
  };

  return {
    sources: async () => (await store.listSources()).map(shownOf),

    add: async (asked) => {
      const source: StoredLiveSource = {
        id: randomUUID(),
        name: asked.name,
        kind: asked.kind,
        address: asked.kind === 'playlistFile' ? null : asked.address,
        guideUrl: asked.guideUrl,
        logoUrl: asked.kind === 'stream' ? asked.logoUrl : null,
        playlist: asked.kind === 'playlistFile' ? asked.playlist : null,
        channelCount: 0,
        refreshedAt: null,
        problem: null,
        createdAt: now(),
      };

      await store.addSource(source);

      return refreshed(source);
    },

    remove: (id) => store.removeSource(id),

    refresh: async (id) => {
      const source = await store.readSource(id);

      return source === null ? null : refreshed(source);
    },

    refreshAll: async () => {
      const sources = await store.listSources();

      for (const source of sources) {
        await refreshed(source);
      }

      return sources.length;
    },

    guide: async (profileId, from, until) => {
      const [sources, channels, programmes, favourites] = await Promise.all([
        store.listSources(),
        store.listChannels(),
        store.listProgrammes(from, until),
        profileId === null ? Promise.resolve(new Set<string>()) : store.favouritesOf(profileId),
      ]);
      const order = new Map(sources.map((source, at) => [source.id, at]));
      const shown = [...channels].sort(
        (left, right) =>
          (order.get(left.sourceId) ?? 0) - (order.get(right.sourceId) ?? 0) ||
          left.position - right.position,
      );
      const byGuide = new Map<string, string[]>();

      for (const channel of shown) {
        if (channel.guideId !== null) {
          const key = `${channel.sourceId}\n${channel.guideId}`;

          byGuide.set(key, [...(byGuide.get(key) ?? []), channel.id]);
        }
      }

      return {
        channels: shown.map((channel) => ({
          id: channel.id,
          sourceId: channel.sourceId,
          number: channel.number,
          name: channel.name,
          group: channel.group,
          hasLogo: channel.logoUrl !== null,
          isFavourite: favourites.has(channel.id),
        })),
        programmes: programmes.flatMap((programme) =>
          (byGuide.get(`${programme.sourceId}\n${programme.guideId}`) ?? []).map((channelId) => ({
            channelId,
            startsAt: programme.startsAt.toISOString(),
            endsAt: programme.endsAt.toISOString(),
            title: programme.title,
            subtitle: programme.subtitle,
            description: programme.description,
            category: programme.category,
          })),
        ),
      };
    },

    channel: (id) => store.readChannel(id),

    keep: async (profileId, channelId) => {
      if ((await store.readChannel(channelId)) === null) {
        return false;
      }

      await store.keep(profileId, channelId);

      return true;
    },

    drop: (profileId, channelId) => store.drop(profileId, channelId),
  };
};

export type { LiveTvServiceOptions };

export { createLiveTvService };
