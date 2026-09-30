import { randomUUID } from 'node:crypto';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { mediaArtworkChoice, mediaItem } from '@ValenceServer/db/Schema';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { ValenceSchema } from '@ValenceServer/db/Database';
import type { ArtworkChoices, ArtworkKind } from '@ValenceContracts/schemas/ArtworkChoice';
import type { MetadataProvider } from './MetadataProvider';

type ArtworkRefusal = 'missing' | 'unmatched' | 'unavailable' | 'refused';

type ArtworkChoicesOptions = {
  db: PgDatabase<PgQueryResultHKT, ValenceSchema>;
  readOptions?: MetadataProvider['readArtworkOptions'];
  readAgain: (libraryId: string, paths: string[]) => Promise<string | null>;
  fetchLogos: (libraryId: string) => Promise<{ jobId: string } | null>;
};

type Title = {
  libraryId: string;
  externalId: string;
  externalKind: 'movie' | 'tv';
};

/**
 * Keeps the pictures an administrator chose for a title in place of the ones the catalogue picked,
 * and answers with them wherever that title's artwork is asked for.
 *
 * A choice belongs to the title, not the file: it is kept against the library and the catalogue's
 * id, so it reaches every episode of a programme, outlives the files being scanned again or replaced,
 * and is dropped with the library. A poster and a logo are the programme's own on every episode, so
 * they are written onto every file as well as kept, and a card that asks whether there is a poster at
 * all is answered yes. A backdrop is not: each episode's is a still from that episode, so a
 * programme's chosen backdrop is only given where the title itself is asked for, and the stills stay.
 *
 * Only a picture the catalogue itself offers can be chosen, so the server never fetches an address
 * somebody typed.
 *
 * @param options - The database, how to ask the catalogue what it has, and how to put a title back
 *   the way the catalogue would have it.
 * @returns What to ask of the choices.
 */
const createArtworkChoices = ({
  db,
  readOptions,
  readAgain,
  fetchLogos,
}: ArtworkChoicesOptions) => {
  /**
   * Reads which catalogue title a file is.
   *
   * @param mediaId - The file.
   * @returns Its title, or why it has none.
   */
  const titleOf = async (mediaId: string): Promise<Title | 'missing' | 'unmatched'> => {
    const [row] = await db
      .select({
        libraryId: mediaItem.libraryId,
        externalId: mediaItem.externalId,
        seriesTitle: mediaItem.seriesTitle,
      })
      .from(mediaItem)
      .where(eq(mediaItem.id, mediaId))
      .limit(1);

    if (row === undefined) {
      return 'missing';
    }

    if (row.externalId === null || row.externalId === '') {
      return 'unmatched';
    }

    return {
      libraryId: row.libraryId,
      externalId: row.externalId,
      externalKind: row.seriesTitle === null ? 'movie' : 'tv',
    };
  };

  /**
   * Narrows to every file in the library that is the same title.
   *
   * @param title - The title.
   * @returns The condition that finds them.
   */
  const filesOf = (title: Title) =>
    and(
      eq(mediaItem.libraryId, title.libraryId),
      eq(mediaItem.externalId, title.externalId),
      title.externalKind === 'tv'
        ? isNotNull(mediaItem.seriesTitle)
        : isNull(mediaItem.seriesTitle),
    );

  /**
   * Narrows to the choices made for a title.
   *
   * @param title - The title.
   * @returns The condition that finds them.
   */
  const choicesOf = (title: Title) =>
    and(
      eq(mediaArtworkChoice.libraryId, title.libraryId),
      eq(mediaArtworkChoice.externalKind, title.externalKind),
      eq(mediaArtworkChoice.externalId, title.externalId),
    );

  /**
   * Reads the pictures chosen for a title, kind by kind.
   *
   * @param title - The title.
   * @returns Each kind's chosen address, or null where the catalogue's own pick stands.
   */
  const chosenFor = async (title: Title): Promise<ArtworkChoices['chosen']> => {
    const rows = await db
      .select({ kind: mediaArtworkChoice.kind, url: mediaArtworkChoice.url })
      .from(mediaArtworkChoice)
      .where(choicesOf(title));
    const find = (kind: ArtworkKind) => rows.find((row) => row.kind === kind)?.url ?? null;

    return { poster: find('poster'), backdrop: find('backdrop'), logo: find('logo') };
  };

  /**
   * Lists what the catalogue has to choose from for a file's title, with what is chosen now.
   *
   * @param mediaId - Any file of the title.
   * @returns The choices, or why there are none to offer.
   */
  const read = async (
    mediaId: string,
  ): Promise<ArtworkChoices | Exclude<ArtworkRefusal, 'refused'>> => {
    const title = await titleOf(mediaId);

    if (typeof title === 'string') {
      return title;
    }

    const options = await readOptions?.({
      externalId: title.externalId,
      isSeries: title.externalKind === 'tv',
    });

    if (options === undefined || options === null) {
      return 'unavailable';
    }

    return { kind: title.externalKind, options, chosen: await chosenFor(title) };
  };

  /**
   * Chooses one of the catalogue's pictures for a file's title, or with none, goes back to the
   * catalogue's own pick and reads the title again so that pick is restored.
   *
   * @param mediaId - Any file of the title.
   * @param kind - Which picture.
   * @param url - The picture chosen, which must be one the catalogue offers, or null to undo.
   * @param by - Who chose it.
   * @returns The job restoring the catalogue's pick where one was needed, or why nothing changed.
   */
  const choose = async (
    mediaId: string,
    kind: ArtworkKind,
    url: string | null,
    by: string | null,
  ): Promise<{ jobId: string | null } | ArtworkRefusal> => {
    const title = await titleOf(mediaId);

    if (typeof title === 'string') {
      return title;
    }

    const isTitleWide = kind !== 'backdrop' || title.externalKind === 'movie';

    if (url === null) {
      await db
        .delete(mediaArtworkChoice)
        .where(and(choicesOf(title), eq(mediaArtworkChoice.kind, kind)));

      if (!isTitleWide) {
        return { jobId: null };
      }

      if (kind === 'logo') {
        await db.update(mediaItem).set({ logoUrl: null }).where(filesOf(title));

        return { jobId: (await fetchLogos(title.libraryId))?.jobId ?? null };
      }

      const files = await db.select({ path: mediaItem.path }).from(mediaItem).where(filesOf(title));

      return {
        jobId: await readAgain(
          title.libraryId,
          files.map((file) => file.path),
        ),
      };
    }

    const options = await readOptions?.({
      externalId: title.externalId,
      isSeries: title.externalKind === 'tv',
    });

    if (options === undefined || options === null) {
      return 'unavailable';
    }

    if (!options[kind].some((option) => option.url === url)) {
      return 'refused';
    }

    await db
      .insert(mediaArtworkChoice)
      .values({
        id: randomUUID(),
        libraryId: title.libraryId,
        externalKind: title.externalKind,
        externalId: title.externalId,
        kind,
        url,
        updatedBy: by,
      })
      .onConflictDoUpdate({
        target: [
          mediaArtworkChoice.libraryId,
          mediaArtworkChoice.externalKind,
          mediaArtworkChoice.externalId,
          mediaArtworkChoice.kind,
        ],
        set: { url, updatedBy: by, updatedAt: new Date() },
      });

    if (isTitleWide) {
      await db
        .update(mediaItem)
        .set(
          kind === 'poster'
            ? { posterUrl: url }
            : kind === 'logo'
              ? { logoUrl: url }
              : { backdropUrl: url },
        )
        .where(filesOf(title));
    }

    return { jobId: null };
  };

  /**
   * Answers which picture a file's artwork should be: the one chosen for its title where there is
   * one that reaches this far, and otherwise nothing, leaving the catalogue's own pick to stand.
   *
   * @param mediaId - The file.
   * @param kind - Which picture.
   * @param isOfTitle - Whether what was asked for is the title's own picture rather than this
   *   file's, which is what lets a programme's chosen backdrop be given in place of an episode still.
   * @returns The chosen address, or null.
   */
  const urlFor = async (
    mediaId: string,
    kind: ArtworkKind,
    isOfTitle: boolean,
  ): Promise<string | null> => {
    const title = await titleOf(mediaId);

    if (typeof title === 'string') {
      return null;
    }

    if (kind === 'backdrop' && title.externalKind === 'tv' && !isOfTitle) {
      return null;
    }

    const [row] = await db
      .select({ url: mediaArtworkChoice.url })
      .from(mediaArtworkChoice)
      .where(and(choicesOf(title), eq(mediaArtworkChoice.kind, kind)))
      .limit(1);

    return row?.url ?? null;
  };

  return { read, choose, urlFor };
};

export type { ArtworkRefusal };

export { createArtworkChoices };
