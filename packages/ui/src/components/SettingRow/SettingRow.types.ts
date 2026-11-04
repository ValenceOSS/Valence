import type { ReactNode } from 'react';

type SettingRowProps = {
  title: string;
  info?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  isMarked?: boolean;
  className?: string;
};

export type { SettingRowProps };
