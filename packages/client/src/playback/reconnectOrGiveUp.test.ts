import { describe, expect, it } from 'vitest';
import { reconnectOrGiveUp } from './reconnectOrGiveUp';

describe('reconnectOrGiveUp', () => {
  it('asks again the first time the server comes back', () => {
    expect(reconnectOrGiveUp([], 1000)).toEqual({ shouldReconnect: true, comebacks: [1000] });
  });

  it('asks again up to three times in a minute', () => {
    expect(reconnectOrGiveUp([1000, 5000], 9000)).toEqual({
      shouldReconnect: true,
      comebacks: [1000, 5000, 9000],
    });
  });

  it('gives up once the stream has failed three times in a minute with the server up', () => {
    expect(reconnectOrGiveUp([1000, 5000, 9000], 13_000)).toEqual({ shouldReconnect: false });
  });

  it('forgets failures more than a minute old', () => {
    expect(reconnectOrGiveUp([1000, 5000, 9000], 66_000)).toEqual({
      shouldReconnect: true,
      comebacks: [9000, 66_000],
    });
  });
});
