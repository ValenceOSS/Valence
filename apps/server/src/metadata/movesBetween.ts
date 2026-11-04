import type { TitleSubjectKind } from '@ValenceContracts/schemas/TitleEdit';
import type { SubjectKeys } from './subjectKeysOf';

type KeyMove = { from: string; to: string; kind: TitleSubjectKind };

const UNMATCHED = /^(?:file|series):/u;

const NUMBERED_EPISODE = /:s\d+e\d+$/u;

/**
 * Works out which of a file's titles have taken a new key since it was last stored, and so where
 * their edits move: a title matched since, from the key its file or folder gave it, and an episode
 * the catalogue has given its own id since, from the key its number gave it. A title matched to a
 * different entry keeps its edits where they are, since that is a different title.
 *
 * @param before - The keys the file was stored under.
 * @param after - The keys it is about to be stored under.
 * @returns The keys to move edits from and to.
 */
const movesBetween = (before: SubjectKeys, after: SubjectKeys): KeyMove[] => {
  if (before.kind === 'film' && after.kind === 'film') {
    return UNMATCHED.test(before.film) && before.film !== after.film
      ? [{ from: before.film, to: after.film, kind: 'film' }]
      : [];
  }

  if (before.kind !== 'episode' || after.kind !== 'episode') {
    return [];
  }

  const isMatchedSince = UNMATCHED.test(before.show) && before.show !== after.show;
  const isNumberedBefore =
    before.episode !== null && NUMBERED_EPISODE.test(before.episode) && before.show === after.show;
  const moves: KeyMove[] = [];

  if (isMatchedSince) {
    moves.push({ from: before.show, to: after.show, kind: 'show' });

    if (before.season !== null && after.season !== null) {
      moves.push({ from: before.season, to: after.season, kind: 'season' });
    }
  }

  if (
    (isMatchedSince || isNumberedBefore) &&
    before.episode !== null &&
    after.episode !== null &&
    before.episode !== after.episode
  ) {
    moves.push({ from: before.episode, to: after.episode, kind: 'episode' });
  }

  return moves;
};

export type { KeyMove };

export { movesBetween };
