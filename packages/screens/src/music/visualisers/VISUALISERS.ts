import { createAmbience } from './createAmbience';
import { createBarsAndWaves } from './createBarsAndWaves';
import { createRadial } from './createRadial';
import { createWarp } from './createWarp';
import { createWaves } from './createWaves';
import type { Visualiser } from './Visualiser';

const VISUALISERS: readonly Visualiser[] = [
  { id: 'bars', name: 'screens.visualisers.barsAndWaves', create: createBarsAndWaves },
  { id: 'waves', name: 'screens.visualisers.waves', create: createWaves },
  { id: 'ambience', name: 'screens.visualisers.ambience', create: createAmbience },
  { id: 'halo', name: 'screens.visualisers.halo', create: createRadial },
  { id: 'warp', name: 'screens.visualisers.warp', create: createWarp },
];

export { VISUALISERS };
