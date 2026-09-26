import { Shuffle as ShuffleIcon, RotateCcw as ResetIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Orb } from '@ValenceUI/Orb';
import { cn } from '@ValenceUI/cn';
import { ORB_VARIANTS } from '@ValenceUI/orbs/ORB_VARIANTS';
import { shuffledOrbLook } from '@ValenceScreens/library/shuffledOrbLook';
import { ColourChoice } from '@ValenceScreens/components/ColourChoice/ColourChoice';
import { OrbSetting } from '@ValenceScreens/components/FaceEditor/components/OrbSetting/OrbSetting';
import type { OrbStudioProps } from './OrbStudio.types';

/**
 * Choosing an orb and making it one's own: every orb moving in a gallery, then the chosen one's
 * colours and every one of its settings, with a shuffle for somebody who would rather be surprised
 * and a way back to how the orb comes.
 *
 * @param value - The orb and its look as they stand.
 * @param onChange - Told the orb or its look changed.
 */
const OrbStudio = ({ value, onChange }: OrbStudioProps) => {
  const variant = ORB_VARIANTS.find((one) => one.key === value.orb) ?? ORB_VARIANTS[0];

  if (variant === undefined) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h3 className="text-[0.65rem] uppercase tracking-[0.18em] text-text-muted">Orb</h3>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {ORB_VARIANTS.map((one) => (
            <Button
              key={one.key}
              variant="bare"
              size="none"
              label={`Use the ${one.label} orb`}
              hasTooltip={false}
              isActive={one.key === variant.key}
              onClick={() => {
                onChange({ orb: one.key, params: {}, colours: {} });
              }}
              className="group flex flex-col items-center gap-1.5"
            >
              <Orb
                variant={one}
                className={cn(
                  'size-14 transition-transform duration-[var(--duration-fast)] group-hover:scale-105',
                  one.key === variant.key &&
                    'ring-2 ring-accent ring-offset-2 ring-offset-[var(--color-surface-raised)]',
                )}
              />
              <span
                className={cn(
                  'text-[0.7rem]',
                  one.key === variant.key ? 'text-text' : 'text-text-muted',
                )}
              >
                {one.label}
              </span>
            </Button>
          ))}
        </div>
      </section>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            onChange({ orb: variant.key, ...shuffledOrbLook(variant) });
          }}
        >
          <Icon of={ShuffleIcon} size={15} />
          Shuffle
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange({ orb: variant.key, params: {}, colours: {} });
          }}
        >
          <Icon of={ResetIcon} size={15} />
          As it comes
        </Button>
      </div>

      {variant.colours.length === 0 ? null : (
        <section className="flex flex-col gap-3">
          <h3 className="text-[0.65rem] uppercase tracking-[0.18em] text-text-muted">Colours</h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {variant.colours.map((colour) => (
              <div key={colour.key} className="flex items-center gap-3">
                <span className="text-xs text-text">{colour.label}</span>
                <ColourChoice
                  isCompact
                  label={colour.label}
                  value={value.colours[colour.key] ?? colour.standard}
                  onChange={(hex) => {
                    onChange({
                      ...value,
                      orb: variant.key,
                      colours: { ...value.colours, [colour.key]: hex },
                    });
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="text-[0.65rem] uppercase tracking-[0.18em] text-text-muted">Settings</h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {variant.params.map((param) => (
            <OrbSetting
              key={param.key}
              param={param}
              value={value.params[param.key] ?? param.standard}
              onChange={(next) => {
                onChange({
                  ...value,
                  orb: variant.key,
                  params: { ...value.params, [param.key]: next },
                });
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

OrbStudio.displayName = 'OrbStudio';

export { OrbStudio };
