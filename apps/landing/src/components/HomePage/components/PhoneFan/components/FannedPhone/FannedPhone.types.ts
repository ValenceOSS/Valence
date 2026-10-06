import type { MotionValue } from 'motion/react';

type FannedPhoneProps = {
  phone: { label: string; turn: number; lift: number; spread: number; src?: string };
  opened: MotionValue<number>;
};

export type { FannedPhoneProps };
