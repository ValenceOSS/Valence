import { folderOf } from '@ValenceCore/functions/folderOf';
import { sharpestStepOf } from '@ValenceCore/functions/sharpestStepOf';
import { sortKeyOf } from '@ValenceCore/functions/sortKeyOf';
import { titleFolderOf } from '@ValenceCore/functions/titleFolderOf';
import { subjectKeysOf } from './subjectKeysOf';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { TitleRow } from '@ValenceContracts/schemas/TitleList';

type ListedFile = {
  summary: MediaSummary;
  path: string;
  sizeBytes: number;
  parentId: string | null;
  originalTitle: string | null;
  seriesKey: string | null;
  episodeTotal: number | null;
  catalogueEpisodeId: string | null;
  hasOverview: boolean;
  tags: readonly string[];
  certification: string | null;
  hasSubtitles: boolean;
};

type ListedTitle = {
  row: TitleRow;
  subjectKey: string | null;
  files: readonly ListedFile[];
  haystack: string;
  genres: ReadonlySet<string>;
  tags: ReadonlySet<string>;
  certification: string | null;
  hasOverview: boolean;
  hasBackdrop: boolean;
  hasLogo: boolean;
  hasSubtitles: boolean;
  maxHeight: number;
  audioKey: string;
  needsALook: boolean;
  isTwice: boolean;
  isUnreadable: boolean;
};

type ListingContext = {
  duplicates: ReadonlyMap<string, string>;
  duplicatePaths: ReadonlyMap<string, string>;
  editedKeys: ReadonlySet<string>;
};

/**
 * Whether a file could not be read: it runs for no time, or has no picture.
 *
 * @param file - The file.
 * @returns Whether it is unreadable.
 */
const isUnreadable = (file: ListedFile): boolean =>
  file.summary.durationSeconds <= 0 || (file.summary.width === 0 && file.summary.height === 0);

/**
 * What every one of some values is where they all agree, and whether they do not.
 *
 * @param values - The values, one a file.
 * @returns The shared value, or null with the values said to differ.
 */
const agreed = <Value>(
  values: readonly Value[],
  keyOf: (value: Value) => string,
): { value: Value | null; isMixed: boolean } => {
  const [first] = values;

  if (first === undefined) {
    return { value: null, isMixed: false };
  }

  const key = keyOf(first);

  return values.every((value) => keyOf(value) === key)
    ? { value: first, isMixed: false }
    : { value: null, isMixed: true };
};

/**
 * Gathers a library's files into the titles the admin's Media lists, one row a film or programme
 * however many files it is, each carrying what its columns show, the files behind any problem it
 * has, whether anybody edited it, and what it is searched, filtered and put in order by.
 *
 * @param files - Every file of the library that is not an extra.
 * @param context - Which files are there twice and where, and the keys edits are kept under.
 * @returns The titles.
 */
const listedTitlesOf = (files: readonly ListedFile[], context: ListingContext): ListedTitle[] => {
  const held = new Set(files.map((file) => file.summary.id));
  const titles = new Map<string, ListedFile[]>();

  for (const file of files) {
    const { summary } = file;
    const key =
      summary.seriesTitle === null || summary.seriesTitle === undefined
        ? `film:${file.parentId !== null && held.has(file.parentId) ? file.parentId : summary.id}`
        : `show:${summary.libraryId} ${summary.seriesId ?? summary.seriesTitle}`;
    const holding = titles.get(key);

    if (holding === undefined) {
      titles.set(key, [file]);
    } else {
      holding.push(file);
    }
  }

  return [...titles.entries()].map(([key, held]): ListedTitle => {
    const isShow = key.startsWith('show:');
    const ordered = isShow
      ? [...held].sort(
          (left, right) =>
            (left.summary.seasonNumber ?? Number.MAX_SAFE_INTEGER) -
              (right.summary.seasonNumber ?? Number.MAX_SAFE_INTEGER) ||
            (left.summary.episodeNumber ?? Number.MAX_SAFE_INTEGER) -
              (right.summary.episodeNumber ?? Number.MAX_SAFE_INTEGER),
        )
      : [...held].sort(
          (left, right) => Number(left.parentId !== null) - Number(right.parentId !== null),
        );
    const leadFile = ordered[0];

    if (leadFile === undefined) {
      throw new Error(`A title with no files: ${key}`);
    }

    const lead = leadFile.summary;
    const name = isShow ? (lead.seriesTitle ?? lead.title) : lead.title;
    const steps = agreed(
      ordered.map((file) => sharpestStepOf(file.summary)?.label ?? ''),
      (step) => step,
    );
    const ranges = agreed(
      ordered.map((file) => file.summary.videoRange),
      (range) => range,
    );
    const codecs = agreed(
      ordered.map((file) => file.summary.videoCodec),
      (codec) => codec.toLowerCase(),
    );
    const audioKeyOf = (file: ListedFile) =>
      file.summary.audio === null || file.summary.audio === undefined
        ? ''
        : [
            file.summary.audio.codec.toLowerCase(),
            file.summary.audio.channels,
            file.summary.audio.isAtmos,
          ].join(' ');
    const audios = agreed(ordered, audioKeyOf);
    const ids = new Set(ordered.map((file) => file.summary.id));
    const twiceGroups = new Set(
      ordered.flatMap((file) => {
        const group = context.duplicates.get(file.summary.id);

        return group === undefined ? [] : [group];
      }),
    );
    const duplicate = [...context.duplicates.entries()]
      .filter(([, group]) => twiceGroups.has(group))
      .map(([id, group]) => ({
        id,
        group,
        path: context.duplicatePaths.get(id) ?? '',
        isOwn: ids.has(id),
      }));
    const unreadable = ordered
      .filter(isUnreadable)
      .map((file) => ({ id: file.summary.id, path: file.path }));
    const keys = subjectKeysOf({
      path: leadFile.path,
      externalId: lead.externalId ?? null,
      seriesKey: leadFile.seriesKey,
      seasonNumber: lead.seasonNumber ?? null,
      episodeNumber: lead.episodeNumber ?? null,
      catalogueEpisodeId: leadFile.catalogueEpisodeId,
      extraKind: null,
    });
    const subject = keys.kind === 'film' ? keys.film : keys.kind === 'episode' ? keys.show : null;
    const isEdited =
      subject !== null &&
      [...context.editedKeys].some((one) => one === subject || one.startsWith(`${subject}:`));
    const isMatched = ordered.some(
      (file) =>
        file.summary.externalId !== null &&
        file.summary.externalId !== undefined &&
        file.summary.externalId !== '',
    );
    const posterFrom = lead.hasPoster ? lead.id : null;
    const added =
      ordered
        .map((file) => file.summary.addedAt)
        .sort()
        .at(-1) ?? lead.addedAt;
    const anyFile = (test: (file: ListedFile) => boolean) => ordered.some(test);
    const row: TitleRow = {
      id: isShow ? `series ${lead.libraryId} ${lead.seriesId ?? lead.seriesTitle ?? ''}` : lead.id,
      key,
      kind: isShow ? 'show' : 'film',
      libraryId: lead.libraryId,
      lead: { ...lead, sizeBytes: leadFile.sizeBytes, parentId: leadFile.parentId },
      name,
      order: sortKeyOf(name, isShow ? lead.seriesSortTitle : lead.sortTitle),
      year: isShow
        ? (ordered.map((file) => file.summary.year).find((year) => year !== null) ?? null)
        : lead.year,
      files: ordered.length,
      versions: isShow ? 0 : ordered.length - 1,
      seasons: new Set(
        ordered.flatMap((file) =>
          file.summary.seasonNumber === null || file.summary.seasonNumber === undefined
            ? []
            : [file.summary.seasonNumber],
        ),
      ).size,
      episodes: isShow
        ? ordered.filter((file) => file.parentId === null || !ids.has(file.parentId)).length
        : 0,
      episodeTotal: isShow ? leadFile.episodeTotal : null,
      sizeBytes: ordered.reduce((sum, file) => sum + file.sizeBytes, 0),
      durationSeconds: isShow
        ? ordered.reduce((sum, file) => sum + file.summary.durationSeconds, 0)
        : lead.durationSeconds,
      latestAddedAt: added,
      isMatched,
      posterFrom,
      folder: isShow ? titleFolderOf(ordered.map((file) => file.path)) : folderOf(leadFile.path),
      leadPath: leadFile.path,
      looks: {
        step: steps.value === '' ? null : steps.value,
        isStepMixed: steps.isMixed,
        range: ranges.value,
        isRangeMixed: ranges.isMixed,
        codec: codecs.value,
        isCodecMixed: codecs.isMixed,
        audio: audios.value?.summary.audio ?? null,
        isAudioMixed: audios.isMixed,
      },
      problemFiles: { duplicate, unreadable },
      isEdited,
    };

    return {
      row,
      subjectKey: subject,
      files: ordered,
      haystack: [
        name,
        leadFile.originalTitle ?? '',
        isShow ? (lead.seriesSortTitle ?? '') : (lead.sortTitle ?? ''),
        ...ordered.map((file) => file.path),
      ]
        .join('\n')
        .toLocaleLowerCase(),
      genres: new Set(ordered.flatMap((file) => file.summary.genres ?? [])),
      tags: new Set(ordered.flatMap((file) => file.tags)),
      certification: leadFile.certification,
      hasOverview: anyFile((file) => file.hasOverview),
      hasBackdrop: anyFile((file) => file.summary.hasBackdrop),
      hasLogo: anyFile((file) => file.summary.hasLogo),
      hasSubtitles: anyFile((file) => file.hasSubtitles),
      maxHeight: Math.max(0, ...ordered.map((file) => file.summary.height)),
      audioKey: audios.isMixed ? '~' : audioKeyOf(leadFile),
      needsALook: !isMatched || (!isShow && posterFrom === null),
      isTwice: duplicate.length > 0,
      isUnreadable: unreadable.length > 0,
    };
  });
};

export type { ListedFile, ListedTitle, ListingContext };

export { listedTitlesOf };
