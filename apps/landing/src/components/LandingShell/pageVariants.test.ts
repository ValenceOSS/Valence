import { describe, expect, it } from 'vitest';
import { pageVariants } from './pageVariants';

describe('pageVariants', () => {
  it('blurs one page away and the next into focus', () => {
    const variants = pageVariants(false);

    expect(variants.hidden).toMatchObject({ opacity: 0, filter: 'blur(14px)' });
    expect(variants.shown).toMatchObject({ opacity: 1, transitionEnd: { filter: 'none' } });
    expect(variants.gone).toMatchObject({ opacity: 0, filter: 'blur(10px)' });
  });

  it('only fades for somebody who asked for less motion', () => {
    const variants = pageVariants(true);

    expect(variants.hidden).toStrictEqual({ opacity: 0 });
    expect(variants.shown).not.toHaveProperty('filter');
  });
});
