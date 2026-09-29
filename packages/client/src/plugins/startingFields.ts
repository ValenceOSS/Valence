import type { SurfaceBlock } from '@ValenceSDK/surface/SurfaceBlockSchema';

/**
 * The values a surface's fields start with, gathered from every section, so what is sent back with
 * an action is every field the page holds and not only the ones somebody touched.
 *
 * @param blocks - The blocks of the surface.
 * @returns Each field's starting value, by its name.
 */
const startingFields = (blocks: readonly SurfaceBlock[]): Record<string, string | boolean> =>
  blocks.reduce<Record<string, string | boolean>>((fields, block) => {
    if (block.type === 'section') {
      return { ...fields, ...startingFields(block.children) };
    }

    if (block.type === 'toggle') {
      return { ...fields, [block.field]: block.value };
    }

    if (block.type === 'textField' || block.type === 'select') {
      return { ...fields, [block.field]: block.value ?? '' };
    }

    return fields;
  }, {});

export { startingFields };
