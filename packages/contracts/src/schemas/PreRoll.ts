import { z } from 'zod';
import { PreRollPlaysBeforeSchema } from './PreRollSettings';

const PreRollChangeSchema = z.object({
  isOn: z.boolean(),
  folder: z.string(),
  playsBefore: PreRollPlaysBeforeSchema,
});

const PreRollClipSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{16}$/u),
  name: z.string().min(1),
});

const PreRollSetupSchema = z.object({
  isOn: z.boolean(),
  folder: z.string(),
  playsBefore: PreRollPlaysBeforeSchema,
  clips: z
    .array(PreRollClipSchema)
    .describe('The clips found in the folder, which one is chosen from at random each time.'),
  isFolderReadable: z
    .boolean()
    .describe('Whether the server could read the folder at all, where one is named.'),
});

const PreRollChoiceSchema = z.object({
  clip: z
    .object({
      id: z.string().regex(/^[0-9a-f]{16}$/u),
      address: z.string().min(1),
    })
    .nullable()
    .describe('The clip to play before this title, or nothing where none should play.'),
});

type PreRollChange = z.infer<typeof PreRollChangeSchema>;

type PreRollClip = z.infer<typeof PreRollClipSchema>;

type PreRollSetup = z.infer<typeof PreRollSetupSchema>;

type PreRollChoice = z.infer<typeof PreRollChoiceSchema>;

export type { PreRollChange, PreRollChoice, PreRollClip, PreRollSetup };

export { PreRollChangeSchema, PreRollChoiceSchema, PreRollClipSchema, PreRollSetupSchema };
