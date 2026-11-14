import { eq, inArray } from 'drizzle-orm';
import { arrApp, downloadClient, mediaRequest, requestItem, sentDownload } from '#dialect/Schema';
import { foldersAbove } from '@ValenceRequests/origins/foldersAbove';
import type { FiledOrigin } from '@ValenceContracts/schemas/MediaOrigin';
import type { RequestsDatabase } from '#dialect/RequestsDatabase';

/**
 * Reads which library files this service filed and how: from the download client a download was
 * fetched with, or from the app a request was handed to. A file counts as filed where a request's
 * item names it, or names the folder it is in, as a filed album or book does.
 *
 * @param db - The database.
 * @returns How to ask it of some paths.
 */
const createDatabaseFiledOrigins =
  (db: RequestsDatabase) =>
  async (paths: readonly string[]): Promise<Record<string, FiledOrigin>> => {
    const above = new Map(paths.map((path) => [path, [path, ...foldersAbove(path)]]));
    const wanted = [...new Set([...above.values()].flat())];

    if (wanted.length === 0) {
      return {};
    }

    const items = await db
      .select({
        filePath: requestItem.filePath,
        downloadId: requestItem.downloadId,
        handOff: mediaRequest.handOff,
      })
      .from(requestItem)
      .innerJoin(mediaRequest, eq(mediaRequest.id, requestItem.requestId))
      .where(inArray(requestItem.filePath, wanted));

    if (items.length === 0) {
      return {};
    }

    const downloadIds = [...new Set(items.flatMap((item) => item.downloadId ?? []))];
    const downloads =
      downloadIds.length === 0
        ? []
        : await db
            .select({ id: sentDownload.id, clientName: downloadClient.name })
            .from(sentDownload)
            .innerJoin(downloadClient, eq(downloadClient.id, sentDownload.clientId))
            .where(inArray(sentDownload.id, downloadIds));
    const appIds = [...new Set(items.flatMap((item) => item.handOff?.appId ?? []))];
    const apps =
      appIds.length === 0
        ? []
        : await db
            .select({ id: arrApp.id, name: arrApp.name })
            .from(arrApp)
            .where(inArray(arrApp.id, appIds));
    const clientOf = new Map(downloads.map((one) => [one.id, one.clientName]));
    const appOf = new Map(apps.map((one) => [one.id, one.name]));
    const originAt = new Map<string, FiledOrigin>();

    for (const item of items) {
      if (item.filePath === null) {
        continue;
      }

      if (item.downloadId !== null) {
        originAt.set(item.filePath, {
          source: 'download',
          via: clientOf.get(item.downloadId) ?? null,
        });
      } else if (item.handOff !== null && !originAt.has(item.filePath)) {
        originAt.set(item.filePath, {
          source: 'handOff',
          via: appOf.get(item.handOff.appId) ?? null,
        });
      }
    }

    return Object.fromEntries(
      [...above.entries()].flatMap(([path, places]) => {
        const found = places.map((place) => originAt.get(place)).find((one) => one !== undefined);

        return found === undefined ? [] : [[path, found]];
      }),
    );
  };

export { createDatabaseFiledOrigins };
