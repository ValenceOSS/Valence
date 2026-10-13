import { z } from 'zod';

const STORAGE_KEY = 'valence.playback';

const SUBTITLES_OFF = 'off';

const PreferencesSchema = z.object({
  volume: z.number().min(0).max(1).default(1),
  boost: z.number().min(1).max(3).default(1),
  isMuted: z.boolean().default(false),
  subtitleLanguage: z.string().nullable().default(null),
  audioLanguage: z.string().nullable().default(null),
  showsRemaining: z.boolean().default(false),
  playsInTheBrowser: z.boolean().default(false),
  hdrBrightness: z.number().min(0.5).max(3).default(1),
});

type PlaybackPreferences = z.infer<typeof PreferencesSchema>;

const DEFAULTS: PlaybackPreferences = {
  volume: 1,
  boost: 1,
  isMuted: false,
  subtitleLanguage: null,
  audioLanguage: null,
  showsRemaining: false,
  playsInTheBrowser: false,
  hdrBrightness: 1,
};

/**
 * How this device likes to watch: the volume, the language it last chose to hear, whether the clock counts down, whether files the
 * browser cannot play by itself are played through its own player rather than converted, how
 * bright HDR is drawn on a screen that is not HDR, and the rest of what survives between sessions. Held on the device rather than on the profile, since these follow the
 * screen and the speakers rather than the person.
 */
const readPlaybackPreferences = (): PlaybackPreferences => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === null) {
      return DEFAULTS;
    }

    const parsed = PreferencesSchema.safeParse(JSON.parse(stored));

    return parsed.success ? parsed.data : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
};

/**
 * Remembers a change to how this device likes to watch — volume, mute, subtitle language. Kept on
 * the device rather than the account, since the right volume is a property of the room.
 *
 * @param change - What changed.
 */
const writePlaybackPreferences = (change: Partial<PlaybackPreferences>): void => {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...readPlaybackPreferences(), ...change }),
    );
  } catch {}
};

export { readPlaybackPreferences, writePlaybackPreferences, STORAGE_KEY, SUBTITLES_OFF, DEFAULTS };
