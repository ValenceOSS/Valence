import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';
import { say } from '@ValenceI18n/say';

const PIXEL: OrbVariant = {
  key: 'pixel',
  label: say('common.pixel'),
  shader: say('ui.variants.pixel.floatBayer2Vec2AAFloor'),
  params: [
    {
      key: 'speed',
      label: say('ui.variants.pixel.waveSpeed'),
      min: 0.015,
      max: 10,
      step: 0.05,
      standard: 0.5,
      isRate: true,
    },
    {
      key: 'spin',
      label: say('common.roll'),
      min: 0,
      max: 5,
      step: 0.03,
      standard: 0.15,
      isRate: true,
    },
    { key: 'radius', label: say('common.radius'), min: 0.15, max: 3, step: 0.015, standard: 0.9 },
    {
      key: 'cells',
      label: say('ui.variants.pixel.gridCells'),
      min: 32,
      max: 320,
      step: 2,
      standard: 140,
    },
    {
      key: 'levels',
      label: say('ui.variants.pixel.toneSteps'),
      min: 2,
      max: 8,
      step: 1,
      standard: 3,
    },
    {
      key: 'scale',
      label: say('ui.variants.pixel.waveScale'),
      min: 0.3,
      max: 12,
      step: 0.1,
      standard: 1.5,
    },
    {
      key: 'plasma',
      label: say('ui.variants.pixel.waveAmount'),
      min: 0,
      max: 3,
      step: 0.015,
      standard: 0.9,
    },
    { key: 'light', label: say('common.keyLight'), min: 0, max: 3, step: 0.015, standard: 0.9 },
    { key: 'rim', label: say('common.rimLight'), min: 0, max: 3, step: 0.015, standard: 0.35 },
    { key: 'gain', label: say('common.brightness'), min: 0.05, max: 5, step: 0.05, standard: 1 },
    {
      key: 'contrast',
      label: say('common.contrast'),
      min: 0.15,
      max: 10,
      step: 0.05,
      standard: 1.1,
    },
  ],
  colours: [
    { key: 'ink', label: say('common.ink'), standard: '#101426' },
    { key: 'paper', label: say('common.paper'), standard: '#cfe6ff' },
  ],
};

export { PIXEL };
