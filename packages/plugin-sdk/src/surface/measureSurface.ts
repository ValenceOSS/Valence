import type { SurfaceBlock } from './SurfaceBlockSchema';

/**
 * How many blocks a surface holds and how deeply its sections nest, which is what keeps a plugin
 * from sending a page too big or too deep for a phone to draw.
 *
 * @param blocks - The blocks at the top of the surface.
 * @returns The count of every block, rows included, and the deepest nesting.
 */
const measureSurface = (blocks: readonly SurfaceBlock[]): { blocks: number; depth: number } =>
  blocks.reduce(
    (sum, block) => {
      if (block.type === 'section') {
        const inner = measureSurface(block.children);

        return {
          blocks: sum.blocks + 1 + inner.blocks,
          depth: Math.max(sum.depth, inner.depth + 1),
        };
      }

      return {
        blocks: sum.blocks + 1 + (block.type === 'list' ? block.rows.length : 0),
        depth: Math.max(sum.depth, 1),
      };
    },
    { blocks: 0, depth: 0 },
  );

export { measureSurface };
