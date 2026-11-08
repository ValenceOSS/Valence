import { describe, expect, it } from 'vitest';
import { mangaVolumeOf } from './mangaVolumeOf';

describe('mangaVolumeOf', () => {
  it('reads the series and volume of a title in Japanese', () => {
    expect(mangaVolumeOf('薫る花は凛と咲く 1')).toEqual({ series: '薫る花は凛と咲く', volume: 1 });
    expect(mangaVolumeOf('ワンピース(３)')).toEqual({ series: 'ワンピース', volume: 3 });
    expect(mangaVolumeOf('進撃の巨人 第2巻')).toEqual({ series: '進撃の巨人', volume: 2 });
  });

  it('keeps a number that is part of the name', () => {
    expect(mangaVolumeOf('怪獣８号 4')).toEqual({ series: '怪獣8号', volume: 4 });
    expect(mangaVolumeOf('怪獣８号')).toBeNull();
  });

  it('passes over a title that is not in an East Asian script', () => {
    expect(mangaVolumeOf('The Fragrant Flower Blooms With Dignity 1')).toBeNull();
  });
});
