type AScrimProps = {
  blurReach?: number;
};

type NativeScrimProps = {
  blurReach: number;
  style: { bottom: 0; left: 0; position: 'absolute'; right: 0; top: 0 };
  pointerEvents: 'none';
};

export type { AScrimProps, NativeScrimProps };
