import { z } from 'zod';

type WidthLimits = {
  narrowest: number;
  widest: number;
  usual: number;
};

/**
 * Remembers how wide a panel was dragged, on this device rather than on the profile, since the
 * right width depends on the screen rather than on who is looking.
 *
 * @param key - Where in the device's storage the width is kept.
 * @param limits - The narrowest and widest it may be, and the width it opens at before any drag.
 * @returns The limits, with a way to read the width remembered and to remember a new one.
 */
const rememberedWidth = (key: string, limits: WidthLimits) => {
  const WidthSchema = z.coerce.number().int().min(limits.narrowest).max(limits.widest);

  return {
    ...limits,
    read: (): number => {
      try {
        const parsed = WidthSchema.safeParse(window.localStorage.getItem(key) ?? undefined);

        return parsed.success ? parsed.data : limits.usual;
      } catch {
        return limits.usual;
      }
    },
    save: (width: number): void => {
      try {
        window.localStorage.setItem(key, width.toString());
      } catch {}
    },
  };
};

export { rememberedWidth };
