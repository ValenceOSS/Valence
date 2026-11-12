import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';
import { randomUUID } from 'node:crypto';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { folderOf } from '@ValenceCore/functions/folderOf';
import { titleFolderOf } from '@ValenceCore/functions/titleFolderOf';
import { ARTWORK_LIMITS } from '@ValenceServer/playlists/ARTWORK_LIMITS';
import { whatIsWrongWithThePicture } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import { diskPictureAddress } from './diskPictureAddress';
import { uploadPictureAddress } from './uploadPictureAddress';
import { UPLOAD_ADDRESS } from './UPLOAD_ADDRESS';
import { and, asc, eq, isNotNull, isNull } from 'drizzle-orm';
import { mediaArtworkChoice, mediaItem } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { upsert } from '@ValenceDatabase/upsert';
import type { ArtworkChoices, ArtworkKind } from '@ValenceContracts/schemas/ArtworkChoice';
import type { MetadataProvider } from './MetadataProvider';

type ArtworkRefusal = 'missing' | 'unmatched' | 'unavailable' | 'refused';

type PictureFault = NonNullable<Awaited<ReturnType<typeof whatIsWrongWithThePicture>>>;

const PICTURE_FILE = /\.(?:jpe?g|png|webp)$/iu;

const MOST_ON_DISK = 60;

type ArtworkChoicesOptions = {
  db: AnyValenceDatabase;
  readOptions?: MetadataProvider['readArtworkOptions'];
  readOwn?: MetadataProvider['readOwnArtwork'];
  readPartOptions?: MetadataProvider['readPartArtwork'];
  borrowedSeasonOf?: (
    mediaId: string,
    season: number,
  ) => Promise<{ externalId: string; season: number } | null>;
  readAgain: (libraryId: string, paths: string[]) => Promise<string | null>;
  fetchLogos: (libraryId: string) => Promise<{ jobId: string } | null>;
  onChanged?: (mediaIds: string[]) => void;
  uploads?: string;
  now?: () => Date;
};

type ArtworkPart = { season: number; episode: number | null };

type Title = {
  libraryId: string;
  externalId: string;
  externalKind: 'movie' | 'tv';
  tvdbId: string | null;
};

/**
 * Keeps the pictures an administrator chose for a title in place of the ones the catalogue picked,
 * and answers with them wherever that title's artwork is asked for.
 *
 * A choice belongs to the title, not the file: it is kept against the library and the catalogue's
 * id, so it reaches every episode of a programme, outlives the files being scanned again or
 * replaced, and is dropped with the library. A poster and a logo are the programme's own on every
 * episode, so they are written onto every file as well as kept, and a card that asks whether there
 * is a poster at all is answered yes. A backdrop is not: each episode's is a still from that
 * episode, so a programme's chosen backdrop is only given where the title itself is asked for, and
 * the stills stay.
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
  readOwn,
  readAgain,
  fetchLogos,
  readPartOptions,
  borrowedSeasonOf,
  onChanged,
  uploads,
  now = () => new Date(),
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
        tvdbId: mediaItem.tvdbId,
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
      tvdbId: row.tvdbId,
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
  /**
   * Finds the pictures kept beside a title's files on the disk, such as a poster.jpg or a
   * fanart.jpg, in a film's folder or a programme's and its seasons'.
   *
   * @param title - The title.
   * @returns Each picture's address and file name.
   */
  const picturesOnDisk = async (title: Title): Promise<{ url: string; name: string }[]> => {
    const files = await db.select({ path: mediaItem.path }).from(mediaItem).where(filesOf(title));
    const paths = files.map((file) => file.path);
    const folders = new Set(
      title.externalKind === 'tv'
        ? [titleFolderOf(paths), ...paths.map(folderOf)].filter((one) => one !== null)
        : paths.map(folderOf),
    );
    const found: { url: string; name: string }[] = [];

    for (const folder of folders) {
      const names = await readdir(folder).catch(() => []);

      for (const name of names.filter((one) => PICTURE_FILE.test(one)).sort()) {
        found.push({ url: diskPictureAddress(join(folder, name)), name });
      }
    }

    return found.slice(0, MOST_ON_DISK);
  };

  const read = async (
    mediaId: string,
  ): Promise<ArtworkChoices | Exclude<ArtworkRefusal, 'refused'>> => {
    const title = await titleOf(mediaId);

    if (typeof title === 'string') {
      return title;
    }

    const asked = {
      externalId: title.externalId,
      isSeries: title.externalKind === 'tv',
      tvdbId: title.tvdbId,
    };
    const [options, own] = await Promise.all([
      readOptions?.(asked).catch(() => null),
      readOwn?.(asked).catch(() => null),
    ]);

    if (options === undefined || options === null) {
      return 'unavailable';
    }

    return {
      kind: title.externalKind,
      options,
      onDisk: await picturesOnDisk(title),
      chosen: await chosenFor(title),
      defaults: {
        poster: own?.poster?.previewUrl ?? null,
        backdrop: own?.backdrop?.previewUrl ?? null,
        logo: own?.logo?.previewUrl ?? null,
      },
    };
  };

  /**
   * Notes that a title's pictures have just changed, so every file of it is asked for under a new
   * address and nobody is shown the picture their browser kept, and says so to whoever listens.
   *
   * @param title - The title.
   */
  const markChanged = async (title: Title): Promise<void> => {
    await db.update(mediaItem).set({ artworkChangedAt: now() }).where(filesOf(title));

    const files = await db.select({ id: mediaItem.id }).from(mediaItem).where(filesOf(title));

    onChanged?.(files.map((file) => file.id));
  };

  /**
   * Puts back the picture the catalogue itself picks for a title, straight away, where the
   * catalogue can be asked; where it cannot, the title is read again and the pick comes back with
   * it.
   *
   * @param title - The title.
   * @param kind - Which picture.
   * @returns The job restoring it, where one was needed.
   */
  const restoreOwn = async (title: Title, kind: ArtworkKind): Promise<string | null> => {
    const own = await readOwn?.({
      externalId: title.externalId,
      isSeries: title.externalKind === 'tv',
    }).catch(() => null);

    if (own !== undefined && own !== null) {
      const url = own[kind]?.url ?? null;

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

      return null;
    }

    if (kind === 'logo') {
      await db.update(mediaItem).set({ logoUrl: null }).where(filesOf(title));

      return (await fetchLogos(title.libraryId))?.jobId ?? null;
    }

    const files = await db
      .select({ path: mediaItem.path })
      .from(mediaItem)
      .where(filesOf(title))
      .orderBy(asc(mediaItem.path));

    return readAgain(
      title.libraryId,
      files.map((file) => file.path),
    );
  };

  /**
   * Chooses one of the catalogue's pictures for a file's title, or with none, goes back to the
   * catalogue's own pick, putting it back at once where the catalogue can be asked.
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

      const jobId = isTitleWide ? await restoreOwn(title, kind) : null;

      await markChanged(title);

      return { jobId };
    }

    const isKeptHere =
      UPLOAD_ADDRESS.test(url) || (await picturesOnDisk(title)).some((one) => one.url === url);

    if (!isKeptHere) {
      const options = await readOptions?.({
        externalId: title.externalId,
        isSeries: title.externalKind === 'tv',
        tvdbId: title.tvdbId,
      }).catch(() => null);

      if (options === undefined || options === null) {
        return 'unavailable';
      }

      if (!options[kind].some((option) => option.url === url)) {
        return 'refused';
      }
    }

    await upsert(db, mediaArtworkChoice, {
      values: [
        {
          id: randomUUID(),
          libraryId: title.libraryId,
          externalKind: title.externalKind,
          externalId: title.externalId,
          kind,
          url,
          updatedBy: by,
        },
      ],
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

    await markChanged(title);

    return { jobId: null };
  };

  /**
   * Answers which picture a file's artwork should be: the one chosen for its title where there is
   * one that reaches this far, and otherwise nothing, leaving the catalogue's own pick to stand.
   *
   * @param mediaId - The file.
   * @param kind - Which picture.
   * @param isOfTitle - Whether what was asked for is the title's own picture rather than this
   *   file's, which is what lets a programme's chosen backdrop be given in place of an episode
   *   still.
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
      const [file] = await db
        .select({ season: mediaItem.seasonNumber, episode: mediaItem.episodeNumber })
        .from(mediaItem)
        .where(eq(mediaItem.id, mediaId))
        .limit(1);

      if (file?.season === null || file?.season === undefined || file.episode === null) {
        return null;
      }

      const [still] = await db
        .select({ url: mediaArtworkChoice.url })
        .from(mediaArtworkChoice)
        .where(
          and(
            choicesOf(title),
            eq(
              mediaArtworkChoice.kind,
              `still:s${file.season.toString()}e${file.episode.toString()}`,
            ),
          ),
        )
        .limit(1);

      return still?.url ?? null;
    }

    const [row] = await db
      .select({ url: mediaArtworkChoice.url })
      .from(mediaArtworkChoice)
      .where(and(choicesOf(title), eq(mediaArtworkChoice.kind, kind)))
      .limit(1);

    return row?.url ?? null;
  };

  /**
   * Lists the posters the catalogue holds of a title with no lettering on them, best first. The
   * catalogue keeps its own answers for hours and shares one question between callers asking at
   * once, so a remote opened on a film again and again asks it only the once.
   *
   * @param title - The title.
   * @returns Their addresses, or null where the catalogue could not be asked.
   */
  const barePostersOf = async (title: Title): Promise<string[] | null> => {
    const options = await readOptions?.({
      externalId: title.externalId,
      isSeries: title.externalKind === 'tv',
      tvdbId: title.tvdbId,
    }).catch(() => null);

    if (options === undefined || options === null) {
      return null;
    }

    return options.poster.filter((option) => option.language === null).map(({ url }) => url);
  };

  /**
   * Answers which poster of a file's title has no lettering on it, for a page that writes the title
   * itself over the picture: the one chosen for the title where that one has none, and otherwise
   * the catalogue's best. Only the library's own catalogue is asked, so it needs nothing more than
   * the library does.
   *
   * @param mediaId - The file.
   * @returns The poster's address, or null where the title has none, or is not matched.
   */
  const barePosterFor = async (mediaId: string): Promise<string | null> => {
    const title = await titleOf(mediaId);

    if (typeof title === 'string') {
      return null;
    }

    const bare = await barePostersOf(title);

    if (bare === null) {
      return null;
    }

    const { poster } = await chosenFor(title);

    return bare.find((url) => url === poster) ?? bare[0] ?? null;
  };

  /**
   * Keeps a picture an administrator uploaded for a title and chooses it, for every file of it.
   *
   * @param mediaId - Any file of the title.
   * @param kind - Which picture.
   * @param artwork - The picture, and what kind of image it is.
   * @param by - Who uploaded it.
   * @param frame - Where a poster or a backdrop sits in its shape, or nothing to show it whole.
   * @returns The choice, why the picture was turned away, or why nothing changed.
   */
  const upload = async (
    mediaId: string,
    kind: ArtworkKind,
    artwork: { body: Uint8Array; contentType: string },
    by: string | null,
    frame: PhotoFrame | null = null,
  ): Promise<{ jobId: string | null } | ArtworkRefusal | { fault: PictureFault }> => {
    if (uploads === undefined) {
      return 'unavailable';
    }

    const wrong = await whatIsWrongWithThePicture(artwork, ARTWORK_LIMITS);

    if (wrong !== null) {
      return { fault: wrong };
    }

    const id = randomUUID();

    await mkdir(uploads, { recursive: true });
    await writeFile(join(uploads, id), artwork.body);

    return choose(
      mediaId,
      kind,
      uploadPictureAddress(id, kind === 'logo' || frame === null ? null : { kind, frame }),
      by,
    );
  };

  /**
   * Whether a picture kept on this server is one a title may be drawn with: one beside its files,
   * or one uploaded.
   *
   * @param mediaId - Any file of the title.
   * @param url - The picture's address.
   * @returns Whether it may be shown.
   */
  const isOwnPicture = async (mediaId: string, url: string): Promise<boolean> => {
    const title = await titleOf(mediaId);

    return (
      typeof title !== 'string' &&
      (UPLOAD_ADDRESS.test(url) || (await picturesOnDisk(title)).some((one) => one.url === url))
    );
  };

  /**
   * Names the choice kept for a season's poster or an episode's still.
   *
   * @param part - The season, and the episode where it is an episode's.
   * @returns The kind the choice is kept under.
   */
  const kindOfPart = (part: ArtworkPart): string =>
    part.episode === null
      ? `poster:s${part.season.toString()}`
      : `still:s${part.season.toString()}e${part.episode.toString()}`;

  /**
   * Narrows to the files of one episode of a programme.
   *
   * @param title - The programme.
   * @param part - The season and episode.
   * @returns The condition that finds them.
   */
  const filesOfPart = (title: Title, part: ArtworkPart) =>
    and(
      filesOf(title),
      eq(mediaItem.seasonNumber, part.season),
      part.episode === null ? undefined : eq(mediaItem.episodeNumber, part.episode),
    );

  /**
   * Lists what the catalogue has for one season's poster or one episode's still, with the one
   * chosen now, from the entry a season is read from where somebody said it is another's.
   *
   * @param mediaId - Any file of the programme.
   * @param part - The season, and the episode where it is an episode's still.
   * @returns The choices, or why there are none.
   */
  const readPart = async (
    mediaId: string,
    part: ArtworkPart,
  ): Promise<ArtworkChoices | Exclude<ArtworkRefusal, 'refused'>> => {
    const title = await titleOf(mediaId);

    if (typeof title === 'string') {
      return title;
    }

    if (title.externalKind !== 'tv') {
      return 'missing';
    }

    const asked = (await borrowedSeasonOf?.(mediaId, part.season)) ?? {
      externalId: title.externalId,
      season: part.season,
    };
    const options = await readPartOptions?.({ ...asked, episode: part.episode }).catch(() => null);

    if (options === undefined || options === null) {
      return 'unavailable';
    }

    const [row] = await db
      .select({ url: mediaArtworkChoice.url })
      .from(mediaArtworkChoice)
      .where(and(choicesOf(title), eq(mediaArtworkChoice.kind, kindOfPart(part))))
      .limit(1);
    const chosen = row?.url ?? null;
    const isStill = part.episode !== null;

    return {
      kind: 'tv',
      options: { poster: isStill ? [] : options, backdrop: isStill ? options : [], logo: [] },
      onDisk: [],
      chosen: { poster: isStill ? null : chosen, backdrop: isStill ? chosen : null, logo: null },
      defaults: { poster: null, backdrop: null, logo: null },
    };
  };

  /**
   * Chooses one of the catalogue's pictures for a season's poster or an episode's still, or with
   * none goes back to the catalogue's own.
   *
   * @param mediaId - Any file of the programme.
   * @param part - The season, and the episode where it is an episode's still.
   * @param url - The picture, which must be one the catalogue offers, or null to undo.
   * @param by - Who chose it.
   * @returns The job putting the catalogue's back where one was needed, or why nothing changed.
   */
  const choosePart = async (
    mediaId: string,
    part: ArtworkPart,
    url: string | null,
    by: string | null,
  ): Promise<{ jobId: string | null } | ArtworkRefusal> => {
    const title = await titleOf(mediaId);

    if (typeof title === 'string') {
      return title;
    }

    if (title.externalKind !== 'tv') {
      return 'missing';
    }

    const kind = kindOfPart(part);

    if (url === null) {
      await db
        .delete(mediaArtworkChoice)
        .where(and(choicesOf(title), eq(mediaArtworkChoice.kind, kind)));

      const files =
        part.episode === null
          ? []
          : await db
              .select({ path: mediaItem.path })
              .from(mediaItem)
              .where(filesOfPart(title, part));
      const jobId =
        files.length === 0
          ? null
          : await readAgain(
              title.libraryId,
              files.map((file) => file.path),
            );

      await markChanged(title);

      return { jobId };
    }

    const asked = (await borrowedSeasonOf?.(mediaId, part.season)) ?? {
      externalId: title.externalId,
      season: part.season,
    };
    const options = await readPartOptions?.({ ...asked, episode: part.episode }).catch(() => null);

    if (options === undefined || options === null) {
      return 'unavailable';
    }

    if (!options.some((option) => option.url === url)) {
      return 'refused';
    }

    await upsert(db, mediaArtworkChoice, {
      values: [
        {
          id: randomUUID(),
          libraryId: title.libraryId,
          externalKind: title.externalKind,
          externalId: title.externalId,
          kind,
          url,
          updatedBy: by,
        },
      ],
      target: [
        mediaArtworkChoice.libraryId,
        mediaArtworkChoice.externalKind,
        mediaArtworkChoice.externalId,
        mediaArtworkChoice.kind,
      ],
      set: { url, updatedBy: by, updatedAt: new Date() },
    });

    if (part.episode !== null) {
      await db.update(mediaItem).set({ backdropUrl: url }).where(filesOfPart(title, part));
    }

    await markChanged(title);

    return { jobId: null };
  };

  /**
   * Reads the season posters and episode stills chosen for a programme, for laying over what the
   * catalogue says of its seasons.
   *
   * @param libraryId - Its library.
   * @param externalId - The programme.
   * @returns Each chosen picture by the kind it is kept under, such as `poster:s1`.
   */
  const partsChosen = async (libraryId: string, externalId: string) =>
    new Map(
      (
        await db
          .select({ kind: mediaArtworkChoice.kind, url: mediaArtworkChoice.url })
          .from(mediaArtworkChoice)
          .where(
            and(
              eq(mediaArtworkChoice.libraryId, libraryId),
              eq(mediaArtworkChoice.externalKind, 'tv'),
              eq(mediaArtworkChoice.externalId, externalId),
            ),
          )
      ).map((row) => [row.kind, row.url] as const),
    );

  return {
    read,
    choose,
    urlFor,
    barePosterFor,
    upload,
    isOwnPicture,
    readPart,
    choosePart,
    partsChosen,
    kindOfPart,
  };
};

export type { ArtworkRefusal };

export { createArtworkChoices };
