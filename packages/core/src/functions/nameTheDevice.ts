import type { DeviceIdentity, DeviceSystem } from '@ValenceContracts/schemas/DeviceIdentity';
import type { Said } from '@ValenceI18n/SaidSchema';
import { saying } from '@ValenceI18n/saying';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';

const KIND_OF_DEVICE: Readonly<Partial<Record<DeviceSystem, () => Said>>> = {
  ios: () => saying('common.iPhone'),
  ipados: () => saying('common.iPad'),
  macos: () => saying('common.mac'),
  windows: () => saying('common.windowsPC'),
  linux: () => saying('common.linuxComputer'),
  chromeos: () => saying('common.chromebook'),
  tvos: () => saying('common.appleTV'),
  androidTv: () => saying('common.androidTV'),
  fireOs: () => saying('common.fireTV'),
  webos: () => saying('common.lgTV'),
  tizen: () => saying('common.samsungTV'),
  xbox: () => saying('common.xbox'),
};

/**
 * What a device is called, the way its owner would recognise it: the name they gave it here, else
 * the name it has on its own system, else its model, else the kind of thing it is — an iPhone, a Mac,
 * an LG TV — and an unknown device only where nothing says even that.
 *
 * @param identity - What the device is.
 * @param renamed - What its owner renamed it to here, where they did.
 * @returns Its name.
 */
const nameTheDevice = (identity: DeviceIdentity, renamed: string | null = null): Said => {
  const own = renamed ?? identity.name ?? identity.model;

  if (own !== null) {
    return sayVerbatim(own);
  }

  if (identity.system === 'android') {
    return identity.form === 'tablet'
      ? saying('common.androidTablet')
      : saying('common.androidPhone');
  }

  const kind = identity.system === null ? undefined : KIND_OF_DEVICE[identity.system];

  if (kind !== undefined) {
    return kind();
  }

  if (identity.form === 'tv') {
    return identity.maker === null
      ? saying('common.smartTV')
      : saying('common.makerTV', { maker: identity.maker });
  }

  return saying('server.realtime.realtimeHandler.unknownDevice');
};

export { nameTheDevice };
