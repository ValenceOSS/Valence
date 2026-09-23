import { whereAlongTheLine } from './whereAlongTheLine';

describe('whereAlongTheLine', () => {
  it('reads a touch halfway along as halfway through', () => {
    expect(whereAlongTheLine(50, 100, 120)).toBe(60);
  });

  it('reads a touch three quarters along as three quarters through', () => {
    expect(whereAlongTheLine(75, 100, 120)).toBe(90);
  });

  it('goes no further than the end, where a finger has left the line', () => {
    expect(whereAlongTheLine(200, 100, 120)).toBe(120);
  });

  it('goes no further back than the beginning, where it has left the other side', () => {
    expect(whereAlongTheLine(-40, 100, 120)).toBe(0);
  });

  it('answers nothing before the line has been measured', () => {
    expect(whereAlongTheLine(25, 0, 120)).toBe(0);
  });

  it('answers nothing for a thing with no length, rather than dividing by it', () => {
    expect(whereAlongTheLine(25, 100, 0)).toBe(0);
  });

  it('reads the very start as the very start', () => {
    expect(whereAlongTheLine(0, 100, 120)).toBe(0);
  });

  it('reads the very end as the very end', () => {
    expect(whereAlongTheLine(100, 100, 120)).toBe(120);
  });
});
