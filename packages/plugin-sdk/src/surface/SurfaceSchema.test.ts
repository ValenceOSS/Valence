import { describe, expect, it } from 'vitest';
import type { SurfaceBlock } from './SurfaceBlockSchema';
import { SURFACE_LIMITS } from './SURFACE_LIMITS';
import { SurfaceSchema } from './SurfaceSchema';

const nested = (depth: number): SurfaceBlock =>
  depth === 0 ? { type: 'divider' } : { type: 'section', children: [nested(depth - 1)] };

describe('SurfaceSchema', () => {
  it('accepts a small surface', () => {
    expect(
      SurfaceSchema.parse({ title: 'Tracking', blocks: [{ type: 'divider' }] }).blocks,
    ).toHaveLength(1);
  });

  it('refuses sections nested deeper than a phone can draw', () => {
    const read = SurfaceSchema.safeParse({ blocks: [nested(SURFACE_LIMITS.depth + 1)] });

    expect(read.success ? [] : read.error.issues.map((issue) => issue.message)).toContain(
      `Sections nest at most ${SURFACE_LIMITS.depth.toString()} deep`,
    );
  });

  it('refuses more blocks than a surface may hold, counting rows', () => {
    const rows = Array.from({ length: 200 }, (_, at) => ({
      type: 'row' as const,
      label: at.toString(),
    }));
    const read = SurfaceSchema.safeParse({
      blocks: [
        { type: 'list', rows },
        { type: 'list', rows },
      ],
    });

    expect(read.success ? [] : read.error.issues.map((issue) => issue.message)).toContain(
      `A surface holds at most ${SURFACE_LIMITS.blocks.toString()} blocks`,
    );
  });
});
