import { describe, expect, it } from 'vitest';
import { isOverDialogs, OVER_DIALOGS } from './isOverDialogs';

describe('isOverDialogs', () => {
  it('says so for anything inside chrome marked as staying over dialogs', () => {
    const bar = document.createElement('div');
    const button = document.createElement('button');

    bar.setAttribute(OVER_DIALOGS, '');
    bar.append(button);

    expect([isOverDialogs(bar), isOverDialogs(button)]).toEqual([true, true]);
  });

  it('says not for anything else, or for nothing at all', () => {
    expect([isOverDialogs(document.createElement('div')), isOverDialogs(null)]).toEqual([
      false,
      false,
    ]);
  });
});
