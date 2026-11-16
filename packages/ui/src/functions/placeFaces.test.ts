import { describe, expect, it } from 'vitest';
import {
  FACE_PX,
  FANNED_LIFT_PX,
  FANNED_STEP_PX,
  LIFT_PX,
  MOST_FACES_GATHERED,
  OVERLAP_STEP_PX,
  placeFaces,
} from './placeFaces';

const together = [
  { id: 'dan', atSeconds: 500 },
  { id: 'sam', atSeconds: 500 },
  { id: 'ruth', atSeconds: 500 },
];

const across = (placed: ReturnType<typeof placeFaces>) =>
  placed.faces.map((face) => face.x + face.offset);

describe('placeFaces', () => {
  it('overlaps people at the same point around it, rather than drawing one on another', () => {
    const placed = placeFaces(together, 1000, 300);

    expect(across(placed)).toEqual([150 - OVERLAP_STEP_PX, 150, 150 + OVERLAP_STEP_PX]);
    expect(placed.faces.every((face) => face.lift === 0)).toBe(true);
  });

  it('fans the group being pointed at outwards and upwards', () => {
    const placed = placeFaces(together, 1000, 300, 'dan');

    expect(across(placed)).toEqual([150 - FANNED_STEP_PX, 150, 150 + FANNED_STEP_PX]);
    expect(placed.faces.every((face) => face.lift === FANNED_LIFT_PX)).toBe(true);
  });

  it('fans only the group being pointed at', () => {
    const placed = placeFaces(
      [
        { id: 'dan', atSeconds: 100 },
        { id: 'sam', atSeconds: 100 },
        { id: 'ruth', atSeconds: 900 },
        { id: 'jo', atSeconds: 900 },
      ],
      1000,
      300,
      'ruth',
    );

    expect(placed.faces.map((face) => face.lift)).toEqual([0, 0, FANNED_LIFT_PX, FANNED_LIFT_PX]);
  });

  it('keeps a group in one place as it opens, so only the spread moves', () => {
    const shut = placeFaces(together, 1000, 300);
    const open = placeFaces(together, 1000, 300, 'dan');

    expect(open.faces.map((face) => face.x)).toEqual(shut.faces.map((face) => face.x));
  });

  it('says how far a group reaches once fanned, whether or not it is', () => {
    const { groups } = placeFaces(together, 1000, 300);

    expect(groups).toMatchObject([
      { key: 'dan', x: 150, reach: FANNED_STEP_PX + FACE_PX / 2, size: 3, more: 0 },
    ]);
  });

  it('lets somebody far enough away leave the group, lifted above the line', () => {
    const { faces } = placeFaces(
      [
        { id: 'dan', atSeconds: 500 },
        { id: 'sam', atSeconds: 500 },
        { id: 'ruth', atSeconds: 900 },
      ],
      1000,
      300,
    );

    expect(faces[2]).toEqual({
      id: 'ruth',
      group: 'ruth',
      x: 270,
      offset: 0,
      lift: LIFT_PX,
      isFolded: false,
    });
    expect(faces[0]?.lift).toBe(0);
  });

  it('does not lift somebody watching alone', () => {
    expect(placeFaces([{ id: 'dan', atSeconds: 500 }], 1000, 300).faces).toEqual([
      { id: 'dan', group: 'dan', x: 150, offset: 0, lift: 0, isFolded: false },
    ]);
  });

  it('keeps people in sync in the order they were given, however their positions jitter', () => {
    const ahead = placeFaces(
      [
        { id: 'dan', atSeconds: 500.4 },
        { id: 'sam', atSeconds: 500 },
      ],
      1000,
      300,
      null,
      2,
    );
    const behind = placeFaces(
      [
        { id: 'dan', atSeconds: 499.6 },
        { id: 'sam', atSeconds: 500 },
      ],
      1000,
      300,
      null,
      2,
    );

    expect(ahead.faces.map((face) => face.offset)).toEqual(behind.faces.map((face) => face.offset));
    expect(ahead.faces[0]?.offset).toBeLessThan(ahead.faces[1]?.offset ?? 0);
  });

  it('places somebody out of sync by where they are, behind the rest', () => {
    const { faces } = placeFaces(
      [
        { id: 'dan', atSeconds: 500 },
        { id: 'sam', atSeconds: 494 },
      ],
      1000,
      300,
      null,
      2,
    );

    expect(faces[1]?.offset).toBeLessThan(faces[0]?.offset ?? 0);
  });

  it('keeps a fanned group at the very start on the bar', () => {
    const atStart = together.map((face) => ({ ...face, atSeconds: 0 }));

    expect(Math.min(...across(placeFaces(atStart, 1000, 300, 'dan')))).toBe(FACE_PX / 2);
  });

  it('starts somebody alone against the left end, wholly on the bar', () => {
    const { faces } = placeFaces([{ id: 'dan', atSeconds: 0 }], 1000, 300);

    expect(faces[0]?.x).toBe(FACE_PX / 2);
  });

  it('ends somebody alone against the right end, wholly on the bar', () => {
    const { faces } = placeFaces([{ id: 'dan', atSeconds: 1000 }], 1000, 300);

    expect(faces[0]?.x).toBe(300 - FACE_PX / 2);
  });

  it('waits against an end until the point is far enough in to follow it', () => {
    const at = (atSeconds: number) =>
      placeFaces([{ id: 'dan', atSeconds }], 1000, 300).faces[0]?.x ?? 0;

    expect(at(10)).toBe(FACE_PX / 2);
    expect(at(100)).toBe(30);
    expect(at(500)).toBe(150);
    expect(at(900)).toBe(270);
    expect(at(990)).toBe(300 - FACE_PX / 2);
  });

  it('centres a group on a bar too short for it to travel', () => {
    expect(placeFaces(together, 1000, 40).groups[0]?.x).toBe(20);
  });

  it('keeps a gathered group at the very start against the left end', () => {
    const atStart = together.map((face) => ({ ...face, atSeconds: 1 }));

    expect(Math.min(...across(placeFaces(atStart, 1000, 300)))).toBe(FACE_PX / 2);
  });

  it('holds a fanned group still against an end while the reports move on', () => {
    const at = (atSeconds: number) =>
      across(
        placeFaces(
          together.map((face) => ({ ...face, atSeconds })),
          1000,
          300,
          'dan',
        ),
      );

    expect(at(2)).toEqual(at(1));
  });

  it('squeezes a group too big for the bar so every face stays on it, fanned or not', () => {
    const crowd = Array.from({ length: 30 }, (_, index) => ({
      id: `person${index.toString()}`,
      atSeconds: 500,
    }));

    for (const fanned of [null, 'person0']) {
      const spots = across(placeFaces(crowd, 1000, 340, fanned));

      expect(Math.min(...spots)).toBeGreaterThanOrEqual(FACE_PX / 2);
      expect(Math.max(...spots)).toBeLessThanOrEqual(340 - FACE_PX / 2);
    }
  });

  it('folds a big gathered group into its first to join, counting the rest', () => {
    const crowd = Array.from({ length: MOST_FACES_GATHERED + 3 }, (_, index) => ({
      id: `person${index.toString()}`,
      atSeconds: 500,
    }));
    const { faces, groups } = placeFaces(crowd, 1000, 300);

    expect(faces.filter((face) => !face.isFolded).map((face) => face.id)).toEqual(['person0']);
    expect(groups[0]?.more).toBe(MOST_FACES_GATHERED + 2);
    expect(groups[0]?.moreAt).toBe((groups[0]?.x ?? 0) + OVERLAP_STEP_PX / 2);
  });

  it('keeps a big group folded when it is pointed at', () => {
    const crowd = Array.from({ length: MOST_FACES_GATHERED + 3 }, (_, index) => ({
      id: `person${index.toString()}`,
      atSeconds: 500,
    }));
    const { faces, groups } = placeFaces(crowd, 1000, 300, 'person0');

    expect(faces.filter((face) => face.isFolded)).toHaveLength(MOST_FACES_GATHERED + 2);
    expect(groups[0]?.folded).toEqual(crowd.slice(1).map((person) => person.id));
  });

  it('does not fold a group of six', () => {
    const six = Array.from({ length: MOST_FACES_GATHERED }, (_, index) => ({
      id: `person${index.toString()}`,
      atSeconds: 500,
    }));

    expect(placeFaces(six, 1000, 300).faces.some((face) => face.isFolded)).toBe(false);
  });

  it('keeps a fanned group at the very end on the bar', () => {
    const atEnd = together.map((face) => ({ ...face, atSeconds: 1000 }));

    expect(Math.max(...across(placeFaces(atEnd, 1000, 300, 'dan')))).toBe(300 - FACE_PX / 2);
  });

  it('answers in the order it was asked', () => {
    const { faces } = placeFaces(
      [
        { id: 'late', atSeconds: 900 },
        { id: 'early', atSeconds: 100 },
      ],
      1000,
      300,
    );

    expect(faces.map((face) => face.id)).toEqual(['late', 'early']);
  });
});
