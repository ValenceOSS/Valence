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
  title: say('client.library.describeHiding.hideTitle', { title: asking.title }),
  detail:
    asking.kind === 'series'
      ? say(
          isShared
            ? 'client.library.describeHiding.everyEpisodeDisappearsForYou'
            : 'client.library.describeHiding.everyEpisodeDisappears',
        )
      : asking.kind === 'library'
        ? say(
            isShared
              ? 'client.library.describeHiding.everythingDisappearsForYou'
              : 'client.library.describeHiding.everythingDisappears',
          )
        : say(
            isShared
              ? 'client.library.describeHiding.itDisappearsForYou'
              : 'client.library.describeHiding.itDisappearsFromYourRows',
          ),
});

export { describeHiding };
