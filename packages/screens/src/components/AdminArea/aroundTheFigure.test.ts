import { describe, expect, it } from 'vitest';
import { aroundTheFigure } from './aroundTheFigure';

describe('aroundTheFigure', () => {
  it('gives the words either side of the figure', () => {
    expect(aroundTheFigure('10 cores', '10')).toEqual({ prefix: '', suffix: ' cores' });
    expect(aroundTheFigure('about 3 left', '3')).toEqual({ prefix: 'about ', suffix: ' left' });
  });

  it('draws the figure bare where the words do not hold it', () => {
    expect(aroundTheFigure('no figure here', '10')).toEqual({ prefix: '', suffix: '' });
  });
});
