type ABlurProps = {
  isDark: boolean;
  isOn?: boolean;
  changesOver?: number;
};

type NativeBlurProps = {
  isDark: boolean;
  isOn: boolean;
  changesOver: number;
  style: { bottom: 0; left: 0; position: 'absolute'; right: 0; top: 0 };
  pointerEvents: 'none';
};

export type { ABlurProps, NativeBlurProps };
