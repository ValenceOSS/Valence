import { motion, useTransform } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { PhoneFrame } from '@ValenceLanding/components/HomePage/components/PhoneFan/components/PhoneFrame/PhoneFrame';
import type { FannedPhoneProps } from './FannedPhone.types';

const SPREAD_PERCENT = 78;

/**
 * One phone in the fan, which slides out from behind the middle one to its own place, turning and
 * dropping as it goes, as far as the fan has opened; the middle one stands in front, a little larger.
 * Behind each, its own screen blurred into a soft glow of its colours, brightest behind the middle one.
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
        'absolute top-0 w-[10rem] origin-bottom sm:w-[12.5rem] lg:w-[15.5rem] xl:w-[18rem]',
        isMiddle ? 'z-20 scale-110' : Math.abs(phone.spread) === 1 ? 'z-10' : 'z-0',
      )}
    >
      {phone.src === undefined ? null : (
        <img
          src={phone.src}
          alt=""
          aria-hidden
          draggable={false}
          className={cn(
            'pointer-events-none absolute inset-[6%] -z-10 h-[88%] w-[88%] scale-125 select-none rounded-[3rem] object-cover blur-3xl saturate-150',
            isMiddle ? 'opacity-70' : 'opacity-40',
          )}
        />
      )}
      <PhoneFrame
        label={phone.label}
        finish={phone.finish}
        {...(phone.src === undefined ? {} : { src: phone.src })}
      />
    </motion.div>
  );
};

FannedPhone.displayName = 'FannedPhone';

export { FannedPhone };
