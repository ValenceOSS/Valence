import type { ComponentType } from 'react';

type PromiseCardProps = {
  title: string;
  text: string;
  glyph: ComponentType<{ size?: number; className?: string }>;
};

export type { PromiseCardProps };
