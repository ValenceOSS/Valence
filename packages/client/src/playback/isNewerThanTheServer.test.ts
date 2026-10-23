import { describe, expect, it } from 'vitest';
import { isNewerThanTheServer } from './isNewerThanTheServer';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

const NOTED: WatchProgress = {
  mediaId: '00000000-0000-4000-8000-000000000001',
  positionSeconds: 600,
  durationSeconds: 7200,
  isFinished: false,
  updatedAt: '2026-10-22T20:00:00.000Z',
};

describe('isNewerThanTheServer', () => {
  it('lets a note stand that was made after the server was last read', () => {
    expect(isNewerThanTheServer(NOTED, Date.parse('2026-10-22T19:59:00.000Z'))).toBe(true);
  });

  it('gives way to the server once it has been read again since', () => {
    expect(isNewerThanTheServer(NOTED, Date.parse('2026-10-22T20:00:01.000Z'))).toBe(false);
  });

  it('lets a note stand where the server has never been read', () => {
    expect(isNewerThanTheServer(NOTED, 0)).toBe(true);
  });
});
