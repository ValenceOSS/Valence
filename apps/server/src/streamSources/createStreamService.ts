import type { StreamOffers, StreamPlayed } from '@ValenceContracts/schemas/StreamOffer';
import { saying } from '@ValenceI18n/saying';
import type { StreamTitle } from '@ValenceSDK/sources/StreamTitleSchema';
import type { Metadata } from '@ValenceServer/library/MetadataProvider';
import { NOT_AN_EPISODE } from '@ValenceServer/library/placement/NOT_AN_EPISODE';
import type { MediaRow } from '@ValenceServer/library/scanLibrary';
import type { PluginSource } from '@ValenceServer/plugins/service/createContributionCalls';
import type { MediaProbe, RemoteFile } from '@ValenceServer/transcoder/TranscoderClient';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { StreamedFilms } from './createDatabaseStreamedFilms';
import type { Link, StreamedLinks } from './createStreamedLinks';
import type { StreamOffersService } from './createStreamOffers';
import { refusalOf } from './refusalOf';
import { remoteKeyOf } from './remoteKeyOf';
import { StreamRefusal } from './StreamRefusal';
import { streamedPathOf } from './streamedPathOf';

type CreateStreamServiceOptions = {
  offers: Pick<StreamOffersService, 'offersFor' | 'held'>;
  films: Pick<StreamedFilms, 'libraryId' | 'itemOf' | 'choiceOf' | 'choose'>;
  links: Pick<StreamedLinks, 'remember'>;
  source: (pluginId: string, sourceId: string) => Pick<PluginSource, 'resolve'>;
  linkHostsOf: (pluginId: string) => Promise<string[]>;
  register: (key: string, remote: RemoteFile) => Promise<void>;
  probeRemote: (key: string) => Promise<MediaProbe>;
  probeVersion: () => Promise<number | null>;
  describeFilm: (title: StreamTitle, probe: MediaProbe) => Promise<Metadata | null>;
  upsert: (row: MediaRow) => Promise<string | null>;
  isOutOfReach: (viewer: Viewer, mediaId: string) => Promise<boolean>;
  now?: () => Date;
};

/**
 * Films played straight from the sources plugins offer. Asking what can play a film searches and
 * asks every source; playing one asks its source for a link, reads the file through the media
 * service, and keeps the film as a title in the hidden library streamed films are kept in — named
 * by the catalogue, with what the file is, and with no subtitles of its own, since reading them
 * would download it — together with the stream it plays from, so resuming plays the same one. A
 * film somebody may not watch is refused once its certificate is known, whoever asked.
 *
 * @param options - Where offers, films and links are kept, and how to probe and describe a film.
 * @returns The service.
 */
const createStreamService = ({
  offers,
  films,
  links,
  source,
  linkHostsOf,
  register,
  probeRemote,
  probeVersion,
  describeFilm,
  upsert,
  isOutOfReach,
  now = () => new Date(),
}: CreateStreamServiceOptions) => ({
  offersFor: (title: StreamTitle, isFresh = false): Promise<StreamOffers> =>
    offers.offersFor(title, isFresh),

  play: async (streamId: string, viewer: Viewer): Promise<StreamPlayed | null> => {
    const held = offers.held(streamId);

    if (held === null) {
      return null;
    }

    const tmdbId = Number(held.title.tmdbId ?? held.title.catalogueId);
    const path = streamedPathOf(tmdbId);
    const existing = await films.itemOf(tmdbId);
    const chosen = existing === null ? null : await films.choiceOf(existing);

    if (
      existing !== null &&
      chosen?.pluginId === held.pluginId &&
      chosen.sourceId === held.sourceId &&
      chosen.streamKey === held.stream.key
    ) {
      if (await isOutOfReach(viewer, existing)) {
        throw new StreamRefusal(
          saying('server.streamSources.createStreamService.thisFilmIsAboveTheAge'),
          'unreadable',
        );
      }

      return { kind: 'ready', mediaId: existing };
    }

    const answer = await source(held.pluginId, held.sourceId).resolve({
      title: held.title,
      stream: {
        key: held.stream.key,
        name: held.stream.name,
        infoHash: held.stream.infoHash,
        fileName: held.stream.fileName,
      },
    });

    if (answer.kind === 'refused') {
      throw refusalOf(answer.reason, held.sourceName);
    }

    if (answer.kind === 'preparing') {
      return { kind: 'preparing', progress: answer.progress };
    }

    const link: Link = {
      key: remoteKeyOf({
        path,
        pluginId: held.pluginId,
        sourceId: held.sourceId,
        streamKey: held.stream.key,
      }),
      url: answer.url,
      hosts: await linkHostsOf(held.pluginId),
      sizeBytes: answer.sizeBytes,
      expiresAt: answer.expiresAt === null ? null : Date.parse(answer.expiresAt),
    };

    await register(link.key, { url: link.url, hosts: link.hosts, sizeBytes: link.sizeBytes });

    const probe = await probeRemote(link.key);

    if (probe.video === null) {
      throw refusalOf('noVideoFile', held.sourceName);
    }

    const described = (await describeFilm(held.title, probe).catch(() => null)) ?? {
      title: held.title.title,
      year: held.title.year,
    };
    const mediaId = await upsert({
      libraryId: await films.libraryId(),
      path,
      title: described.title,
      year: described.year,
      sizeBytes: answer.sizeBytes,
      modifiedAtMs: now().getTime(),
      probe: { ...probe, subtitleStreams: [] },
      probeVersion: await probeVersion(),
      metadata: { ...described, externalId: held.title.tmdbId ?? held.title.catalogueId },
      episode: NOT_AN_EPISODE,
      extraKind: null,
      versionLabel: null,
    });

    if (mediaId === null) {
      throw refusalOf('noVideoFile', held.sourceName);
    }

    await films.choose({
      mediaItemId: mediaId,
      pluginId: held.pluginId,
      sourceId: held.sourceId,
      streamKey: held.stream.key,
      name: held.stream.name,
      infoHash: held.stream.infoHash,
      fileName: answer.fileName,
      sizeBytes: answer.sizeBytes,
    });
    links.remember(mediaId, link);

    if (await isOutOfReach(viewer, mediaId)) {
      throw new StreamRefusal(
        saying('server.streamSources.createStreamService.thisFilmIsAboveTheAge'),
        'unreadable',
      );
    }

    return { kind: 'ready', mediaId };
  },
});

type StreamService = ReturnType<typeof createStreamService>;

export type { StreamService };

export { createStreamService };
