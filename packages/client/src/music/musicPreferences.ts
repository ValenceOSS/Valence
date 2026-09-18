import { z } from 'zod';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { AudioQualitySchema } from '@ValenceContracts/schemas/Music';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';

const STORAGE_KEY = 'valence.music';

const MusicPreferencesSchema = z.object({
  quality: AudioQualitySchema.default('lossless'),
  volume: z.number().min(0).max(1).default(0.8),
  isMuted: z.boolean().default(false),
});

type MusicPreferences = z.infer<typeof MusicPreferencesSchema>;

const DEFAULT_MUSIC_PREFERENCES: MusicPreferences = {
  quality: 'lossless',
  volume: 0.8,
  isMuted: false,
};

/**
 * Reads how this device last listened: the quality chosen, and how loud.
 *
 * Kept per device rather than per profile, because the right quality is a question about the
 * connection a device is on — lossless at home, data saver on a phone — rather than about a person.
 *
 * @returns The preferences, or the defaults where none were kept or what was kept will not read.
 */
const readMusicPreferences = (): MusicPreferences => {
  const stored = platformInUse().store.read(STORAGE_KEY);

  if (stored === null) {
    return DEFAULT_MUSIC_PREFERENCES;
  }

  try {
    const parsed = MusicPreferencesSchema.safeParse(JsonValueSchema.parse(JSON.parse(stored)));

    return parsed.success ? parsed.data : DEFAULT_MUSIC_PREFERENCES;
  } catch {
    return DEFAULT_MUSIC_PREFERENCES;
  }
};

/**
 * Keeps a change to how this device listens.
 *
 * @param change - What changed.
 */
const saveMusicPreferences = (change: Partial<MusicPreferences>): void => {
  platformInUse().store.write(
    STORAGE_KEY,
    JSON.stringify({ ...readMusicPreferences(), ...change }),
  );
};

export type { MusicPreferences };

export { DEFAULT_MUSIC_PREFERENCES, STORAGE_KEY, readMusicPreferences, saveMusicPreferences };
