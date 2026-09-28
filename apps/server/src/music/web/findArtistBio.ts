import { z } from 'zod';
import type { MusicWeb } from './createMusicWeb';

const RelationsSchema = z.object({
  relations: z
    .array(
      z.object({
        type: z.string().catch(''),
        url: z.object({ resource: z.string() }).nullish().catch(null),
      }),
    )
    .catch([]),
});

const EntitySchema = z.object({
  entities: z.record(
    z.string(),
    z.object({
      sitelinks: z
        .record(z.string(), z.object({ title: z.string() }).catch({ title: '' }))
        .catch({}),
    }),
  ),
});

const SummarySchema = z.object({
  extract: z.string().catch(''),
  content_urls: z
    .object({ desktop: z.object({ page: z.string() }) })
    .nullish()
    .catch(null),
});

/**
 * Finds a few sentences about an artist, from the English Wikipedia article MusicBrainz links them
 * to through Wikidata, none of which needs a key.
 *
 * Only the article the artist is linked to is read, never one found by searching for the name, so
 * a band is never described by the article of another that shares its name.
 *
 * @param web - The way out to the web.
 * @param musicBrainzId - The artist on MusicBrainz.
 * @returns The sentences and the article they came from, or nothing where there is no article.
 */
const findArtistBio = async (
  web: MusicWeb,
  musicBrainzId: string,
): Promise<{ bio: string; sourceUrl: string | null } | null> => {
  const related = RelationsSchema.safeParse(
    await web.json(
      `https://musicbrainz.org/ws/2/artist/${encodeURIComponent(musicBrainzId)}?inc=url-rels&fmt=json`,
    ),
  );
  const wikidata = related.success
    ? related.data.relations.find((relation) => relation.type === 'wikidata')?.url?.resource
    : undefined;
  const entityId = wikidata === undefined ? null : (/Q\d+$/.exec(wikidata)?.[0] ?? null);

  if (entityId === null) {
    return null;
  }

  const entity = EntitySchema.safeParse(
    await web.json(`https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`),
  );
  const article = entity.success
    ? Object.values(entity.data.entities)[0]?.sitelinks.enwiki?.title
    : undefined;

  if (article === undefined || article === '') {
    return null;
  }

  const summary = SummarySchema.safeParse(
    await web.json(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article.replaceAll(' ', '_'))}`,
    ),
  );

  return !summary.success || summary.data.extract.trim() === ''
    ? null
    : {
        bio: summary.data.extract.trim(),
        sourceUrl: summary.data.content_urls?.desktop.page ?? null,
      };
};

export { findArtistBio };
