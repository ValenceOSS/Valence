import { describe, expect, it } from 'vitest';
import { SurfaceActRequestSchema } from './SurfaceActRequestSchema';

describe('SurfaceActRequestSchema', () => {
  it('carries the action and the fields a surface holds', () => {
    const request = SurfaceActRequestSchema.parse({
      action: { id: 'save' },
      fields: { username: 'marques', twoWay: true },
    });

    expect(request.fields).toEqual({ username: 'marques', twoWay: true });
  });

  it('refuses more than sixty fields, and a field name that is not a simple name', () => {
    const many = Object.fromEntries(Array.from({ length: 61 }, (_, at) => [`field${at.toString()}`, 'x']));

    expect(SurfaceActRequestSchema.safeParse({ action: { id: 'save' }, fields: many }).success).toBe(false);
    expect(SurfaceActRequestSchema.safeParse({ action: { id: 'save' }, fields: { 'no-dashes': 'x' } }).success).toBe(false);
  });
});
