import { guideRules } from '@ValenceTv/focus/guideRules';
import type { GuideRule } from '@ValenceTv/focus/GuideRule';

/**
 * Every guide or fence an element sits inside, nearest first, each with the element it is drawn as.
 *
 * @param element - Where to start.
 * @returns The guides around it.
 */
const rulesAround = (element: Element): { at: Element; rule: GuideRule }[] => {
  const found: { at: Element; rule: GuideRule }[] = [];

  for (let at: Element | null = element; at !== null; at = at.parentElement) {
    const rule = guideRules.get(at);

    if (rule !== undefined) {
      found.push({ at, rule });
    }
  }

  return found;
};

export { rulesAround };
