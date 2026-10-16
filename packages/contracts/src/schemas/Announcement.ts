import { z } from 'zod';

const ANNOUNCEMENT_LIMIT = 500;

const ANNOUNCEMENT_SEVERITIES = ['info', 'warning', 'critical'] as const;

const AnnouncementDraftSchema = z.object({
  text: z.string().trim().min(1).max(ANNOUNCEMENT_LIMIT),
  severity: z.enum(ANNOUNCEMENT_SEVERITIES).default('info'),
  endsAt: z.string().datetime().nullable().default(null),
});

const AnnouncementSchema = AnnouncementDraftSchema.extend({
  id: z.string().min(1),
  postedAt: z.string().datetime(),
});

const AnnouncementAnswerSchema = z.object({ announcement: AnnouncementSchema.nullable() });

type AnnouncementDraft = z.infer<typeof AnnouncementDraftSchema>;

type Announcement = z.infer<typeof AnnouncementSchema>;

type AnnouncementSeverity = (typeof ANNOUNCEMENT_SEVERITIES)[number];

export type { Announcement, AnnouncementDraft, AnnouncementSeverity };

export {
  ANNOUNCEMENT_LIMIT,
  ANNOUNCEMENT_SEVERITIES,
  AnnouncementAnswerSchema,
  AnnouncementDraftSchema,
  AnnouncementSchema,
};
