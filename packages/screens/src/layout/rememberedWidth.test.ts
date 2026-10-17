import { afterEach, describe, expect, it } from 'vitest';
import { rememberedWidth } from './rememberedWidth';

const KEY = 'valence.testWidth';
const width = rememberedWidth(KEY, { narrowest: 200, widest: 400, usual: 300 });

afterEach(() => {
  window.localStorage.clear();
});

describe('rememberedWidth', () => {
  it('opens at the usual width when nothing is remembered', () => {
    expect(width.read()).toBe(300);
  });

  it('remembers the width it was left at', () => {
    width.save(360);

    expect(width.read()).toBe(360);
  });

  it('ignores a remembered width outside its limits', () => {
    window.localStorage.setItem(KEY, '9000');

    expect(width.read()).toBe(300);
  });
});
