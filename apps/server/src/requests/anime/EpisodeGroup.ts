type EpisodeGroup = {
  id: string;
  name: string;
  type: number;
  groups: { name: string; episodes: { season: number; episode: number }[] }[];
};

export type { EpisodeGroup };
