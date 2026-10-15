import type { AnimeAudioPolicy } from '@ValenceContracts/schemas/AnimeAudioPolicy';
import type { AnimeFacts, CourOrder } from '@ValenceContracts/schemas/Anime';

type AnimeFilmLink = { title: string; year: number | null; titleKey: string | null };

type AnimeSettingsCardProps = {
  anime: AnimeFacts;
  animeAudio: AnimeAudioPolicy | null;
  profileAudio: AnimeAudioPolicy;
  preferredGroup: string | null;
  courOrder: CourOrder;
  films: readonly AnimeFilmLink[];
  isBusy: boolean;
  onChangeAudio: (policy: AnimeAudioPolicy | null) => void;
  onChangeGroup: (group: string | null) => void;
  onChangeCourOrder: (order: CourOrder) => void;
  onOpenTitle?: (titleKey: string) => void;
};

export type { AnimeFilmLink, AnimeSettingsCardProps };
