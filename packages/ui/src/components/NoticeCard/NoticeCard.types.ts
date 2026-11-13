type NoticeTone = 'info' | 'worked' | 'failed' | 'working' | 'warning';

type NoticeCountdown = {
  seconds: number;
  lead?: string;
};

import type { ReactNode } from 'react';

type NoticeCardProps = {
  tone: NoticeTone;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
  tags?: readonly string[];
  countdown?: NoticeCountdown;
  isCompact?: boolean;
  children?: ReactNode;
  onDismiss: () => void;
};

export type { NoticeCardProps, NoticeCountdown, NoticeTone };
