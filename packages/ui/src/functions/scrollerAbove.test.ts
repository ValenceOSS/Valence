import { describe, expect, it } from 'vitest';
import { scrollerAbove } from './scrollerAbove';

describe('scrollerAbove', () => {
  it('finds the nearest ancestor that scrolls', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    const leaf = document.createElement('span');

    outer.style.overflowY = 'auto';
    outer.append(inner);
    inner.append(leaf);
    document.body.append(outer);

    expect(scrollerAbove(leaf)).toBe(outer);

    outer.remove();
  });

  it('answers with the document where nothing nearer scrolls', () => {
    const leaf = document.createElement('span');

    document.body.append(leaf);

    expect(scrollerAbove(leaf)).toBe(document.documentElement);

    leaf.remove();
  });
});
