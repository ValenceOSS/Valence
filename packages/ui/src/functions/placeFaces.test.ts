import { describe, expect, it } from 'vitest';
import {
  FACE_PX,
  FANNED_LIFT_PX,
  FANNED_STEP_PX,
  LIFT_PX,
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

    expect(groups).toEqual([{ key: 'dan', x: 150, reach: FANNED_STEP_PX + FACE_PX / 2, size: 3 }]);
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

    expect(faces[2]).toEqual({ id: 'ruth', group: 'ruth', x: 270, offset: 0, lift: LIFT_PX });
    expect(faces[0]?.lift).toBe(0);
  });

  it('does not lift somebody watching alone', () => {
    expect(placeFaces([{ id: 'dan', atSeconds: 500 }], 1000, 300).faces).toEqual([
      { id: 'dan', group: 'dan', x: 150, offset: 0, lift: 0 },
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

    expect(Math.min(...across(placeFaces(atStart, 1000, 300, 'dan')))).toBe(0);
  });

  it('keeps a fanned group at the very end on the bar', () => {
    const atEnd = together.map((face) => ({ ...face, atSeconds: 1000 }));

    expect(Math.max(...across(placeFaces(atEnd, 1000, 300, 'dan')))).toBe(300);
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
