import type { Surface } from '@ValenceSDK/surface/SurfaceSchema';
import type { SurfaceBlock } from '@ValenceSDK/surface/SurfaceBlockSchema';
import type { ImageRef } from '@ValenceSDK/surface/ImageRefSchema';

/**
 * The address of a picture fetched from elsewhere, or nothing for one packed or from the library.
 *
 * @param image - The picture, where there is one.
 * @returns Its address, in a list of none or one.
 */
const remoteOf = (image: ImageRef | undefined): string[] =>
  image?.kind === 'remote' ? [image.url] : [];

/**
 * Every picture a surface fetches from elsewhere, in its blocks and the rows and sections inside
 * them, so the server knows which pictures it has drawn for whom.
 *
 * @param surface - What a plugin drew.
 * @returns The addresses, each once.
 */
const remoteImagesOf = (surface: Surface): string[] => {
  const walk = (blocks: readonly SurfaceBlock[]): string[] =>
    blocks.flatMap((block) =>
      block.type === 'image' || block.type === 'row'
        ? remoteOf(block.image)
        : block.type === 'section'
          ? walk(block.children)
          : block.type === 'list'
            ? block.rows.flatMap((row) => remoteOf(row.image))
            : [],
    );

  return [...new Set(walk(surface.blocks))];
};

export { remoteImagesOf };
