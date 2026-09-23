type VolumeModule = {
  now: () => number;
  set: (to: number) => Promise<void>;
  addListener: (event: 'onVolume', listener: (change: object) => void) => { remove: () => void };
};

type NativeVolumeProps = {
  style: { height: number; left: number; position: 'absolute'; top: number; width: number };
};

export type { NativeVolumeProps, VolumeModule };
