import { Slider } from '@ValenceUI/Slider';
import type { OrbSettingProps } from './OrbSetting.types';

/**
 * One of an orb's own settings as a slider, counted in its own steps from its own least value,
 * since the slider underneath always starts at nothing.
 *
 * @param param - The setting, with its range and step.
 * @param value - Where it stands now.
 * @param onChange - Told where it was moved to.
 */
const OrbSetting = ({ param, value, onChange }: OrbSettingProps) => {
  const steps = Math.round((param.max - param.min) / param.step);
  const decimals = Math.max(0, -Math.floor(Math.log10(param.step)));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-text">{param.label}</span>
        <span className="font-mono text-[0.7rem] tabular-nums text-text-muted">
          {value.toFixed(decimals)}
        </span>
      </div>
      <Slider
        label={param.label}
        value={Math.round((value - param.min) / param.step)}
        max={steps}
        step={1}
        valueLabel={(at) => (param.min + at * param.step).toFixed(decimals)}
        onValueChange={(at) => {
          onChange(Number((param.min + at * param.step).toFixed(decimals)));
        }}
      />
    </div>
  );
};

OrbSetting.displayName = 'OrbSetting';

export { OrbSetting };
