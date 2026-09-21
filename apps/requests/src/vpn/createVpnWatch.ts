import type { RequestsVpn } from '@ValenceContracts/schemas/Requests';

type CreateVpnWatchOptions = {
  read: () => Promise<RequestsVpn>;
  everyMs: number;
  onChange?: (vpn: RequestsVpn) => void;
};

const NOT_YET_ASKED: RequestsVpn = {
  isConfigured: false,
  isUp: null,
  publicAddress: null,
  country: null,
  checkedAt: null,
  problem: null,
};

/**
 * Keeps asking the VPN how it is, so whoever wants to know reads the last answer rather than
 * waiting on gluetun, and anything that must stop when the tunnel drops hears about it.
 *
 * @param read - How to ask.
 * @param everyMs - How long to leave between asking.
 * @param onChange - Told whenever the tunnel goes up or down.
 * @returns The watch: start it, stop it, and read the last answer.
 */
const createVpnWatch = ({ read, everyMs, onChange }: CreateVpnWatchOptions) => {
  let latest = NOT_YET_ASKED;
  let timer: NodeJS.Timeout | null = null;

  const check = async (): Promise<RequestsVpn> => {
    const next = await read();
    const hasChanged = next.isUp !== latest.isUp;

    latest = next;

    if (hasChanged) {
      onChange?.(next);
    }

    return next;
  };

  return {
    start: async (): Promise<void> => {
      await check();
      timer ??= setInterval(() => {
        void check();
      }, everyMs);
    },
    stop: (): void => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    },
    check,
    current: (): RequestsVpn => latest,
  };
};

export type { CreateVpnWatchOptions };

export { createVpnWatch };
