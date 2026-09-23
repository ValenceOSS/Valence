import { describe, expect, it } from 'vitest';
import { bytesOf } from './bytesOf';

describe('bytesOf', () => {
  it('reads the bytes after the comma', () => {
    expect([...bytesOf('data:application/x-bittorrent;base64,AAEC/w==')]).toEqual([0, 1, 2, 255]);
  });

  it('reads nothing from an empty answer', () => {
    expect(bytesOf('data:application/octet-stream;base64,').length).toBe(0);
  });
});
