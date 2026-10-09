import type { IconGlyph } from '@ValenceUI/Icon.types';

type MachineSupport = 'image' | 'native' | 'setup' | 'software' | 'notYet';

type Machine = {
  id: string;
  name: string;
  examples: string;
  acceleration: string;
  support: MachineSupport;
  body: string;
  guide: string | null;
  icon: IconGlyph;
};

export type { Machine, MachineSupport };
