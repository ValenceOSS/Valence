type ControllerReading = { buttons: readonly boolean[]; axes: readonly number[] };

type Held = { presses: number; at: number };

type ControllerKeys = {
  down: { key: string; isRepeat: boolean }[];
  up: string[];
  holding: Map<string, Held>;
};

const BUTTON_OF_KEY: Record<string, number> = {
  Enter: 0,
  Escape: 1,
  ArrowUp: 12,
  ArrowDown: 13,
  ArrowLeft: 14,
  ArrowRight: 15,
};

const STICK_PAST = 0.75;

const FIRST_REPEAT_MS = 200;

const REPEATS_EVERY_MS = 40;

/**
 * The keys a controller's buttons and left stick stand for, as a remote's would be pressed: the
 * D-pad or the stick pushed most of the way for the arrows, A for select and B for back.
 *
 * @param reading - What one controller says is pressed.
 * @returns The keys.
 */
const keysOf = (reading: ControllerReading): string[] => {
  const [across = 0, down = 0] = reading.axes;
  const pushed = [
    ...(across < -STICK_PAST ? ['ArrowLeft'] : []),
    ...(across > STICK_PAST ? ['ArrowRight'] : []),
    ...(down < -STICK_PAST ? ['ArrowUp'] : []),
    ...(down > STICK_PAST ? ['ArrowDown'] : []),
  ];

  return [
    ...Object.entries(BUTTON_OF_KEY).flatMap(([key, button]) =>
      reading.buttons[button] === true ? [key] : [],
    ),
    ...pushed,
  ];
};

/**
 * Turns what the controllers say is pressed into keys going down, repeating and coming up, as
 * Jellyfin's web client reads a controller on an Xbox: a key goes down the moment its button does,
 * repeats a fifth of a second later and every twenty-fifth after that while it is held, and comes
 * up when it is let go. Back never repeats, so holding B goes back one step, not several.
 *
 * @param readings - What each controller says is pressed.
 * @param was - The keys held down at the last reading.
 * @param now - When this reading is, in milliseconds.
 * @returns The keys that go down and come up, and those held down now.
 */
const keysFromTheController = (
  readings: readonly ControllerReading[],
  was: ReadonlyMap<string, Held>,
  now: number,
): ControllerKeys => {
  const pressed = new Set(readings.flatMap(keysOf));
  const holding = new Map<string, Held>();
  const down: ControllerKeys['down'] = [];

  for (const key of pressed) {
    const held = was.get(key);

    if (held === undefined) {
      down.push({ key, isRepeat: false });
      holding.set(key, { presses: 1, at: now });
      continue;
    }

    const wait = held.presses === 1 ? FIRST_REPEAT_MS : REPEATS_EVERY_MS;

    if (key !== 'Escape' && now - held.at >= wait) {
      down.push({ key, isRepeat: true });
      holding.set(key, { presses: held.presses + 1, at: now });
    } else {
      holding.set(key, held);
    }
  }

  return { down, up: [...was.keys()].filter((key) => !pressed.has(key)), holding };
};

export { keysFromTheController };
