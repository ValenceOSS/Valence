import { render } from '@testing-library/react';
import { Shade } from '@ValenceTv/components/Shade/Shade';

describe('Shade in a browser', () => {
  it('fills its box with one flat colour rather than a gradient', () => {
    const drawn = render(
      <Shade colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']} flat="rgba(0, 0, 0, 0.25)" />,
    );
    const box = drawn.container.firstElementChild;

    expect(box?.getAttribute('style') ?? '').not.toContain('gradient');
    expect(getComputedStyle(box ?? document.body).backgroundColor).toBe('rgba(0, 0, 0, 0.25)');
  });
});
