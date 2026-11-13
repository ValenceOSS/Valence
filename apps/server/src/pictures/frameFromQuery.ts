import { FrameQuerySchema } from '@ValenceContracts/schemas/FrameQuery';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * Where an uploaded picture sits in its shape, read from the address it was sent to. An upload that
 * says nothing of it, or says something out of bounds, is left in its middle.
 *
 * @param query - What the upload's address carried.
 * @returns Where it sits, or nothing for its middle.
 */
const frameFromQuery = (query: Record<string, string>): PhotoFrame | null => {
  const read = FrameQuerySchema.safeParse(query);

  if (!read.success || (read.data.zoom ?? read.data.x ?? read.data.y) === undefined) {
    return null;
  }

  return { zoom: read.data.zoom ?? 1, x: read.data.x ?? 0, y: read.data.y ?? 0 };
};

export { frameFromQuery };
