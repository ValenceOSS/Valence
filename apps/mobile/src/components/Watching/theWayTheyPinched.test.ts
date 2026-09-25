import { theWayTheyPinched } from './theWayTheyPinched';

describe('theWayTheyPinched', () => {
  it('reads fingers pushed well apart as pushed apart', () => {
    expect(theWayTheyPinched(100, 140)).toBe('apart');
  });

  it('reads fingers drawn well together as drawn together', () => {
    expect(theWayTheyPinched(140, 100)).toBe('together');
  });

  it('reads a hand holding still as neither, rather than as flickering between the two', () => {
    expect(theWayTheyPinched(100, 105)).toBe('neither');
    expect(theWayTheyPinched(105, 100)).toBe('neither');
  });

  it('waits until a push has gone far enough to have been meant', () => {
    expect(theWayTheyPinched(100, 114)).toBe('neither');
    expect(theWayTheyPinched(100, 115)).toBe('apart');
  });

  it('answers neither where the fingers never had a distance', () => {
    expect(theWayTheyPinched(0, 120)).toBe('neither');
    expect(theWayTheyPinched(120, 0)).toBe('neither');
  });
});
