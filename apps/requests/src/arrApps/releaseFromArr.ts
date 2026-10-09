import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { parseReleaseName } from '@ValenceCore/releases/parseReleaseName';
import type { ArrRelease } from '@ValenceRequests/arrApps/schemas/ArrReleaseSchema';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { Judgement } from '@ValenceContracts/schemas/QualityProfile';

/**
 * A release a connected app found, as Valence lists one: its id carries the app's own indexer and
 * guid so it can be handed back to pick, and its judgement is the app's own — whether it would take
 * it, why not, and how its quality and custom formats rank it — since the app is what fetches it.
 *
 * @param found - The release, as the app listed it.
 * @param appId - The app, standing in for the indexer, which only the app knows.
 * @returns The release and its judgement.
 */
const releaseFromArr = (
  found: ArrRelease,
  appId: string,
): { release: Release; judgement: Judgement } => {
  const id = `${found.indexerId.toString()}:${found.guid}`;
  const published =
    found.publishDate === null || found.publishDate === undefined
      ? NaN
      : Date.parse(found.publishDate);

  return {
    release: {
      id,
      title: found.title,
      indexerId: appId,
      indexerName: found.indexer,
      protocol: found.protocol === 'usenet' ? 'usenet' : 'torrent',
      sizeBytes: found.size ?? null,
      seeders: found.seeders ?? null,
      leechers: found.leechers ?? null,
      grabs: null,
      publishedAt: Number.isNaN(published) ? null : new Date(published).toISOString(),
      categories: [],
      downloadUrl: found.downloadUrl ?? null,
      magnetUrl: null,
      infoUrl: found.infoUrl ?? null,
      infoHash: null,
      downloadFactor: null,
      uploadFactor: null,
      minimumRatio: null,
      minimumSeedSeconds: null,
    },
    judgement: {
      releaseId: id,
      parsed: parseReleaseName(found.title),
      quality: found.qualityWeight ?? 0,
      score: found.customFormatScore ?? 0,
      isRejected: found.rejected,
      rejections: found.rejections.map((rejection) => sayVerbatim(rejection)),
      reasons: [],
    },
  };
};

export { releaseFromArr };
