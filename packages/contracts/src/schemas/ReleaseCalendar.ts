import { z } from 'zod';
import { CalendarDateSchema, MediaRequestKindSchema } from './MediaRequest';

const CALENDAR_RELEASES = ['airs', 'cinema', 'digital', 'physical'] as const;

const CALENDAR_STATES = ['available', 'downloading', 'wanted', 'notOutYet', 'notHeld'] as const;

const CALENDAR_SOURCES = ['library', 'request'] as const;

const CALENDAR_AUDIENCES = ['mine', 'everyone'] as const;

const LONGEST_CALENDAR_DAYS = 120;

const CalendarOpensSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('show'), showId: z.string().min(1) }),
  z.object({ kind: z.literal('item'), mediaId: z.string().min(1) }),
  z.object({
    kind: z.literal('asking'),
    requestKind: MediaRequestKindSchema,
    catalogueId: z.string().min(1),
  }),
]);

const CalendarEntrySchema = z.object({
  id: z.string().min(1),
  date: CalendarDateSchema,
  release: z.enum(CALENDAR_RELEASES),
  title: z.string(),
  episode: z
    .object({
      seasonNumber: z.number().int().nonnegative(),
      episodeNumber: z.number().int().positive(),
      title: z.string(),
      stillUrl: z.string().nullable(),
    })
    .nullable(),
  artworkMediaId: z.string().nullable(),
  posterUrl: z.string().nullable(),
  backdropUrl: z.string().nullable(),
  logoUrl: z.string().nullable(),
  state: z.enum(CALENDAR_STATES),
  source: z.enum(CALENDAR_SOURCES),
  requestedBy: z.object({ id: z.string().min(1), name: z.string() }).nullable(),
  opens: CalendarOpensSchema,
});

const ReleaseCalendarSchema = z.object({ entries: z.array(CalendarEntrySchema) });

const ReleaseCalendarQuerySchema = z
  .object({
    from: CalendarDateSchema,
    to: CalendarDateSchema,
    who: z.enum(CALENDAR_AUDIENCES).default('mine'),
  })
  .refine(({ from, to }) => from <= to, { path: ['to'] })
  .refine(
    ({ from, to }) =>
      (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000 <=
      LONGEST_CALENDAR_DAYS,
    { path: ['to'] },
  );

type CalendarEntry = z.infer<typeof CalendarEntrySchema>;
type CalendarState = (typeof CALENDAR_STATES)[number];
type CalendarRelease = (typeof CALENDAR_RELEASES)[number];
type CalendarAudience = (typeof CALENDAR_AUDIENCES)[number];
type ReleaseCalendar = z.infer<typeof ReleaseCalendarSchema>;

export type { CalendarAudience, CalendarEntry, CalendarRelease, CalendarState, ReleaseCalendar };

export {
  CALENDAR_AUDIENCES,
  CALENDAR_RELEASES,
  CALENDAR_STATES,
  CalendarEntrySchema,
  LONGEST_CALENDAR_DAYS,
  ReleaseCalendarQuerySchema,
  ReleaseCalendarSchema,
};
