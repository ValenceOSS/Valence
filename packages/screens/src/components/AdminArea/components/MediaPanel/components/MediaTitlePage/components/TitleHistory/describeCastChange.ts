import type { TitleValue } from '@ValenceContracts/schemas/TitleEdit';
import { castOfValue } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitlePeople/castOfValue';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayingAll } from '@ValenceI18n/sayingAll';

/**
 * Lists names the way a sentence does.
 *
 * @param names - The names, at least one.
 * @returns The list.
 */
const listOf = ([first = '', ...rest]: readonly string[]): string =>
  sayAgain(sayingAll([first, ...rest]));

/**
 * Says what a change to a cast did, rather than quoting both casts: who was added and taken off,
 * whose part changed, and whether the order did.
 *
 * @param before - The cast before.
 * @param after - The cast after.
 * @returns What changed, or nothing where neither is a cast or nothing did.
 */
const describeCastChange = (before: TitleValue, after: TitleValue): string | null => {
  const was = castOfValue(before);
  const now = castOfValue(after);
  const keyOf = (one: { personId: number | null; name: string }) =>
    one.personId === null ? `name:${one.name}` : `id:${one.personId.toString()}`;
  const wasKeys = was.map(keyOf);
  const nowKeys = now.map(keyOf);
  const added = now.filter((one) => !wasKeys.includes(keyOf(one))).map((one) => one.name);
  const removed = was.filter((one) => !nowKeys.includes(keyOf(one))).map((one) => one.name);
  const recast = now
    .filter((one) => was.some((other) => keyOf(other) === keyOf(one) && other.role !== one.role))
    .map((one) => one.name);
  const kept = nowKeys.filter((key) => wasKeys.includes(key));
  const isReordered = kept.join('\n') !== wasKeys.filter((key) => nowKeys.includes(key)).join('\n');
  const parts = [
    ...(added.length === 0
      ? []
      : [say('screens.adminArea.titleHistory.addedNames', { names: listOf(added) })]),
    ...(removed.length === 0
      ? []
      : [say('screens.adminArea.titleHistory.tookOffNames', { names: listOf(removed) })]),
    ...(recast.length === 0
      ? []
      : [say('screens.adminArea.titleHistory.changedThePartsOf', { names: listOf(recast) })]),
    ...(isReordered ? [say('screens.adminArea.titleHistory.changedTheBilling')] : []),
  ];

  return parts.length === 0 ? null : parts.join('; ');
};

export { describeCastChange };
