import { asAClock } from './asAClock';

describe('asAClock', () => {
  it('says minutes and seconds for anything under an hour', () => {
    expect(asAClock(251)).toBe('4:11');
  });

  it('pads the seconds, since 4:1 is not a time', () => {
    expect(asAClock(241)).toBe('4:01');
  });

  it('says hours only where there are any', () => {
    expect(asAClock(3600)).toBe('1:00:00');
  });

  it('pads the minutes once there are hours, since 1:4:11 is not a time either', () => {
    expect(asAClock(3851)).toBe('1:04:11');
  });

  it('says the beginning as the beginning', () => {
    expect(asAClock(0)).toBe('0:00');
  });

  it('drops the part of a second nobody reads', () => {
    expect(asAClock(251.8)).toBe('4:11');
  });

  it('reads a position before the beginning as the beginning', () => {
    expect(asAClock(-5)).toBe('0:00');
  });

  it('manages a film longer than a day, rather than wrapping round', () => {
    expect(asAClock(90000)).toBe('25:00:00');
  });
});
