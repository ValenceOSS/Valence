import { bloomsOf } from './bloomsOf';

describe('bloomsOf', () => {
  it('blooms each light where it was read, in its colour', () => {
    const blooms = bloomsOf([{ colour: 'rgb(255 0 0)', at: '8.3% 12.5%', weight: 1 }]);

    expect(blooms).toContain(
      'radial-gradient(ellipse 48% 43.2% at 8.3% 12.5%, rgba(255, 0, 0, 0.42) 0%',
    );
    expect(blooms).toContain('transparent 70%)');
  });

  it('shines fainter row by row towards the foot', () => {
    const palette = Array.from({ length: 24 }, (_, at) => ({
      colour: '#00ff00',
      at: `${at.toString()}% 50%`,
    }));
    const blooms = bloomsOf(palette) ?? '';

    expect(blooms).toContain('at 0% 50%, rgba(0, 255, 0, 0.42) 0%');
    expect(blooms).toContain('at 23% 50%, rgba(0, 255, 0, 0.2) 0%');
  });

  it('shines as strongly as each light is vivid, and not at all for a grey', () => {
    const blooms = bloomsOf([
      { colour: '#0000ff', at: '10% 10%', weight: 0.5 },
      { colour: '#808080', at: '20% 10%', weight: 0 },
    ]);

    expect(blooms).toContain('rgba(0, 0, 255, 0.21) 0%');
    expect(blooms).not.toContain('at 20% 10%');
  });

  it('draws the first light beneath the rest', () => {
    const blooms =
      bloomsOf([
        { colour: '#0000ff', at: '10% 10%' },
        { colour: '#ff0000', at: '20% 10%' },
      ]) ?? '';

    expect(blooms.indexOf('at 20% 10%')).toBeLessThan(blooms.indexOf('at 10% 10%'));
  });

  it('has nothing to draw where no light shines', () => {
    expect(bloomsOf([])).toBeNull();
    expect(bloomsOf([{ colour: '#808080', at: '10% 10%', weight: 0 }])).toBeNull();
  });
});
