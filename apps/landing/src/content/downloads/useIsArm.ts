import { useEffect, useState } from 'react';
import { detectArm } from './detectArm';

/**
 * Whether the visitor's computer has an ARM processor, false until the browser has answered.
 *
 * @returns Whether it is ARM.
 */
const useIsArm = (): boolean => {
  const [isArm, setIsArm] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    void detectArm(navigator).then((found) => {
      if (isCurrent) {
        setIsArm(found);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  return isArm;
};

export { useIsArm };
