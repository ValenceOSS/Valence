import { describe, expect, it } from 'vitest';
import { SurfaceActionSchema } from './SurfaceActionSchema';

describe('SurfaceActionSchema', () => {
  it('accepts an action with a small payload and a confirmation', () => {
    expect(
      SurfaceActionSchema.parse({
        id: 'import.list',
        payload: { list: 'watching', page: 2 },
        confirm: 'Import?',
      }).id,
    ).toBe('import.list');
  });

  it('refuses a payload over 4 KB and nested payload values', () => {
    expect(
      SurfaceActionSchema.safeParse({
        id: 'big',
        payload: {
          text: 'x'.repeat(1000),
          more: 'y'.repeat(1000),
          again: 'z'.repeat(1000),
          last: 'w'.repeat(1000),
          over: 'v'.repeat(200),
        },
      }).success,
    ).toBe(false);
    expect(
      SurfaceActionSchema.safeParse({ id: 'nested', payload: { inner: { a: 1 } } }).success,
    ).toBe(false);
  });

  it('refuses an id that is not a simple name', () => {
    expect(SurfaceActionSchema.safeParse({ id: 'Do It' }).success).toBe(false);
  });
});
