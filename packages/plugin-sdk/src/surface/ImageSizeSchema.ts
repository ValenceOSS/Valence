import { z } from 'zod';

const ImageSizeSchema = z.enum(['small', 'medium']);

type ImageSize = z.infer<typeof ImageSizeSchema>;

export type { ImageSize };

export { ImageSizeSchema };
