import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { cn } from '@ValenceUI/cn';
import { hexOfHsv } from '@ValenceUI/hexOfHsv';
import { hsvOf } from '@ValenceUI/hsvOf';
import type { ColourPickerProps } from './ColourPicker.types';

const HEX = /^#[0-9a-f]{6}$/iu;

const NUDGE = 0.02;

/**
 * Where a pointer is across and down an element, each from nothing to one and held inside it.
 *
 * @param event - The pointer.
 */
const placeOf = (event: PointerEvent<HTMLDivElement>): { across: number; down: number } => {
  const box = event.currentTarget.getBoundingClientRect();

  return {
    across: Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1),
    down: Math.min(Math.max((event.clientY - box.top) / box.height, 0), 1),
  };
};

/**
 * Picks any colour at all: a field of every shade of one hue, a strip of every hue, and the colour
 * written out as a hex code for somebody who already knows the one they want, with a row of ready
 * colours above where there are any.
 *
 * The field and the strip follow a pointer dragged anywhere across them, and each moves by arrow
 * keys as well, so nothing here needs a mouse.
 *
 * @param label - What the colour is for, read out on each control.
 * @param value - The colour now, as `#rrggbb`.
 * @param onChange - Told the new colour as it moves.
 * @param presets - Ready colours to offer first.
 * @param className - Extra classes for the caller's own layout.
 */
const ColourPicker = ({ label, value, onChange, presets = [], className }: ColourPickerProps) => {
  const [hsv, setHsv] = useState(() => hsvOf(value));
  const [typed, setTyped] = useState(value);
  const sent = useRef(value);

  useEffect(() => {
    if (value !== sent.current) {
      sent.current = value;
      setHsv(hsvOf(value));
    }

    setTyped(value);
  }, [value]);

  const move = (next: { hue: number; saturation: number; brightness: number }) => {
    const hex = hexOfHsv(next.hue, next.saturation, next.brightness);

    setHsv(next);
    sent.current = hex;
    onChange(hex);
  };

  const dragField = (event: PointerEvent<HTMLDivElement>) => {
    const { across, down } = placeOf(event);

    move({ ...hsv, saturation: across, brightness: 1 - down });
  };

  const dragHue = (event: PointerEvent<HTMLDivElement>) => {
    move({ ...hsv, hue: placeOf(event).across * 359.9 });
  };

  const nudgeField = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = {
      ArrowLeft: { saturation: -NUDGE, brightness: 0 },
      ArrowRight: { saturation: NUDGE, brightness: 0 },
      ArrowUp: { saturation: 0, brightness: NUDGE },
      ArrowDown: { saturation: 0, brightness: -NUDGE },
    }[event.key];

    if (step !== undefined) {
      event.preventDefault();
      move({
        ...hsv,
        saturation: Math.min(Math.max(hsv.saturation + step.saturation, 0), 1),
        brightness: Math.min(Math.max(hsv.brightness + step.brightness, 0), 1),
      });
    }
  };

  const nudgeHue = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: -3, ArrowDown: -3, ArrowRight: 3, ArrowUp: 3 }[event.key];

    if (step !== undefined) {
      event.preventDefault();
      move({ ...hsv, hue: (hsv.hue + step + 360) % 360 });
    }
  };

  return (
    <div className={cn('flex w-60 flex-col gap-3', className)}>
      {presets.length === 0 ? null : (
        <div className="grid grid-cols-8 gap-1.5">
          {presets.map((preset) => (
            <Button
              key={preset}
              variant="bare"
              size="none"
              label={`Use ${preset}`}
              isActive={preset.toLowerCase() === value.toLowerCase()}
              style={{ backgroundColor: preset }}
              className={cn(
                'aspect-square w-full rounded-full ring-1 ring-line transition-transform',
                preset.toLowerCase() === value.toLowerCase()
                  ? 'ring-2 ring-accent'
                  : 'hover-hover:hover:scale-110',
              )}
              onClick={() => {
                sent.current = preset;
                setHsv(hsvOf(preset));
                onChange(preset);
              }}
            />
          ))}
        </div>
      )}

      <div
        role="slider"
        tabIndex={0}
        aria-label={`${label}: shade`}
        aria-valuetext={`${Math.round(hsv.saturation * 100).toString()}% colour, ${Math.round(hsv.brightness * 100).toString()}% bright`}
        aria-valuenow={Math.round(hsv.saturation * 100)}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragField(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            dragField(event);
          }
        }}
        onKeyDown={nudgeField}
        style={{ backgroundColor: hexOfHsv(hsv.hue, 1, 1) }}
        className="relative h-40 w-full cursor-crosshair touch-none rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        <span className="absolute inset-0 rounded-md bg-linear-to-r from-picker-light to-transparent" />
        <span className="absolute inset-0 rounded-md bg-linear-to-t from-picker-dark to-transparent" />
        <span
          style={{
            left: `${(hsv.saturation * 100).toString()}%`,
            top: `${((1 - hsv.brightness) * 100).toString()}%`,
            backgroundColor: value,
          }}
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-picker-thumb"
        />
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label={`${label}: hue`}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.hue)}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragHue(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            dragHue(event);
          }
        }}
        onKeyDown={nudgeHue}
        className="relative h-3 w-full bg-picker-hues cursor-pointer touch-none rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        <span
          style={{
            left: `${((hsv.hue / 360) * 100).toString()}%`,
            backgroundColor: hexOfHsv(hsv.hue, 1, 1),
          }}
          className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-picker-thumb"
        />
      </div>

      <div className="flex items-center gap-2">
        <span
          aria-hidden
          style={{ backgroundColor: value }}
          className="size-8 shrink-0 rounded-md ring-1 ring-line"
        />
        <TextField
          label={`${label}: hex code`}
          isLabelHidden
          value={typed}
          size="sm"
          className="flex-1 font-mono"
          onValueChange={(next) => {
            const hex = next.startsWith('#') ? next : `#${next}`;

            setTyped(hex);

            if (HEX.test(hex)) {
              sent.current = hex.toLowerCase();
              setHsv(hsvOf(hex));
              onChange(hex.toLowerCase());
            }
          }}
        />
      </div>
    </div>
  );
};

ColourPicker.displayName = 'ColourPicker';

export { ColourPicker };
