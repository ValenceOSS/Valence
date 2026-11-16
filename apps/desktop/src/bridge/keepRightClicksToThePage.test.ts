import { describe, expect, it } from 'vitest';
import { keepRightClicksToThePage } from './keepRightClicksToThePage';

describe('keepRightClicksToThePage', () => {
  it('keeps the webview from showing a menu of its own', () => {
    keepRightClicksToThePage(document);

    const rightClick = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });

    document.body.dispatchEvent(rightClick);

    expect(rightClick.defaultPrevented).toBe(true);
  });
});
