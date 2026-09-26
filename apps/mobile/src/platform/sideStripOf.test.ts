import { sideStripOf } from './sideStripOf';

describe('sideStripOf', () => {
  it('finds a strip down the right of a folding phone', () => {
    expect(sideStripOf({ left: 0, right: 84 })).toEqual({ side: 'right', breadth: 84 });
  });

  it('finds a strip down the left of a folding phone', () => {
    expect(sideStripOf({ left: 84, right: 0 })).toEqual({ side: 'left', breadth: 84 });
  });

  it('finds none on an ordinary phone held on its side', () => {
    expect(sideStripOf({ left: 62, right: 62 })).toBeNull();
  });

  it('finds none on a phone held upright', () => {
    expect(sideStripOf({ left: 0, right: 0 })).toBeNull();
  });
});
