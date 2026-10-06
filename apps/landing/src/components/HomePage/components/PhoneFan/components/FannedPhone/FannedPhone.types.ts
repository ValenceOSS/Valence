import type { MotionValue } from 'motion/react';
import type { PhoneFinish } from '@ValenceLanding/components/HomePage/components/PhoneFan/components/PhoneFrame/PhoneFrame.types';

type FannedPhoneProps = {
  phone: {
    label: string;
    turn: number;
    lift: number;
    spread: number;
    finish: PhoneFinish;
    src?: string;
  };
  opened: MotionValue<number>;
};

export type { FannedPhoneProps };
