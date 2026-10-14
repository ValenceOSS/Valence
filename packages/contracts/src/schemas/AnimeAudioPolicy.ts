import { z } from 'zod';

const ANIME_AUDIO_POLICIES = ['subbed', 'dubbed', 'dual', 'subbedUntilDubbed'] as const;

const AnimeAudioPolicySchema = z.enum(ANIME_AUDIO_POLICIES);

type AnimeAudioPolicy = (typeof ANIME_AUDIO_POLICIES)[number];

export type { AnimeAudioPolicy };

export { ANIME_AUDIO_POLICIES, AnimeAudioPolicySchema };
