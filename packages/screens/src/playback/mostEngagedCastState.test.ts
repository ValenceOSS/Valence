import { describe, expect, it } from 'vitest';
import { mostEngagedCastState } from './mostEngagedCastState';

describe('mostEngagedCastState', () => {
  it('says casting is in use when either way is in use', () => {
    expect(mostEngagedCastState('available', 'connected')).toBe('connected');
    expect(mostEngagedCastState('connected', 'unavailable')).toBe('connected');
  });

  it('offers somewhere to cast when either way offers one', () => {
    expect(mostEngagedCastState('unavailable', 'available')).toBe('available');
  });

  it('waits on a device being reached over one merely on offer', () => {
    expect(mostEngagedCastState('connecting', 'available')).toBe('connecting');
  });

  it('offers nothing when neither does', () => {
    expect(mostEngagedCastState('unavailable', 'unavailable')).toBe('unavailable');
  });
});
