import { guideRules } from '@ValenceTv/focus/guideRules';
import { rulesAround } from '@ValenceTv/focus/rulesAround';

const aRule = (isRemembering: boolean) => ({
  isRemembering,
  trapped: new Set<never>(),
  isShut: false,
  lastFocused: null,
});

describe('rulesAround', () => {
  it('finds every guide an element sits inside, nearest first', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    const leaf = document.createElement('span');

    outer.append(inner);
    inner.append(leaf);
    guideRules.set(outer, aRule(false));
    guideRules.set(inner, aRule(true));

    expect(rulesAround(leaf).map(({ at }) => at)).toEqual([inner, outer]);
  });
});
