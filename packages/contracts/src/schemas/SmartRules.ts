import { z } from 'zod';

const MOST_SMART_ENTRIES = 1000;

const MOST_SMART_RULES = 20;

const SONG_ORDERS = ['random', 'mostPlayed', 'lastPlayed', 'added', 'released', 'title'] as const;

const TITLE_ORDERS = ['added', 'released', 'title', 'rating', 'yourStars', 'random'] as const;

const TITLE_HOLDS = ['films', 'series'] as const;

const WATCHED_STATES = ['unwatched', 'inProgress', 'finished', 'notFinished'] as const;

const YearSchema = z.number().int().min(1800).max(2200);

const DaysSchema = z.number().int().min(1).max(3650);

const CountSchema = z.number().int().min(0).max(100_000);

const MinutesSchema = z.number().int().min(1).max(1440);

const GenreRuleSchema = z.strictObject({
  kind: z.literal('genre'),
  anyOf: z.array(z.string().trim().min(1).max(100)).min(1).max(50),
  isNegated: z.boolean(),
});

const ReleasedRuleSchema = z
  .strictObject({
    kind: z.literal('released'),
    from: YearSchema.nullable(),
    to: YearSchema.nullable(),
  })
  .refine(({ from, to }) => from !== null || to !== null, { path: ['from'] })
  .refine(({ from, to }) => from === null || to === null || from <= to, { path: ['to'] });

const AddedRuleSchema = z.strictObject({
  kind: z.literal('added'),
  withinDays: DaysSchema,
});

const LikedRuleSchema = z.strictObject({
  kind: z.literal('liked'),
  is: z.boolean(),
});

const FollowedArtistRuleSchema = z.strictObject({
  kind: z.literal('followedArtist'),
  is: z.boolean(),
});

const PlaysRuleSchema = z
  .strictObject({
    kind: z.literal('plays'),
    atLeast: CountSchema.nullable(),
    atMost: CountSchema.nullable(),
  })
  .refine(({ atLeast, atMost }) => atLeast !== null || atMost !== null, { path: ['atLeast'] })
  .refine(({ atLeast, atMost }) => atLeast === null || atMost === null || atLeast <= atMost, {
    path: ['atMost'],
  });

const LastPlayedRuleSchema = z.strictObject({
  kind: z.literal('lastPlayed'),
  withinDays: DaysSchema,
  isNegated: z.boolean(),
});

const RuntimeRuleSchema = z
  .strictObject({
    kind: z.literal('runtime'),
    atLeastMinutes: MinutesSchema.nullable(),
    atMostMinutes: MinutesSchema.nullable(),
  })
  .refine(
    ({ atLeastMinutes, atMostMinutes }) => atLeastMinutes !== null || atMostMinutes !== null,
    {
      path: ['atLeastMinutes'],
    },
  )
  .refine(
    ({ atLeastMinutes, atMostMinutes }) =>
      atLeastMinutes === null || atMostMinutes === null || atLeastMinutes <= atMostMinutes,
    { path: ['atMostMinutes'] },
  );

const WatchedRuleSchema = z.strictObject({
  kind: z.literal('watched'),
  state: z.enum(WATCHED_STATES),
});

const RatingRuleSchema = z.strictObject({
  kind: z.literal('rating'),
  atLeast: z.number().min(0).max(10),
});

const YourStarsRuleSchema = z.strictObject({
  kind: z.literal('yourStars'),
  atLeast: z.number().int().min(1).max(5),
});

const LibraryRuleSchema = z.strictObject({
  kind: z.literal('library'),
  anyOf: z.array(z.string().min(1).max(100)).min(1).max(50),
});

const AgeRatingRuleSchema = z.strictObject({
  kind: z.literal('ageRating'),
  atMost: z.number().int().min(0).max(21),
});

const SongRuleSchema = z.discriminatedUnion('kind', [
  LikedRuleSchema,
  FollowedArtistRuleSchema,
  GenreRuleSchema,
  ReleasedRuleSchema,
  PlaysRuleSchema,
  LastPlayedRuleSchema,
  AddedRuleSchema,
]);

const TitleRuleSchema = z.discriminatedUnion('kind', [
  GenreRuleSchema,
  ReleasedRuleSchema,
  RuntimeRuleSchema,
  WatchedRuleSchema,
  RatingRuleSchema,
  YourStarsRuleSchema,
  AddedRuleSchema,
  LibraryRuleSchema,
  AgeRatingRuleSchema,
]);

const SmartLimitSchema = z.number().int().min(1).max(MOST_SMART_ENTRIES).nullable();

const SongOrderSchema = z.enum(SONG_ORDERS);

const TitleOrderSchema = z.enum(TITLE_ORDERS);

const TitleHoldsSchema = z.enum(TITLE_HOLDS);

const SongRulesSchema = z.strictObject({
  rules: z.array(SongRuleSchema).max(MOST_SMART_RULES),
  order: SongOrderSchema,
  limit: SmartLimitSchema,
});

const TitleRulesSchema = z.strictObject({
  holds: TitleHoldsSchema,
  rules: z.array(TitleRuleSchema).max(MOST_SMART_RULES),
  order: TitleOrderSchema,
  limit: SmartLimitSchema,
});

type SongRule = z.infer<typeof SongRuleSchema>;
type TitleRule = z.infer<typeof TitleRuleSchema>;
type SongRules = z.infer<typeof SongRulesSchema>;
type TitleRules = z.infer<typeof TitleRulesSchema>;
type SongOrder = z.infer<typeof SongOrderSchema>;
type TitleOrder = z.infer<typeof TitleOrderSchema>;
type TitleHolds = z.infer<typeof TitleHoldsSchema>;
type WatchedState = (typeof WATCHED_STATES)[number];

export type {
  SongOrder,
  SongRule,
  SongRules,
  TitleHolds,
  TitleOrder,
  TitleRule,
  TitleRules,
  WatchedState,
};

export {
  MOST_SMART_ENTRIES,
  MOST_SMART_RULES,
  SONG_ORDERS,
  SongOrderSchema,
  SongRuleSchema,
  SongRulesSchema,
  TITLE_HOLDS,
  TITLE_ORDERS,
  TitleHoldsSchema,
  TitleOrderSchema,
  TitleRuleSchema,
  TitleRulesSchema,
  WATCHED_STATES,
};
