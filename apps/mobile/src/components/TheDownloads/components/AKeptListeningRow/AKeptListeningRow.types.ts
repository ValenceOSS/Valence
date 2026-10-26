import type { KeptListening } from '@ValenceContracts/schemas/KeptListening';
import type { KeptListeningStanding } from '@ValenceClient/downloads/standingOfKeptListening';

type AKeptListeningRowProps = {
  kept: KeptListening;
  standing: KeptListeningStanding;
  onPlaying: (heard: 'music' | 'book') => void;
};

export type { AKeptListeningRowProps };
