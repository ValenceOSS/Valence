import { say } from '@ValenceI18n/say';
import type { AnimeAudioPolicy } from '@ValenceContracts/schemas/AnimeAudioPolicy';

const ANIME_AUDIO_NAMES: Readonly<Record<AnimeAudioPolicy, string>> = {
  subbed: say('common.subtitles'),
  dubbed: say('client.requests.animeAudio.dubbed'),
  dual: say('client.requests.animeAudio.dual'),
  subbedUntilDubbed: say('client.requests.animeAudio.subbedUntilDubbed'),
};

export { ANIME_AUDIO_NAMES };
