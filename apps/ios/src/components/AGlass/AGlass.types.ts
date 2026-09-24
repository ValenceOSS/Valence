type AGlassProps = {
  roundness: number;
  tint?: string;
  isShown?: boolean;
};

type NativeGlassProps = {
  roundness: number;
  tint?: string;
  isShown?: boolean;
  style: { bottom: 0; left: 0; position: 'absolute'; right: 0; top: 0 };
  pointerEvents: 'none';
};

export type { AGlassProps, NativeGlassProps };
