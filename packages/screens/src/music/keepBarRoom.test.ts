import { describe, expect, it } from 'vitest';
import { keepBarRoom } from './keepBarRoom';

describe('keepBarRoom', () => {
  it('tells the page how tall the bar is, and takes it back when the bar goes', () => {
    const bar = document.createElement('div');

    Object.defineProperty(bar, 'offsetHeight', { value: 84 });

    const stop = keepBarRoom(bar);

    expect(document.documentElement.style.getPropertyValue('--music-bar-room')).toBe('84px');

    stop();

    expect(document.documentElement.style.getPropertyValue('--music-bar-room')).toBe('');
  });
});
