import { dirname } from 'node:path';
import { z } from 'zod';
import { saying } from '@ValenceI18n/saying';
import type { Fulfilment } from '@ValenceContracts/schemas/ArrApp';
import { ArrAppFailure } from '@ValenceRequests/arrApps/ArrAppFailure';
import type { ArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import type { HandOffHandler, ItemSighting } from '@ValenceRequests/arrApps/handOff/HandOffHandler';
import { ArrAcknowledgementSchema } from '@ValenceRequests/arrApps/schemas/ArrAcknowledgementSchema';
import { ArrCommandSchema } from '@ValenceRequests/arrApps/schemas/ArrCommandSchema';
import { ArrFileSchema } from '@ValenceRequests/arrApps/schemas/ArrFileSchema';
import { ArrIdSchema } from '@ValenceRequests/arrApps/schemas/ArrIdSchema';
import { LidarrAlbumSchema } from '@ValenceRequests/arrApps/schemas/LidarrAlbumSchema';
import type { LidarrAlbum } from '@ValenceRequests/arrApps/schemas/LidarrAlbumSchema';
import { LidarrArtistSchema } from '@ValenceRequests/arrApps/schemas/LidarrArtistSchema';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

const LidarrAlbumsSchema = z.array(LidarrAlbumSchema);

const LidarrArtistsSchema = z.array(LidarrArtistSchema);

const ArrFilesSchema = z.array(ArrFileSchema);

const SETTLED = new Set<RequestItemRecord['state']>(['filed', 'available']);

/**
 * The metadata profile an artist is added with, which Lidarr will not add one without.
 *
 * @param handOff - What the library chose.
 * @returns The profile.
 */
const metadataProfileOf = (handOff: Fulfilment): number => {
  if (handOff.metadataProfileId === null) {
    throw new ArrAppFailure(saying('requests.arrApps.handOff.lidarrNeedsAMetadataProfile'));
  }

  return handOff.metadataProfileId;
};

/**
 * Whether Lidarr has every track of an album it knows of.
 *
 * @param album - The album.
 * @returns Whether it is all there.
 */
const isWhole = (album: LidarrAlbum): boolean => {
  const tracks = album.statistics?.trackCount ?? 0;

  return tracks > 0 && (album.statistics?.trackFileCount ?? 0) >= tracks;
};

/**
 * Hands music to Lidarr by its MusicBrainz ids — an album by its release group, adding its artist
 * unmonitored beside it where Lidarr lacks them, and an artist with every album its metadata
 * profile takes — or monitors and searches what Lidarr has already, then reads which albums it has
 * imported whole or has queued, monitoring any album asked for since.
 *
 * @param caller - How to ask Lidarr.
 * @returns The hand-off.
 */
const createLidarrHandOff = (caller: Pick<ArrCaller, 'read' | 'send'>): HandOffHandler => {
  const musicBrainzIdOf = (request: MediaRequestRecord): string => {
    if (request.musicBrainzId === null) {
      throw new ArrAppFailure(saying('requests.arrApps.handOff.itHasNoMusicBrainzIdToHandOver'));
    }

    return request.musicBrainzId;
  };

  const monitorAndSearch = async (albums: readonly LidarrAlbum[], handOff: Fulfilment) => {
    if (albums.length === 0) {
      return;
    }

    await caller.send(
      'PUT',
      '/album/monitor',
      { albumIds: albums.map((album) => album.id), monitored: true },
      ArrAcknowledgementSchema,
    );

    if (handOff.searchesOnAdd) {
      await caller.send(
        'POST',
        '/command',
        { name: 'AlbumSearch', albumIds: albums.map((album) => album.id) },
        ArrCommandSchema,
      );
    }
  };

  const placeAlbum = async (request: MediaRequestRecord, handOff: Fulfilment) => {
    const releaseGroup = musicBrainzIdOf(request);
    const [kept] = await caller.read('/album', LidarrAlbumsSchema, {
      foreignAlbumId: releaseGroup,
    });

    if (kept !== undefined) {
      await monitorAndSearch(kept.monitored ? [] : [kept], handOff);

      return kept.artistId;
    }

    const [found] = await caller.read('/album/lookup', LidarrAlbumsSchema, {
      term: `lidarr:${releaseGroup}`,
    });

    if (found?.artist === null || found?.artist === undefined) {
      throw new ArrAppFailure(saying('requests.arrApps.handOff.lidarrCannotFindIt'));
    }

    const { artist } = found;
    const known = (await caller.read('/artist', LidarrArtistsSchema)).find(
      (one) => one.foreignArtistId === artist.foreignArtistId,
    );

    return (
      await caller.send(
        'POST',
        '/album',
        {
          foreignAlbumId: releaseGroup,
          title: found.title,
          monitored: true,
          anyReleaseOk: true,
          artist: {
            ...(known === undefined ? {} : { id: known.id }),
            foreignArtistId: artist.foreignArtistId,
            artistName: artist.artistName,
            qualityProfileId: handOff.qualityProfileId,
            metadataProfileId: metadataProfileOf(handOff),
            rootFolderPath: handOff.rootFolderPath,
            monitored: known?.monitored ?? true,
            monitorNewItems: 'none',
            addOptions: { monitor: 'none', searchForMissingAlbums: false },
          },
          addOptions: { searchForNewAlbum: handOff.searchesOnAdd },
        },
        LidarrAlbumSchema,
      )
    ).artistId;
  };

  const placeArtist = async (request: MediaRequestRecord, handOff: Fulfilment) => {
    const artistId = musicBrainzIdOf(request);
    const kept = (await caller.read('/artist', LidarrArtistsSchema)).find(
      (one) => one.foreignArtistId === artistId,
    );

    if (kept !== undefined) {
      if (!kept.monitored) {
        await caller.send(
          'PUT',
          '/artist/editor',
          { artistIds: [kept.id], monitored: true },
          ArrAcknowledgementSchema,
        );
      }

      if (handOff.searchesOnAdd) {
        await caller.send(
          'POST',
          '/command',
          { name: 'ArtistSearch', artistId: kept.id },
          ArrCommandSchema,
        );
      }

      return kept.id;
    }

    const [found] = await caller.read('/artist/lookup', LidarrArtistsSchema, {
      term: `lidarr:${artistId}`,
    });

    if (found === undefined) {
      throw new ArrAppFailure(saying('requests.arrApps.handOff.lidarrCannotFindIt'));
    }

    return (
      await caller.send(
        'POST',
        '/artist',
        {
          foreignArtistId: artistId,
          artistName: found.artistName,
          qualityProfileId: handOff.qualityProfileId,
          metadataProfileId: metadataProfileOf(handOff),
          rootFolderPath: handOff.rootFolderPath,
          monitored: true,
          monitorNewItems: 'all',
          addOptions: { monitor: 'all', searchForMissingAlbums: handOff.searchesOnAdd },
        },
        ArrIdSchema,
      )
    ).id;
  };

  return {
    place: (request, _items, handOff) =>
      request.kind === 'artist' ? placeArtist(request, handOff) : placeAlbum(request, handOff),

    search: async (_request, handOffId) => {
      await caller.send(
        'POST',
        '/command',
        { name: 'ArtistSearch', artistId: handOffId },
        ArrCommandSchema,
      );
    },

    pageOf: (request) =>
      Promise.resolve(
        request.musicBrainzId === null
          ? null
          : `/${request.kind === 'album' ? 'album' : 'artist'}/${request.musicBrainzId}`,
      ),

    watch: async (_request, items, handOff, handOffId, queue) => {
      const albums = await caller.read('/album', LidarrAlbumsSchema, {
        artistId: handOffId.toString(),
      });
      const albumOf = (item: RequestItemRecord) =>
        albums.find((album) => album.foreignAlbumId === item.musicBrainzId);

      await monitorAndSearch(
        items.flatMap((item) => {
          const album = albumOf(item);

          return album === undefined || album.monitored || SETTLED.has(item.state) ? [] : [album];
        }),
        handOff,
      );

      return Promise.all(
        items.map(async (item): Promise<ItemSighting> => {
          const album = albumOf(item);

          if (SETTLED.has(item.state)) {
            return { itemId: item.id, kind: 'unchanged' };
          }

          if (album !== undefined && isWhole(album)) {
            const [file] = await caller.read('/trackfile', ArrFilesSchema, {
              albumId: album.id.toString(),
            });

            if (file !== undefined) {
              return {
                itemId: item.id,
                kind: 'imported',
                path: file.path,
                folder: dirname(file.path),
              };
            }
          }

          const queued =
            album === undefined ? undefined : queue.find((record) => record.albumId === album.id);

          return queued === undefined
            ? { itemId: item.id, kind: 'missing' }
            : { itemId: item.id, kind: 'queued', record: queued };
        }),
      );
    },
  };
};

export { createLidarrHandOff };
