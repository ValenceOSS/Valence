import { describe, expect, it } from 'vitest';
import { aFakePainter } from '@ValenceScreens/testing/aFakePainter';
import { makeAudioFrame } from './makeAudioFrame';
import { runOf } from './createWarp';
import { VISUALISERS } from './VISUALISERS';

const SIZE = { width: 1280, height: 720 };

const loud = () => {
  const heard = new Uint8Array(512);

  heard.forEach((_, at) => {
    heard[at] = Math.max(0, 255 - at);
  });

  const wave = new Uint8Array(1024);

  wave.forEach((_, at) => {
    wave[at] = 128 + Math.round(Math.sin(at / 9) * 100);
  });

  return { heard, wave };
};

const frameAt = (seconds: number, isLoud: boolean) => {
  const { heard, wave } = isLoud
    ? loud()
    : { heard: new Uint8Array(512), wave: new Uint8Array(1024).fill(128) };

  return makeAudioFrame(heard, wave, SIZE, { seconds, delta: 1 / 60 }, 200);
};

describe('the visualisers', () => {
  it('are five, each with its own id and name', () => {
    expect(VISUALISERS).toHaveLength(5);
    expect(new Set(VISUALISERS.map((one) => one.id)).size).toBe(5);
    expect(new Set(VISUALISERS.map((one) => one.name)).size).toBe(5);
  });

  describe.each(VISUALISERS)('$name', (visualiser) => {
    it('draws something for a loud sound', () => {
      const { painter, counts } = aFakePainter();
      const draw = visualiser.create();

      for (let frame = 0; frame < 30; frame += 1) {
        draw(painter, frameAt(frame / 60, true));
      }

      expect(counts.fillRect + counts.stroke + counts.fill).toBeGreaterThan(30);
    });

    it('draws only at places that are numbers, in silence as well as in noise', () => {
      const { painter, numbers } = aFakePainter();
      const draw = visualiser.create();

      for (let frame = 0; frame < 60; frame += 1) {
        draw(painter, frameAt(frame / 60, frame % 2 === 0));
      }

      expect(numbers.length).toBeGreaterThan(0);
      expect(numbers.every((one) => Number.isFinite(one))).toBe(true);
    });

    it('does not carry state from one screen to the next', () => {
      const first = aFakePainter();
      const second = aFakePainter();

      visualiser.create()(first.painter, frameAt(1, true));
      visualiser.create()(second.painter, frameAt(1, true));

      expect(first.numbers).toEqual(second.numbers);
    });

    it('leaves the painter as it found it for the next thing drawn', () => {
      const { painter } = aFakePainter();

      visualiser.create()(painter, frameAt(2, true));

      expect(painter.globalCompositeOperation).toBe('source-over');
      expect(painter.shadowBlur).toBe(0);
    });
  });
});

describe('runOf', () => {
  it('gives the same numbers every time from the same seed, each from nothing up to one', () => {
    const one = runOf(3);
    const another = runOf(3);
    const first = Array.from({ length: 20 }, () => one());

    expect(first).toEqual(Array.from({ length: 20 }, () => another()));
    expect(first.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(new Set(first).size).toBe(20);
  });
});
