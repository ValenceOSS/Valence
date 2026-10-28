import { howWideACell } from './howWideACell';

const GAP = 18;

const rowInSinglePrecision = (cell: number, across: number) =>
  Array.from({ length: across }, (_, at) => at).reduce(
    (row, at) => Math.fround(row + Math.fround(cell) + (at === 0 ? 0 : GAP)),
    0,
  );

describe('howWideACell', () => {
  it('fills the room to within a 64th of a point a cell', () => {
    const cell = howWideACell(400, 3, GAP);

    expect(400 - (cell * 3 + GAP * 2)).toBeLessThan(3 / 64);
    expect(howWideACell(390, 3, GAP)).toBe(118);
  });

  it('never makes a row the layout adds up to more than the room', () => {
    for (let room = 300; room <= 1400; room += 0.25) {
      for (const across of [2, 3, 4, 5, 6]) {
        expect(rowInSinglePrecision(howWideACell(room, across, GAP), across)).toBeLessThanOrEqual(
          room,
        );
      }
    }
  });
});
