import { soundBands } from '@ValenceTv/music/soundBands';

const SIZE = 1024;

const aTone = (cycles: number): number[] =>
  Array.from({ length: SIZE }, (_, at) => Math.sin((2 * Math.PI * cycles * at) / SIZE));

const loudest = (bands: number[]): number => bands.indexOf(Math.max(...bands));

describe('soundBands', () => {
  it('reads four bands', () => {
    expect(soundBands(aTone(3))).toHaveLength(4);
  });

  it('hears nothing in silence', () => {
    expect(soundBands(new Array<number>(SIZE).fill(0))).toEqual([0, 0, 0, 0]);
  });

  it('puts a low note in the bass and a high one in the treble', () => {
    expect(loudest(soundBands(aTone(4)))).toBe(0);
    expect(loudest(soundBands(aTone(14)))).toBe(1);
    expect(loudest(soundBands(aTone(50)))).toBe(2);
    expect(loudest(soundBands(aTone(190)))).toBe(3);
  });

  it('reads only the last stretch of a long block', () => {
    const long = [...new Array<number>(SIZE).fill(1), ...aTone(4)];

    expect(soundBands(long)).toEqual(soundBands(aTone(4)));
  });

  it('reads a block shorter than its window', () => {
    const bands = soundBands(aTone(4).slice(0, 256));

    expect(bands.every((band) => Number.isFinite(band))).toBe(true);
  });
});
