import { z } from 'zod';
import { isWebAddress } from '@ValenceCore/functions/isWebAddress';
import {
  WebhookFiltersSchema,
  WebhookPresetSchema,
  WebhookSubscribableEventSchema,
} from '@ValenceContracts/schemas/Webhook';
import type { WebhookFilters } from '@ValenceContracts/schemas/Webhook';
import { say } from '@ValenceI18n/say';

const webhookFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: say('common.enterAName') }),
  url: z
    .string()
    .trim()
    .refine(isWebAddress, { error: say('common.theAddressNeedsToBeA') }),
  preset: WebhookPresetSchema,
  events: z
    .array(WebhookSubscribableEventSchema)
    .min(1, { error: say('screens.adminArea.webhookFields.pickAtLeastOneEvent') }),
  filters: z.custom<WebhookFilters>((filters) => WebhookFiltersSchema.safeParse(filters).success),
});

export { webhookFormSchema };
