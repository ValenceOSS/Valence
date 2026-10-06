import { motion, useTransform } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { PhoneFrame } from '@ValenceLanding/components/HomePage/components/PhoneFan/components/PhoneFrame/PhoneFrame';
import type { FannedPhoneProps } from './FannedPhone.types';

const SPREAD_PERCENT = 78;

/**
 * One phone in the fan, which slides out from behind the middle one to its own place, turning and
 * dropping as it goes, as far as the fan has opened; the middle one stands in front, a little larger.
 *
 * @param phone - Which part of the app it shows, and where it sits once the fan is open.
 * @param opened - How far the fan has opened, from stacked to spread.
 */
const FannedPhone = ({ phone, opened }: FannedPhoneProps) => {
  const x = useTransform(opened, [0, 1], ['0%', `${(phone.spread * SPREAD_PERCENT).toString()}%`]);
  const rotate = useTransform(opened, [0, 1], [0, phone.turn]);
  const y = useTransform(opened, [0, 1], [0, phone.lift]);
  const isMiddle = phone.spread === 0;

  return (
    <motion.div
      style={{ x, rotate, y }}
      className={cn(
        'absolute top-0 w-[11rem] origin-bottom sm:w-[14rem] lg:w-[15.5rem]',
        isMiddle ? 'z-20 scale-110' : Math.abs(phone.spread) === 1 ? 'z-10' : 'z-0',
      )}
    >
      <PhoneFrame label={phone.label} {...(phone.src === undefined ? {} : { src: phone.src })} />
    </motion.div>
  );
};

FannedPhone.displayName = 'FannedPhone';

export { FannedPhone };
