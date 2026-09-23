import { howFarApart } from './howFarApart';

describe('howFarApart', () => {
  it('measures across the screen, not along one edge of it', () => {
    expect(
      howFarApart([
        { pageX: 0, pageY: 0 },
        { pageX: 3, pageY: 4 },
      ]),
    ).toBe(5);
  });

  it('reads two fingers in the same place as no distance at all', () => {
    expect(
      howFarApart([
        { pageX: 10, pageY: 10 },
        { pageX: 10, pageY: 10 },
      ]),
    ).toBe(0);
  });

  it('answers nothing for one finger, which is not a pinch', () => {
    expect(howFarApart([{ pageX: 0, pageY: 0 }])).toBeNull();
  });

  it('answers nothing for no fingers', () => {
    expect(howFarApart([])).toBeNull();
  });

  it('reads the first two where a third has joined in', () => {
    expect(
      howFarApart([
        { pageX: 0, pageY: 0 },
        { pageX: 0, pageY: 8 },
        { pageX: 100, pageY: 100 },
      ]),
    ).toBe(8);
  });
});
