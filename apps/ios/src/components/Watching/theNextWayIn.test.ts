import { theNextWayIn } from './theNextWayIn';

describe('theNextWayIn', () => {
  it('lets a film reach the edges when the fingers go apart', () => {
    expect(theNextWayIn('apart')).toBe('edge');
  });

  it('holds it clear of the cutout when they come together', () => {
    expect(theNextWayIn('together')).toBe('safe');
  });
});
