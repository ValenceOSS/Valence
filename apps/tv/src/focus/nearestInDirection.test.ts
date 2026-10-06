import { nearestInDirection } from '@ValenceTv/focus/nearestInDirection';

const box = (left: number, top: number, width = 100, height = 100) => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
});

describe('nearestInDirection', () => {
  const row = [
    { place: 'a', box: box(0, 500) },
    { place: 'b', box: box(120, 500) },
    { place: 'c', box: box(240, 500) },
  ];

  it('moves along a row to the next in line', () => {
    expect(nearestInDirection(box(0, 500), row, 'right')).toBe('b');
    expect(nearestInDirection(box(240, 500), row, 'left')).toBe('b');
  });

  it('stays at the end of a row rather than leaving it sideways for something not level', () => {
    const withTheBar = [...row, { place: 'bar', box: box(400, 0, 600, 60) }];

    expect(nearestInDirection(box(240, 500), withTheBar, 'right')).toBeNull();
  });

  it('never lands on something that only starts further along, like a bar laid over the row', () => {
    const underTheBar = [
      { place: 'next', box: box(240, 0, 100, 300) },
      { place: 'bar', box: box(60, 20, 600, 60) },
    ];

    expect(nearestInDirection(box(120, 0, 100, 300), underTheBar, 'right')).toBe('next');
  });

  it('goes down to the nearest row, the one in line before one beside it', () => {
    const below = [
      { place: 'under', box: box(0, 700) },
      { place: 'beside', box: box(300, 650) },
    ];

    expect(nearestInDirection(box(0, 500), below, 'down')).toBe('under');
  });

  it('goes up to the nearest row even where nothing lines up exactly', () => {
    expect(nearestInDirection(box(900, 500), [{ place: 'tab', box: box(0, 0) }], 'up')).toBe('tab');
  });

  it('finds nothing where nothing lies that way', () => {
    expect(nearestInDirection(box(0, 0), row, 'up')).toBeNull();
  });
});
