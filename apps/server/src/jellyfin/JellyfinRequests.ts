import { z } from 'zod';

const listOf = z
  .string()
  .optional()
  .transform((joined) =>
    (joined ?? '')
      .split(/[,|]/u)
      .map((one) => one.trim())
      .filter((one) => one !== ''),
  );

const whole = z.coerce.number().int().nonnegative().optional().catch(undefined);

const yes = z
  .string()
  .optional()
  .transform((said) => (said === undefined ? undefined : said.toLowerCase() === 'true'));

const AuthenticateByNameSchema = z.object({
  username: z.string().trim().min(1).max(320),
  pw: z.string().max(1000).nullish(),
  password: z.string().max(1000).nullish(),
});

const ItemsQuerySchema = z.object({
  parentid: z.string().max(64).optional(),
  ids: listOf,
  includeitemtypes: listOf,
  excludeitemtypes: listOf,
  recursive: yes,
  sortby: listOf,
  sortorder: listOf,
  startindex: whole,
  limit: whole,
  searchterm: z.string().max(200).optional(),
  filters: listOf,
  isfavorite: yes,
  isplayed: yes,
  genres: listOf,
  years: listOf,
  personids: listOf,
  seriesid: z.string().max(64).optional(),
  seasonid: z.string().max(64).optional(),
  season: whole,
  enableuserdata: yes,
  fields: listOf,
  mediatypes: listOf,
});

const ConditionSchema = z.object({
  condition: z.string().optional(),
  property: z.string().optional(),
  value: z.string().optional(),
});

const JellyfinDeviceProfileSchema = z.object({
  maxstreamingbitrate: z.number().int().positive().nullish(),
  directplayprofiles: z
    .array(
      z.object({
        container: z.string().nullish(),
        type: z.string().nullish(),
        videocodec: z.string().nullish(),
        audiocodec: z.string().nullish(),
      }),
    )
    .nullish(),
  transcodingprofiles: z
    .array(
      z.object({
        container: z.string().nullish(),
        type: z.string().nullish(),
        videocodec: z.string().nullish(),
        audiocodec: z.string().nullish(),
        protocol: z.string().nullish(),
      }),
    )
    .nullish(),
  codecprofiles: z
    .array(
      z.object({
        type: z.string().nullish(),
        codec: z.string().nullish(),
        conditions: z.array(ConditionSchema).nullish(),
        applyconditions: z.array(ConditionSchema).nullish(),
      }),
    )
    .nullish(),
  subtitleprofiles: z
    .array(z.object({ format: z.string().nullish(), method: z.string().nullish() }))
    .nullish(),
});

const PlaybackInfoBodySchema = z
  .object({
    deviceprofile: JellyfinDeviceProfileSchema.nullish().catch(null),
    maxstreamingbitrate: z.number().int().positive().nullish().catch(null),
    starttimeticks: z.number().nonnegative().nullish().catch(null),
    audiostreamindex: z.number().int().nullish().catch(null),
    subtitlestreamindex: z.number().int().nullish().catch(null),
    mediasourceid: z.string().nullish().catch(null),
    enabledirectplay: z.boolean().nullish().catch(null),
    enabledirectstream: z.boolean().nullish().catch(null),
    enabletranscoding: z.boolean().nullish().catch(null),
  })
  .catch({
    deviceprofile: null,
    maxstreamingbitrate: null,
    starttimeticks: null,
    audiostreamindex: null,
    subtitlestreamindex: null,
    mediasourceid: null,
    enabledirectplay: null,
    enabledirectstream: null,
    enabletranscoding: null,
  });

const PlaybackInfoQuerySchema = z.object({
  maxstreamingbitrate: whole,
  starttimeticks: whole,
  audiostreamindex: whole,
  subtitlestreamindex: whole,
  mediasourceid: z.string().max(64).optional(),
});

const PlaybackReportSchema = z.object({
  itemid: z.string().max(64).nullish(),
  mediasourceid: z.string().max(64).nullish(),
  playsessionid: z.string().max(200).nullish(),
  positionticks: z.number().nonnegative().nullish(),
  ispaused: z.boolean().nullish(),
});

type JellyfinDeviceProfile = z.infer<typeof JellyfinDeviceProfileSchema>;

type ItemsQuery = z.infer<typeof ItemsQuerySchema>;

export type { ItemsQuery, JellyfinDeviceProfile };

export {
  AuthenticateByNameSchema,
  ItemsQuerySchema,
  JellyfinDeviceProfileSchema,
  PlaybackInfoBodySchema,
  PlaybackInfoQuerySchema,
  PlaybackReportSchema,
};
