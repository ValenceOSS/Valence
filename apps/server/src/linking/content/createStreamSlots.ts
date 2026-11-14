/**
 * The streams a linked server is starting, counted from the moment one is asked for rather than
 * once it has started, so that several asked for at once cannot all slip under its limit while the
 * first is still being started.
 *
 * @returns A way to take a slot, which hands back how to give it back, or nothing where there is no
 *   room.
 */
const createStreamSlots = () => {
  const starting = new Map<string, number>();

  return {
    take: (serverId: string, most: number | null, playing: number): (() => void) | null => {
      const pending = starting.get(serverId) ?? 0;

      if (most !== null && playing + pending >= most) {
        return null;
      }

      starting.set(serverId, pending + 1);

      let isGivenBack = false;

      return () => {
        if (isGivenBack) {
          return;
        }

        isGivenBack = true;

        const left = (starting.get(serverId) ?? 1) - 1;

        if (left <= 0) {
          starting.delete(serverId);
        } else {
          starting.set(serverId, left);
        }
      };
    },
  };
};

export { createStreamSlots };
