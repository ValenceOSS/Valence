import { theNextWayIn } from './theNextWayIn';

describe('theNextWayIn', () => {
  it('goes from held clear of the cutout to reaching the edges', () => {
    expect(theNextWayIn('safe', 'apart')).toBe('edge');
  });

  it('goes from reaching the edges to filling the screen', () => {
    expect(theNextWayIn('edge', 'apart')).toBe('full');
  });

  it('stays filled when somebody keeps pushing', () => {
    expect(theNextWayIn('full', 'apart')).toBe('full');
  });

  it('goes from filling the screen back to reaching the edges', () => {
    expect(theNextWayIn('full', 'together')).toBe('edge');
  });

  it('goes from reaching the edges back to clear of the cutout', () => {
    expect(theNextWayIn('edge', 'together')).toBe('safe');
  });

  it('stays clear when somebody keeps drawing together', () => {
    expect(theNextWayIn('safe', 'together')).toBe('safe');
  });

  it('never skips the middle, which is where most people want to stop', () => {
    expect(theNextWayIn('safe', 'apart')).not.toBe('full');
    expect(theNextWayIn('full', 'together')).not.toBe('safe');
  });
});
