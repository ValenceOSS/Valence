import { z } from 'zod';
import { LetterFontSchema } from './LetterFont';
import { SketchSceneSchema } from './SketchScene';
import { HowOftenToAskSchema, StillWatchingSchema } from './StillWatching';

const PROFILE_COLOURS = [
  '#e8503a',
  '#e8a33a',
  '#3ac47d',
  '#3a8ee8',
  '#8b5ce8',
  '#e83a90',
  '#f2c94c',
  '#9ccc3a',
  '#2ec4b6',
  '#3ac2e8',
  '#4a5ce8',
  '#c45ce8',
  '#ff8fa3',
  '#b5835a',
  '#8a94a6',
  '#3b4252',
  '#e6e1d8',
  '#111418',
] as const;

const ProfileColourSchema = z
  .string()
  .regex(/^#[0-9a-f]{6}$/iu)
  .transform((hex) => hex.toLowerCase());

const NAME_MAX = 24;

const AVATAR_STYLES = [
  'adventurer',
  'lorelei',
  'notionists',
  'bottts',
  'funEmoji',
  'thumbs',
] as const;

const AvatarStyleSchema = z.enum(AVATAR_STYLES);

const PhotoFrameSchema = z.object({
  zoom: z.number().min(1).max(4),
  x: z.number().min(-1).max(1),
  y: z.number().min(-1).max(1),
});

const AvatarSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('initial'), font: LetterFontSchema.default('gilroy') }),
  z.object({ kind: z.literal('drawn'), style: AvatarStyleSchema, seed: z.string().min(1).max(64) }),
  z.object({
    kind: z.literal('photo'),
    isVideo: z.boolean().default(false),
    frame: PhotoFrameSchema.nullable().default(null),
  }),
  z.object({
    kind: z.literal('orb'),
    orb: z.string().min(1).max(32),
    params: z.record(z.string().max(32), z.number().finite()),
    colours: z.record(z.string().max(32), z.string().regex(/^#[0-9a-f]{6}$/iu)),
  }),
  z.object({ kind: z.literal('sketch'), scene: SketchSceneSchema }),
]);

const ViewerProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(NAME_MAX),
  colour: ProfileColourSchema,
  avatar: AvatarSchema,
  askStillWatchingAfter: StillWatchingSchema,
  showsWhatIamWatching: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const ViewerProfileRequestSchema = z.object({
  name: z.string().trim().min(1).max(NAME_MAX),
  colour: ProfileColourSchema,
  avatar: AvatarSchema.optional(),
  askStillWatchingAfter: HowOftenToAskSchema.optional(),
  showsWhatIamWatching: z.boolean().optional(),
});

const ViewerProfileListSchema = z.object({ profiles: z.array(ViewerProfileSchema) });

const WayInSchema = ViewerProfileListSchema.extend({ splashscreen: z.string().nullish() });

/**
 * Picks the letter a profile is drawn with while it has no picture of its own — the first character
 * of the name, upper-cased. A name that is empty or only spaces falls back to a question mark
 * rather than to a blank circle nobody can aim at.
 *
 * @param name - The profile's name as somebody typed it.
 * @returns A single character to draw in the circle.
 */
const profileInitial = (name: string): string => (name.trim()[0] ?? '?').toUpperCase();

/**
 * Builds the address a profile's picture is served from, carrying the profile's own last-updated
 * time as part of the query so that changing the picture changes the address. Without that a
 * browser shows the old face until its cache expires, which is long after somebody has changed it
 * and gone looking for the new one.
 *
 * @param profile - The profile being drawn, with the time it was last changed.
 * @returns The address to load the picture from.
 */
const profileAvatarUrl = (profile: { id: string; updatedAt: string }): string =>
  `/api/profiles/${profile.id}/avatar?v=${encodeURIComponent(profile.updatedAt)}`;

type Avatar = z.infer<typeof AvatarSchema>;
type PhotoFrame = z.infer<typeof PhotoFrameSchema>;
type ViewerProfile = z.infer<typeof ViewerProfileSchema>;
type ProfileColour = z.infer<typeof ProfileColourSchema>;

export type { Avatar, PhotoFrame, ProfileColour, ViewerProfile };

export {
  ViewerProfileSchema,
  ViewerProfileRequestSchema,
  ViewerProfileListSchema,
  WayInSchema,
  ProfileColourSchema,
  PROFILE_COLOURS,
  AvatarSchema,
  AvatarStyleSchema,
  AVATAR_STYLES,
  NAME_MAX,
  profileInitial,
  profileAvatarUrl,
};
