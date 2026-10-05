import { z } from 'zod';

const WindowFrameSchema = z.object({
  isMaximised: z.boolean(),
  isFullScreen: z.boolean(),
});

export type WindowFrame = z.infer<typeof WindowFrameSchema>;
export { WindowFrameSchema };
