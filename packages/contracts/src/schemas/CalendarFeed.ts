import { z } from 'zod';

const CalendarFeedSchema = z.object({
  token: z.string().min(1).nullable(),
  createdAt: z.string().datetime(),
  lastReadAt: z.string().datetime().nullable(),
});

const CalendarFeedStatusSchema = z.object({ feed: CalendarFeedSchema.nullable() });

type CalendarFeed = z.infer<typeof CalendarFeedSchema>;
type CalendarFeedStatus = z.infer<typeof CalendarFeedStatusSchema>;

export type { CalendarFeed, CalendarFeedStatus };

export { CalendarFeedSchema, CalendarFeedStatusSchema };
