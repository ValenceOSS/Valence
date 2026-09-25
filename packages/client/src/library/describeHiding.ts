import type { Asked } from '@ValenceClient/library/useHidden';
import { say } from '@ValenceI18n/say';

/**
 * What to ask before hiding something, and what hiding it does.
 *
 * @param asking - What is about to be hidden.
 * @param isShared - Whether other people use this account, who will still see it.
 * @returns The question and what it means.
 */
const describeHiding = (asking: Asked, isShared: boolean): { title: string; detail: string } => ({
  title: say('client.describeHiding.title', { title: asking.title }),
  detail: say(
    asking.kind === 'series'
      ? isShared
        ? 'client.describeHiding.seriesShared'
        : 'client.describeHiding.series'
      : asking.kind === 'library'
        ? isShared
          ? 'client.describeHiding.libraryShared'
          : 'client.describeHiding.library'
        : isShared
          ? 'client.describeHiding.itemShared'
          : 'client.describeHiding.item',
  ),
});

export { describeHiding };
