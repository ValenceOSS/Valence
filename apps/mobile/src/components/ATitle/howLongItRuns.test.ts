import { howLongItRuns } from './howLongItRuns';

describe('howLongItRuns', () => {
  it('says hours and minutes for a film', () => {
    expect(howLongItRuns(6960)).toBe('1h 56m');
  });

  it('says minutes alone for something short', () => {
    expect(howLongItRuns(1500)).toBe('25m');
  });

  it('rounds to the minute, since nobody deciding what to watch counts seconds', () => {
    expect(howLongItRuns(3629)).toBe('1h 0m');
  });

  it('manages an exact hour', () => {
    expect(howLongItRuns(7200)).toBe('2h 0m');
  });
});
