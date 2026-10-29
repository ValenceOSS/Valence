import { theNextWayIn } from './theNextWayIn';

describe('theNextWayIn', () => {
  it('zooms a film to fill the screen when the fingers go apart', () => {
    expect(theNextWayIn('apart')).toBe('fill');
  });

  it('fits the whole of it back when they come together', () => {
    expect(theNextWayIn('together')).toBe('fit');
  });
});
