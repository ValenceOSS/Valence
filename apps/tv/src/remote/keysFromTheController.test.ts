import { keysFromTheController } from '@ValenceTv/remote/keysFromTheController';

/**
 * A controller with these buttons pressed and its stick where it is.
 *
 * @param pressed - The buttons held, by their standard numbers.
 * @param axes - Where the left stick is, across and down.
 * @returns What it says.
 */
const aController = (pressed: number[], axes: number[] = [0, 0]) => ({
  buttons: Array.from({ length: 17 }, (_, button) => pressed.includes(button)),
  axes,
});

describe('keysFromTheController', () => {
  it('presses the arrows for the D-pad, select for A and back for B', () => {
    const keys = keysFromTheController([aController([12, 15, 0, 1])], new Map(), 0);

    expect(new Set(keys.down.map((each) => each.key))).toEqual(
      new Set(['ArrowRight', 'ArrowUp', 'Enter', 'Escape']),
    );
    expect(keys.down.every((each) => !each.isRepeat)).toBe(true);
  });

  it('presses an arrow for the stick only once it is pushed most of the way', () => {
    expect(keysFromTheController([aController([], [0.5, 0])], new Map(), 0).down).toEqual([]);
    expect(keysFromTheController([aController([], [-0.9, 0.9])], new Map(), 0).down).toEqual([
      { key: 'ArrowLeft', isRepeat: false },
      { key: 'ArrowDown', isRepeat: false },
    ]);
  });

  it('repeats a held arrow after a fifth of a second, then every twenty-fifth', () => {
    const first = keysFromTheController([aController([15])], new Map(), 0);
    const tooSoon = keysFromTheController([aController([15])], first.holding, 150);
    const second = keysFromTheController([aController([15])], tooSoon.holding, 200);
    const third = keysFromTheController([aController([15])], second.holding, 240);

    expect(tooSoon.down).toEqual([]);
    expect(second.down).toEqual([{ key: 'ArrowRight', isRepeat: true }]);
    expect(third.down).toEqual([{ key: 'ArrowRight', isRepeat: true }]);
  });

  it('never repeats back, so holding B goes back a single step', () => {
    const first = keysFromTheController([aController([1])], new Map(), 0);

    expect(keysFromTheController([aController([1])], first.holding, 1000).down).toEqual([]);
  });

  it('lets a key up when its button is let go', () => {
    const first = keysFromTheController([aController([0])], new Map(), 0);
    const after = keysFromTheController([aController([])], first.holding, 20);

    expect(after.up).toEqual(['Enter']);
    expect(after.holding.size).toBe(0);
  });

  it('hears every controller at once', () => {
    const keys = keysFromTheController([aController([12]), aController([13])], new Map(), 0);

    expect(keys.down.map((each) => each.key)).toEqual(['ArrowUp', 'ArrowDown']);
  });
});
