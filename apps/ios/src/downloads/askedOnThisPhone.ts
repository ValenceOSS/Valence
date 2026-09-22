import { z } from 'zod';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { ASKED_ON_THIS_PHONE } from '@ValencePhone/downloads/ASKED_ON_THIS_PHONE';

const IdsSchema = z.array(z.string()).catch([]);

/**
 * The downloads asked for from this phone and not yet fetched to it.
 *
 * @returns Their ids.
 */
const askedOnThisPhone = (): string[] =>
  IdsSchema.parse(JSON.parse(platformInUse().store.read(ASKED_ON_THIS_PHONE) ?? '[]'));

export { askedOnThisPhone };
