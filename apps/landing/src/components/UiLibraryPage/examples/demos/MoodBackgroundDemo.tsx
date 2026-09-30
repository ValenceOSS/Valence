import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { MoodBackground } from '@ValenceUI/MoodBackground';
import { HOUSE_LIGHTS } from '@ValenceCore/tokens/houseLights';

const PRESETS = [
  { name: 'House', lights: HOUSE_LIGHTS },
  { name: 'Warm', lights: ['var(--color-busy)', 'var(--color-danger)', 'var(--color-highlight)'] },
  { name: 'Cool', lights: ['var(--color-accent)', 'var(--color-success)', 'var(--color-accent)'] },
] as const;

/**
 * The glow a page is lit by, held in a frame of its own, with a few sets of colours to move it
 * between: changing them warms the frame from one to the next rather than switching.
 */
const MoodBackgroundDemo = () => {
  const [preset, setPreset] = useState<string>('House');
  const lights = PRESETS.find((one) => one.name === preset)?.lights ?? PRESETS[0].lights;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="relative isolate h-56 w-full overflow-hidden rounded-2xl border border-[var(--surface-line)] bg-surface">
        <MoodBackground lights={lights.map((color) => ({ color }))} isDrifting />
      </div>

      <div className="flex gap-2">
        {PRESETS.map((one) => (
          <Button
            key={one.name}
            variant="secondary"
            size="sm"
            isActive={one.name === preset}
            onClick={() => {
              setPreset(one.name);
            }}
          >
            {one.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

MoodBackgroundDemo.displayName = 'MoodBackgroundDemo';

export { MoodBackgroundDemo };
