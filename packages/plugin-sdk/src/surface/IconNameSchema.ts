import { z } from 'zod';
import { ICON_NAMES } from './ICON_NAMES';

const IconNameSchema = z.enum(ICON_NAMES);

type IconName = z.infer<typeof IconNameSchema>;

export type { IconName };

export { IconNameSchema };
