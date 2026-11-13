import { describe, expect, it } from 'vitest';
import { appIconFile } from './appIconFile';

describe('appIconFile', () => {
  it('follows the system until a light or dark icon is chosen', () => {
    expect(appIconFile(null, false)).toBe('build/icon-win.png');
    expect(appIconFile(null, true)).toBe('build/icon-win-dark.png');
    expect(appIconFile('light', true)).toBe('build/icon-win.png');
    expect(appIconFile('dark', false)).toBe('build/icon-win-dark.png');
  });
});
