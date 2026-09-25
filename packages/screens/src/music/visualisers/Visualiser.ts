import type { AudioFrame } from './AudioFrame';
import type { Painter } from './Painter';
import type { StringKey } from '@ValenceI18n/StringKey';

type Draw = (painter: Painter, frame: AudioFrame) => void;

type Visualiser = {
  id: string;
  name: StringKey;
  create: () => Draw;
};

export type { Draw, Visualiser };
