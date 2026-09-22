import type { Asked } from '@ValenceClient/library/useHidden';

/**
 * What to ask before hiding something, and what hiding it does.
 *
 * @param asking - What is about to be hidden.
 * @param isShared - Whether other people use this account, who will still see it.
 * @returns The question and what it means.
 */
const describeHiding = (asking: Asked, isShared: boolean): { title: string; detail: string } => ({
  title: `Hide ${asking.title}?`,
  detail: `${
    asking.kind === 'series'
      ? 'Every episode of it disappears'
      : asking.kind === 'library'
        ? 'Everything in it disappears'
        : 'It disappears'
  } from your rows, your searches and the randomiser${
    isShared ? ', for you and for nobody else on this account' : ''
  }. Bring it back from Hidden on your profile at any time.`,
});

export { describeHiding };
