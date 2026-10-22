import { describe, expect, it } from 'vitest';
import { problemOfAFault } from './problemOfAFault';

describe('problemOfAFault', () => {
  it('reconnects from a stream that stopped arriving', () => {
    for (const category of [1, 4, 5]) {
      expect(problemOfAFault({ from: 'engine', category }, true)).toBe('reconnect');
    }

    expect(problemOfAFault({ from: 'element', code: 2 }, true)).toBe('reconnect');
  });

  it('calls a stream damaged that would not decode part of the way in', () => {
    expect(problemOfAFault({ from: 'engine', category: 3, code: 3016 }, true)).toBe('damaged');
    expect(problemOfAFault({ from: 'element', code: 3 }, true)).toBe('damaged');
  });

  it('calls it a format the device cannot play where nothing played at all', () => {
    expect(problemOfAFault({ from: 'engine', category: 3, code: 3016 }, false)).toBe('unsupported');
    expect(problemOfAFault({ from: 'element', code: 4 }, false)).toBe('unsupported');
  });

  it('calls a picture that stopped while the sound went on damaged', () => {
    expect(problemOfAFault({ from: 'picture' }, true)).toBe('damaged');
  });

  it('says the stream could not be loaded where the browser would hold no more of it', () => {
    expect(problemOfAFault({ from: 'engine', category: 3, code: 3017 }, true)).toBe('streamLost');
  });

  it('says only that something went wrong for anything it cannot place', () => {
    expect(problemOfAFault({ from: 'engine', category: 9 }, true)).toBe('unknown');
    expect(problemOfAFault({ from: 'element', code: null }, true)).toBe('unknown');
  });
});
