import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayCount } from '@ValenceI18n/sayCount';
import { saying } from '@ValenceI18n/saying';
import { sayingAll } from '@ValenceI18n/sayingAll';
import type { MediaTitle } from './MediaTitle.types';

type TitleProblem = 'unmatched' | 'noPoster' | 'twice' | 'unreadable';

type ProblemSource = {
  duplicate: { items: readonly { id: string; path: string; group: string | null }[] };
  unreadable: { items: readonly { id: string; path: string }[] };
};

type TitleProblems = {
  problems: readonly TitleProblem[];
  details: readonly string[];
};

const NAMED = 3;

const COPIES: ReadonlySet<MediaTitle['kind']> = new Set(['film', 'version', 'episode']);

const fileOf = (path: string): string => path.split(/[\\/]/u).at(-1) ?? path;

const idsOf = (title: MediaTitle): string[] => [
  title.lead.id,
  ...title.episodes.map((episode) => episode.id),
  ...title.parts.flatMap(idsOf),
  ...(title.row === undefined
    ? []
    : [
        ...title.row.problemFiles.duplicate.filter((one) => one.isOwn).map((one) => one.id),
        ...title.row.problemFiles.unreadable.map((one) => one.id),
      ]),
];

const nameAll = (files: readonly string[]): string => {
  const [first, ...others] = files.slice(0, NAMED);

  if (first === undefined) {
    return '';
  }

  if (files.length <= NAMED) {
    return sayAgain(sayingAll([first, ...others]));
  }

  const shown = [first, ...others];
  const listed = shown
    .slice(0, -1)
    .reduceRight(
      (rest, file) => sayAgain(saying('common.list.series', { first: file, rest })),
      shown.at(-1) ?? first,
    );

  return sayCount('common.list.andMore', files.length - NAMED, { listed });
};

/**
 * Says what is wrong with a title in the media list, and with which of its files: that it has no
 * match, or no poster where it is a film, which of its episodes share a number or which other copy
 * shares its match, and which of its files could not be read, naming only the other copies under one
 * that is itself a copy.
 *
 * @param title - The title, with its episodes and parts.
 * @param health - Which files are there twice and which could not be read, or nothing before the
 *   server has said.
 * @returns The kinds of problem the title has, and a line naming the files behind each.
 */
const describeTitleProblems = (
  title: MediaTitle,
  health: ProblemSource | null | undefined,
): TitleProblems => {
  const ids = new Set(idsOf(title));
  const twice = (health?.duplicate.items ?? []).filter((item) => ids.has(item.id));
  const unreadable = (health?.unreadable.items ?? []).filter((item) => ids.has(item.id));
  const groups = [...new Set(twice.map((item) => item.group ?? item.id))];

  const problems: TitleProblem[] = [
    ...(title.isMatched ? [] : ['unmatched' as const]),
    ...(title.isMatched && title.posterFrom === null && title.kind === 'film'
      ? ['noPoster' as const]
      : []),
    ...(twice.length > 0 ? ['twice' as const] : []),
    ...(unreadable.length > 0 ? ['unreadable' as const] : []),
  ];

  const isOneOfThem = COPIES.has(title.kind);

  const sharing = groups.map((group) => {
    const all = (health?.duplicate.items ?? []).filter((item) => (item.group ?? item.id) === group);
    const others = all.filter((item) => !ids.has(item.id));
    const isNamingOthers = isOneOfThem && others.length > 0;
    const files = nameAll((isNamingOthers ? others : all).map((item) => fileOf(item.path)));
    const [, season, episode] = group.split(':');

    if (group.startsWith('film:') || season === undefined || episode === undefined) {
      return isNamingOthers
        ? say('screens.adminArea.mediaPanel.matchedToTheSameFilmAs', { files })
        : say('screens.adminArea.mediaPanel.matchedToTheSameFilm', { files });
    }

    return isNamingOthers
      ? say('screens.adminArea.mediaPanel.alsoNumbered', { season, episode, files })
      : say('screens.adminArea.mediaPanel.numberedMoreThanOnce', { season, episode, files });
  });

  return {
    problems,
    details: [
      ...sharing,
      ...(unreadable.length === 0
        ? []
        : [
            say('screens.adminArea.mediaPanel.couldNotReadFiles', {
              files: nameAll(unreadable.map((item) => fileOf(item.path))),
            }),
          ]),
    ],
  };
};

export type { ProblemSource, TitleProblem, TitleProblems };

export { describeTitleProblems };
