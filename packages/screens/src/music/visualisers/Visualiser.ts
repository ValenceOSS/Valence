import type { AudioFrame } from './AudioFrame';
import type { Painter } from './Painter';

type Draw = (painter: Painter, frame: AudioFrame) => void;

type Visualiser = {
  id: string;
  name: string;
  create: () => Draw;
};

export type { Draw, Visualiser };
