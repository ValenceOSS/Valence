import { guideRules } from '@ValenceTv/focus/guideRules';
import { rememberWhereFocusWent } from '@ValenceTv/focus/rememberWhereFocusWent';

describe('rememberWhereFocusWent', () => {
  it('has a remembering guide keep what the remote landed on, and nothing else keep it', () => {
    const remembering = document.createElement('div');
    const forgetting = document.createElement('div');
    const landed = document.createElement('button');

    remembering.append(forgetting);
    forgetting.append(landed);
    guideRules.set(remembering, {
      isRemembering: true,
      trapped: new Set(),
      isShut: false,
      lastFocused: null,
    });
    guideRules.set(forgetting, {
      isRemembering: false,
      trapped: new Set(),
      isShut: false,
      lastFocused: null,
    });

    rememberWhereFocusWent(landed);

    expect(guideRules.get(remembering)?.lastFocused).toBe(landed);
    expect(guideRules.get(forgetting)?.lastFocused).toBeNull();
  });

  it('ignores something that is not an element', () => {
    expect(() => {
      rememberWhereFocusWent(null);
    }).not.toThrow();
  });
});
