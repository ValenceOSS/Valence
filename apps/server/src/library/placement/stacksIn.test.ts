import { describe, expect, it } from 'vitest';
import { stacksIn } from './stacksIn';

const FOLDER = '/movies/Film (1999)';

describe('stacksIn', () => {
  it('joins the parts of a film kept as several files, in order, under its first', () => {
    const paths = [
      `${FOLDER}/Film (1999) - cd2.mkv`,
      `${FOLDER}/Film (1999) - cd1.mkv`,
      `${FOLDER}/Film (1999) - cd3.mkv`,
    ];

    expect(stacksIn(paths)).toEqual(
      new Map([
        [
          `${FOLDER}/Film (1999) - cd1.mkv`,
          {
            name: 'Film (1999)',
            parts: [
              `${FOLDER}/Film (1999) - cd1.mkv`,
              `${FOLDER}/Film (1999) - cd2.mkv`,
              `${FOLDER}/Film (1999) - cd3.mkv`,
            ],
          },
        ],
      ]),
    );
  });

  it('joins parts that name themselves by letter', () => {
    const paths = [`${FOLDER}/Film (1999) - partb.mkv`, `${FOLDER}/Film (1999) - parta.mkv`];

    expect(stacksIn(paths).get(`${FOLDER}/Film (1999) - parta.mkv`)?.parts).toEqual([
      `${FOLDER}/Film (1999) - parta.mkv`,
      `${FOLDER}/Film (1999) - partb.mkv`,
    ]);
  });

  it('leaves alone a lone part, parts with one missing, and parts of two different films', () => {
    expect(stacksIn([`${FOLDER}/Film (1999) - cd1.mkv`]).size).toBe(0);
    expect(
      stacksIn([`${FOLDER}/Film (1999) - cd1.mkv`, `${FOLDER}/Film (1999) - cd3.mkv`]).size,
    ).toBe(0);
    expect(
      stacksIn([`${FOLDER}/Film (1999) - cd1.mkv`, `${FOLDER}/Other (2001) - cd2.mkv`]).size,
    ).toBe(0);
  });

  it('keeps parts in different folders apart, and parts named by different words', () => {
    expect(stacksIn([`/movies/A/Film - cd1.mkv`, `/movies/B/Film - cd2.mkv`]).size).toBe(0);
    expect(stacksIn([`${FOLDER}/Film - cd1.mkv`, `${FOLDER}/Film - part2.mkv`]).size).toBe(0);
  });

  it('joins nothing where two files claim the same part', () => {
    expect(
      stacksIn([`${FOLDER}/Film - cd1.mkv`, `${FOLDER}/Film - cd1.avi`, `${FOLDER}/Film - cd2.mkv`])
        .size,
    ).toBe(0);
  });
});
