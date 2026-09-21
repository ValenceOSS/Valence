import { createAmbience } from './createAmbience';
import { createBarsAndWaves } from './createBarsAndWaves';
import { createRadial } from './createRadial';
import { createWarp } from './createWarp';
import { createWaves } from './createWaves';
import type { Visualiser } from './Visualiser';

const VISUALISERS: readonly Visualiser[] = [
  { id: 'bars', name: 'Bars and waves', create: createBarsAndWaves },
  { id: 'waves', name: 'Waves', create: createWaves },
  { id: 'ambience', name: 'Ambience', create: createAmbience },
  { id: 'halo', name: 'Halo', create: createRadial },
  { id: 'warp', name: 'Warp', create: createWarp },
];

export { VISUALISERS };
