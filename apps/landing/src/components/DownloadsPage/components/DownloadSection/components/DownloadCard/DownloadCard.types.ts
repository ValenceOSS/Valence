import type { ComponentType, ReactNode } from 'react';

type DownloadCardProps = {
  eyebrow: string;
  title: string;
  glyph: ComponentType<{ size?: number; className?: string }>;
  index: number;
  isLit?: boolean;
  className?: string;
  children: ReactNode;
};

export type { DownloadCardProps };
