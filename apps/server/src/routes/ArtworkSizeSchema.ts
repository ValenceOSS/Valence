import { z } from '@hono/zod-openapi';

const ArtworkSizeSchema = z.enum(['small', 'medium', 'large']);

export { ArtworkSizeSchema };
